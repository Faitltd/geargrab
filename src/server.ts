/**
 * Server Entry Point
 * Main server file to start the application
 */

import dotenv from 'dotenv';
import { startServer } from './infrastructure/web/app';

// Load environment variables
dotenv.config();

// Get port from environment or default to 3000
const PORT = parseInt(process.env.PORT || '3000', 10);

// Start the server
startServer(PORT);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
