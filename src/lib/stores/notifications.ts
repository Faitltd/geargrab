import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  description?: string;
  timeout?: number;
}

export const notifications = writable<Notification[]>([]);

function createToastStore() {
  const { subscribe, update } = notifications;

  function remove(id: string) {
    update((items) => items.filter((item) => item.id !== id));
  }

  function push(message: string, type: Notification['type'] = 'info', timeout = 5000, description?: string) {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const entry: Notification = { id, type, message, description, timeout };

    update((items) => [entry, ...items]);

    if (timeout) {
      setTimeout(() => remove(id), timeout);
    }

    return id;
  }

  return {
    subscribe,
    push,
    success: (message: string, timeout?: number) => push(message, 'success', timeout),
    error: (message: string, timeout?: number) => push(message, 'error', timeout),
    info: (message: string, timeout?: number) => push(message, 'info', timeout),
    warning: (message: string, timeout?: number) => push(message, 'warning', timeout),
    remove
  };
}

export const toastNotifications = createToastStore();
