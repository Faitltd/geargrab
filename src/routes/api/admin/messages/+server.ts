import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isAdminInitialized } from '$lib/firebase/server';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Check if Firebase Admin is available
    if (!isAdminInitialized || !adminFirestore) {
      return json({ 
        error: 'Firebase Admin not initialized',
        details: 'Missing Firebase Admin credentials'
      }, { status: 500 });
    }

    // Get query parameters
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build query
    let query = adminFirestore.collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // Apply status filter if not 'all'
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Execute query
    const snapshot = await query.get();
    
    // Group messages by conversation
    const conversationMap = new Map();
    
    snapshot.docs.forEach(doc => {
      const message = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      };

      // Create conversation ID from participants
      const participants = [message.senderUid, message.recipientUid].sort();
      const conversationId = participants.join('_');

      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          participants: participants,
          senderEmail: message.senderEmail,
          recipientEmail: message.recipientEmail,
          listingId: message.listingId,
          listingTitle: message.listingTitle,
          messages: [],
          messageCount: 0,
          lastMessage: null,
          lastActivity: new Date(0),
          status: 'active',
          flagged: false
        });
      }

      const conversation = conversationMap.get(conversationId);
      conversation.messages.push(message);
      conversation.messageCount++;

      if (message.createdAt > conversation.lastActivity) {
        conversation.lastMessage = message;
        conversation.lastActivity = message.createdAt;
      }

      if (message.flagged) {
        conversation.flagged = true;
      }
    });

    const conversations = Array.from(conversationMap.values());

    return json({
      success: true,
      conversations,
      totalCount: conversations.length,
      status: status
    });

  } catch (error) {
    console.error('Error loading messages:', error);
    return json({ 
      error: 'Failed to load messages',
      details: error.message
    }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    // Check if Firebase Admin is available
    if (!isAdminInitialized || !adminFirestore) {
      return json({ 
        error: 'Firebase Admin not initialized',
        details: 'Missing Firebase Admin credentials'
      }, { status: 500 });
    }

    const { messageId, updates } = await request.json();
    
    if (!messageId) {
      return json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Update message
    await adminFirestore.collection('messages').doc(messageId).update({
      ...updates,
      updatedAt: new Date()
    });

    return json({ 
      success: true,
      message: 'Message updated successfully'
    });

  } catch (error) {
    console.error('Error updating message:', error);
    return json({ 
      error: 'Failed to update message',
      details: error.message
    }, { status: 500 });
  }
};
