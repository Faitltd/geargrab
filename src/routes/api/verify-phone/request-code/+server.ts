import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$lib/firebase/server';
import { sendVerificationSMS, generateVerificationCode, validatePhoneNumber } from '$lib/services/twilio';
import { auditLog } from '$lib/security/audit';

export const POST: RequestHandler = createSecureHandler(
  async ({ request, getClientAddress }, { auth, body }) => {
    const { phoneNumber } = body;
    
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      // Validate phone number format
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return json({ 
          error: 'Invalid phone number format',
          details: validation.error 
        }, { status: 400 });
      }

      // Check if phone number is already verified by another user
      const existingUserQuery = await adminFirestore
        .collection('users')
        .where('phoneNumber', '==', validation.formatted)
        .where('phoneVerified', '==', true)
        .get();

      if (!existingUserQuery.empty) {
        const existingUser = existingUserQuery.docs[0];
        if (existingUser.id !== auth.userId) {
          return json({ 
            error: 'Phone number already verified by another account' 
          }, { status: 409 });
        }
      }

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Save verification data to Firestore
      const verificationData = {
        userId: auth.userId,
        phoneNumber: validation.formatted,
        code: verificationCode,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        expiresAt,
        verified: false,
        ip: getClientAddress(),
        userAgent: request.headers.get('User-Agent') || 'unknown'
      };

      await adminFirestore
        .collection('phoneVerifications')
        .doc(auth.userId)
        .set(verificationData);

      // Send SMS
      const smsResult = await sendVerificationSMS(validation.formatted, verificationCode);
      
      if (!smsResult.success) {
        // Log the error but don't expose Twilio details to client
        console.error('SMS sending failed:', smsResult.error);
        
        return json({ 
          error: 'Failed to send verification code. Please try again.' 
        }, { status: 500 });
      }

      // Log successful verification request
      await auditLog.logSecurityEvent({
        type: 'phone_verification_requested',
        userId: auth.userId,
        ip: getClientAddress(),
        userAgent: request.headers.get('User-Agent') || 'unknown',
        details: {
          phoneNumber: validation.formatted,
          messageId: smsResult.messageId
        },
        timestamp: new Date()
      });

      return json({
        success: true,
        message: 'Verification code sent successfully',
        phoneNumber: validation.formatted,
        expiresAt: expiresAt.toISOString(),
        messageId: smsResult.messageId
      });

    } catch (error) {
      console.error('Phone verification request error:', error);
      
      // Log the error
      await auditLog.logSecurityEvent({
        type: 'phone_verification_error',
        userId: auth.userId,
        ip: getClientAddress(),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      return json({ 
        error: 'Internal server error. Please try again.' 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: 'auth', // Limit to prevent SMS spam
    validateCSRF: true,
    inputSchema: {
      phoneNumber: { 
        required: true, 
        type: 'string' as const, 
        minLength: 10,
        maxLength: 20
      }
    }
  }
);
