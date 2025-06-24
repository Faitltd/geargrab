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
import { simpleAuth } from '$lib/auth/simple-auth';

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

  // Helper to get authentication headers
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get the current auth state
    const authState = simpleAuth.authState;
    const currentAuthState = authState.subscribe ? authState : { subscribe: () => {} };

    return new Promise((resolve) => {
      const unsubscribe = simpleAuth.authState.subscribe((state) => {
        if (state.isAuthenticated && state.user) {
          // Get the ID token for authentication
          state.user.getIdToken().then((token) => {
            headers['Authorization'] = `Bearer ${token}`;
            resolve(headers);
            unsubscribe();
          }).catch(() => {
            resolve(headers);
            unsubscribe();
          });
        } else {
          resolve(headers);
          unsubscribe();
        }
      });
    });
  }
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
      // Use API endpoint to create or get conversation
      const headers = await this.getAuthHeaders();

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          otherUserId,
          bookingId,
          listingId,
          listingTitle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const result = await response.json();
      return result.conversation.id;
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
      const headers = await this.getAuthHeaders();

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content,
          type,
          attachments: attachments || []
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // The API handles updating the conversation and message creation
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
      const response = await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get recent conversations
  async getRecentConversations(userId: string, limitCount: number = 20): Promise<ChatConversation[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`/api/conversations?limit=${limitCount}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const result = await response.json();
      return result.conversations.map((conv: any) => ({
        id: conv.id,
        participants: conv.participants,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount || 0,
        bookingId: conv.bookingId,
        listingId: conv.listingId,
        listingTitle: conv.listingTitle,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }));
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

  // Admin Functions - Monitor all communications

  // Get all conversations for admin monitoring
  async getAllConversations(limitCount: number = 50): Promise<ChatConversation[]> {
    try {
      const conversationsRef = collection(firestore, 'conversations');
      const q = query(
        conversationsRef,
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
      console.error('Error getting all conversations:', error);
      throw error;
    }
  }

  // Get all messages for admin monitoring
  async getAllMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const querySnapshot = await getDocs(q);
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

      return messages;
    } catch (error) {
      console.error('Error getting all messages:', error);
      throw error;
    }
  }

  // Flag inappropriate content
  async flagMessage(messageId: string, conversationId: string, reason: string, flaggedBy: string): Promise<void> {
    try {
      const flagsRef = collection(firestore, 'moderationFlags');

      const flagData = {
        messageId,
        conversationId,
        reason,
        flaggedBy,
        flaggedAt: serverTimestamp(),
        status: 'pending',
        reviewed: false
      };

      await addDoc(flagsRef, flagData);

      // Also update the message with a flag
      const messageRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
      await updateDoc(messageRef, {
        flagged: true,
        flaggedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error flagging message:', error);
      throw error;
    }
  }

  // Get flagged content for admin review
  async getFlaggedContent(): Promise<any[]> {
    try {
      const flagsRef = collection(firestore, 'moderationFlags');
      const q = query(
        flagsRef,
        where('status', '==', 'pending'),
        orderBy('flaggedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const flags: any[] = [];

      querySnapshot.forEach((doc) => {
        flags.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return flags;
    } catch (error) {
      console.error('Error getting flagged content:', error);
      throw error;
    }
  }

  // Search conversations and messages
  async searchConversations(searchTerm: string, userId?: string): Promise<ChatConversation[]> {
    try {
      const conversationsRef = collection(firestore, 'conversations');
      let q = query(conversationsRef, orderBy('updatedAt', 'desc'));

      if (userId) {
        q = query(conversationsRef, where('participants', 'array-contains', userId), orderBy('updatedAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const conversations: ChatConversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const conversation = {
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
        };

        // Filter by search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            conversation.listingTitle?.toLowerCase().includes(searchLower) ||
            conversation.lastMessage?.content.toLowerCase().includes(searchLower)
          ) {
            conversations.push(conversation);
          }
        } else {
          conversations.push(conversation);
        }
      });

      return conversations;
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
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
