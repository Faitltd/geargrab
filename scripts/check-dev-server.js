#!/usr/bin/env node

/**
 * Small script to check if dev server is running and restart if needed
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkDevServer() {
  console.log('🔍 Checking development server status...');
  
  try {
    // Check if server is running on port 5173
    const response = await fetch('http://localhost:5173');
    
    if (response.ok) {
      console.log('✅ Development server is running');
      console.log('🌐 Visit http://localhost:5173/book/confirm to test payment form');
      return true;
    }
  } catch (error) {
    console.log('❌ Development server is not running');
  }
  
  // Try to start the server
  console.log('🚀 Starting development server...');
  
  try {
    // Start dev server in background
    const child = exec('npm run dev', { 
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore'
    });
    
    child.unref();
    
    console.log('✅ Development server starting...');
    console.log('⏳ Please wait a moment for the server to start');
    console.log('🌐 Then visit http://localhost:5173/book/confirm to test payment form');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start development server:', error.message);
    return false;
  }
}

// Run the check
checkDevServer();
