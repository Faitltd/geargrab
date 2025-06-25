// Real-time WebSocket client for GearGrab messaging
import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { simpleAuth } from '$lib/auth/simple-auth';

// WebSocket connection state
export const socketConnected = writable(false);
export const onlineUsers = writable<Set<string>>(new Set());
export const typingUsers = writable<Map<string, string>>(new Map());

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentConversationId: string | null = null;

  constructor() {
    if (browser) {
      this.initialize();
    }
  }

  private async initialize() {
    try {
      // Wait for auth to be ready
      const authState = simpleAuth.authState;
      
      // Subscribe to auth changes
      authState.subscribe((state) => {
        if (state.isAuthenticated && state.user && !this.socket?.connected) {
          this.connect(state.user.accessToken);
        } else if (!state.isAuthenticated && this.socket?.connected) {
          this.disconnect();
        }
      });
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  }

  private connect(token: string) {
    if (this.socket?.connected) return;

    const serverUrl = import.meta.env.DEV 
      ? 'http://localhost:5173' 
      : 'https://geargrab.co';

    console.log('🔌 Connecting to WebSocket server...');

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      socketConnected.set(true);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      socketConnected.set(false);
      
      // Auto-reconnect on unexpected disconnection
      if (reason === 'io server disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 WebSocket connection error:', error);
      socketConnected.set(false);
      this.handleReconnect();
    });

    // User presence events
    this.socket.on('user-online', ({ userId, userEmail }) => {
      onlineUsers.update(users => {
        users.add(userId);
        return users;
      });
      console.log(`👤 User ${userEmail} is online`);
    });

    this.socket.on('user-offline', ({ userId }) => {
      onlineUsers.update(users => {
        users.delete(userId);
        return users;
      });
      typingUsers.update(typing => {
        typing.delete(userId);
        return typing;
      });
    });

    // Typing indicators
    this.socket.on('user-typing', ({ userId, userEmail, isTyping }) => {
      typingUsers.update(typing => {
        if (isTyping) {
          typing.set(userId, userEmail);
        } else {
          typing.delete(userId);
        }
        return typing;
      });
    });

    // Error handling
    this.socket.on('error', ({ message }) => {
      console.error('WebSocket error:', message);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, delay);
    }
  }

  // Public methods
  joinConversation(conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot join conversation');
      return;
    }

    // Leave current conversation if any
    if (this.currentConversationId) {
      this.leaveConversation(this.currentConversationId);
    }

    this.currentConversationId = conversationId;
    this.socket.emit('join-conversation', conversationId);
    console.log(`👥 Joining conversation: ${conversationId}`);
  }

  leaveConversation(conversationId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('leave-conversation', conversationId);
    this.currentConversationId = null;
    console.log(`👋 Left conversation: ${conversationId}`);
  }

  sendMessage(conversationId: string, content: string, type: string = 'text') {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    this.socket.emit('send-message', {
      conversationId,
      content,
      type
    });

    return true;
  }

  startTyping(conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing-start', { conversationId });
  }

  stopTyping(conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing-stop', { conversationId });
  }

  markMessagesAsRead(conversationId: string, messageIds: string[]) {
    if (!this.socket?.connected) return;
    this.socket.emit('mark-messages-read', { conversationId, messageIds });
  }

  // Event listeners for components
  onNewMessage(callback: (message: any) => void) {
    if (!this.socket) return;
    this.socket.on('new-message', callback);
  }

  onMessagesRead(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('messages-read', callback);
  }

  onNotification(callback: (notification: any) => void) {
    if (!this.socket) return;
    this.socket.on('notification', callback);
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      socketConnected.set(false);
      onlineUsers.set(new Set());
      typingUsers.set(new Map());
    }
  }

  // Get connection status
  get isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();
