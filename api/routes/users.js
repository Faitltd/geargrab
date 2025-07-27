/**
 * Users Routes
 * User profile management and user-related operations
 */

const express = require('express');
const { query, queryBuilders } = require('../config/database');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const { validateRequest, validateUUID, userSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/users
 * Get list of users (admin only)
 */
router.get('/',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    
    let queryText = `
      SELECT id, email, display_name, first_name, last_name, 
             city, state, is_verified, account_status, created_at,
             rating_as_owner, rating_as_renter
      FROM users
    `;
    let params = [];
    
    if (search) {
      queryText += ` WHERE display_name ILIKE $1 OR email ILIKE $1`;
      params.push(`%${search}%`);
    }
    
    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await query(queryText, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users';
    let countParams = [];
    
    if (search) {
      countQuery += ' WHERE display_name ILIKE $1 OR email ILIKE $1';
      countParams.push(`%${search}%`);
    }
    
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

/**
 * GET /api/users/:id
 * Get user profile by ID
 */
router.get('/:id',
  validateUUID(),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Determine what fields to return based on whether it's the user's own profile
    const isOwnProfile = req.user && req.user.id === id;
    const isAdmin = req.user && req.user.is_admin;
    
    let fields = `
      id, display_name, first_name, last_name, photo_url,
      city, state, is_verified, rating_as_owner, rating_as_renter,
      total_reviews_as_owner, total_reviews_as_renter, created_at
    `;
    
    if (isOwnProfile || isAdmin) {
      fields += `, email, phone_number, street_address, zip_code, country,
                  is_email_verified, is_phone_verified, last_login_at`;
    }
    
    const result = await query(`
      SELECT ${fields}
      FROM users 
      WHERE id = $1 AND account_status = 'active'
    `, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    res.json({
      user: result.rows[0]
    });
  })
);

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id',
  validateUUID(),
  authenticateToken,
  validateRequest(userSchemas.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Users can only update their own profile (unless admin)
    if (req.user.id !== id && !req.user.is_admin) {
      throw new ForbiddenError('You can only update your own profile');
    }
    
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );
    
    if (existingUser.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    // Build update query
    const updateData = req.body;
    const { query: updateQuery, params } = queryBuilders.buildUpdateQuery('users', id, updateData);
    
    const result = await query(updateQuery, params);
    
    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  })
);

/**
 * GET /api/users/:id/gear-items
 * Get user's gear listings
 */
router.get('/:id/gear-items',
  validateUUID(),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20, status = 'active' } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    // Get user's gear items
    const result = await query(`
      SELECT id, title, description, category, subcategory, brand, model,
             condition, daily_price, weekly_price, monthly_price,
             city, state, images, rating, review_count, status, created_at
      FROM gear_items
      WHERE owner_id = $1 AND status = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `, [id, status, limit, offset]);
    
    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM gear_items WHERE owner_id = $1 AND status = $2',
      [id, status]
    );
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      gear_items: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

/**
 * GET /api/users/:id/reviews
 * Get reviews for a user
 */
router.get('/:id/reviews',
  validateUUID(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    let whereClause = 'WHERE reviewee_id = $1 AND is_public = true';
    let params = [id];
    
    if (type === 'as_owner') {
      whereClause += ' AND review_type = $2';
      params.push('renter_to_owner');
    } else if (type === 'as_renter') {
      whereClause += ' AND review_type = $2';
      params.push('owner_to_renter');
    }
    
    const result = await query(`
      SELECT r.id, r.rating, r.title, r.comment, r.review_type, r.created_at,
             u.display_name as reviewer_name, u.photo_url as reviewer_photo,
             gi.title as gear_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      LEFT JOIN gear_items gi ON r.gear_item_id = gi.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    
    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) FROM reviews r ${whereClause}
    `, params);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

/**
 * DELETE /api/users/:id
 * Delete user account (admin only or self-deletion)
 */
router.delete('/:id',
  validateUUID(),
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Users can only delete their own account (unless admin)
    if (req.user.id !== id && !req.user.is_admin) {
      throw new ForbiddenError('You can only delete your own account');
    }
    
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );
    
    if (existingUser.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    
    // Soft delete by updating account status
    await query(
      'UPDATE users SET account_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['deleted', id]
    );
    
    res.json({
      message: 'Account deleted successfully'
    });
  })
);

module.exports = router;
