// Real-time chat service using Firebase Firestore
import { firestore } from '$lib/firebase/client';
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  type Unsubscribe,
  getDocs,
  limit
} from 'firebase/firestore';
import type { Message, Conversation } from '$lib/types/firestore';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'system';
  attachments?: string[];
}

export interface ChatConversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: Record<string, number>;
  bookingId?: string;
  listingId?: string;
  listingTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

class ChatService {
  private messageListeners: Map<string, Unsubscribe> = new Map();
  private conversationListeners: Map<string, Unsubscribe> = new Map();

  // Get or create conversation between two users
  async getOrCreateConversation(
    currentUserId: string,
    otherUserId: string,
    bookingId?: string,
    listingId?: string,
    listingTitle?: string
  ): Promise<string> {
    try {
      // Check if conversation already exists
      const conversationsRef = collection(firestore, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', currentUserId)
      );
      
      const querySnapshot = await getDocs(q);
      let existingConversation = null;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(otherUserId)) {
          existingConversation = { id: doc.id, ...data };
        }
      });

      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation
      const newConversation = {
        participants: [currentUserId, otherUserId],
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0
        },
        bookingId: bookingId || null,
        listingId: listingId || null,
        listingTitle: listingTitle || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(conversationsRef, newConversation);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'system' = 'text',
    attachments?: string[]
  ): Promise<void> {
    try {
      const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
      
      const messageData = {
        senderId,
        content,
        type,
        attachments: attachments || [],
        timestamp: serverTimestamp(),
        read: false
      };

      await addDoc(messagesRef, messageData);

      // Update conversation with last message
      const conversationRef = doc(firestore, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          content,
          senderId,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Listen to messages in a conversation
  subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe {
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          conversationId,
          senderId: data.senderId,
          senderName: data.senderName || 'Unknown',
          senderAvatar: data.senderAvatar,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          read: data.read,
          type: data.type || 'text',
          attachments: data.attachments || []
        });
      });
      callback(messages);
    });

    this.messageListeners.set(conversationId, unsubscribe);
    return unsubscribe;
  }

  // Listen to user's conversations
  subscribeToConversations(
    userId: string,
    callback: (conversations: ChatConversation[]) => void
  ): Unsubscribe {
    const conversationsRef = collection(firestore, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const conversations: ChatConversation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          participants: data.participants.map((id: string) => ({
            id,
            name: 'User', // Would be populated from user data
            avatar: undefined
          })),
          lastMessage: data.lastMessage ? {
            content: data.lastMessage.content,
            senderId: data.lastMessage.senderId,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date()
          } : undefined,
          unreadCount: data.unreadCount || {},
          bookingId: data.bookingId,
          listingId: data.listingId,
          listingTitle: data.listingTitle,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      callback(conversations);
    });

    this.conversationListeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
      const q = query(
        messagesRef,
        where('senderId', '!=', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const batch = [];

      querySnapshot.forEach((doc) => {
        batch.push(updateDoc(doc.ref, { read: true }));
      });

      await Promise.all(batch);

      // Reset unread count for this user
      const conversationRef = doc(firestore, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get recent conversations
  async getRecentConversations(userId: string, limitCount: number = 20): Promise<ChatConversation[]> {
    try {
      const conversationsRef = collection(firestore, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const conversations: ChatConversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          participants: data.participants.map((id: string) => ({
            id,
            name: 'User',
            avatar: undefined
          })),
          lastMessage: data.lastMessage ? {
            content: data.lastMessage.content,
            senderId: data.lastMessage.senderId,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date()
          } : undefined,
          unreadCount: data.unreadCount || {},
          bookingId: data.bookingId,
          listingId: data.listingId,
          listingTitle: data.listingTitle,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      return conversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  // Cleanup listeners
  unsubscribeFromMessages(conversationId: string): void {
    const unsubscribe = this.messageListeners.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      this.messageListeners.delete(conversationId);
    }
  }

  unsubscribeFromConversations(userId: string): void {
    const unsubscribe = this.conversationListeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.conversationListeners.delete(userId);
    }
  }

  // Cleanup all listeners
  cleanup(): void {
    this.messageListeners.forEach((unsubscribe) => unsubscribe());
    this.conversationListeners.forEach((unsubscribe) => unsubscribe());
    this.messageListeners.clear();
    this.conversationListeners.clear();
  }
}

export const chatService = new ChatService();
