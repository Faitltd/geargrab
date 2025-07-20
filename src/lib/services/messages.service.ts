import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/firebase';

// Message types
export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'system';
  readBy: string[];
  createdAt: any;
  updatedAt: any;
}

// Conversation types
export interface Conversation {
  id?: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string;
  participants: string[];
  participantNames: { [userId: string]: string };
  participantAvatars: { [userId: string]: string };
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: any;
  };
  unreadCount?: number;
  createdAt: any;
  updatedAt: any;
}

// Message input for sending
export interface MessageInput {
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'system';
}

/**
 * Get all conversations for a user
 */
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const conversations: Conversation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        ...data,
        unreadCount: data.unreadCounts?.[userId] || 0
      } as Conversation);
    });

    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw new Error('Failed to load conversations');
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const snapshot = await getDocs(q);
    const messages: Message[] = [];

    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as Message);
    });

    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw new Error('Failed to load messages');
  }
};

/**
 * Send a message
 */
export const sendMessage = async (messageInput: MessageInput): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const { conversationId, senderId, content, type } = messageInput;

    // Add message to subcollection
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messageDoc = await addDoc(messagesRef, {
      senderId,
      content,
      type,
      readBy: [senderId], // Sender has read their own message
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update conversation with last message and increment unread counts
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      const conversationData = conversationSnap.data();
      const participants = conversationData.participants || [];
      
      // Create unread counts object - increment for all participants except sender
      const unreadCounts: { [userId: string]: number } = {};
      participants.forEach((participantId: string) => {
        if (participantId === senderId) {
          unreadCounts[participantId] = 0; // Sender has no unread messages
        } else {
          const currentCount = conversationData.unreadCounts?.[participantId] || 0;
          unreadCounts[participantId] = currentCount + 1;
        }
      });

      await updateDoc(conversationRef, {
        lastMessage: {
          content,
          senderId,
          createdAt: serverTimestamp()
        },
        unreadCounts,
        updatedAt: serverTimestamp()
      });
    }

    return messageDoc.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

/**
 * Mark conversation as read for a user
 */
export const markConversationAsRead = async (conversationId: string, userId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      const conversationData = conversationSnap.data();
      const unreadCounts = conversationData.unreadCounts || {};
      
      // Set user's unread count to 0
      unreadCounts[userId] = 0;

      await updateDoc(conversationRef, {
        unreadCounts,
        updatedAt: serverTimestamp()
      });

      // Also mark all messages in this conversation as read by this user
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, where('readBy', 'not-in', [[userId]]));
      
      const snapshot = await getDocs(q);
      const updatePromises: Promise<void>[] = [];

      snapshot.forEach((messageDoc) => {
        const messageData = messageDoc.data();
        const readBy = messageData.readBy || [];
        
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          updatePromises.push(
            updateDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id), {
              readBy,
              updatedAt: serverTimestamp()
            })
          );
        }
      });

      await Promise.all(updatePromises);
    }
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw new Error('Failed to mark conversation as read');
  }
};

/**
 * Subscribe to real-time conversation updates
 */
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): Unsubscribe => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        ...data,
        unreadCount: data.unreadCounts?.[userId] || 0
      } as Conversation);
    });

    callback(conversations);
  }, (error) => {
    console.error('Error in conversations subscription:', error);
  });
};

/**
 * Subscribe to real-time message updates for a conversation
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];

    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as Message);
    });

    callback(messages);
  }, (error) => {
    console.error('Error in messages subscription:', error);
  });
};

/**
 * Get total unread message count for a user
 */
export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const conversations = await getConversations(userId);
    return conversations.reduce((total, conversation) => {
      return total + (conversation.unreadCount || 0);
    }, 0);
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
};

/**
 * Subscribe to total unread count changes
 */
export const subscribeToUnreadCount = (
  userId: string,
  callback: (count: number) => void
): Unsubscribe => {
  return subscribeToConversations(userId, (conversations) => {
    const totalUnread = conversations.reduce((total, conversation) => {
      return total + (conversation.unreadCount || 0);
    }, 0);
    callback(totalUnread);
  });
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  listingId: string,
  listingTitle: string,
  listingImageUrl: string | undefined,
  participants: string[],
  participantNames: { [userId: string]: string },
  participantAvatars: { [userId: string]: string } = {}
): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('listingId', '==', listingId),
      where('participants', '==', participants.sort()) // Sort to ensure consistent ordering
    );

    const existingSnapshot = await getDocs(q);
    if (!existingSnapshot.empty) {
      return existingSnapshot.docs[0].id;
    }

    // Create new conversation
    const conversationDoc = await addDoc(conversationsRef, {
      listingId,
      listingTitle,
      listingImageUrl,
      participants: participants.sort(),
      participantNames,
      participantAvatars,
      unreadCounts: participants.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return conversationDoc.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw new Error('Failed to create conversation');
  }
};

/**
 * Start a conversation about a listing
 */
export const startConversationAboutListing = async (
  listingId: string,
  listingTitle: string,
  listingImageUrl: string | undefined,
  ownerId: string,
  ownerName: string,
  ownerAvatar: string | undefined,
  renterId: string,
  renterName: string,
  renterAvatar: string | undefined,
  initialMessage?: string
): Promise<string> => {
  try {
    const participants = [ownerId, renterId];
    const participantNames = {
      [ownerId]: ownerName,
      [renterId]: renterName
    };
    const participantAvatars: { [userId: string]: string } = {};
    if (ownerAvatar) participantAvatars[ownerId] = ownerAvatar;
    if (renterAvatar) participantAvatars[renterId] = renterAvatar;

    const conversationId = await createConversation(
      listingId,
      listingTitle,
      listingImageUrl,
      participants,
      participantNames,
      participantAvatars
    );

    // Send initial message if provided
    if (initialMessage) {
      await sendMessage({
        conversationId,
        senderId: renterId,
        content: initialMessage,
        type: 'text'
      });
    }

    return conversationId;
  } catch (error) {
    console.error('Error starting conversation about listing:', error);
    throw new Error('Failed to start conversation');
  }
};
