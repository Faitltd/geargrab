import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$lib/firebase/server';
import { auditLog } from '$lib/security/audit';

// Get user's conversations
export const GET: RequestHandler = createSecureHandler(
  async ({ url }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const searchTerm = url.searchParams.get('search');

      // Get conversations where user is a participant
      let query = adminFirestore.collection('conversations')
        .where('participants', 'array-contains', auth.userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit);

      const snapshot = await query.get();
      const conversations = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get participant details
        const participantDetails = [];
        for (const participantId of data.participants) {
          if (participantId !== auth.userId) {
            try {
              const userDoc = await adminFirestore.collection('users').doc(participantId).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                participantDetails.push({
                  id: participantId,
                  name: userData?.displayName || userData?.email || 'Unknown User',
                  avatar: userData?.photoURL || null,
                  email: userData?.email || null
                });
              }
            } catch (error) {
              console.warn(`Could not fetch user ${participantId}:`, error);
              participantDetails.push({
                id: participantId,
                name: 'Unknown User',
                avatar: null,
                email: null
              });
            }
          }
        }

        // Calculate unread count for this user
        const unreadCount = data.unreadCount?.[auth.userId] || 0;

        const conversation = {
          id: doc.id,
          participants: participantDetails,
          lastMessage: data.lastMessage ? {
            content: data.lastMessage.content,
            senderId: data.lastMessage.senderId,
            timestamp: data.lastMessage.timestamp?.toDate?.() || new Date(data.lastMessage.timestamp)
          } : null,
          unreadCount,
          bookingId: data.bookingId || null,
          listingId: data.listingId || null,
          listingTitle: data.listingTitle || null,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
        };

        // Apply search filter if provided
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = 
            conversation.listingTitle?.toLowerCase().includes(searchLower) ||
            conversation.lastMessage?.content.toLowerCase().includes(searchLower) ||
            conversation.participants.some(p => p.name.toLowerCase().includes(searchLower));
          
          if (matchesSearch) {
            conversations.push(conversation);
          }
        } else {
          conversations.push(conversation);
        }
      }

      return json({
        success: true,
        conversations,
        totalCount: conversations.length
      });

    } catch (error) {
      console.error('Error fetching conversations:', error);
      return json({ 
        error: 'Failed to fetch conversations',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true
  }
);

// Create or get conversation
export const POST: RequestHandler = createSecureHandler(
  async ({ request }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const { otherUserId, bookingId, listingId, listingTitle } = await request.json();

      if (!otherUserId) {
        return json({ error: 'Other user ID is required' }, { status: 400 });
      }

      if (otherUserId === auth.userId) {
        return json({ error: 'Cannot create conversation with yourself' }, { status: 400 });
      }

      // Check if conversation already exists
      const existingQuery = await adminFirestore.collection('conversations')
        .where('participants', 'array-contains', auth.userId)
        .get();

      let existingConversation = null;
      existingQuery.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(otherUserId)) {
          existingConversation = { id: doc.id, ...data };
        }
      });

      if (existingConversation) {
        // Return existing conversation
        return json({
          success: true,
          conversation: {
            id: existingConversation.id,
            participants: existingConversation.participants,
            bookingId: existingConversation.bookingId,
            listingId: existingConversation.listingId,
            listingTitle: existingConversation.listingTitle
          },
          isNew: false
        });
      }

      // Verify other user exists
      const otherUserDoc = await adminFirestore.collection('users').doc(otherUserId).get();
      if (!otherUserDoc.exists) {
        return json({ error: 'Other user not found' }, { status: 404 });
      }

      // Create new conversation
      const conversationData = {
        participants: [auth.userId, otherUserId],
        createdAt: adminFirestore.Timestamp.now(),
        updatedAt: adminFirestore.Timestamp.now(),
        unreadCount: {
          [auth.userId]: 0,
          [otherUserId]: 0
        },
        ...(bookingId && { bookingId }),
        ...(listingId && { listingId }),
        ...(listingTitle && { listingTitle })
      };

      const conversationRef = await adminFirestore.collection('conversations').add(conversationData);

      // Log conversation creation
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'conversation_created',
        resource: 'conversation',
        resourceId: conversationRef.id,
        timestamp: new Date(),
        success: true,
        details: {
          otherUserId,
          bookingId: bookingId || null,
          listingId: listingId || null
        }
      });

      return json({
        success: true,
        conversation: {
          id: conversationRef.id,
          participants: [auth.userId, otherUserId],
          bookingId: bookingId || null,
          listingId: listingId || null,
          listingTitle: listingTitle || null
        },
        isNew: true
      });

    } catch (error) {
      console.error('Error creating conversation:', error);
      return json({ 
        error: 'Failed to create conversation',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10 // 10 conversation creations per 15 minutes
    }
  }
);
