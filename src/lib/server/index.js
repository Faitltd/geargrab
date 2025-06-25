// Enhanced server with WebSocket support
import { handler } from '../build/handler.js';
import express from 'express';
import { createServer } from 'http';
import { initializeWebSocket } from './websocket.js';
import { createPerformanceMiddleware } from './performance.js';

const app = express();
const server = createServer(app);

// Initialize WebSocket server
const io = initializeWebSocket(server);

// Apply performance middleware
const performanceMiddleware = createPerformanceMiddleware();
performanceMiddleware.forEach(middleware => {
  app.use(middleware);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    websocket: io ? 'active' : 'inactive',
    timestamp: new Date().toISOString()
  });
});

// WebSocket status endpoint
app.get('/api/websocket/status', (req, res) => {
  res.json({
    connected: io ? true : false,
    connectedClients: io ? io.engine.clientsCount : 0
  });
});

// SvelteKit handler for all other routes
app.use(handler);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔌 WebSocket server initialized`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export { app, server, io };
