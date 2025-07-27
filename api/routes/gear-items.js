/**
 * Gear Items Routes
 * CRUD operations for outdoor gear listings
 */

const express = require('express');
const { query, queryBuilders } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateRequest, validateUUID, gearItemSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/gear_items
 * Get list of gear items with filtering and pagination
 */
router.get('/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      city,
      state,
      zip_code,
      min_price,
      max_price,
      condition,
      brand,
      delivery_options,
      instant_book,
      sort_by = 'created_at',
      sort_order = 'desc',
      available_from,
      available_to,
      latitude,
      longitude,
      radius = 50, // miles
      query: searchQuery
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build WHERE conditions
    let whereConditions = ['status = $1'];
    let params = ['active'];
    let paramIndex = 2;
    
    if (category) {
      whereConditions.push(`gi.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (subcategory) {
      whereConditions.push(`gi.subcategory = $${paramIndex}`);
      params.push(subcategory);
      paramIndex++;
    }

    if (city) {
      whereConditions.push(`gi.city ILIKE $${paramIndex}`);
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (state) {
      whereConditions.push(`gi.state = $${paramIndex}`);
      params.push(state);
      paramIndex++;
    }

    if (zip_code) {
      whereConditions.push(`gi.zip_code = $${paramIndex}`);
      params.push(zip_code);
      paramIndex++;
    }

    if (condition) {
      whereConditions.push(`gi.condition = $${paramIndex}`);
      params.push(condition);
      paramIndex++;
    }

    if (brand) {
      whereConditions.push(`gi.brand ILIKE $${paramIndex}`);
      params.push(`%${brand}%`);
      paramIndex++;
    }

    if (instant_book === 'true') {
      whereConditions.push(`gi.instant_book = true`);
    }
    
    if (min_price) {
      whereConditions.push(`gi.daily_price >= $${paramIndex}`);
      params.push(parseFloat(min_price));
      paramIndex++;
    }

    if (max_price) {
      whereConditions.push(`gi.daily_price <= $${paramIndex}`);
      params.push(parseFloat(max_price));
      paramIndex++;
    }

    // Location-based filtering (radius search)
    if (latitude && longitude) {
      whereConditions.push(`
        (6371 * acos(cos(radians($${paramIndex})) * cos(radians(gi.latitude)) *
        cos(radians(gi.longitude) - radians($${paramIndex + 1})) +
        sin(radians($${paramIndex})) * sin(radians(gi.latitude)))) <= $${paramIndex + 2}
      `);
      params.push(parseFloat(latitude), parseFloat(longitude), parseFloat(radius));
      paramIndex += 3;
    }
    
    if (searchQuery) {
      whereConditions.push(`(
        gi.title ILIKE $${paramIndex} OR
        gi.description ILIKE $${paramIndex} OR
        gi.brand ILIKE $${paramIndex} OR
        gi.model ILIKE $${paramIndex} OR
        gi.category ILIKE $${paramIndex} OR
        gi.subcategory ILIKE $${paramIndex} OR
        to_tsvector('english', gi.title || ' ' || gi.description) @@ plainto_tsquery('english', $${paramIndex})
      )`);
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }
    
    // TODO: Add availability date filtering
    // This would require checking against the unavailable_dates JSON array
    // and existing rental bookings
    
    // Build ORDER BY clause
    let orderBy = 'gi.created_at DESC';
    const validSortFields = {
      'created_at': 'gi.created_at',
      'price_low': 'gi.daily_price',
      'price_high': 'gi.daily_price',
      'title': 'gi.title',
      'rating': 'gi.rating'
    };

    if (latitude && longitude && sort_by === 'distance') {
      orderBy = `(6371 * acos(cos(radians(${parseFloat(latitude)})) * cos(radians(gi.latitude)) *
                 cos(radians(gi.longitude) - radians(${parseFloat(longitude)})) +
                 sin(radians(${parseFloat(latitude)})) * sin(radians(gi.latitude)))) ASC`;
    } else if (validSortFields[sort_by]) {
      const direction = sort_by === 'price_high' ? 'DESC' :
                       (sort_order === 'asc' ? 'ASC' : 'DESC');
      orderBy = `${validSortFields[sort_by]} ${direction}`;
    }

    const queryText = `
      SELECT gi.id, gi.title, gi.description, gi.category, gi.subcategory,
             gi.brand, gi.model, gi.condition, gi.daily_price, gi.weekly_price,
             gi.monthly_price, gi.security_deposit, gi.city, gi.state,
             gi.images, gi.rating, gi.review_count, gi.created_at,
             u.display_name as owner_name, u.rating_as_owner as owner_rating,
             ${latitude && longitude ? `
               (6371 * acos(cos(radians(${parseFloat(latitude)})) * cos(radians(gi.latitude)) *
               cos(radians(gi.longitude) - radians(${parseFloat(longitude)})) +
               sin(radians(${parseFloat(latitude)})) * sin(radians(gi.latitude)))) as distance
             ` : 'NULL as distance'}
      FROM gear_items gi
      JOIN users u ON gi.owner_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), offset);
    
    const result = await query(queryText, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM gear_items gi
      JOIN users u ON gi.owner_id = u.id
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset
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
 * POST /api/gear_items/search
 * Advanced search with filters (same as GET but with POST body)
 */
router.post('/search',
  optionalAuth,
  validateRequest(gearItemSchemas.search),
  asyncHandler(async (req, res) => {
    // Redirect to GET with query parameters
    const queryParams = new URLSearchParams(req.body).toString();
    req.query = { ...req.query, ...req.body };
    
    // Reuse the GET logic
    return router.handle({ ...req, method: 'GET' }, res);
  })
);

/**
 * GET /api/gear_items/:id
 * Get single gear item by ID
 */
router.get('/:id',
  validateUUID(),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(`
      SELECT gi.*, 
             u.display_name as owner_name, u.photo_url as owner_photo,
             u.rating_as_owner as owner_rating, u.total_reviews_as_owner,
             u.city as owner_city, u.state as owner_state
      FROM gear_items gi
      JOIN users u ON gi.owner_id = u.id
      WHERE gi.id = $1 AND gi.status = 'active'
    `, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Gear item not found');
    }
    
    const gearItem = result.rows[0];
    
    // Increment view count
    await query(
      'UPDATE gear_items SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
    
    // Get recent reviews for this gear item
    const reviewsResult = await query(`
      SELECT r.rating, r.title, r.comment, r.created_at,
             u.display_name as reviewer_name, u.photo_url as reviewer_photo
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.gear_item_id = $1 AND r.is_public = true
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [id]);
    
    res.json({
      gear_item: gearItem,
      recent_reviews: reviewsResult.rows
    });
  })
);

/**
 * POST /api/gear_items
 * Create new gear item listing
 */
router.post('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      title,
      description,
      category,
      subcategory,
      daily_price,
      weekly_price,
      monthly_price,
      deposit_amount,
      images = [],
      condition,
      brand,
      model,
      year,
      size,
      weight,
      dimensions,
      features = [],
      included_accessories = [],
      delivery_options = [],
      pickup_location,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      availability_type = 'manual',
      min_rental_days = 1,
      max_rental_days = 30,
      advance_notice_days = 1,
      instant_book = false
    } = req.body;

    // Validation
    if (!title || !description || !category || !daily_price) {
      return res.status(400).json({
        error: 'Title, description, category, and daily price are required'
      });
    }

    if (daily_price <= 0) {
      return res.status(400).json({
        error: 'Daily price must be greater than 0'
      });
    }

    if (images.length === 0) {
      return res.status(400).json({
        error: 'At least one image is required'
      });
    }

    const gearData = {
      title: title.trim(),
      description: description.trim(),
      category,
      subcategory,
      daily_price: parseFloat(daily_price),
      weekly_price: weekly_price ? parseFloat(weekly_price) : null,
      monthly_price: monthly_price ? parseFloat(monthly_price) : null,
      deposit_amount: deposit_amount ? parseFloat(deposit_amount) : 0,
      images: JSON.stringify(images),
      condition: condition || 'good',
      brand: brand?.trim(),
      model: model?.trim(),
      year: year ? parseInt(year) : null,
      size: size?.trim(),
      weight: weight ? parseFloat(weight) : null,
      dimensions: dimensions?.trim(),
      features: JSON.stringify(features),
      included_accessories: JSON.stringify(included_accessories),
      delivery_options: JSON.stringify(delivery_options),
      pickup_location: pickup_location?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      zip_code: zip_code?.trim(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      availability_type,
      min_rental_days: parseInt(min_rental_days),
      max_rental_days: parseInt(max_rental_days),
      advance_notice_days: parseInt(advance_notice_days),
      instant_book: Boolean(instant_book),
      status: 'active',
      owner_id: req.user.id,
      created_by: req.user.id
    };

    const { query: insertQuery, params } = queryBuilders.buildInsertQuery('gear_items', gearData);
    const result = await query(insertQuery, params);

    res.status(201).json({
      message: 'Gear item created successfully',
      gear_item: result.rows[0]
    });
  })
);

/**
 * PUT /api/gear_items/:id
 * Update gear item listing
 */
router.put('/:id',
  validateUUID(),
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if gear item exists and user owns it
    const existingItem = await query(
      'SELECT owner_id FROM gear_items WHERE id = $1',
      [id]
    );

    if (existingItem.rows.length === 0) {
      throw new NotFoundError('Gear item not found');
    }

    if (existingItem.rows[0].owner_id !== req.user.id) {
      throw new ForbiddenError('You can only update your own gear items');
    }

    // Process update data
    const updateData = { ...req.body };

    // Handle JSON fields
    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = JSON.stringify(updateData.images);
    }
    if (updateData.features && Array.isArray(updateData.features)) {
      updateData.features = JSON.stringify(updateData.features);
    }
    if (updateData.included_accessories && Array.isArray(updateData.included_accessories)) {
      updateData.included_accessories = JSON.stringify(updateData.included_accessories);
    }
    if (updateData.delivery_options && Array.isArray(updateData.delivery_options)) {
      updateData.delivery_options = JSON.stringify(updateData.delivery_options);
    }

    // Convert numeric fields
    if (updateData.daily_price) updateData.daily_price = parseFloat(updateData.daily_price);
    if (updateData.weekly_price) updateData.weekly_price = parseFloat(updateData.weekly_price);
    if (updateData.monthly_price) updateData.monthly_price = parseFloat(updateData.monthly_price);
    if (updateData.deposit_amount) updateData.deposit_amount = parseFloat(updateData.deposit_amount);
    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.weight) updateData.weight = parseFloat(updateData.weight);
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.min_rental_days) updateData.min_rental_days = parseInt(updateData.min_rental_days);
    if (updateData.max_rental_days) updateData.max_rental_days = parseInt(updateData.max_rental_days);
    if (updateData.advance_notice_days) updateData.advance_notice_days = parseInt(updateData.advance_notice_days);

    // Convert boolean fields
    if (updateData.instant_book !== undefined) updateData.instant_book = Boolean(updateData.instant_book);

    const { query: updateQuery, params } = queryBuilders.buildUpdateQuery('gear_items', id, updateData);
    const result = await query(updateQuery, params);

    res.json({
      message: 'Gear item updated successfully',
      gear_item: result.rows[0]
    });
  })
);

/**
 * DELETE /api/gear_items/:id
 * Delete gear item listing
 */
router.delete('/:id',
  validateUUID(),
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if gear item exists and user owns it
    const existingItem = await query(
      'SELECT owner_id FROM gear_items WHERE id = $1',
      [id]
    );
    
    if (existingItem.rows.length === 0) {
      throw new NotFoundError('Gear item not found');
    }
    
    if (existingItem.rows[0].owner_id !== req.user.id) {
      throw new ForbiddenError('You can only delete your own gear items');
    }
    
    // Check if there are active rentals
    const activeRentals = await query(
      'SELECT id FROM rentals WHERE gear_item_id = $1 AND status IN ($2, $3, $4)',
      [id, 'pending', 'confirmed', 'active']
    );
    
    if (activeRentals.rows.length > 0) {
      throw new ForbiddenError('Cannot delete gear item with active rentals');
    }
    
    // Soft delete by updating status
    await query(
      'UPDATE gear_items SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['inactive', id]
    );
    
    res.json({
      message: 'Gear item deleted successfully'
    });
  })
);

/**
 * GET /api/gear_items/:id/availability
 * Check availability for specific dates
 */
router.get('/:id/availability',
  validateUUID(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'start_date and end_date are required'
      });
    }
    
    // Check if gear item exists
    const gearItem = await query(
      'SELECT id, unavailable_dates FROM gear_items WHERE id = $1 AND status = $2',
      [id, 'active']
    );
    
    if (gearItem.rows.length === 0) {
      throw new NotFoundError('Gear item not found');
    }
    
    // Check against existing rentals
    const conflictingRentals = await query(`
      SELECT id FROM rentals 
      WHERE gear_item_id = $1 
      AND status IN ('confirmed', 'active')
      AND (
        (start_date <= $2 AND end_date >= $2) OR
        (start_date <= $3 AND end_date >= $3) OR
        (start_date >= $2 AND end_date <= $3)
      )
    `, [id, start_date, end_date]);
    
    const isAvailable = conflictingRentals.rows.length === 0;
    
    res.json({
      available: isAvailable,
      conflicting_rentals: conflictingRentals.rows.length,
      unavailable_dates: gearItem.rows[0].unavailable_dates || []
    });
  })
);

module.exports = router;
