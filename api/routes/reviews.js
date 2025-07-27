/**
 * Reviews Routes
 * User and gear reviews and ratings
 */

const express = require('express');
const { query, queryBuilders } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateRequest, validateUUID, reviewSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ForbiddenError, ConflictError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/reviews
 * Get reviews (public endpoint)
 */
router.get('/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, gear_item_id, user_id, review_type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['is_public = true'];
    let params = [];
    let paramIndex = 1;
    
    if (gear_item_id) {
      whereConditions.push(`gear_item_id = $${paramIndex}`);
      params.push(gear_item_id);
      paramIndex++;
    }
    
    if (user_id) {
      whereConditions.push(`reviewee_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }
    
    if (review_type) {
      whereConditions.push(`review_type = $${paramIndex}`);
      params.push(review_type);
      paramIndex++;
    }
    
    const result = await query(`
      SELECT r.id, r.rating, r.title, r.comment, r.review_type, r.created_at,
             reviewer.display_name as reviewer_name, reviewer.photo_url as reviewer_photo,
             reviewee.display_name as reviewee_name,
             gi.title as gear_title
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN users reviewee ON r.reviewee_id = reviewee.id
      LEFT JOIN gear_items gi ON r.gear_item_id = gi.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);
    
    res.json({
      reviews: result.rows
    });
  })
);

/**
 * POST /api/reviews
 * Create a new review
 */
router.post('/',
  authenticateToken,
  validateRequest(reviewSchemas.create),
  asyncHandler(async (req, res) => {
    const { rental_id, rating, title, comment, review_type } = req.body;
    
    // Get rental details
    const rentalResult = await query(
      'SELECT * FROM rentals WHERE id = $1',
      [rental_id]
    );
    
    if (rentalResult.rows.length === 0) {
      throw new NotFoundError('Rental not found');
    }
    
    const rental = rentalResult.rows[0];
    
    // Check if user is involved in this rental
    if (rental.renter_id !== req.user.id && rental.owner_id !== req.user.id) {
      throw new ForbiddenError('You can only review rentals you were involved in');
    }
    
    // Check if rental is completed
    if (rental.status !== 'completed') {
      throw new ForbiddenError('You can only review completed rentals');
    }
    
    // Determine reviewee based on review type
    let reviewee_id, gear_item_id;
    
    if (review_type === 'renter_to_owner') {
      if (rental.renter_id !== req.user.id) {
        throw new ForbiddenError('Only renters can leave owner reviews');
      }
      reviewee_id = rental.owner_id;
    } else if (review_type === 'owner_to_renter') {
      if (rental.owner_id !== req.user.id) {
        throw new ForbiddenError('Only owners can leave renter reviews');
      }
      reviewee_id = rental.renter_id;
    } else if (review_type === 'gear_review') {
      if (rental.renter_id !== req.user.id) {
        throw new ForbiddenError('Only renters can leave gear reviews');
      }
      reviewee_id = rental.owner_id; // Gear reviews are associated with the owner
      gear_item_id = rental.gear_item_id;
    }
    
    // Check if review already exists
    const existingReview = await query(
      'SELECT id FROM reviews WHERE rental_id = $1 AND reviewer_id = $2 AND review_type = $3',
      [rental_id, req.user.id, review_type]
    );
    
    if (existingReview.rows.length > 0) {
      throw new ConflictError('You have already reviewed this rental');
    }
    
    // Create review
    const reviewData = {
      rental_id,
      reviewer_id: req.user.id,
      reviewee_id,
      gear_item_id,
      rating,
      title,
      comment,
      review_type
    };
    
    const { query: insertQuery, params } = queryBuilders.buildInsertQuery('reviews', reviewData);
    const result = await query(insertQuery, params);
    
    // Update user/gear ratings
    await updateRatings(reviewee_id, gear_item_id, review_type);
    
    res.status(201).json({
      message: 'Review created successfully',
      review: result.rows[0]
    });
  })
);

/**
 * Helper function to update ratings
 */
async function updateRatings(userId, gearItemId, reviewType) {
  if (reviewType === 'renter_to_owner') {
    // Update owner rating
    const ownerStats = await query(`
      SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as total_reviews
      FROM reviews 
      WHERE reviewee_id = $1 AND review_type = 'renter_to_owner'
    `, [userId]);
    
    await query(
      'UPDATE users SET rating_as_owner = $1, total_reviews_as_owner = $2 WHERE id = $3',
      [ownerStats.rows[0].avg_rating, ownerStats.rows[0].total_reviews, userId]
    );
  } else if (reviewType === 'owner_to_renter') {
    // Update renter rating
    const renterStats = await query(`
      SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as total_reviews
      FROM reviews 
      WHERE reviewee_id = $1 AND review_type = 'owner_to_renter'
    `, [userId]);
    
    await query(
      'UPDATE users SET rating_as_renter = $1, total_reviews_as_renter = $2 WHERE id = $3',
      [renterStats.rows[0].avg_rating, renterStats.rows[0].total_reviews, userId]
    );
  } else if (reviewType === 'gear_review' && gearItemId) {
    // Update gear item rating
    const gearStats = await query(`
      SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as total_reviews
      FROM reviews 
      WHERE gear_item_id = $1 AND review_type = 'gear_review'
    `, [gearItemId]);
    
    await query(
      'UPDATE gear_items SET rating = $1, review_count = $2 WHERE id = $3',
      [gearStats.rows[0].avg_rating, gearStats.rows[0].total_reviews, gearItemId]
    );
  }
}

module.exports = router;
