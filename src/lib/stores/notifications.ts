import { writable } from 'svelte/store';
import { firestore } from '$lib/firebase/client';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  type Unsubscribe
} from 'firebase/firestore';

// Toast notifications (temporary)
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timeout?: number;
}

// Persistent notifications (stored in database)
export interface PersistentNotification {
  id: string;
  userId: string;
  type: 'booking' | 'message' | 'payment' | 'system' | 'review' | 'verification';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    bookingId?: string;
    listingId?: string;
    senderId?: string;
    amount?: number;
  };
  createdAt: Date;
  readAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  icon?: string;
}

// Notification preferences
export interface NotificationPreferences {
  userId: string;
  email: {
    bookingUpdates: boolean;
    messages: boolean;
    payments: boolean;
    marketing: boolean;
    reviews: boolean;
  };
  push: {
    bookingUpdates: boolean;
    messages: boolean;
    payments: boolean;
    reviews: boolean;
  };
  sms: {
    bookingConfirmations: boolean;
    urgentUpdates: boolean;
  };
}

// Toast notification store
const createToastNotificationStore = () => {
  const { subscribe, update } = writable<ToastNotification[]>([]);

  const add = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };

    update((notifications) => [...notifications, newNotification as ToastNotification]);

    if (notification.timeout) {
      setTimeout(() => {
        update((notifications) =>
          notifications.filter((n) => n.id !== id)
        );
      }, notification.timeout);
    }

    return id;
  };

  return {
    subscribe,
    add,
    remove: (id: string) => {
      update((notifications) =>
        notifications.filter((n) => n.id !== id)
      );
    },
    clear: () => {
      update(() => []);
    },
    // Convenience methods
    success: (message: string, timeout = 5000) => add({ type: 'success', message, timeout }),
    error: (message: string, timeout = 5000) => add({ type: 'error', message, timeout }),
    info: (message: string, timeout = 5000) => add({ type: 'info', message, timeout }),
    warning: (message: string, timeout = 5000) => add({ type: 'warning', message, timeout })
  };
};

// Persistent notification store
const createPersistentNotificationStore = () => {
  const { subscribe, set, update } = writable<PersistentNotification[]>([]);
  let unsubscribe: Unsubscribe | null = null;

  return {
    subscribe,

    // Initialize real-time listener for user notifications
    init: (userId: string) => {
      if (unsubscribe) {
        unsubscribe();
      }

      const notificationsRef = collection(firestore, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications: PersistentNotification[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            readAt: data.readAt?.toDate()
          } as PersistentNotification);
        });
        set(notifications);
      });
    },

    // Mark notification as read
    markAsRead: async (notificationId: string) => {
      try {
        const notificationRef = doc(firestore, 'notifications', notificationId);
        await updateDoc(notificationRef, {
          read: true,
          readAt: new Date()
        });

        // Update local state
        update((notifications) =>
          notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },

    // Mark all notifications as read
    markAllAsRead: async (userId: string) => {
      try {
        // This would typically be done via a cloud function for efficiency
        update((notifications) =>
          notifications.map((n) => ({ ...n, read: true, readAt: new Date() }))
        );
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    },

    // Get unread count
    getUnreadCount: (notifications: PersistentNotification[]) => {
      return notifications.filter(n => !n.read).length;
    },

    // Cleanup listener
    cleanup: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    }
  };
};

// Notification preferences store
const createNotificationPreferencesStore = () => {
  const { subscribe, set } = writable<NotificationPreferences | null>(null);

  return {
    subscribe,

    // Load user preferences
    load: async (userId: string) => {
      try {
        // In a real implementation, this would fetch from Firestore
        const defaultPreferences: NotificationPreferences = {
          userId,
          email: {
            bookingUpdates: true,
            messages: true,
            payments: true,
            marketing: false,
            reviews: true
          },
          push: {
            bookingUpdates: true,
            messages: true,
            payments: true,
            reviews: false
          },
          sms: {
            bookingConfirmations: true,
            urgentUpdates: true
          }
        };
        set(defaultPreferences);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    },

    // Update preferences
    update: async (preferences: NotificationPreferences) => {
      try {
        // In a real implementation, this would save to Firestore
        set(preferences);
      } catch (error) {
        console.error('Error updating notification preferences:', error);
      }
    }
  };
};

export const toastNotifications = createToastNotificationStore();
export const persistentNotifications = createPersistentNotificationStore();
export const notificationPreferences = createNotificationPreferencesStore();

// Backward compatibility
export const notifications = toastNotifications;
export const notificationsStore = toastNotifications;
