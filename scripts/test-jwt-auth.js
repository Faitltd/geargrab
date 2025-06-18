#!/usr/bin/env node

/**
 * Test script for JWT Role-Based Authentication
 * 
 * This script generates test JWT tokens and demonstrates how to test
 * the enhanced authentication middleware.
 */

import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

// Load environment variables
config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in environment variables');
  console.log('Please make sure JWT_SECRET is set in your .env file');
  process.exit(1);
}

console.log('🔐 JWT Authentication Test Script');
console.log('================================\n');

// Generate test tokens
function generateTestToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Test user tokens
const testUsers = {
  admin: {
    sub: 'admin_user_123',
    email: 'admin@geargrab.co',
    roles: ['admin'],
    iat: Math.floor(Date.now() / 1000),
  },
  editor: {
    sub: 'editor_user_456',
    email: 'editor@geargrab.co',
    roles: ['editor'],
    iat: Math.floor(Date.now() / 1000),
  },
  adminEditor: {
    sub: 'super_user_789',
    email: 'super@geargrab.co',
    roles: ['admin', 'editor'],
    iat: Math.floor(Date.now() / 1000),
  },
  regularUser: {
    sub: 'regular_user_101',
    email: 'user@geargrab.co',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000),
  },
  noRoles: {
    sub: 'no_roles_user_202',
    email: 'noroles@geargrab.co',
    iat: Math.floor(Date.now() / 1000),
  }
};

// Generate tokens
console.log('🎫 Generated Test Tokens:');
console.log('========================\n');

const tokens = {};
for (const [userType, payload] of Object.entries(testUsers)) {
  const token = generateTestToken(payload);
  tokens[userType] = token;
  
  console.log(`${userType.toUpperCase()} TOKEN:`);
  console.log(`User: ${payload.email}`);
  console.log(`Roles: ${payload.roles ? payload.roles.join(', ') : 'none'}`);
  console.log(`Token: ${token.substring(0, 50)}...`);
  console.log('');
}

// Test commands
console.log('🧪 Test Commands:');
console.log('================\n');

const baseUrl = 'http://localhost:5173';

console.log('1. Test Admin Users Endpoint (requires admin role):');
console.log(`curl -X GET "${baseUrl}/api/admin/users" \\`);
console.log(`  -H "Authorization: Bearer ${tokens.admin.substring(0, 50)}..." \\`);
console.log(`  -H "Content-Type: application/json"`);
console.log('');

console.log('2. Test with Editor Token (should fail for admin-only endpoint):');
console.log(`curl -X GET "${baseUrl}/api/admin/users" \\`);
console.log(`  -H "Authorization: Bearer ${tokens.editor.substring(0, 50)}..." \\`);
console.log(`  -H "Content-Type: application/json"`);
console.log('');

console.log('3. Test Background Checks Endpoint (requires admin role):');
console.log(`curl -X GET "${baseUrl}/api/admin/background-checks" \\`);
console.log(`  -H "Authorization: Bearer ${tokens.admin.substring(0, 50)}..." \\`);
console.log(`  -H "Content-Type: application/json"`);
console.log('');

console.log('4. Test with Regular User Token (should fail):');
console.log(`curl -X GET "${baseUrl}/api/admin/users" \\`);
console.log(`  -H "Authorization: Bearer ${tokens.regularUser.substring(0, 50)}..." \\`);
console.log(`  -H "Content-Type: application/json"`);
console.log('');

console.log('5. Test with No Token (should fail):');
console.log(`curl -X GET "${baseUrl}/api/admin/users" \\`);
console.log(`  -H "Content-Type: application/json"`);
console.log('');

// Save tokens to file for easy access
const tokenData = {
  generated: new Date().toISOString(),
  baseUrl,
  tokens: {
    admin: tokens.admin,
    editor: tokens.editor,
    adminEditor: tokens.adminEditor,
    regularUser: tokens.regularUser,
    noRoles: tokens.noRoles
  },
  users: testUsers
};

// Write to file
import { writeFileSync } from 'fs';
writeFileSync('test-tokens.json', JSON.stringify(tokenData, null, 2));

console.log('💾 Test tokens saved to: test-tokens.json');
console.log('');

console.log('🚀 Quick Test:');
console.log('=============');
console.log('Start your dev server: npm run dev');
console.log('Then run one of the curl commands above to test authentication!');
console.log('');

console.log('✅ Expected Results:');
console.log('- Admin token → ✅ Access granted');
console.log('- Editor token → ❌ Access denied (for admin-only endpoints)');
console.log('- Regular user token → ❌ Access denied');
console.log('- No token → ❌ Access denied');
console.log('');

console.log('📋 Implementation Status:');
console.log('- ✅ JWT middleware created');
console.log('- ✅ Enhanced auth middleware created');
console.log('- ✅ Admin users endpoint secured');
console.log('- ✅ Background checks endpoint secured');
console.log('- ✅ Test tokens generated');
console.log('');

console.log('🎯 Next Steps:');
console.log('1. Start your development server');
console.log('2. Test the endpoints with the generated tokens');
console.log('3. Add admin/editor roles to real user accounts');
console.log('4. Gradually migrate other admin routes');
