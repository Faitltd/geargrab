#!/usr/bin/env node

/**
 * Deployment Verification Script
 * This script helps verify that the latest changes have been deployed
 */

const https = require('https');

const BASE_URL = 'https://geargrab.co';

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'GearGrab-Deployment-Verification/1.0'
      }
    };

    if (body) {
      const bodyString = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function verifyDeployment() {
  console.log('🔍 Verifying deployment status...\n');

  try {
    // Test 1: Check version endpoint
    console.log('1. Testing version endpoint...');
    const versionResponse = await makeRequest('/api/debug/version');
    console.log(`   Status: ${versionResponse.status}`);
    if (versionResponse.status === 200) {
      console.log(`   Version: ${versionResponse.data.version}`);
      console.log(`   Auth Status: ${versionResponse.data.authenticationStatus}`);
      console.log(`   ✅ Version endpoint working`);
    } else {
      console.log(`   ❌ Version endpoint failed`);
    }
    console.log('');

    // Test 2: Check ping endpoint
    console.log('2. Testing ping endpoint...');
    const pingResponse = await makeRequest('/api/test/ping', 'POST', { test: 'deployment_verification' });
    console.log(`   Status: ${pingResponse.status}`);
    if (pingResponse.status === 200) {
      console.log(`   ✅ Ping endpoint working`);
    } else {
      console.log(`   ❌ Ping endpoint failed`);
    }
    console.log('');

    // Test 3: Check payment endpoint (should not return 401)
    console.log('3. Testing payment endpoint...');
    const paymentResponse = await makeRequest('/api/payments/create-intent', 'POST', {
      amount: 1000,
      currency: 'usd',
      metadata: { test: 'deployment_verification' }
    });
    console.log(`   Status: ${paymentResponse.status}`);
    if (paymentResponse.status === 200) {
      console.log(`   ✅ Payment endpoint working`);
      if (paymentResponse.data.mock) {
        console.log(`   📝 Using mock payment intent (expected for debugging)`);
      }
    } else if (paymentResponse.status === 401) {
      console.log(`   ❌ Payment endpoint still returning 401 - deployment not updated`);
    } else {
      console.log(`   ⚠️ Payment endpoint returned status ${paymentResponse.status}`);
    }
    console.log('');

    // Test 4: Check test payment endpoint
    console.log('4. Testing test payment endpoint...');
    const testPaymentResponse = await makeRequest('/api/payments/test-intent', 'POST', {
      amount: 1000,
      currency: 'usd',
      metadata: { test: 'deployment_verification' }
    });
    console.log(`   Status: ${testPaymentResponse.status}`);
    if (testPaymentResponse.status === 200) {
      console.log(`   ✅ Test payment endpoint working`);
    } else {
      console.log(`   ❌ Test payment endpoint failed`);
    }
    console.log('');

    // Summary
    console.log('📊 Summary:');
    if (paymentResponse.status === 401) {
      console.log('❌ Main issue: Payment endpoint still returns 401');
      console.log('💡 This indicates the deployment has not been updated with the latest changes');
      console.log('🔧 Recommended actions:');
      console.log('   1. Redeploy the application');
      console.log('   2. Clear any CDN/proxy caches');
      console.log('   3. Check if there are multiple deployment environments');
    } else if (paymentResponse.status === 200) {
      console.log('✅ Payment endpoint is working - authentication bypass successful');
    } else {
      console.log(`⚠️ Payment endpoint returned unexpected status: ${paymentResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Run the verification
verifyDeployment();