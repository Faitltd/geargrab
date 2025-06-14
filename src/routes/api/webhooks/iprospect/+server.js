/**
 * FCRA-Compliant iProspectCheck Webhook Handler
 * Processes background check completion events from iProspectCheck
 */

import { json } from '@sveltejs/kit';
import { fetchReport, determineAdverseAction, getReportPdfUrl } from '$lib/utils/i-prospect-check-client.js';
import { fcraNoticeService } from '$lib/utils/fcra-notices.js';
import { BackgroundCheckRecord } from '$lib/models/backgroundCheck.js';
import { adminAuth, adminFirestore } from '$lib/firebase/server';

export async function POST({ request }) {
  try {
    const body = await request.text();
    // const signature = request.headers.get('x-iprospect-signature');

    // Note: Add signature verification if iProspectCheck provides webhook signatures
    // For now, we'll process the webhook without signature verification
    console.log('Received iProspectCheck webhook');

    const webhookData = JSON.parse(body);
    console.log('iProspectCheck webhook data:', {
      type: webhookData.type,
      reportId: webhookData.data?.report_id
    });

    // Handle different webhook event types
    switch (webhookData.type) {
      case 'report.completed':
        await handleReportCompletion(webhookData.data);
        break;

      case 'report.disputed':
        await handleReportDispute(webhookData.data);
        break;

      default:
        console.log('Unhandled webhook type:', webhookData.type);
    }

    return json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('iProspectCheck webhook processing error:', error);
    return json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

/**
 * Handle report completion webhook
 * @param {Object} reportData - iProspectCheck report data
 */
async function handleReportCompletion(reportData) {
  try {
    const reportId = reportData.report_id;
    console.log('Processing report completion for:', reportId);

    // Find the background check record
    const backgroundCheck = await BackgroundCheckRecord.findByReportId(reportId);
    if (!backgroundCheck) {
      console.error('Background check record not found for report:', reportId);
      return;
    }

    // Only process if report is actually completed
    if (reportData.status !== 'complete') {
      console.log('Report not yet completed, status:', reportData.status);
      return;
    }

    // Get full report details from iProspectCheck
    const fullReport = await fetchReport(reportId);

    // Get report PDF URL for FCRA notices
    let reportPdfUrl;
    try {
      reportPdfUrl = await getReportPdfUrl(reportId);
    } catch (error) {
      console.warn('Failed to get report PDF URL:', error);
      reportPdfUrl = `https://portal.iprospectcheck.com/reports/${reportId}`;
    }

    // Determine if adverse action is required
    const decision = determineAdverseAction(fullReport);
    
    console.log('Background check decision:', {
      reportId,
      requiresAdverseAction: decision.requiresAdverseAction,
      action: decision.action,
      riskLevel: decision.riskLevel
    });

    // Update background check record
    const updates = {
      status: decision.requiresAdverseAction ? 'pending_adverse' : 'clear',
      reportPdfUrl,
      decision,
      metadata: {
        ...fullReport,
        webhookProcessedAt: new Date().toISOString()
      }
    };

    await BackgroundCheckRecord.update(backgroundCheck.id, updates);

    if (decision.requiresAdverseAction) {
      // Send pre-adverse notice
      await sendPreAdverseNotice(backgroundCheck, reportPdfUrl);
    } else {
      // Background check passed - create user account
      await createUserAccount(backgroundCheck);
    }

  } catch (error) {
    console.error('Error handling report completion:', error);
    throw error;
  }
}

/**
 * Handle report dispute webhook
 * @param {Object} reportData - Checkr report data
 */
async function handleReportDispute(reportData) {
  try {
    const reportId = reportData.id;
    console.log('Processing report dispute for:', reportId);

    // Find the background check record
    const backgroundCheck = await BackgroundCheckRecord.findByReportId(reportId);
    if (!backgroundCheck) {
      console.error('Background check record not found for report:', reportId);
      return;
    }

    // Update record to indicate dispute
    await BackgroundCheckRecord.update(backgroundCheck.id, {
      status: 'disputed',
      disputedAt: new Date(),
      metadata: {
        ...backgroundCheck.metadata,
        disputeData: reportData,
        disputeProcessedAt: new Date().toISOString()
      }
    });

    console.log('Report dispute recorded for:', reportId);

    // Optionally notify admin team about dispute
    // await notifyAdminOfDispute(backgroundCheck, reportData);

  } catch (error) {
    console.error('Error handling report dispute:', error);
    throw error;
  }
}

/**
 * Send pre-adverse notice to candidate
 * @param {Object} backgroundCheck - Background check record
 * @param {string} reportPdfUrl - Report PDF URL
 */
async function sendPreAdverseNotice(backgroundCheck, reportPdfUrl) {
  try {
    console.log('Sending pre-adverse notice to:', backgroundCheck.email);

    await fcraNoticeService.sendPreAdverseNotice(
      backgroundCheck.email,
      reportPdfUrl,
      {
        firstName: backgroundCheck.firstName,
        lastName: backgroundCheck.lastName
      }
    );

    // Update record to mark pre-adverse notice sent
    await BackgroundCheckRecord.update(backgroundCheck.id, {
      preAdverseSent: true,
      preAdverseSentAt: new Date()
    });

    console.log('Pre-adverse notice sent successfully to:', backgroundCheck.email);

  } catch (error) {
    console.error('Failed to send pre-adverse notice:', error);
    throw error;
  }
}

/**
 * Create user account after successful background check
 * @param {Object} backgroundCheck - Background check record
 */
async function createUserAccount(backgroundCheck) {
  try {
    console.log('Creating user account for:', backgroundCheck.email);

    // Generate a temporary password (user will need to reset)
    const tempPassword = generateTempPassword();

    // Create Firebase user
    const userRecord = await adminAuth.createUser({
      email: backgroundCheck.email,
      password: tempPassword,
      displayName: `${backgroundCheck.firstName} ${backgroundCheck.lastName}`,
      emailVerified: false
    });

    // Create user document in Firestore
    await adminFirestore.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: backgroundCheck.email,
      displayName: userRecord.displayName,
      firstName: backgroundCheck.firstName,
      lastName: backgroundCheck.lastName,
      isVerified: true, // Background check passed
      backgroundCheckStatus: 'clear',
      backgroundCheckDate: new Date(),
      backgroundCheckReportId: backgroundCheck.checkrReportId,
      createdAt: new Date(),
      status: 'active',
      profileComplete: false,
      tempPassword: true // Indicates user needs to set password
    });

    // Update background check record with user ID
    await BackgroundCheckRecord.update(backgroundCheck.id, {
      userId: userRecord.uid,
      status: 'clear',
      accountCreatedAt: new Date()
    });

    console.log('User account created successfully:', userRecord.uid);

    // Send account creation email with password reset link
    await sendAccountCreationEmail(backgroundCheck.email, backgroundCheck.firstName);

  } catch (error) {
    console.error('Failed to create user account:', error);
    
    // Update status to indicate account creation failed
    await BackgroundCheckRecord.update(backgroundCheck.id, {
      status: 'account_creation_failed',
      error: error.message,
      failedAt: new Date()
    });
    
    throw error;
  }
}

