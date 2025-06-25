// Push notifications service for GearGrab
import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Notification permission state
export const notificationPermission = writable<NotificationPermission>('default');
export const pushSupported = writable(false);

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    if (browser) {
      this.initialize();
    }
  }

  private async initialize() {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    pushSupported.set(supported);

    if (!supported) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    // Update permission state
    notificationPermission.set(Notification.permission);

    // Register service worker for push notifications
    try {
      this.registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('✅ Push service worker registered');
    } catch (error) {
      console.error('❌ Failed to register push service worker:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!browser || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      notificationPermission.set(permission);
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async subscribeToPush(userId: string): Promise<string | null> {
    if (!this.registration || Notification.permission !== 'granted') {
      return null;
    }

    try {
      // Get existing subscription or create new one
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
        
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON()
        })
      });

      if (response.ok) {
        console.log('✅ Push subscription saved');
        return subscription.endpoint;
      } else {
        console.error('❌ Failed to save push subscription');
        return null;
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  async unsubscribeFromPush(userId: string): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
        
        console.log('✅ Push subscription removed');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }

  // Show local notification (for immediate feedback)
  showLocalNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      icon: '/geargrab-logo.png',
      badge: '/geargrab-logo.png',
      tag: 'geargrab-message',
      renotify: true,
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  // Send push notification via server
  async sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          notification: {
            title,
            body,
            icon: '/geargrab-logo.png',
            badge: '/geargrab-logo.png',
            tag: 'geargrab-message',
            data
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Utility functions for components
export async function enableNotifications(userId: string): Promise<boolean> {
  const permitted = await pushNotificationService.requestPermission();
  if (permitted) {
    const endpoint = await pushNotificationService.subscribeToPush(userId);
    return !!endpoint;
  }
  return false;
}

export async function disableNotifications(userId: string): Promise<boolean> {
  return await pushNotificationService.unsubscribeFromPush(userId);
}
