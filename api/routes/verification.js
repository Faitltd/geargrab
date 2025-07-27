/**
 * Verification Routes
 * User verification workflows (email, phone, ID)
 */

const express = require('express');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, APIError, NotFoundError } = require('../middleware/errorHandler');
const { generateEmailVerificationLink, generatePasswordResetLink } = require('../config/firebase-admin');

const router = express.Router();

/**
 * POST /api/verification/send-email
 * Send email verification
 */
router.post('/send-email',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Get user details
    const userResult = await query(
      'SELECT email, is_email_verified FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const user = userResult.rows[0];
    
    if (user.is_email_verified) {
      return res.json({
        message: 'Email is already verified'
      });
    }
    
    try {
      // Generate verification code
      const verificationCode = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store verification code
      await query(`
        INSERT INTO email_verifications (user_id, email, verification_code, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET verification_code = $3, expires_at = $4, created_at = CURRENT_TIMESTAMP
      `, [userId, user.email, verificationCode, expiresAt]);
      
      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?code=${verificationCode}`;
      
      // TODO: Send actual email using nodemailer
      console.log(`Email verification link for ${user.email}: ${verificationLink}`);
      
      res.json({
        message: 'Verification email sent successfully',
        // In development, return the link for testing
        ...(process.env.NODE_ENV === 'development' && { verification_link: verificationLink })
      });
      
    } catch (error) {
      console.error('Email verification error:', error);
      throw new APIError('Failed to send verification email', 500);
    }
  })
);

/**
 * POST /api/verification/verify-email
 * Verify email with code
 */
router.post('/verify-email',
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    
    if (!code) {
      throw new APIError('Verification code is required', 400);
    }
    
    await transaction(async (client) => {
      // Find verification record
      const verificationResult = await client.query(`
        SELECT ev.*, u.email 
        FROM email_verifications ev
        JOIN users u ON ev.user_id = u.id
        WHERE ev.verification_code = $1 AND ev.expires_at > CURRENT_TIMESTAMP
      `, [code]);
      
      if (verificationResult.rows.length === 0) {
        throw new APIError('Invalid or expired verification code', 400);
      }
      
      const verification = verificationResult.rows[0];
      
      // Update user as verified
      await client.query(
        'UPDATE users SET is_email_verified = true WHERE id = $1',
        [verification.user_id]
      );
      
      // Delete verification record
      await client.query(
        'DELETE FROM email_verifications WHERE user_id = $1',
        [verification.user_id]
      );
      
      return verification;
    });
    
    res.json({
      message: 'Email verified successfully'
    });
  })
);

/**
 * POST /api/verification/send-phone
 * Send phone verification SMS
 */
router.post('/send-phone',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { phone_number } = req.body;
    const userId = req.user.id;
    
    if (!phone_number) {
      throw new APIError('Phone number is required', 400);
    }
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone_number)) {
      throw new APIError('Invalid phone number format', 400);
    }
    
    try {
      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store verification code
      await query(`
        INSERT INTO phone_verifications (user_id, phone_number, verification_code, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET phone_number = $2, verification_code = $3, expires_at = $4, created_at = CURRENT_TIMESTAMP
      `, [userId, phone_number, verificationCode, expiresAt]);
      
      // TODO: Send SMS using Twilio or similar service
      console.log(`SMS verification code for ${phone_number}: ${verificationCode}`);
      
      res.json({
        message: 'Verification SMS sent successfully',
        // In development, return the code for testing
        ...(process.env.NODE_ENV === 'development' && { verification_code: verificationCode })
      });
      
    } catch (error) {
      console.error('Phone verification error:', error);
      throw new APIError('Failed to send verification SMS', 500);
    }
  })
);

/**
 * POST /api/verification/verify-phone
 * Verify phone with SMS code
 */
router.post('/verify-phone',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    const userId = req.user.id;
    
    if (!code) {
      throw new APIError('Verification code is required', 400);
    }
    
    await transaction(async (client) => {
      // Find verification record
      const verificationResult = await client.query(`
        SELECT * FROM phone_verifications 
        WHERE user_id = $1 AND verification_code = $2 AND expires_at > CURRENT_TIMESTAMP
      `, [userId, code]);
      
      if (verificationResult.rows.length === 0) {
        throw new APIError('Invalid or expired verification code', 400);
      }
      
      const verification = verificationResult.rows[0];
      
      // Update user phone and mark as verified
      await client.query(`
        UPDATE users 
        SET phone_number = $1, is_phone_verified = true 
        WHERE id = $2
      `, [verification.phone_number, userId]);
      
      // Delete verification record
      await client.query(
        'DELETE FROM phone_verifications WHERE user_id = $1',
        [userId]
      );
      
      return verification;
    });
    
    res.json({
      message: 'Phone number verified successfully'
    });
  })
);

/**
 * POST /api/verification/upload-id
 * Upload ID document for verification
 */
router.post('/upload-id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { document_type, document_url, document_number } = req.body;
    const userId = req.user.id;
    
    if (!document_type || !document_url) {
      throw new APIError('Document type and URL are required', 400);
    }
    
    const validDocumentTypes = ['drivers_license', 'passport', 'national_id', 'state_id'];
    if (!validDocumentTypes.includes(document_type)) {
      throw new APIError('Invalid document type', 400);
    }
    
    try {
      // Store ID verification request
      await query(`
        INSERT INTO id_verifications (
          user_id, document_type, document_url, document_number, status
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          document_type = $2, 
          document_url = $3, 
          document_number = $4,
          status = $5,
          submitted_at = CURRENT_TIMESTAMP
      `, [userId, document_type, document_url, document_number, 'pending']);
      
      res.json({
        message: 'ID document uploaded successfully. Verification is pending review.',
        status: 'pending'
      });
      
    } catch (error) {
      console.error('ID verification error:', error);
      throw new APIError('Failed to upload ID document', 500);
    }
  })
);

/**
 * GET /api/verification/status
 * Get verification status for current user
 */
router.get('/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Get user verification status
    const userResult = await query(`
      SELECT is_email_verified, is_phone_verified, is_id_verified
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    const user = userResult.rows[0];
    
    // Get pending ID verification
    const idVerificationResult = await query(`
      SELECT document_type, status, submitted_at
      FROM id_verifications 
      WHERE user_id = $1
      ORDER BY submitted_at DESC
      LIMIT 1
    `, [userId]);
    
    const idVerification = idVerificationResult.rows[0] || null;
    
    res.json({
      email_verified: user.is_email_verified,
      phone_verified: user.is_phone_verified,
      id_verified: user.is_id_verified,
      id_verification: idVerification ? {
        document_type: idVerification.document_type,
        status: idVerification.status,
        submitted_at: idVerification.submitted_at
      } : null
    });
  })
);

module.exports = router;
