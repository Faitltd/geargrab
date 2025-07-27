/**
 * Rentals Routes
 * Rental booking and management operations
 */

const express = require('express');
const { query, queryBuilders, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, validateUUID, rentalSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ForbiddenError, ConflictError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/rentals
 * Get user's rentals (as renter or owner)
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, role = 'all' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    // Filter by user role
    if (role === 'renter') {
      whereConditions.push(`r.renter_id = $${paramIndex}`);
      params.push(req.user.id);
      paramIndex++;
    } else if (role === 'owner') {
      whereConditions.push(`r.owner_id = $${paramIndex}`);
      params.push(req.user.id);
      paramIndex++;
    } else {
      whereConditions.push(`(r.renter_id = $${paramIndex} OR r.owner_id = $${paramIndex})`);
      params.push(req.user.id);
      paramIndex++;
    }
    
    // Filter by status
    if (status) {
      whereConditions.push(`r.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    const result = await query(`
      SELECT r.*, 
             gi.title as gear_title, gi.images as gear_images,
             gi.daily_price as gear_daily_price,
             renter.display_name as renter_name, renter.photo_url as renter_photo,
             owner.display_name as owner_name, owner.photo_url as owner_photo
      FROM rentals r
      JOIN gear_items gi ON r.gear_item_id = gi.id
      JOIN users renter ON r.renter_id = renter.id
      JOIN users owner ON r.owner_id = owner.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);
    
    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) FROM rentals r WHERE ${whereConditions.join(' AND ')}
    `, params);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      rentals: result.rows,
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
 * GET /api/rentals/:id
 * Get single rental by ID
 */
router.get('/:id',
  validateUUID(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(`
      SELECT r.*, 
             gi.title as gear_title, gi.description as gear_description,
             gi.images as gear_images, gi.brand, gi.model,
             renter.display_name as renter_name, renter.email as renter_email,
             renter.phone_number as renter_phone, renter.photo_url as renter_photo,
             owner.display_name as owner_name, owner.email as owner_email,
             owner.phone_number as owner_phone, owner.photo_url as owner_photo
      FROM rentals r
      JOIN gear_items gi ON r.gear_item_id = gi.id
      JOIN users renter ON r.renter_id = renter.id
      JOIN users owner ON r.owner_id = owner.id
      WHERE r.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Rental not found');
    }
    
    const rental = result.rows[0];
    
    // Check if user is involved in this rental
    if (rental.renter_id !== req.user.id && rental.owner_id !== req.user.id) {
      throw new ForbiddenError('You can only view your own rentals');
    }
    
    res.json({
      rental
    });
  })
);

/**
 * POST /api/rentals
 * Create new rental booking
 */
router.post('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      gear_item_id,
      start_date,
      end_date,
      delivery_method = 'pickup',
      delivery_address,
      special_requests,
      total_days,
      subtotal,
      service_fee,
      total_amount
    } = req.body;

    const renterId = req.user.id;

    // Validation
    if (!gear_item_id || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Gear item ID, start date, and end date are required'
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        error: 'Start date cannot be in the past'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        error: 'End date must be after start date'
      });
    }

    const result = await transaction(async (client) => {
      // Get gear item details
      const gearResult = await client.query(`
        SELECT gi.*, u.id as owner_id, u.display_name as owner_name
        FROM gear_items gi
        JOIN users u ON gi.owner_id = u.id
        WHERE gi.id = $1 AND gi.status = 'active'
      `, [gear_item_id]);

      if (gearResult.rows.length === 0) {
        throw new NotFoundError('Gear item not found or not available');
      }

      const gearItem = gearResult.rows[0];

      // Check if user is trying to rent their own gear
      if (gearItem.owner_id === renterId) {
        throw new ForbiddenError('You cannot rent your own gear');
      }
      
      // Check for conflicting rentals (including pending)
      const conflictingRentals = await client.query(`
        SELECT id FROM rentals
        WHERE gear_item_id = $1
        AND status IN ('pending', 'confirmed', 'active')
        AND (
          (start_date <= $2 AND end_date >= $2) OR
          (start_date <= $3 AND end_date >= $3) OR
          (start_date >= $2 AND end_date <= $3)
        )
      `, [gear_item_id, start_date, end_date]);

      if (conflictingRentals.rows.length > 0) {
        throw new ConflictError('Gear is not available for the selected dates');
      }
      
      // Calculate pricing
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const subtotal = gearItem.daily_price * totalDays;
      const serviceFee = subtotal * 0.1; // 10% service fee
      const totalAmount = subtotal + serviceFee;
      
      // Create rental
      const rentalData = {
        gear_item_id,
        renter_id: renterId,
        owner_id: gearItem.owner_id,
        start_date,
        end_date,
        daily_rate: gearItem.daily_price,
        total_days: total_days || totalDays,
        subtotal: subtotal || (gearItem.daily_price * totalDays),
        service_fee: service_fee || serviceFee,
        total_amount: total_amount || totalAmount,
        security_deposit: gearItem.security_deposit || 0,
        delivery_method: delivery_method || 'pickup',
        delivery_address,
        special_requests,
        status: gearItem.instant_book ? 'confirmed' : 'pending',
        confirmed_at: gearItem.instant_book ? new Date() : null,
        created_by: renterId
      };
      
      const { query: insertQuery, params } = queryBuilders.buildInsertQuery('rentals', rentalData);
      const result = await client.query(insertQuery, params);
      
      return result.rows[0];
    });
    
    res.status(201).json({
      message: 'Rental booking created successfully',
      rental: result,
      instant_book: result.status === 'confirmed'
    });
  })
);

/**
 * PUT /api/rentals/:id/approve
 * Approve rental request (owner only)
 */
