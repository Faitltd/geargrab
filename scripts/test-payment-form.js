#!/usr/bin/env node

/**
 * Small script to test if payment form initialization works
 * This checks if Stripe keys are properly configured
 */

import fs from 'fs';

function testStripeConfig() {
  console.log('🧪 Testing Stripe configuration...');
  
  try {
    // Read .env file
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Check for required Stripe keys
    const requiredKeys = [
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];
    
    const missingKeys = [];
    const presentKeys = [];
    
    for (const key of requiredKeys) {
      if (envContent.includes(`${key}=`) && !envContent.includes(`${key}=your_`)) {
        presentKeys.push(key);
      } else {
        missingKeys.push(key);
      }
    }
    
    // Report results
    console.log('\n📊 Configuration Status:');
    
    if (presentKeys.length > 0) {
      console.log('✅ Present keys:');
      presentKeys.forEach(key => console.log(`   - ${key}`));
    }
    
    if (missingKeys.length > 0) {
      console.log('❌ Missing keys:');
      missingKeys.forEach(key => console.log(`   - ${key}`));
      console.log('\n💡 Run: node scripts/fix-stripe-config.js');
      return false;
    }
    
    console.log('\n✅ All Stripe keys are configured!');
    console.log('🎉 Payment form should now initialize properly');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    return false;
  }
}

// Run the test
const success = testStripeConfig();
process.exit(success ? 0 : 1);
