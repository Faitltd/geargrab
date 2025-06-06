#!/usr/bin/env node

/**
 * Test script for iProspectCheck integration
 * Tests the basic functionality of creating and fetching reports
 */

import dotenv from 'dotenv';
import { createReport, fetchReport } from '../src/lib/utils/iProspectCheckClient.js';

// Load environment variables
dotenv.config();

async function testIProspectCheckIntegration() {
  console.log('🧪 Testing iProspectCheck Integration\n');

  // Test data
  const testCandidateData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    dob: '1990-01-01',
    ssn: '123-45-6789',
    address: '123 Test Street, Denver, CO 80202'
  };

  const testMetadata = {
    ip: '127.0.0.1',
    userAgent: 'Test-Agent/1.0',
    source: 'test_script'
  };

  try {
    // Test 1: Create Report
    console.log('📝 Test 1: Creating background check report...');
    console.log('Candidate:', {
      name: `${testCandidateData.firstName} ${testCandidateData.lastName}`,
      email: testCandidateData.email
    });

    const report = await createReport(testCandidateData, testMetadata);
    
    console.log('✅ Report created successfully!');
    console.log('Report ID:', report.report_id);
    console.log('Status:', report.status);
    console.log('');

    // Test 2: Fetch Report
    console.log('📋 Test 2: Fetching report details...');
    
    const fetchedReport = await fetchReport(report.report_id);
    
    console.log('✅ Report fetched successfully!');
    console.log('Report ID:', fetchedReport.report_id || fetchedReport.id);
    console.log('Status:', fetchedReport.status);
    console.log('Created:', fetchedReport.created_at || fetchedReport.createdAt);
    console.log('');

    // Test 3: Monitor Status (brief polling)
    console.log('⏱️  Test 3: Monitoring report status...');
    
    let attempts = 0;
    const maxAttempts = 5; // Only check a few times for testing
    
    while (attempts < maxAttempts) {
      const currentReport = await fetchReport(report.report_id);
      console.log(`Attempt ${attempts + 1}: Status = ${currentReport.status}`);
      
      if (currentReport.status === 'complete') {
        console.log('✅ Report completed!');
        
        if (currentReport.adjudication) {
          console.log('Clear Flag:', currentReport.adjudication.clear_flag);
        }
        
        if (currentReport.pdf_url) {
          console.log('PDF URL:', currentReport.pdf_url);
        }
        
        break;
      }
      
      attempts++;
      
      if (attempts < maxAttempts) {
        console.log('⏳ Waiting 10 seconds before next check...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    if (attempts >= maxAttempts) {
      console.log('⚠️  Report still pending after', maxAttempts, 'attempts');
      console.log('💡 This is normal - background checks can take 24-48 hours');
    }

    console.log('\n🎉 iProspectCheck integration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Report creation: ✅ Working');
    console.log('- Report fetching: ✅ Working');
    console.log('- API authentication: ✅ Working');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check that IPROSPECT_API_KEY is set correctly');
      console.log('2. Check that IPROSPECT_API_SECRET is set correctly');
      console.log('3. Verify credentials with iProspectCheck support');
    } else if (error.message.includes('Invalid request data')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check the candidate data format');
      console.log('2. Verify required fields are provided');
      console.log('3. Check iProspectCheck API documentation');
    }
    
    process.exit(1);
  }
}

// Check environment variables
function checkEnvironment() {
  const required = ['IPROSPECT_API_KEY', 'IPROSPECT_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.log('\n💡 Please set these in your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables configured');
}

// Main execution
async function main() {
  console.log('🔧 Checking environment...');
  checkEnvironment();
  console.log('');
  
  await testIProspectCheckIntegration();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the test
main().catch(console.error);
