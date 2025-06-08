#!/usr/bin/env node

/**
 * Small script to restart the development server
 * This ensures environment variables are reloaded
 */

import { spawn } from 'child_process';

console.log('🔄 Restarting development server...');

// Kill any existing dev server processes
const killProcess = spawn('pkill', ['-f', 'vite'], { stdio: 'inherit' });

killProcess.on('close', (code) => {
  console.log('🛑 Stopped existing dev server');
  
  // Wait a moment then start new server
  setTimeout(() => {
    console.log('🚀 Starting development server...');
    
    const devServer = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      detached: true
    });
    
    // Don't wait for the server to exit
    devServer.unref();
    
    console.log('✅ Development server started!');
    console.log('🌐 Visit http://localhost:5173 to test the payment form');
    
    // Exit this script
    process.exit(0);
  }, 1000);
});
