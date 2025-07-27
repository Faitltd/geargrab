/**
 * GearGrab API Server
 * Express.js server with PostgreSQL database integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const { pool } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gearItemRoutes = require('./routes/gear-items');
const rentalRoutes = require('./routes/rentals');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');
const integrationRoutes = require('./routes/integrations');
const verificationRoutes = require('./routes/verification');
const stripeConnectRoutes = require('./routes/stripe-connect');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');
const disputeRoutes = require('./routes/disputes');
const messageRoutes = require('./routes/messages');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { validateRequest } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://geargrab.co', 'https://www.geargrab.co']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// Webhook routes (no auth required - verified by signature)
app.use('/api/webhooks', webhookRoutes);

// Upload routes (auth required)
app.use('/api/upload', authenticateToken, uploadRoutes);

// Entity routes (auth required for most operations)
app.use('/api/users', userRoutes);
app.use('/api/gear_items', gearItemRoutes);
app.use('/api/rentals', authenticateToken, rentalRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/reviews', reviewRoutes);

// Verification routes (auth required)
app.use('/api/verification', authenticateToken, verificationRoutes);

// Stripe Connect routes (auth required)
app.use('/api/stripe-connect', authenticateToken, stripeConnectRoutes);

// Payment routes (auth required)
app.use('/api/payments', authenticateToken, paymentRoutes);

// Dispute routes (auth required)
app.use('/api/disputes', authenticateToken, disputeRoutes);

// Message routes (auth required)
app.use('/api/messages', authenticateToken, messageRoutes);

// Integration routes (auth required)
app.use('/api/integrations', authenticateToken, integrationRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close database connections
  await pool.end();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  // Close database connections
  await pool.end();
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GearGrab API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection on startup
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
    } else {
      console.log('✅ Database connected successfully');
    }
  });
});

module.exports = app;
