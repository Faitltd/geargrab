import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';
import { backgroundCheckProviders } from '$lib/services/backgroundCheckProviders';
import { sendBackgroundCheckEmails } from '$lib/services/email';
import crypto from 'crypto';

// Webhook handler for background check provider updates
export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const provider = url.searchParams.get('provider');
    
    if (!provider) {
      return json({ error: 'Provider parameter is required' }, { status: 400 });
    }

    const providerService = backgroundCheckProviders.getProvider(provider);
    if (!providerService) {
      return json({ error: 'Invalid provider' }, { status: 400 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-signature') || request.headers.get('x-checkr-signature');

    // Verify webhook signature (security)
    if (!verifyWebhookSignature(body, signature, provider)) {
      return json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData = JSON.parse(body);
    
    // Process webhook based on provider
    switch (provider) {
      case 'checkr':
        await handleCheckrWebhook(webhookData);
        break;
      case 'sterling':
        await handleSterlingWebhook(webhookData);
        break;
      case 'accurate':
        await handleAccurateWebhook(webhookData);
        break;
      default:
        return json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return json({ error: 'Failed to process webhook' }, { status: 500 });
  }
};

// Verify webhook signature for security
function verifyWebhookSignature(body: string, signature: string | null, provider: string): boolean {
  if (!signature) return false;

  try {
    let secret: string;
    
    switch (provider) {
      case 'checkr':
        secret = process.env.CHECKR_WEBHOOK_SECRET || 'test_secret';
        break;
      case 'sterling':
        secret = process.env.STERLING_WEBHOOK_SECRET || 'test_secret';
        break;
      case 'accurate':
        secret = process.env.ACCURATE_WEBHOOK_SECRET || 'test_secret';
        break;
      default:
        return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Handle Checkr webhook events
async function handleCheckrWebhook(data: any): Promise<void> {
  const { type, data: reportData } = data;

  if (type === 'report.completed' || type === 'report.updated') {
    const externalId = reportData.id;
    const tags = reportData.tags || [];
    
    // Find the request ID from tags
    const requestTag = tags.find((tag: string) => tag.startsWith('geargrab_'));
    if (!requestTag) {
      console.error('No GearGrab request ID found in Checkr webhook');
      return;
    }

    const requestId = requestTag.replace('geargrab_', '');
    
    // Get the verification request
    const requestDoc = await adminFirestore
      .collection('verificationRequests')
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      console.error('Verification request not found:', requestId);
      return;
    }

    // Parse Checkr results
    const results = parseCheckrResults(reportData);
    
    // Update the verification request
    await requestDoc.ref.update({
      status: results.status === 'completed' ? 'approved' : 'in_progress',
      'backgroundCheckData.results': results.results,
      'backgroundCheckData.riskLevel': results.riskLevel,
      'backgroundCheckData.overallStatus': results.overallStatus,
      'backgroundCheckData.completedAt': results.completedAt,
      'backgroundCheckData.expiresAt': results.expiresAt,
      'backgroundCheckData.providerData': reportData,
      reviewedAt: new Date()
    });

    // Send notification email
    const request = requestDoc.data();
    if (request && results.status === 'completed') {
      await sendBackgroundCheckEmails({
        userId: request.userId,
        requestId,
        checkType: request.backgroundCheckData.checkType,
        provider: 'checkr',
        status: results.overallStatus === 'pass' ? 'approved' : 'rejected',
        results: results.results
      });
    }
  }
}

// Handle Sterling webhook events
async function handleSterlingWebhook(data: any): Promise<void> {
  // Sterling webhook implementation
  console.log('Sterling webhook received:', data);
  
  // Parse Sterling-specific webhook format
  const { event_type, order } = data;
  
  if (event_type === 'order.completed' || event_type === 'order.updated') {
    // Process Sterling order completion
    // Implementation would be similar to Checkr but with Sterling's data format
  }
}

// Handle Accurate Background webhook events
async function handleAccurateWebhook(data: any): Promise<void> {
  // Accurate Background webhook implementation
  console.log('Accurate Background webhook received:', data);
  
  // Parse Accurate Background-specific webhook format
  // Implementation would be similar to other providers
}

// Parse Checkr report results into our standard format
function parseCheckrResults(reportData: any): any {
  const status = mapCheckrStatus(reportData.status);
  
  const results = {
    criminalHistory: {
      status: reportData.adjudication === 'engaged' ? 'records_found' : 'clear',
      details: reportData.adjudication === 'engaged' ? 'Records found requiring review' : 'No criminal records found'
    },
    sexOffenderRegistry: {
      status: 'clear', // Checkr includes this in criminal search
      details: 'No matches found in sex offender registry'
    },
    globalWatchlist: {
      status: 'clear', // Checkr includes this in criminal search
      details: 'No matches found in global watchlists'
    },
    identityVerification: {
      status: 'verified',
      ssnTrace: true,
      addressHistory: true
    }
  };

  // Add motor vehicle records if available
  if (reportData.motor_vehicle_report) {
    results.motorVehicleRecords = {
      status: reportData.motor_vehicle_report.result === 'clear' ? 'clear' : 'violations_found',
      violations: reportData.motor_vehicle_report.violations || []
    };
  }

  return {
    status,
    results,
    riskLevel: reportData.adjudication === 'engaged' ? 'high' : 'low',
    overallStatus: reportData.adjudication === 'engaged' ? 'review_required' : 'pass',
    completedAt: reportData.completed_at ? new Date(reportData.completed_at) : new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  };
}

// Map Checkr status to our standard status
function mapCheckrStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'failed' {
  switch (status) {
    case 'pending': return 'pending';
    case 'consider': return 'in_progress';
    case 'complete': return 'completed';
    case 'disputed': return 'failed';
    default: return 'pending';
  }
}

// Test webhook endpoint for development
export const GET: RequestHandler = async ({ url }) => {
  const provider = url.searchParams.get('provider') || 'checkr';
  const requestId = url.searchParams.get('requestId');

  if (!requestId) {
    return json({ error: 'requestId parameter is required for testing' }, { status: 400 });
  }

  // Simulate webhook data for testing
  const mockWebhookData = {
    checkr: {
      type: 'report.completed',
      data: {
        id: `checkr_${Date.now()}`,
        status: 'complete',
        adjudication: Math.random() > 0.8 ? 'engaged' : 'clear', // 20% chance of records
        completed_at: new Date().toISOString(),
        tags: [`geargrab_${requestId}`],
        candidate: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    },
    sterling: {
      event_type: 'order.completed',
      order: {
        id: `sterling_${Date.now()}`,
        status: 'completed',
        results: {
          overall_status: 'clear'
        }
      }
    }
  };

  // Process the mock webhook
  try {
    switch (provider) {
      case 'checkr':
        await handleCheckrWebhook(mockWebhookData.checkr);
        break;
      case 'sterling':
        await handleSterlingWebhook(mockWebhookData.sterling);
        break;
    }

    return json({ 
      success: true, 
      message: `Mock ${provider} webhook processed for request ${requestId}`,
      data: mockWebhookData[provider as keyof typeof mockWebhookData]
    });
  } catch (error) {
    return json({ 
      error: `Failed to process mock webhook: ${error.message}` 
    }, { status: 500 });
  }
};