router.put('/:id/approve',
  validateUUID(),
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await transaction(async (client) => {
      // Get rental details
      const rentalResult = await client.query(
        'SELECT * FROM rentals WHERE id = $1',
        [id]
      );

      if (rentalResult.rows.length === 0) {
        throw new NotFoundError('Rental not found');
      }

      const rental = rentalResult.rows[0];

      // Check if user is the gear owner
      if (rental.owner_id !== userId) {
        throw new ForbiddenError('Only the gear owner can approve rentals');
      }

      // Check if rental is in pending status
      if (rental.status !== 'pending') {
        throw new APIError('Only pending rentals can be approved', 400);
      }

      // Update rental status
      await client.query(`
        UPDATE rentals
        SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);

      // TODO: Send notification to renter
      // TODO: Create payment intent for confirmed rental

      return { rental_id: id, status: 'confirmed' };
    });

    res.json({
      message: 'Rental approved successfully',
      rental_id: id,
      status: 'confirmed'
    });
  })
);

/**
 * PUT /api/rentals/:id/reject
 * Reject rental request (owner only)
 */
router.put('/:id/reject',
  validateUUID(),
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const userId = req.user.id;

    await transaction(async (client) => {
      // Get rental details
      const rentalResult = await client.query(
        'SELECT * FROM rentals WHERE id = $1',
        [id]
      );

      if (rentalResult.rows.length === 0) {
        throw new NotFoundError('Rental not found');
      }

      const rental = rentalResult.rows[0];

      // Check if user is the gear owner
      if (rental.owner_id !== userId) {
        throw new ForbiddenError('Only the gear owner can reject rentals');
      }

      // Check if rental is in pending status
      if (rental.status !== 'pending') {
        throw new APIError('Only pending rentals can be rejected', 400);
      }

      // Update rental status
      await client.query(`
        UPDATE rentals
        SET status = 'rejected', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id, rejection_reason]);

      // TODO: Send notification to renter

      return { rental_id: id, status: 'rejected' };
    });

    res.json({
      message: 'Rental rejected successfully',
      rental_id: id,
      status: 'rejected'
    });
  })
);

/**
 * PUT /api/rentals/:id
 * Update rental status or details
 */
router.put('/:id',
  validateUUID(),
  validateRequest(rentalSchemas.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Get rental details
    const existingRental = await query(
      'SELECT * FROM rentals WHERE id = $1',
      [id]
    );
    
    if (existingRental.rows.length === 0) {
      throw new NotFoundError('Rental not found');
    }
    
    const rental = existingRental.rows[0];
    
    // Check if user is involved in this rental
    if (rental.renter_id !== req.user.id && rental.owner_id !== req.user.id) {
      throw new ForbiddenError('You can only update your own rentals');
    }
    
    // Validate status transitions
    const { status } = req.body;
    if (status) {
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['active', 'cancelled'],
        'active': ['completed', 'disputed'],
        'completed': ['disputed'],
        'cancelled': [],
        'disputed': ['completed', 'cancelled']
      };
      
      if (status !== rental.status && !validTransitions[rental.status]?.includes(status)) {
        throw new ForbiddenError(`Cannot transition from ${rental.status} to ${status}`);
      }
      
      // Only owners can confirm rentals
      if (status === 'confirmed' && rental.owner_id !== req.user.id) {
        throw new ForbiddenError('Only the gear owner can confirm rentals');
      }
    }
    
    // Add timestamps for status changes
    const updateData = { ...req.body };
    if (status) {
      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString();
          break;
        case 'active':
          updateData.checked_out_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString();
          break;
      }
    }
    
    const { query: updateQuery, params } = queryBuilders.buildUpdateQuery('rentals', id, updateData);
    const result = await query(updateQuery, params);
    
    res.json({
      message: 'Rental updated successfully',
      rental: result.rows[0]
    });
  })
);

/**
 * POST /api/rentals/:id/confirm
 * Confirm rental booking (owner only)
 */
router.post('/:id/confirm',
  validateUUID(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const rental = await query(
      'SELECT * FROM rentals WHERE id = $1',
      [id]
    );
    
    if (rental.rows.length === 0) {
      throw new NotFoundError('Rental not found');
    }
    
    const rentalData = rental.rows[0];
    
    if (rentalData.owner_id !== req.user.id) {
      throw new ForbiddenError('Only the gear owner can confirm rentals');
    }
    
    if (rentalData.status !== 'pending') {
      throw new ForbiddenError('Only pending rentals can be confirmed');
    }
    
    const result = await query(
      'UPDATE rentals SET status = $1, confirmed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['confirmed', id]
    );
    
    res.json({
      message: 'Rental confirmed successfully',
      rental: result.rows[0]
    });
  })
);

/**
 * POST /api/rentals/:id/cancel
 * Cancel rental booking
 */
router.post('/:id/cancel',
  validateUUID(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    const rental = await query(
      'SELECT * FROM rentals WHERE id = $1',
      [id]
    );
    
    if (rental.rows.length === 0) {
      throw new NotFoundError('Rental not found');
    }
    
    const rentalData = rental.rows[0];
    
    if (rentalData.renter_id !== req.user.id && rentalData.owner_id !== req.user.id) {
      throw new ForbiddenError('You can only cancel your own rentals');
    }
    
    if (!['pending', 'confirmed'].includes(rentalData.status)) {
      throw new ForbiddenError('Only pending or confirmed rentals can be cancelled');
    }
    
    const result = await query(`
      UPDATE rentals 
      SET status = $1, cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = $2 
      WHERE id = $3 
      RETURNING *
    `, ['cancelled', reason, id]);
    
    res.json({
      message: 'Rental cancelled successfully',
      rental: result.rows[0]
    });
  })
);

module.exports = router;
