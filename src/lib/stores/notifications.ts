import { writable } from 'svelte/store';

// Define notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Define notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  dismissible: boolean;
  timeout: number | null; // null means no auto-dismiss
  createdAt: Date;
}

// Create a writable store for notifications
const createNotificationsStore = () => {
  const { subscribe, update } = writable<Notification[]>([]);
  
  // Generate a unique ID for notifications
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  return {
    subscribe,
    
    // Add a new notification
    add: (
      message: string,
      type: NotificationType = 'info',
      dismissible: boolean = true,
      timeout: number | null = 5000
    ) => {
      const id = generateId();
      const notification: Notification = {
        id,
        type,
        message,
        dismissible,
        timeout,
        createdAt: new Date()
      };
      
      update((notifications) => [...notifications, notification]);
      
      // Set up auto-dismiss if timeout is provided
      if (timeout) {
        setTimeout(() => {
          update((notifications) => 
            notifications.filter((n) => n.id !== id)
          );
        }, timeout);
      }
      
      return id;
    },
    
    // Remove a notification by ID
    remove: (id: string) => {
      update((notifications) => 
        notifications.filter((n) => n.id !== id)
      );
    },
    
    // Clear all notifications
    clear: () => {
      update(() => []);
    },
    
    // Convenience methods for different notification types
    info: (message: string, dismissible = true, timeout = 5000) => {
      return notificationsStore.add(message, 'info', dismissible, timeout);
    },
    
    success: (message: string, dismissible = true, timeout = 5000) => {
      return notificationsStore.add(message, 'success', dismissible, timeout);
    },
    
    warning: (message: string, dismissible = true, timeout = 5000) => {
      return notificationsStore.add(message, 'warning', dismissible, timeout);
    },
    
    error: (message: string, dismissible = true, timeout = 8000) => {
      return notificationsStore.add(message, 'error', dismissible, timeout);
    }
  };
};

export const notificationsStore = createNotificationsStore();
