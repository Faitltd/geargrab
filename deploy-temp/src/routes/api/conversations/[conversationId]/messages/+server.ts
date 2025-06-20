import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$lib/firebase/server';
import { auditLog } from '$lib/security/audit';

// Get messages for a conversation
export const GET: RequestHandler = createSecureHandler(
  async ({ params, url }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const conversationId = params.conversationId;
    if (!conversationId) {
      return json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    try {
      // Verify user has access to this conversation
      const conversationDoc = await adminFirestore.collection('conversations').doc(conversationId).get();
      if (!conversationDoc.exists) {
        return json({ error: 'Conversation not found' }, { status: 404 });
      }

      const conversationData = conversationDoc.data();
      if (!conversationData?.participants.includes(auth.userId)) {
        return json({ error: 'Unauthorized access to conversation' }, { status: 403 });
      }

      // Get pagination parameters
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const before = url.searchParams.get('before'); // Timestamp for pagination

      // Build query
      let query = adminFirestore.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit);

      if (before) {
        const beforeTimestamp = adminFirestore.Timestamp.fromDate(new Date(before));
        query = query.startAfter(beforeTimestamp);
      }

      const snapshot = await query.get();
      const messages = [];

      // Get sender details for each message
      const senderCache = new Map();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get sender details (with caching)
        let senderName = 'Unknown User';
        let senderAvatar = null;
        
        if (!senderCache.has(data.senderId)) {
          try {
            const senderDoc = await adminFirestore.collection('users').doc(data.senderId).get();
            if (senderDoc.exists) {
              const senderData = senderDoc.data();
              senderName = senderData?.displayName || senderData?.email || 'Unknown User';
              senderAvatar = senderData?.photoURL || null;
            }
            senderCache.set(data.senderId, { name: senderName, avatar: senderAvatar });
          } catch (error) {
            console.warn(`Could not fetch sender ${data.senderId}:`, error);
            senderCache.set(data.senderId, { name: 'Unknown User', avatar: null });
          }
        } else {
          const cached = senderCache.get(data.senderId);
          senderName = cached.name;
          senderAvatar = cached.avatar;
        }

        messages.push({
          id: doc.id,
          conversationId,
          senderId: data.senderId,
          senderName,
          senderAvatar,
          content: data.content,
          type: data.type || 'text',
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
          read: data.read || false,
          attachments: data.attachments || []
        });
      }

      // Reverse to get chronological order (oldest first)
      messages.reverse();

      return json({
        success: true,
        messages,
        hasMore: snapshot.size === limit,
        conversationId
      });

    } catch (error) {
      console.error('Error fetching messages:', error);
      return json({ 
        error: 'Failed to fetch messages',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true
  }
);

// Send a message
export const POST: RequestHandler = createSecureHandler(
  async ({ request, params }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const conversationId = params.conversationId;
    if (!conversationId) {
      return json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    try {
      const { content, type = 'text', attachments = [] } = await request.json();

      if (!content || content.trim().length === 0) {
        return json({ error: 'Message content is required' }, { status: 400 });
      }

      if (content.length > 2000) {
        return json({ error: 'Message content too long (max 2000 characters)' }, { status: 400 });
      }

      // Verify user has access to this conversation
      const conversationDoc = await adminFirestore.collection('conversations').doc(conversationId).get();
      if (!conversationDoc.exists) {
        return json({ error: 'Conversation not found' }, { status: 404 });
      }

      const conversationData = conversationDoc.data();
      if (!conversationData?.participants.includes(auth.userId)) {
        return json({ error: 'Unauthorized access to conversation' }, { status: 403 });
      }

      // Create message
      const messageData = {
        senderId: auth.userId,
        content: content.trim(),
        type,
        attachments,
        timestamp: adminFirestore.Timestamp.now(),
        read: false
      };

      const messageRef = await adminFirestore.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .add(messageData);

      // Update conversation with last message and increment unread counts
      const updateData: any = {
        lastMessage: {
          content: content.trim(),
          senderId: auth.userId,
          timestamp: adminFirestore.Timestamp.now()
        },
        updatedAt: adminFirestore.Timestamp.now()
      };

      // Increment unread count for other participants
      const unreadUpdates: any = {};
      conversationData.participants.forEach((participantId: string) => {
        if (participantId !== auth.userId) {
          unreadUpdates[`unreadCount.${participantId}`] = adminFirestore.FieldValue.increment(1);
        }
      });

      await adminFirestore.collection('conversations').doc(conversationId).update({
        ...updateData,
        ...unreadUpdates
      });

      // Get sender details for response
      const senderDoc = await adminFirestore.collection('users').doc(auth.userId).get();
      const senderData = senderDoc.data();
      const senderName = senderData?.displayName || senderData?.email || 'Unknown User';
      const senderAvatar = senderData?.photoURL || null;

      // Log message sent
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'message_sent',
        resource: 'message',
        resourceId: messageRef.id,
        timestamp: new Date(),
        success: true,
        details: {
          conversationId,
          messageType: type,
          contentLength: content.length,
          hasAttachments: attachments.length > 0
        }
      });

      return json({
        success: true,
        message: {
          id: messageRef.id,
          conversationId,
          senderId: auth.userId,
          senderName,
          senderAvatar,
          content: content.trim(),
          type,
          timestamp: new Date(),
          read: false,
          attachments
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      return json({ 
        error: 'Failed to send message',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 30 // 30 messages per minute
    }
  }
);
