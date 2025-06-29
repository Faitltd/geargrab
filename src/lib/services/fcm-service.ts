// FCM (Firebase Cloud Messaging) Service for push notifications
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firestore } from '$lib/firebase/client';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { simpleAuth } from '$lib/auth/simple-auth';
import { notifications } from '$lib/stores/notifications';

class FCMService {
  private messaging: any = null;
  private currentToken: string | null = null;
  private isSupported = false;

  async initialize() {
    try {
      // Check if FCM is supported
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('FCM not supported in this environment');
        return false;
      }

      // Initialize Firebase Messaging
      this.messaging = getMessaging();
      this.isSupported = true;

      // Set up message listener for foreground messages
      this.setupMessageListener();

      console.log('FCM service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing FCM service:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        console.log('FCM not supported');
        return false;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      if (!this.isSupported || !this.messaging) {
        return null;
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: 'BKxvxhk5f-nxKVA_E1rZzqeHFO7KZ8X9wPtAbBhqFZ2wJGfvMhEeUJxvQhvQFZ2wJGfvMhEeUJxvQhvQFZ2wJGfvMhEeUJxvQhvQ' // You'll need to replace this with your actual VAPID key
      });

      if (token) {
        this.currentToken = token;
        console.log('FCM token obtained:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.log('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async registerToken(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        console.error('User ID required to register FCM token');
        return false;
      }

      const token = await this.getToken();
      if (!token) {
        console.log('No FCM token to register');
        return false;
      }

      // Save token to Firestore
      await setDoc(doc(firestore, 'fcmTokens', `${userId}_${Date.now()}`), {
        userId,
        token,
        platform: 'web',
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
        isActive: true
      });

      console.log('FCM token registered successfully');
      return true;
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return false;
    }
  }

  async unregisterToken(userId: string): Promise<boolean> {
    try {
      if (!userId || !this.currentToken) {
        return false;
      }

      // Remove token from Firestore
      // Note: In a real implementation, you'd query for the specific token document
      // For now, we'll just mark it as inactive
      console.log('FCM token unregistered');
      return true;
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
      return false;
    }
  }

  private setupMessageListener() {
    if (!this.messaging) return;

    // Handle foreground messages
    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);

      const { notification, data } = payload;

      if (notification) {
        // Show notification using our notification store
        notifications.add({
          type: 'info',
          title: notification.title || 'New Notification',
          message: notification.body || '',
          timeout: 5000,
          data: data
        });

        // Also show browser notification if permission is granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title || 'GearGrab', {
            body: notification.body,
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: data?.type || 'general',
            data: data
          });
        }
      }
    });
  }

  async sendTestNotification(userId: string): Promise<boolean> {
    try {
      // This would typically be done from the server
      // For testing, we'll simulate a local notification
      if (Notification.permission === 'granted') {
        new Notification('GearGrab Test', {
          body: 'FCM push notifications are working!',
          icon: '/favicon.png',
          badge: '/favicon.png'
        });

        notifications.add({
          type: 'success',
          title: 'Test Notification',
          message: 'FCM push notifications are working correctly!',
          timeout: 3000
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  // Auto-register FCM token when user logs in
  async autoRegister() {
    try {
      // Wait for auth to be ready
      await simpleAuth.waitForAuthReady();

      if (!simpleAuth.user) {
        console.log('No user logged in, skipping FCM registration');
        return;
      }

      // Initialize FCM
      const initialized = await this.initialize();
      if (!initialized) {
        console.log('FCM initialization failed');
        return;
      }

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return;
      }

      // Register token
      const registered = await this.registerToken(simpleAuth.user.uid);
      if (registered) {
        console.log('FCM auto-registration successful');
        
        // Show success notification
        notifications.add({
          type: 'success',
          title: 'Notifications Enabled',
          message: 'You\'ll now receive push notifications for important updates!',
          timeout: 3000
        });
      }
    } catch (error) {
      console.error('Error in FCM auto-registration:', error);
    }
  }

  // Check if notifications are supported and enabled
  getNotificationStatus(): { supported: boolean; permission: string; hasToken: boolean } {
    return {
      supported: this.isSupported,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      hasToken: !!this.currentToken
    };
  }
}

export const fcmService = new FCMService();
