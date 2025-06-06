#!/usr/bin/env node

/**
 * Test Script for Phone Verification System
 * 
 * This script tests the Twilio integration and phone verification endpoints
 * 
 * Usage:
 * node scripts/test-phone-verification.js
 */

const { validatePhoneNumber, generateVerificationCode } = require('../src/lib/services/twilio.ts');

console.log('🧪 Testing Phone Verification System...\n');

// Test 1: Phone number validation
console.log('📱 Testing phone number validation:');

const testNumbers = [
  '7209267341',           // US number without country code
  '+17209267341',         // US number with country code
  '1-720-926-7341',       // US number with formatting
  '(720) 926-7341',       // US number with parentheses
  '+44 20 7946 0958',     // UK number
  '123',                  // Invalid short number
  'abc-def-ghij'          // Invalid non-numeric
];

testNumbers.forEach(number => {
  try {
    const result = validatePhoneNumber(number);
    console.log(`  ${number} -> ${result.isValid ? '✅' : '❌'} ${result.formatted} ${result.error || ''}`);
  } catch (error) {
    console.log(`  ${number} -> ❌ Error: ${error.message}`);
  }
});

// Test 2: Verification code generation
console.log('\n🔢 Testing verification code generation:');
for (let i = 0; i < 5; i++) {
  const code = generateVerificationCode();
  console.log(`  Generated code ${i + 1}: ${code} (length: ${code.length})`);
}

// Test 3: Environment variables check
console.log('\n⚙️ Checking environment variables:');
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 
  'TWILIO_PHONE_NUMBER'
];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`  ✅ ${envVar}: ${envVar === 'TWILIO_AUTH_TOKEN' ? '***hidden***' : value}`);
  } else {
    console.log(`  ❌ ${envVar}: Not set`);
  }
});

console.log('\n🎉 Phone verification system test completed!');
console.log('\n📋 Next steps:');
console.log('1. Start your development server: npm run dev');
console.log('2. Navigate to /verify page');
console.log('3. Test phone verification flow');
console.log('4. Check console logs for SMS codes in development mode');
console.log('5. Check Twilio console for SMS delivery in production');
