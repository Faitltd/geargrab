import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$lib/firebase/server';

// Mark messages as read
export const POST: RequestHandler = createSecureHandler(
  async ({ params }, { auth }) => {
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

      // Reset unread count for this user
      await adminFirestore.collection('conversations').doc(conversationId).update({
        [`unreadCount.${auth.userId}`]: 0,
        updatedAt: adminFirestore.Timestamp.now()
      });

      // Mark all unread messages from other users as read
      const messagesQuery = adminFirestore.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .where('senderId', '!=', auth.userId)
        .where('read', '==', false);

      const unreadMessages = await messagesQuery.get();
      
      if (!unreadMessages.empty) {
        const batch = adminFirestore.batch();
        
        unreadMessages.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
      }

      return json({
        success: true,
        message: 'Messages marked as read',
        markedCount: unreadMessages.size
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      return json({ 
        error: 'Failed to mark messages as read',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 60 // 60 mark-read requests per minute
    }
  }
);
