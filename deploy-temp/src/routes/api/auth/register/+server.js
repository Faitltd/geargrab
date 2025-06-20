/**
 * FCRA-Compliant User Registration with Background Check
 * Handles user registration with mandatory background check screening
 */

import { json } from '@sveltejs/kit';
import { createReport, fetchReport, determineAdverseAction, getReportPdfUrl } from '$lib/utils/i-prospect-check-client.js';
import { fcraNoticeService } from '$lib/utils/fcra-notices.js';
import { BackgroundCheckRecord } from '$lib/models/backgroundCheck.js';
import { adminAuth, adminFirestore } from '$lib/firebase/server';

export async function POST({ request, getClientAddress }) {
  try {
    const body = await request.json();
    const clientIp = getClientAddress();
    const userAgent = request.headers.get('User-Agent') || 'Unknown';

    // Validate required fields
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth, // YYYY-MM-DD format
      ssn,
      address,
      driverLicenseNumber,
      consentGiven
    } = body;

    // Validate consent
    if (!consentGiven) {
      return json({
        error: 'Must consent to background check',
        message: 'You must authorize GearGrab to obtain a background check to verify your eligibility.'
      }, { status: 400 });
    }

    // Validate required personal information
    const requiredFields = {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      ssn,
      address
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return json({
        error: 'Missing required fields',
        missingFields
      }, { status: 400 });
    }

    // Validate address object
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      return json({
        error: 'Complete address is required',
        message: 'Street, city, state, and zip code are all required.'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingCheck = await BackgroundCheckRecord.findByEmail(email);
    if (existingCheck) {
      return json({
        error: 'Application already exists',
        message: 'An application with this email address already exists.',
        status: existingCheck.status
      }, { status: 409 });
    }

    console.log('Starting FCRA-compliant registration for:', email);

    // Step 1: Create iProspectCheck report
    const candidateData = {
      firstName,
      lastName,
      email,
      phone,
      dob: dateOfBirth,
      ssn,
      address: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`, // Full address string
      driverLicenseNumber
    };

    const metadata = {
      ip: clientIp,
      userAgent,
      consentTimestamp: new Date().toISOString(),
      registrationSource: 'geargrab_web'
    };

    let report;

    try {
      report = await createReport(candidateData, metadata);
      console.log('iProspectCheck report created:', report.report_id);
    } catch (error) {
      console.error('Failed to create iProspectCheck report:', error);
      return json({
        error: 'Background check service unavailable',
        message: 'Unable to process background check at this time. Please try again later.'
      }, { status: 503 });
    }

    // Step 2: Save background check record
    const backgroundCheckRecord = new BackgroundCheckRecord({
      checkrReportId: report.report_id, // iProspectCheck uses report_id
      checkrCandidateId: null, // iProspectCheck doesn't separate candidate creation
      status: 'pending',
      email,
      firstName,
      lastName,
      consentTimestamp: new Date(),
      consentIp: clientIp,
      consentUserAgent: userAgent,
      metadata: {
        reportStatus: report.status,
        packageType: 'BASIC_CRIMINAL'
      }
    });

    // Validate record before saving
    const validationErrors = backgroundCheckRecord.validate();
    if (validationErrors.length > 0) {
      console.error('Background check record validation failed:', validationErrors);
      return json({
        error: 'Data validation failed',
        details: validationErrors
      }, { status: 400 });
    }

    let recordId;
    try {
      recordId = await backgroundCheckRecord.save();
      console.log('Background check record saved:', recordId);
    } catch (error) {
      console.error('Failed to save background check record:', error);
      return json({
        error: 'Failed to save application',
        message: 'Unable to save your application. Please try again.'
      }, { status: 500 });
    }

    // Step 3: Start polling for report completion (async)
    // Don't await this - let it run in background
    processBackgroundCheckCompletion(report.report_id, recordId, {
      email,
      firstName,
      lastName,
      password
    }).catch(error => {
      console.error('Background check processing error:', error);
    });

    // Step 4: Return success response
    return json({
      success: true,
      message: 'Background check initiated successfully',
      data: {
        reportId: report.report_id,
        status: 'pending',
        estimatedCompletion: '24-48 hours',
        nextSteps: 'You will receive an email once your background check is complete.'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return json({
      error: 'Registration failed',
      message: 'An unexpected error occurred during registration. Please try again.'
    }, { status: 500 });
  }
}

/**
 * Process background check completion asynchronously
 * @param {string} reportId - Checkr report ID
 * @param {string} recordId - Background check record ID
 * @param {Object} userData - User data for account creation
 */
async function processBackgroundCheckCompletion(reportId, recordId, userData) {
  try {
    console.log('Starting background check polling for report:', reportId);

    // Poll for completion using simple polling approach
    let completedReport;
    let attempts = 0;
    const maxAttempts = 144; // 2 hours with 30-second intervals

    while (attempts < maxAttempts) {
      try {
        completedReport = await fetchReport(reportId);

        console.log(`Report ${reportId} status: ${completedReport.status} (attempt ${attempts + 1})`);

        if (completedReport.status === 'complete') {
          break;
        }

        // Wait 30 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 30000));
        attempts++;

      } catch (error) {
        console.error(`Error polling report ${reportId}:`, error.message);
        attempts++;

        if (attempts >= maxAttempts) {
          throw new Error(`Report polling failed after ${maxAttempts} attempts`);
        }

        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    if (!completedReport || completedReport.status !== 'complete') {
      throw new Error(`Report ${reportId} did not complete within ${maxAttempts} attempts`);
    }

    console.log('Background check completed:', {
      reportId,
      status: completedReport.status,
      adjudication: completedReport.adjudication
    });

    // Get report PDF URL for FCRA notices
    let reportPdfUrl;
    try {
      reportPdfUrl = await getReportPdfUrl(reportId);
    } catch (error) {
      console.warn('Failed to get report PDF URL:', error);
      reportPdfUrl = `https://portal.iprospectcheck.com/reports/${reportId}`;
    }

    // Determine if adverse action is required
    const decision = determineAdverseAction(completedReport);
    
    // Update background check record
    const updates = {
      status: decision.requiresAdverseAction ? 'pending_adverse' : 'clear',
      reportPdfUrl,
      decision,
      metadata: {
        ...completedReport,
        processedAt: new Date().toISOString()
      }
    };

    await BackgroundCheckRecord.update(recordId, updates);

    if (decision.requiresAdverseAction) {
      // Send pre-adverse notice
      console.log('Sending pre-adverse notice for:', userData.email);
      
      try {
        await fcraNoticeService.sendPreAdverseNotice(
          userData.email,
          reportPdfUrl,
          { firstName: userData.firstName, lastName: userData.lastName }
        );

        // Update record to mark pre-adverse notice sent
        await BackgroundCheckRecord.update(recordId, {
          preAdverseSent: true,
          preAdverseSentAt: new Date()
        });

        console.log('Pre-adverse notice sent successfully');
      } catch (error) {
        console.error('Failed to send pre-adverse notice:', error);
      }

    } else {
      // Background check passed - create user account
      console.log('Background check passed, creating user account for:', userData.email);
      
      try {
        // Create Firebase user
        const userRecord = await adminAuth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: `${userData.firstName} ${userData.lastName}`,
          emailVerified: false
        });

        // Create user document in Firestore
        await adminFirestore.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: userData.email,
          displayName: userRecord.displayName,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isVerified: true, // Background check passed
          backgroundCheckStatus: 'clear',
          backgroundCheckDate: new Date(),
          createdAt: new Date(),
          status: 'active'
        });

        // Update background check record with user ID
        await BackgroundCheckRecord.update(recordId, {
          userId: userRecord.uid,
          status: 'clear'
        });

        console.log('User account created successfully:', userRecord.uid);

        // Send welcome email (optional)
        // await sendWelcomeEmail(userData.email, userData.firstName);

      } catch (error) {
        console.error('Failed to create user account:', error);
        // Update status to indicate account creation failed
        await BackgroundCheckRecord.update(recordId, {
          status: 'account_creation_failed',
          error: error.message
        });
      }
    }

  } catch (error) {
    console.error('Background check processing failed:', error);
    
    // Update record to indicate processing failed
    try {
      await BackgroundCheckRecord.update(recordId, {
        status: 'processing_failed',
        error: error.message,
        failedAt: new Date()
      });
    } catch (updateError) {
      console.error('Failed to update record with error status:', updateError);
    }
  }
}
