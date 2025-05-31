import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timeout?: number;
}

const createNotificationStore = () => {
  const { subscribe, update } = writable<Notification[]>([]);

  const add = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };

    update((notifications) => [...notifications, newNotification as Notification]);

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

export const notifications = createNotificationStore();
export const notificationsStore = notifications; // Alias for backward compatibility