/**
 * Generate temporary password for new user
 * @returns {string} Temporary password
 */
function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Send account creation email
 * @param {string} email - User email
 * @param {string} firstName - User first name
 */
async function sendAccountCreationEmail(email, _firstName) {
  try {
    // This would integrate with your email service
    // For now, just log that we would send an email
    console.log('Would send account creation email to:', email);
    
    // In production, send email with:
    // - Welcome message
    // - Password reset link
    // - Next steps for completing profile
    
  } catch (error) {
    console.error('Failed to send account creation email:', error);
  }
}

// Test endpoint for webhook validation
export async function GET({ url }) {
  const reportId = url.searchParams.get('reportId');
  
  if (!reportId) {
    return json({ error: 'reportId parameter is required for testing' }, { status: 400 });
  }

  try {
    // Simulate webhook data for testing
    const mockWebhookData = {
      type: 'report.completed',
      data: {
        id: reportId,
        status: 'complete',
        adjudication: Math.random() > 0.8 ? 'engaged' : 'clear', // 20% chance of adverse
        completed_at: new Date().toISOString(),
        candidate: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    };

    // Process the mock webhook
    await handleReportCompletion(mockWebhookData.data);

    return json({
      success: true,
      message: `Mock Checkr webhook processed for report ${reportId}`,
      data: mockWebhookData
    });

  } catch (error) {
    return json({
      error: `Failed to process mock webhook: ${error.message}`
    }, { status: 500 });
  }
}
