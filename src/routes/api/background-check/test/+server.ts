import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { backgroundCheckProviders } from '$lib/services/backgroundCheckProviders';
import { adminFirestore } from '$firebase/server';

// Test endpoint for background check providers
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { checkType, provider, personalInfo } = await request.json();

    if (!checkType || !provider || !personalInfo) {
      return json({ 
        error: 'Missing required fields: checkType, provider, personalInfo' 
      }, { status: 400 });
    }

    // Validate check type
    if (!['basic', 'standard', 'comprehensive'].includes(checkType)) {
      return json({ 
        error: 'Invalid check type. Must be basic, standard, or comprehensive' 
      }, { status: 400 });
    }

    // Get the provider service
    const providerService = backgroundCheckProviders.getProvider(provider);
    if (!providerService) {
      return json({ 
        error: `Invalid provider: ${provider}` 
      }, { status: 400 });
    }

    // Create a test request ID
    const testRequestId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Prepare background check request
    const backgroundCheckRequest = {
      userId: 'test_user',
      requestId: testRequestId,
      checkType,
      personalInfo: {
        firstName: personalInfo.firstName || 'Test',
        lastName: personalInfo.lastName || 'User',
        email: personalInfo.email || 'test@example.com',
        phone: personalInfo.phone || '555-123-4567',
        dateOfBirth: personalInfo.dateOfBirth || '1990-01-01',
        ssn: personalInfo.ssn || '123-45-6789',
        address: {
          street: personalInfo.address?.street || '123 Test St',
          city: personalInfo.address?.city || 'Test City',
          state: personalInfo.address?.state || 'UT',
          zipCode: personalInfo.address?.zipCode || '84101',
          country: personalInfo.address?.country || 'US'
        },
        driverLicense: personalInfo.driverLicense
      }
    };

    // Test the provider integration
    let externalId: string;
    let estimatedCompletion: string;

    try {
      // Initiate background check with the provider
      externalId = await providerService.initiateBackgroundCheck(backgroundCheckRequest);
      estimatedCompletion = providerService.getEstimatedCompletion(checkType);

      // Create a test verification request record
      const testVerificationRequest = {
        userId: 'test_user',
        type: 'background_check',
        status: 'in_progress',
        submittedAt: new Date(),
        isTestRequest: true,
        backgroundCheckData: {
          checkType,
          provider,
          externalId,
          consentGiven: true,
          consentTimestamp: new Date(),
          personalInfo: backgroundCheckRequest.personalInfo,
          results: {
            criminalHistory: { status: 'pending' },
            sexOffenderRegistry: { status: 'pending' },
            globalWatchlist: { status: 'pending' },
            identityVerification: { status: 'pending' }
          }
        }
      };

      // Add additional checks for standard and comprehensive
      if (checkType === 'standard' || checkType === 'comprehensive') {
        testVerificationRequest.backgroundCheckData.results = {
          ...testVerificationRequest.backgroundCheckData.results,
          addressHistory: { status: 'pending' },
          ssnTrace: { status: 'pending' }
        };
      }

      if (checkType === 'comprehensive') {
        testVerificationRequest.backgroundCheckData.results = {
          ...testVerificationRequest.backgroundCheckData.results,
          motorVehicleRecords: { status: 'pending' },
          professionalLicenses: { status: 'pending' },
          educationVerification: { status: 'pending' },
          employmentHistory: { status: 'pending' }
        };
      }

      // Save test request to Firestore (in a test collection)
      const docRef = await adminFirestore
        .collection('testVerificationRequests')
        .add(testVerificationRequest);

      // For mock provider, simulate completion after a short delay
      if (provider === 'mock') {
        setTimeout(async () => {
          try {
            await simulateBackgroundCheckCompletion(docRef.id, externalId);
          } catch (error) {
            console.error('Error simulating background check completion:', error);
          }
        }, 3000); // 3 seconds
      }

      return json({
        success: true,
        message: `Background check test initiated successfully with ${providerService.name}`,
        requestId: docRef.id,
        externalId,
        estimatedCompletion,
        provider: providerService.name,
        checkType,
        testMode: true
      });

    } catch (providerError) {
      console.error(`${provider} provider error:`, providerError);
      
      // Return provider-specific error information
      return json({
        error: `Provider integration failed: ${providerError.message}`,
        provider,
        checkType,
        details: providerError.toString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Background check test error:', error);
    return json({ 
      error: 'Failed to process background check test' 
    }, { status: 500 });
  }
};

// Simulate background check completion for testing
async function simulateBackgroundCheckCompletion(requestId: string, externalId: string): Promise<void> {
  try {
    const requestRef = adminFirestore.collection('testVerificationRequests').doc(requestId);
    
    // Simulate completed results
    const completedResults = {
      criminalHistory: { 
        status: 'clear', 
        details: 'No criminal records found',
        lastChecked: new Date()
      },
      sexOffenderRegistry: { 
        status: 'clear', 
        details: 'Not found in registry',
        lastChecked: new Date()
      },
      globalWatchlist: { 
        status: 'clear', 
        details: 'No matches found',
        lastChecked: new Date()
      },
      identityVerification: { 
        status: 'verified', 
        ssnTrace: true, 
        addressHistory: true,
        lastChecked: new Date()
      },
      addressHistory: { 
        status: 'verified', 
        details: 'Address history confirmed',
        lastChecked: new Date()
      },
      ssnTrace: { 
        status: 'verified', 
        details: 'SSN trace completed',
        lastChecked: new Date()
      }
    };

    await requestRef.update({
      status: 'completed',
      completedAt: new Date(),
      'backgroundCheckData.results': completedResults,
      'backgroundCheckData.overallStatus': 'pass',
      'backgroundCheckData.riskLevel': 'low',
      'backgroundCheckData.expiresAt': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    });

    console.log(`Simulated background check completion for request: ${requestId}`);

  } catch (error) {
    console.error('Error simulating background check completion:', error);
  }
}

// Get test results endpoint
export const GET: RequestHandler = async ({ url }) => {
  try {
    const requestId = url.searchParams.get('requestId');
    
    if (!requestId) {
      return json({ error: 'Request ID is required' }, { status: 400 });
    }

    const requestDoc = await adminFirestore
      .collection('testVerificationRequests')
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return json({ error: 'Test request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data();
    
    return json({
      success: true,
      request: {
        id: requestDoc.id,
        ...requestData,
        submittedAt: requestData?.submittedAt?.toDate?.() || requestData?.submittedAt,
        completedAt: requestData?.completedAt?.toDate?.() || requestData?.completedAt
      }
    });

  } catch (error) {
    console.error('Error fetching test results:', error);
    return json({ 
      error: 'Failed to fetch test results' 
    }, { status: 500 });
  }
};

// Clean up test data endpoint
export const DELETE: RequestHandler = async () => {
  try {
    // Delete all test verification requests older than 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const oldTestRequests = await adminFirestore
      .collection('testVerificationRequests')
      .where('submittedAt', '<', cutoffTime)
      .get();

    const batch = adminFirestore.batch();
    oldTestRequests.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return json({
      success: true,
      message: `Cleaned up ${oldTestRequests.size} old test requests`,
      deletedCount: oldTestRequests.size
    });

  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return json({ 
      error: 'Failed to clean up test data' 
    }, { status: 500 });
  }
};
