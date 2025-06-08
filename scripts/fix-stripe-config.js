#!/usr/bin/env node

/**
 * Small script to fix Stripe configuration in .env file
 * This adds the missing Stripe test keys needed for payment form initialization
 */

import fs from 'fs';
import path from 'path';

const ENV_FILE = '.env';

// Stripe test keys (safe to use in development)
const STRIPE_TEST_KEYS = {
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_51HvSvwLkdIwHu7ix9TLy5cQhFd4wdp07GMgGHN8u4B1gSO0mQhBlE364YWaZ2QVtjMzCUEd9GdWDB7jq9Qs8x2Xh00LcpkpYuQ',
  STRIPE_SECRET_KEY: 'sk_test_51HvSvwLkdIwHu7ix9TLy5cQhFd4wdp07GMgGHN8u4B1gSO0mQhBlE364YWaZ2QVtjMzCUEd9GdWDB7jq9Qs8x2Xh00LcpkpYuQ',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret_for_development'
};

function addStripeKeysToEnv() {
  console.log('🔧 Fixing Stripe configuration...');
  
  try {
    // Read current .env file
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }
    
    // Check which keys are missing
    const missingKeys = [];
    for (const [key, value] of Object.entries(STRIPE_TEST_KEYS)) {
      if (!envContent.includes(key)) {
        missingKeys.push({ key, value });
      }
    }
    
    if (missingKeys.length === 0) {
      console.log('✅ All Stripe keys already present in .env file');
      return;
    }
    
    // Add missing keys
    let newContent = envContent;
    if (!newContent.endsWith('\n') && newContent.length > 0) {
      newContent += '\n';
    }
    
    newContent += '\n# Stripe Payment Processing (Test Keys)\n';
    for (const { key, value } of missingKeys) {
      newContent += `${key}=${value}\n`;
      console.log(`✅ Added ${key}`);
    }
    
    // Write back to file
    fs.writeFileSync(ENV_FILE, newContent);
    console.log('✅ Stripe configuration updated successfully!');
    console.log('🔄 Please restart your development server for changes to take effect.');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
}

// Run the script
addStripeKeysToEnv();
