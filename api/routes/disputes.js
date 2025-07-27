/**
 * Disputes Routes
 * Handle rental disputes and resolution
 */

const express = require('express');
const { query, transaction, queryBuilders } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest, validateUUID } = require('../middleware/validation');
const { asyncHandler, APIError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const { processRefund } = require('../config/stripe');

const router = express.Router();

/**
 * POST /api/disputes
 * Create a new dispute
 */
router.post('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rental_id, dispute_type, description, evidence_urls = [] } = req.body;
    const userId = req.user.id;
    
    if (!rental_id || !dispute_type || !description) {
      throw new APIError('Rental ID, dispute type, and description are required', 400);
    }
    
    const validDisputeTypes = ['damage', 'no_show', 'late_return', 'item_not_as_described', 'other'];
    if (!validDisputeTypes.includes(dispute_type)) {
      throw new APIError('Invalid dispute type', 400);
    }
    
    await transaction(async (client) => {
      // Get rental details
      const rentalResult = await client.query(
        'SELECT * FROM rentals WHERE id = $1',
        [rental_id]
      );
      
      if (rentalResult.rows.length === 0) {
        throw new NotFoundError('Rental not found');
      }
      
      const rental = rentalResult.rows[0];
      
      // Check if user is involved in the rental
      if (rental.renter_id !== userId && rental.owner_id !== userId) {
        throw new ForbiddenError('You can only create disputes for your own rentals');
      }
      
      // Check if rental is in a state that allows disputes
      const allowedStatuses = ['active', 'completed', 'overdue'];
      if (!allowedStatuses.includes(rental.status)) {
        throw new APIError('Disputes can only be created for active, completed, or overdue rentals', 400);
      }
      
      // Check if there's already an open dispute
      const existingDispute = await client.query(
        'SELECT id FROM disputes WHERE rental_id = $1 AND status IN ($2, $3)',
        [rental_id, 'open', 'under_review']
      );
      
      if (existingDispute.rows.length > 0) {
        throw new APIError('There is already an open dispute for this rental', 400);
      }
      
      // Create dispute
      const disputeData = {
        rental_id,
        complainant_id: userId,
        respondent_id: rental.renter_id === userId ? rental.owner_id : rental.renter_id,
        dispute_type,
        description,
        evidence_urls: JSON.stringify(evidence_urls),
        status: 'open',
        created_by: userId
      };
      
      const { query: insertQuery, params } = queryBuilders.buildInsertQuery('disputes', disputeData);
      const result = await client.query(insertQuery, params);
      
      // Update rental status to disputed
      await client.query(
        'UPDATE rentals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['disputed', rental_id]
      );
      
      return result.rows[0];
    });
    
    res.status(201).json({
      message: 'Dispute created successfully',
      dispute: result
    });
  })
);

/**
 * GET /api/disputes
 * Get user's disputes
 */
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    
    let whereConditions = ['(complainant_id = $1 OR respondent_id = $1)'];
    let params = [userId];
    let paramIndex = 2;
    
    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    const result = await query(`
      SELECT d.*, 
             r.gear_item_id, gi.title as gear_title,
             complainant.display_name as complainant_name,
             respondent.display_name as respondent_name
      FROM disputes d
      JOIN rentals r ON d.rental_id = r.id
      JOIN gear_items gi ON r.gear_item_id = gi.id
      JOIN users complainant ON d.complainant_id = complainant.id
      JOIN users respondent ON d.respondent_id = respondent.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);
    
    res.json({
      disputes: result.rows
    });
  })
);

/**
 * GET /api/disputes/:id
 * Get single dispute details
 */
router.get('/:id',
  validateUUID(),
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await query(`
      SELECT d.*, 
             r.gear_item_id, r.start_date, r.end_date, r.total_amount,
             gi.title as gear_title, gi.images as gear_images,
             complainant.display_name as complainant_name, complainant.email as complainant_email,
             respondent.display_name as respondent_name, respondent.email as respondent_email
      FROM disputes d
      JOIN rentals r ON d.rental_id = r.id
      JOIN gear_items gi ON r.gear_item_id = gi.id
      JOIN users complainant ON d.complainant_id = complainant.id
      JOIN users respondent ON d.respondent_id = respondent.id
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Dispute not found');
    }
    
    const dispute = result.rows[0];
    
    // Check if user is involved in the dispute or is admin
    if (dispute.complainant_id !== userId && dispute.respondent_id !== userId && !req.user.is_admin) {
      throw new ForbiddenError('You can only view your own disputes');
    }
    
    // Get dispute messages
    const messagesResult = await query(`
      SELECT dm.*, u.display_name as sender_name
      FROM dispute_messages dm
      JOIN users u ON dm.sender_id = u.id
      WHERE dm.dispute_id = $1
      ORDER BY dm.created_at ASC
    `, [id]);
    
    res.json({
      dispute,
      messages: messagesResult.rows
    });
  })
);

