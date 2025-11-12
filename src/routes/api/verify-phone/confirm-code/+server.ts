import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$lib/firebase/server';
import { auditLog } from '$lib/security/audit';
import { sendEmailTemplate } from '$lib/services/email';

export const POST: RequestHandler = createSecureHandler(
  async ({ request, getClientAddress }, { auth, body }) => {
    const { code } = body;
    
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      // Get verification record
      const verificationDoc = await adminFirestore
        .collection('phoneVerifications')
        .doc(auth.userId)
        .get();

      if (!verificationDoc.exists) {
        return json({ 
          error: 'No verification request found. Please request a new code.' 
        }, { status: 404 });
      }

      const verificationData = verificationDoc.data();
      
      // Check if verification has expired
      if (new Date() > verificationData.expiresAt.toDate()) {
        return json({ 
          error: 'Verification code has expired. Please request a new code.' 
        }, { status: 410 });
      }

      // Check if too many attempts
      if (verificationData.attempts >= verificationData.maxAttempts) {
        return json({ 
          error: 'Too many failed attempts. Please request a new code.' 
        }, { status: 429 });
      }

      // Check if already verified
      if (verificationData.verified) {
        return json({ 
          error: 'Phone number already verified.' 
        }, { status: 409 });
      }

      // Verify the code
      if (code !== verificationData.code) {
        // Increment attempts
        await adminFirestore
          .collection('phoneVerifications')
          .doc(auth.userId)
          .update({
            attempts: verificationData.attempts + 1,
            lastAttemptAt: new Date()
          });

        // Log failed attempt
        await auditLog.logSecurityEvent({
          type: 'phone_verification_failed',
          userId: auth.userId,
          ip: getClientAddress(),
          userAgent: request.headers.get('User-Agent') || 'unknown',
          details: {
            phoneNumber: verificationData.phoneNumber,
            attempts: verificationData.attempts + 1
          },
          timestamp: new Date()
        });

        return json({ 
          error: 'Invalid verification code. Please try again.',
          attemptsRemaining: verificationData.maxAttempts - (verificationData.attempts + 1)
        }, { status: 400 });
      }

      // Code is correct - mark as verified
      const batch = adminFirestore.batch();

      // Update verification record
      const verificationRef = adminFirestore
        .collection('phoneVerifications')
        .doc(auth.userId);
      
      batch.update(verificationRef, {
        verified: true,
        verifiedAt: new Date(),
        attempts: verificationData.attempts + 1
      });

      // Update user record
      const userRef = adminFirestore
        .collection('users')
        .doc(auth.userId);
      
      batch.update(userRef, {
        phoneNumber: verificationData.phoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: new Date()
      });

      // Commit the batch
      await batch.commit();

      // Get user data for email notification
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Send confirmation email
      if (userData?.email) {
        try {
          await sendEmailTemplate('phoneVerified', {
            userEmail: userData.email,
            userName: userData.displayName || userData.email.split('@')[0],
            phoneNumber: verificationData.phoneNumber
          });
        } catch (emailError) {
          console.error('Failed to send phone verification email:', emailError);
          // Don't fail the verification if email fails
        }
      }

      // Log successful verification
      await auditLog.logSecurityEvent({
        type: 'phone_verification_success',
        userId: auth.userId,
        ip: getClientAddress(),
        userAgent: request.headers.get('User-Agent') || 'unknown',
        details: {
          phoneNumber: verificationData.phoneNumber
        },
        timestamp: new Date()
      });

      return json({
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber: verificationData.phoneNumber,
        verifiedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Phone verification confirmation error:', error);
      
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
    rateLimit: 'auth',
    validateCSRF: true,
    inputSchema: {
      code: { 
        required: true, 
        type: 'string' as const, 
        minLength: 6,
        maxLength: 6,
        pattern: '^[0-9]{6}$'
      }
    }
  }
);
