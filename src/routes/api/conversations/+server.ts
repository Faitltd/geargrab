import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminFirestore } from '$lib/firebase/server';
import { auditLog } from '$lib/security/audit';

// Get user's conversations
export const GET: RequestHandler = async (event) => {
  try {
    // Basic auth check
    const sessionCookie = event.cookies.get('__session');
    const authHeader = event.request.headers.get('Authorization');

    if (!sessionCookie && !authHeader) {
      return json({
        error: 'Authentication required. Please log in to view messages.'
      }, { status: 401 });
    }

    const limit = parseInt(event.url.searchParams.get('limit') || '20');
    const searchTerm = event.url.searchParams.get('search');
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Require Firebase Admin for conversations
    if (!adminFirestore) {
      return json({
        success: true,
        conversations: [],
        totalCount: 0,
        message: 'Firebase Admin not configured - using client-side data only'
      });
    }

      // For now, we'll use a temporary user ID until proper auth is set up
      // TODO: Replace with actual authenticated user ID
      const tempUserId = 'temp-user-id';

      // Get conversations where user is a participant
      let query = adminFirestore.collection('conversations')
        .where('participants', 'array-contains', tempUserId)
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
};

// Create or get conversation
export const POST: RequestHandler = async (event) => {
  try {
    // Basic auth check
    const sessionCookie = event.cookies.get('__session');
    const authHeader = event.request.headers.get('Authorization');

    if (!sessionCookie && !authHeader) {
      return json({
        error: 'Authentication required. Please log in to start a conversation.'
      }, { status: 401 });
    }

    const { otherUserId, bookingId, listingId, listingTitle } = await event.request.json();
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (!otherUserId) {
      return json({ error: 'Other user ID is required' }, { status: 400 });
    }

    // For now, we'll use a temporary user ID until proper auth is set up
    const tempUserId = 'temp-user-id';

    if (otherUserId === tempUserId) {
      return json({ error: 'Cannot create conversation with yourself' }, { status: 400 });
    }

      // Require Firebase Admin for conversations
      if (!adminFirestore) {
        return json({ error: 'Server configuration error - cannot create conversations' }, { status: 500 });
      }

    // Check if conversation already exists
    const existingQuery = await adminFirestore.collection('conversations')
      .where('participants', 'array-contains', tempUserId)
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
      participants: [tempUserId, otherUserId],
      createdAt: adminFirestore.Timestamp.now(),
      updatedAt: adminFirestore.Timestamp.now(),
      unreadCount: {
        [tempUserId]: 0,
        [otherUserId]: 0
      },
      ...(bookingId && { bookingId }),
      ...(listingId && { listingId }),
      ...(listingTitle && { listingTitle })
    };

    const conversationRef = await adminFirestore.collection('conversations').add(conversationData);

    // Log conversation creation (with error handling)
    try {
      await auditLog.logUserActivity({
        userId: tempUserId,
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
    } catch (error) {
      console.warn('Could not log conversation creation:', error);
    }

    return json({
      success: true,
      conversation: {
        id: conversationRef.id,
        participants: [tempUserId, otherUserId],
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
};
