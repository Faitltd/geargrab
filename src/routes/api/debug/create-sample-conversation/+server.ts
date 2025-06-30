import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/server';

export const POST: RequestHandler = async () => {
  try {
    if (!adminFirestore) {
      return json({ 
        error: 'Firebase Admin not configured' 
      }, { status: 500 });
    }

    const tempUserId = 'temp-user-id';
    const otherUserId = 'other-user-id';

    // Create sample users if they don't exist
    const tempUserRef = adminFirestore.collection('users').doc(tempUserId);
    const tempUserDoc = await tempUserRef.get();
    if (!tempUserDoc.exists) {
      await tempUserRef.set({
        displayName: 'Temp User',
        email: 'temp@example.com',
        photoURL: null,
        createdAt: adminFirestore.Timestamp.now()
      });
    }

    const otherUserRef = adminFirestore.collection('users').doc(otherUserId);
    const otherUserDoc = await otherUserRef.get();
    if (!otherUserDoc.exists) {
      await otherUserRef.set({
        displayName: 'Other User',
        email: 'other@example.com',
        photoURL: null,
        createdAt: adminFirestore.Timestamp.now()
      });
    }

    // Create sample conversation
    const conversationData = {
      participants: [tempUserId, otherUserId],
      createdAt: adminFirestore.Timestamp.now(),
      updatedAt: adminFirestore.Timestamp.now(),
      unreadCount: {
        [tempUserId]: 0,
        [otherUserId]: 1
      },
      listingId: 'sample-listing-123',
      listingTitle: 'Sample Camping Gear',
      lastMessage: {
        content: 'Hello! Is this gear still available?',
        senderId: tempUserId,
        timestamp: adminFirestore.Timestamp.now()
      }
    };

    const conversationRef = await adminFirestore.collection('conversations').add(conversationData);

    // Create sample messages
    const messages = [
      {
        senderId: tempUserId,
        content: 'Hello! Is this gear still available?',
        type: 'text',
        timestamp: adminFirestore.Timestamp.now(),
        read: false,
        attachments: []
      },
      {
        senderId: otherUserId,
        content: 'Yes, it is! When would you need it?',
        type: 'text',
        timestamp: adminFirestore.Timestamp.now(),
        read: true,
        attachments: []
      },
      {
        senderId: tempUserId,
        content: 'Great! I need it for this weekend. Is that possible?',
        type: 'text',
        timestamp: adminFirestore.Timestamp.now(),
        read: false,
        attachments: []
      }
    ];

    // Add messages to conversation
    for (const messageData of messages) {
      await adminFirestore.collection('conversations')
        .doc(conversationRef.id)
        .collection('messages')
        .add(messageData);
    }

    return json({
      success: true,
      message: 'Sample conversation and messages created successfully',
      conversationId: conversationRef.id,
      participants: [tempUserId, otherUserId],
      messageCount: messages.length
    });

  } catch (error) {
    console.error('Error creating sample conversation:', error);
    return json({ 
      error: 'Failed to create sample conversation',
      details: error.message 
    }, { status: 500 });
  }
};
