#!/usr/bin/env node

/**
 * Deployment Status Checker for GearGrab
 * This script checks the status of various deployment components
 */

import https from 'https';
import { URL } from 'url';

const ENDPOINTS = [
  'https://geargrab.co',
  'https://www.geargrab.co',
  'https://geargrab-app-123456789-uc.a.run.app' // Replace with actual Cloud Run URL
];

const API_ENDPOINTS = [
  '/api/comments?articleId=test',
  '/api/health', // If you have a health check endpoint
];

/**
 * Check if a URL is accessible
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'GearGrab-Deployment-Checker/1.0'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 400,
        headers: res.headers,
        redirected: res.statusCode >= 300 && res.statusCode < 400
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

/**
 * Check SSL certificate
 */
function checkSSL(hostname) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port: 443,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      resolve({
        hostname,
        valid: res.socket.authorized,
        issuer: cert.issuer?.CN || 'Unknown',
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysUntilExpiry: cert.valid_to ? Math.floor((new Date(cert.valid_to) - new Date()) / (1000 * 60 * 60 * 24)) : null
      });
    });

    req.on('error', (error) => {
      resolve({
        hostname,
        valid: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        hostname,
        valid: false,
        error: 'SSL check timeout'
      });
    });

    req.end();
  });
}

/**
 * Main deployment check function
 */
async function checkDeployment() {
  console.log('🔍 Checking GearGrab Deployment Status...\n');

  // Check main endpoints
  console.log('📡 Checking Main Endpoints:');
  for (const endpoint of ENDPOINTS) {
    try {
      const result = await checkUrl(endpoint);
      const status = result.success ? '✅' : '❌';
      const statusText = result.status || 'FAILED';
      
      console.log(`${status} ${endpoint} - ${statusText}`);
      
      if (result.redirected) {
        console.log(`   ↳ Redirects to: ${result.headers.location}`);
      }
      
      if (result.error) {
        console.log(`   ↳ Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
    }
  }

  console.log('\n🔒 Checking SSL Certificates:');
  const domains = ['geargrab.co', 'www.geargrab.co'];
  
  for (const domain of domains) {
    try {
      const sslResult = await checkSSL(domain);
      const status = sslResult.valid ? '✅' : '❌';
      
      console.log(`${status} ${domain}`);
      
      if (sslResult.valid) {
        console.log(`   ↳ Issuer: ${sslResult.issuer}`);
        console.log(`   ↳ Valid until: ${sslResult.validTo}`);
        
        if (sslResult.daysUntilExpiry !== null) {
          const daysLeft = sslResult.daysUntilExpiry;
          const warningIcon = daysLeft < 30 ? '⚠️' : '';
          console.log(`   ↳ Days until expiry: ${daysLeft} ${warningIcon}`);
        }
      } else if (sslResult.error) {
        console.log(`   ↳ Error: ${sslResult.error}`);
      }
    } catch (error) {
      console.log(`❌ ${domain} - SSL Error: ${error.message}`);
    }
  }

  // Check API endpoints (if main site is accessible)
  const mainSiteCheck = await checkUrl('https://geargrab.co');
  if (mainSiteCheck.success) {
    console.log('\n🔌 Checking API Endpoints:');
    
    for (const apiPath of API_ENDPOINTS) {
      try {
        const apiUrl = `https://geargrab.co${apiPath}`;
        const result = await checkUrl(apiUrl);
        const status = result.success ? '✅' : '❌';
        
        console.log(`${status} ${apiPath} - ${result.status || 'FAILED'}`);
        
        if (result.error) {
          console.log(`   ↳ Error: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ ${apiPath} - ERROR: ${error.message}`);
      }
    }
  }

  console.log('\n📊 Deployment Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const allChecks = await Promise.all(ENDPOINTS.map(checkUrl));
  const successfulChecks = allChecks.filter(check => check.success).length;
  const totalChecks = allChecks.length;
  
  console.log(`✅ Successful endpoints: ${successfulChecks}/${totalChecks}`);
  
  if (successfulChecks === totalChecks) {
    console.log('🎉 All systems operational!');
  } else if (successfulChecks > 0) {
    console.log('⚠️  Partial deployment - some endpoints failing');
  } else {
    console.log('❌ Deployment appears to be down');
  }

  console.log('\n💡 Next Steps:');
  if (successfulChecks === 0) {
    console.log('• Check GitHub Actions for deployment errors');
    console.log('• Verify Google Cloud Run service is running');
    console.log('• Check DNS configuration');
  } else if (successfulChecks < totalChecks) {
    console.log('• Check DNS propagation status');
    console.log('• Verify domain mappings in Google Cloud Console');
    console.log('• Wait for SSL certificate provisioning (can take up to 24 hours)');
  } else {
    console.log('• Run end-to-end tests');
    console.log('• Monitor application logs');
    console.log('• Set up monitoring and alerting');
  }
}

// Run the check
checkDeployment().catch(console.error);
