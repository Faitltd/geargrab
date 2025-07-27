/**
 * Authentication Routes
 * User registration, login, and authentication endpoints
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { userSchemas } = require('../middleware/validation');
const { asyncHandler, APIError, ConflictError, UnauthorizedError } = require('../middleware/errorHandler');
const { verifyFirebaseToken, isFirebaseAdminAvailable } = require('../config/firebase-admin');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', 
  validateRequest(userSchemas.register),
  asyncHandler(async (req, res) => {
    const { email, password, display_name, first_name, last_name, phone_number, date_of_birth } = req.body;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new ConflictError('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    
    // Create user
    const result = await query(`
      INSERT INTO users (
        email, password_hash, display_name, first_name, last_name, 
        phone_number, date_of_birth, is_email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, display_name, first_name, last_name, created_at
    `, [
      email, hashedPassword, display_name, first_name, last_name,
      phone_number, date_of_birth, false
    ]);
    
    const user = result.rows[0];
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at
      },
      token
    });
  })
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login',
  validateRequest(userSchemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Find user by email
    const result = await query(`
      SELECT id, email, password_hash, display_name, first_name, last_name, 
             account_status, is_email_verified
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    const user = result.rows[0];
    
    // Check account status
    if (user.account_status !== 'active') {
      throw new UnauthorizedError('Account is suspended or inactive');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    // Update last login
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        first_name: user.first_name,
        last_name: user.last_name,
        is_email_verified: user.is_email_verified
      },
      token
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT id, email, display_name, first_name, last_name, phone_number,
             street_address, city, state, zip_code, country,
             is_verified, is_email_verified, is_phone_verified,
             rating_as_owner, rating_as_renter, total_reviews_as_owner, total_reviews_as_renter,
             created_at, last_login_at
      FROM users 
      WHERE id = $1
    `, [req.user.id]);
    
    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }
    
    res.json({
      user: result.rows[0]
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // In a more sophisticated setup, you might maintain a blacklist of tokens
    // For now, we rely on client-side token removal
    
    res.json({
      message: 'Logout successful'
    });
  })
);

/**
 * POST /api/auth/firebase
 * Exchange Firebase ID token for JWT token
 */
router.post('/firebase',
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
      throw new APIError('Firebase ID token is required', 400);
    }

    if (!isFirebaseAdminAvailable()) {
      throw new APIError('Firebase authentication not configured', 500);
    }

    try {
      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(idToken);

      // Find or create user
      let userResult = await query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [decodedToken.uid]
      );

      let user;

      if (userResult.rows.length === 0) {
        // Create new user from Firebase data
        const newUserResult = await query(`
          INSERT INTO users (
            firebase_uid, email, display_name, photo_url, phone_number,
            is_email_verified, is_phone_verified, account_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          decodedToken.uid,
          decodedToken.email,
          decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          decodedToken.picture,
          decodedToken.phone_number,
          decodedToken.email_verified || false,
          decodedToken.phone_number ? true : false,
          'active'
        ]);

        user = newUserResult.rows[0];
      } else {
        user = userResult.rows[0];

        // Update user info from Firebase if needed
        await query(`
          UPDATE users
          SET display_name = COALESCE($2, display_name),
              photo_url = COALESCE($3, photo_url),
              is_email_verified = GREATEST(is_email_verified, $4),
              last_login_at = CURRENT_TIMESTAMP
          WHERE firebase_uid = $1
        `, [
          decodedToken.uid,
          decodedToken.name,
          decodedToken.picture,
          decodedToken.email_verified || false
        ]);
      }

      // Generate JWT token
      const jwtToken = generateToken(user);

      res.json({
        message: 'Firebase authentication successful',
        user: {
          id: user.id,
          firebase_uid: user.firebase_uid,
          email: user.email,
          display_name: user.display_name,
          photo_url: user.photo_url,
          is_email_verified: user.is_email_verified,
          is_phone_verified: user.is_phone_verified
        },
        token: jwtToken
      });

    } catch (error) {
      console.error('Firebase authentication error:', error);
      throw new UnauthorizedError('Invalid Firebase token');
    }
  })
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Generate new token
    const token = generateToken(req.user);

    res.json({
      message: 'Token refreshed successfully',
      token
    });
  })
);

/**
 * POST /api/auth/forgot-password
 * Request password reset (placeholder for now)
 */
router.post('/forgot-password',
  validateRequest(userSchemas.login.extract('email')),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    // Check if user exists
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent'
    });
    
    // TODO: Implement actual password reset email sending
    if (result.rows.length > 0) {
      console.log(`Password reset requested for user: ${email}`);
      // Send password reset email here
    }
  })
);

module.exports = router;
