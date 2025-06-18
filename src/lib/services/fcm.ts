/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications for the application
 */

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { browser } from '$app/environment';
import { firestore } from '$lib/firebase/client';
import { doc, updateDoc } from 'firebase/firestore';

// FCM configuration
const FCM_CONFIG = {
  vapidKey: 'your-vapid-key' // You'll need to generate this in Firebase Console
};

let messaging: Messaging | null = null;

// Initialize FCM
export function initializeFCM(): Messaging | null {
  if (!browser) return null;
  
  try {
    messaging = getMessaging();
    return messaging;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!browser) {
    return { success: false, error: 'Not in browser environment' };
  }

  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return { success: false, error: 'Notifications not supported in this browser' };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = initializeFCM();
      if (!messaging) {
        return { success: false, error: 'Failed to initialize messaging' };
      }
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: FCM_CONFIG.vapidKey
    });

    if (!token) {
      return { success: false, error: 'Failed to get FCM token' };
    }

    // Save token to user document
    await saveFCMToken(userId, token);

    return { success: true, token };

  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Save FCM token to user document
async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date()
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (!browser || !messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return null;
  }
}

// Show notification (for foreground messages)
export function showNotification(title: string, options: NotificationOptions = {}): void {
  if (!browser || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      ...options
    });
  }
}

// Server-side FCM functions (for API routes)
export const FCMServer = {
  // Send push notification to a user
  async sendNotification(
    fcmToken: string,
    notification: {
      title: string;
      body: string;
      icon?: string;
      clickAction?: string;
    },
    data?: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // This would be implemented in the server-side API route
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: fcmToken,
          notification,
          data
        })
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Send notification to multiple users
  async sendMulticastNotification(
    fcmTokens: string[],
    notification: {
      title: string;
      body: string;
      icon?: string;
      clickAction?: string;
    },
    data?: Record<string, string>
  ): Promise<{ success: boolean; successCount?: number; failureCount?: number; error?: string }> {
    try {
      const response = await fetch('/api/notifications/send-multicast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokens: fcmTokens,
          notification,
          data
        })
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error sending multicast notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Notification templates
export const NotificationTemplates = {
  newMessage: (senderName: string, preview: string) => ({
    title: `New message from ${senderName}`,
    body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
    icon: '/icons/message.png',
    clickAction: '/messages'
  }),

  bookingRequest: (listingTitle: string) => ({
    title: 'New booking request',
    body: `Someone wants to book your "${listingTitle}"`,
    icon: '/icons/booking.png',
    clickAction: '/dashboard/bookings'
  }),

  bookingConfirmed: (listingTitle: string) => ({
    title: 'Booking confirmed!',
    body: `Your booking for "${listingTitle}" has been confirmed`,
    icon: '/icons/confirmed.png',
    clickAction: '/dashboard/bookings'
  }),

  paymentReceived: (amount: string) => ({
    title: 'Payment received',
    body: `You received a payment of ${amount}`,
    icon: '/icons/payment.png',
    clickAction: '/dashboard/earnings'
  }),

  reminderPickup: (listingTitle: string, hours: number) => ({
    title: 'Pickup reminder',
    body: `Don't forget to pick up "${listingTitle}" in ${hours} hours`,
    icon: '/icons/reminder.png',
    clickAction: '/dashboard/bookings'
  }),

  reminderReturn: (listingTitle: string, hours: number) => ({
    title: 'Return reminder',
    body: `Please return "${listingTitle}" in ${hours} hours`,
    icon: '/icons/reminder.png',
    clickAction: '/dashboard/bookings'
  })
};
