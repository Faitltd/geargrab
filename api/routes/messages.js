/**
 * Messages Routes
 * User messaging and communication
 */

const express = require('express');
const { query, transaction, queryBuilders } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, validateUUID, messageSchemas } = require('../middleware/validation');
const { asyncHandler, APIError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/messages/conversations
 * Get user's conversations
 */
router.get('/conversations',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT DISTINCT
        c.id,
        c.rental_id,
        c.participant1_id,
        c.participant2_id,
        c.created_at,
        c.updated_at,
        -- Get the other participant's info
        CASE
          WHEN c.participant1_id = $1 THEN u2.display_name
          ELSE u1.display_name
        END as other_participant_name,
        CASE
          WHEN c.participant1_id = $1 THEN u2.photo_url
          ELSE u1.photo_url
        END as other_participant_photo,
        CASE
          WHEN c.participant1_id = $1 THEN c.participant2_id
          ELSE c.participant1_id
        END as other_participant_id,
        -- Get rental info
        r.status as rental_status,
        gi.title as gear_title,
        gi.images as gear_images,
        -- Get last message
        lm.content as last_message_content,
        lm.created_at as last_message_at,
        lm.sender_id as last_message_sender_id,
        -- Count unread messages
        COALESCE(unread.count, 0) as unread_count
      FROM conversations c
      JOIN users u1 ON c.participant1_id = u1.id
      JOIN users u2 ON c.participant2_id = u2.id
      LEFT JOIN rentals r ON c.rental_id = r.id
      LEFT JOIN gear_items gi ON r.gear_item_id = gi.id
      LEFT JOIN LATERAL (
        SELECT content, created_at, sender_id
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.sender_id != $1
        AND m.read_at IS NULL
      ) unread ON true
      WHERE c.participant1_id = $1 OR c.participant2_id = $1
      ORDER BY COALESCE(lm.created_at, c.created_at) DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json({
      conversations: result.rows
    });
  })
);

/**
 * GET /api/messages/conversations/:id
 * Get conversation messages
 */
router.get('/conversations/:id',
  validateUUID(),
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is participant in conversation
    const conversationResult = await query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)',
      [id, userId]
    );

    if (conversationResult.rows.length === 0) {
      throw new NotFoundError('Conversation not found or access denied');
    }

    const conversation = conversationResult.rows[0];

    // Get messages
    const messagesResult = await query(`
      SELECT m.*, u.display_name as sender_name, u.photo_url as sender_photo
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    // Mark messages as read
    await query(
      'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL',
      [id, userId]
    );

    res.json({
      conversation,
      messages: messagesResult.rows.reverse() // Reverse to show oldest first
    });
  })
);

/**
 * GET /api/messages
 * Get user's messages/conversations (legacy endpoint)
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, rental_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['(sender_id = $1 OR receiver_id = $1)'];
    let params = [req.user.id];
    let paramIndex = 2;
    
    if (rental_id) {
      whereConditions.push(`rental_id = $${paramIndex}`);
      params.push(rental_id);
      paramIndex++;
    }
    
    const result = await query(`
      SELECT m.*, 
             sender.display_name as sender_name, sender.photo_url as sender_photo,
             receiver.display_name as receiver_name, receiver.photo_url as receiver_photo,
             r.gear_item_id, gi.title as gear_title
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      LEFT JOIN rentals r ON m.rental_id = r.id
      LEFT JOIN gear_items gi ON r.gear_item_id = gi.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);
    
    res.json({
      messages: result.rows
    });
  })
);

/**
 * POST /api/messages/conversations
 * Create or get conversation for a rental
 */
router.post('/conversations',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rental_id, recipient_id } = req.body;
    const userId = req.user.id;

    if (!rental_id && !recipient_id) {
      throw new APIError('Either rental_id or recipient_id is required', 400);
    }

    if (recipient_id === userId) {
      throw new APIError('Cannot create conversation with yourself', 400);
    }

    let conversationId;

    await transaction(async (client) => {
      if (rental_id) {
        // Check if user is involved in the rental
        const rentalResult = await client.query(
          'SELECT renter_id, owner_id FROM rentals WHERE id = $1',
          [rental_id]
        );

        if (rentalResult.rows.length === 0) {
          throw new NotFoundError('Rental not found');
        }

        const rental = rentalResult.rows[0];
        if (rental.renter_id !== userId && rental.owner_id !== userId) {
          throw new ForbiddenError('You can only create conversations for your own rentals');
        }

        // Check if conversation already exists for this rental
        const existingConversation = await client.query(
          'SELECT id FROM conversations WHERE rental_id = $1',
          [rental_id]
        );

        if (existingConversation.rows.length > 0) {
          conversationId = existingConversation.rows[0].id;
        } else {
          // Create new conversation
          const participant1Id = rental.renter_id;
          const participant2Id = rental.owner_id;

          const conversationResult = await client.query(`
            INSERT INTO conversations (rental_id, participant1_id, participant2_id, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `, [rental_id, participant1Id, participant2Id, userId]);

          conversationId = conversationResult.rows[0].id;
        }
      } else {
        // Direct message conversation
        const participant1Id = Math.min(userId, recipient_id);
        const participant2Id = Math.max(userId, recipient_id);

        // Check if conversation already exists
        const existingConversation = await client.query(
          'SELECT id FROM conversations WHERE participant1_id = $1 AND participant2_id = $2 AND rental_id IS NULL',
          [participant1Id, participant2Id]
        );

        if (existingConversation.rows.length > 0) {
          conversationId = existingConversation.rows[0].id;
        } else {
          // Create new conversation
          const conversationResult = await client.query(`
            INSERT INTO conversations (participant1_id, participant2_id, created_by)
            VALUES ($1, $2, $3)
            RETURNING id
          `, [participant1Id, participant2Id, userId]);

          conversationId = conversationResult.rows[0].id;
        }
      }
    });

    res.status(201).json({
      message: 'Conversation created or retrieved successfully',
      conversation_id: conversationId
    });
  })
);

/**
 * POST /api/messages
 * Send a new message
 */
router.post('/',
  validateRequest(messageSchemas.create),
  asyncHandler(async (req, res) => {
    const messageData = {
      ...req.body,
      sender_id: req.user.id
    };
    
    // Validate that receiver exists
    const receiverResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [messageData.receiver_id]
    );
    
    if (receiverResult.rows.length === 0) {
      throw new NotFoundError('Receiver not found');
    }
    
    const { query: insertQuery, params } = queryBuilders.buildInsertQuery('messages', messageData);
    const result = await query(insertQuery, params);
    
    res.status(201).json({
      message: 'Message sent successfully',
      message_data: result.rows[0]
    });
  })
);

/**
 * PUT /api/messages/:id/read
 * Mark message as read
 */
router.put('/:id/read',
  validateUUID(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE messages SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND receiver_id = $2 RETURNING *',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Message not found or you are not the receiver');
    }
    
    res.json({
      message: 'Message marked as read',
      message_data: result.rows[0]
    });
  })
);

module.exports = router;