/**
 * POST /api/disputes/:id/messages
 * Add message to dispute
 */
router.post('/:id/messages',
  validateUUID(),
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, is_admin_message = false } = req.body;
    const userId = req.user.id;
    
    if (!message || message.trim().length === 0) {
      throw new APIError('Message is required', 400);
    }
    
    await transaction(async (client) => {
      // Get dispute details
      const disputeResult = await client.query(
        'SELECT * FROM disputes WHERE id = $1',
        [id]
      );
      
      if (disputeResult.rows.length === 0) {
        throw new NotFoundError('Dispute not found');
      }
      
      const dispute = disputeResult.rows[0];
      
      // Check if user can add messages to this dispute
      const canMessage = dispute.complainant_id === userId || 
                        dispute.respondent_id === userId || 
                        (req.user.is_admin && is_admin_message);
      
      if (!canMessage) {
        throw new ForbiddenError('You cannot add messages to this dispute');
      }
      
      // Add message
      const messageData = {
        dispute_id: id,
        sender_id: userId,
        message: message.trim(),
        is_admin_message,
        created_by: userId
      };
      
      const { query: insertQuery, params } = queryBuilders.buildInsertQuery('dispute_messages', messageData);
      const result = await client.query(insertQuery, params);
      
      return result.rows[0];
    });
    
    res.status(201).json({
      message: 'Message added successfully',
      dispute_message: result
    });
  })
);

/**
 * PUT /api/disputes/:id/resolve
 * Resolve dispute (admin only)
 */
router.put('/:id/resolve',
  validateUUID(),
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { resolution, refund_amount = null, refund_to = null } = req.body;
    const adminId = req.user.id;
    
    if (!resolution) {
      throw new APIError('Resolution is required', 400);
    }
    
    await transaction(async (client) => {
      // Get dispute details
      const disputeResult = await client.query(`
        SELECT d.*, r.id as rental_id, pi.stripe_payment_intent_id
        FROM disputes d
        JOIN rentals r ON d.rental_id = r.id
        LEFT JOIN payment_intents pi ON r.id = pi.rental_id
        WHERE d.id = $1
      `, [id]);
      
      if (disputeResult.rows.length === 0) {
        throw new NotFoundError('Dispute not found');
      }
      
      const dispute = disputeResult.rows[0];
      
      if (dispute.status !== 'open' && dispute.status !== 'under_review') {
        throw new APIError('Only open or under review disputes can be resolved', 400);
      }
      
      // Process refund if specified
      if (refund_amount && refund_to && dispute.stripe_payment_intent_id) {
        const refundAmountCents = Math.round(refund_amount * 100);
        
        try {
          await processRefund(
            dispute.stripe_payment_intent_id,
            refundAmountCents,
            'dispute_resolution'
          );
        } catch (error) {
          console.error('Refund processing failed:', error);
          throw new APIError('Failed to process refund', 500);
        }
      }
      
      // Update dispute
      await client.query(`
        UPDATE disputes 
        SET status = $1, resolution = $2, resolved_by = $3, resolved_at = CURRENT_TIMESTAMP,
            refund_amount = $4, refund_recipient_id = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, ['resolved', resolution, adminId, refund_amount, refund_to, id]);
      
      // Update rental status
      await client.query(
        'UPDATE rentals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', dispute.rental_id]
      );
      
      return { dispute_id: id, status: 'resolved' };
    });
    
    res.json({
      message: 'Dispute resolved successfully',
      result
    });
  })
);

/**
 * GET /api/disputes/admin/all
 * Get all disputes for admin review
 */
router.get('/admin/all',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = 'open' } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await query(`
      SELECT d.*, 
             r.gear_item_id, gi.title as gear_title,
             complainant.display_name as complainant_name, complainant.email as complainant_email,
             respondent.display_name as respondent_name, respondent.email as respondent_email
      FROM disputes d
      JOIN rentals r ON d.rental_id = r.id
      JOIN gear_items gi ON r.gear_item_id = gi.id
      JOIN users complainant ON d.complainant_id = complainant.id
      JOIN users respondent ON d.respondent_id = respondent.id
      WHERE d.status = $1
      ORDER BY d.created_at ASC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);
    
    res.json({
      disputes: result.rows
    });
  })
);

module.exports = router;
