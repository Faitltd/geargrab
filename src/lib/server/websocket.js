// Real-time WebSocket server for GearGrab messaging
import { Server } from 'socket.io';
import { adminFirestore } from '$lib/firebase/admin';
import jwt from 'jsonwebtoken';

let io;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://geargrab.co', 'https://www.geargrab.co']
        : ['http://localhost:5173', 'http://localhost:4173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token (adjust based on your auth system)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.uid || decoded.userId;
      socket.userEmail = decoded.email;
      
      console.log(`🔌 User ${socket.userEmail} connected via WebSocket`);
      next();
    } catch (error) {
      console.error('WebSocket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`✅ WebSocket connected: ${socket.userId}`);

    // Join user to their personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Handle joining conversation rooms
    socket.on('join-conversation', async (conversationId) => {
      try {
        // Verify user has access to this conversation
        const conversationRef = adminFirestore.collection('conversations').doc(conversationId);
        const conversationDoc = await conversationRef.get();
        
        if (!conversationDoc.exists) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const conversation = conversationDoc.data();
        const hasAccess = conversation.participants.some(p => p.id === socket.userId);
        
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`👥 User ${socket.userId} joined conversation ${conversationId}`);
        
        // Notify others in the conversation that user is online
        socket.to(`conversation:${conversationId}`).emit('user-online', {
          userId: socket.userId,
          userEmail: socket.userEmail
        });

      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`👋 User ${socket.userId} left conversation ${conversationId}`);
      
      // Notify others that user went offline
      socket.to(`conversation:${conversationId}`).emit('user-offline', {
        userId: socket.userId
      });
    });

    // Handle typing indicators
    socket.on('typing-start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        isTyping: true
      });
    });

    socket.on('typing-stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle real-time message sending
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, type = 'text' } = data;
        
        // Save message to Firestore
        const messageRef = adminFirestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages');

        const messageData = {
          senderId: socket.userId,
          senderEmail: socket.userEmail,
          content,
          type,
          timestamp: adminFirestore.Timestamp.now(),
          read: false
        };

        const messageDoc = await messageRef.add(messageData);
        
        // Update conversation last message
        await adminFirestore.collection('conversations').doc(conversationId).update({
          lastMessage: content,
          lastMessageTime: messageData.timestamp,
          [`unreadCount.${socket.userId}`]: 0 // Reset sender's unread count
        });

        // Broadcast message to all users in the conversation
        const messageWithId = {
          id: messageDoc.id,
          ...messageData,
          timestamp: messageData.timestamp.toDate()
        };

        io.to(`conversation:${conversationId}`).emit('new-message', messageWithId);
        
        console.log(`💬 Message sent in conversation ${conversationId}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('mark-messages-read', async ({ conversationId, messageIds }) => {
      try {
        const batch = adminFirestore.batch();
        
        messageIds.forEach(messageId => {
          const messageRef = adminFirestore
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .doc(messageId);
          batch.update(messageRef, { read: true });
        });

        await batch.commit();
        
        // Notify other users that messages were read
        socket.to(`conversation:${conversationId}`).emit('messages-read', {
          userId: socket.userId,
          messageIds
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ WebSocket disconnected: ${socket.userId}`);
    });
  });

  return io;
}

/**
 * Send notification to specific user
 */
export function sendNotificationToUser(userId, notification) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
}

/**
 * Send message to conversation
 */
export function sendMessageToConversation(conversationId, message) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit('new-message', message);
  }
}

export { io };
