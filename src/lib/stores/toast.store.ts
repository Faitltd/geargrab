// Centralized toast notification store

import { writable, type Writable } from 'svelte/store';
import type { ToastNotification } from '$lib/types';

interface ToastState {
  notifications: ToastNotification[];
}

class ToastStore {
  private store: Writable<ToastState>;
  public readonly subscribe;

  constructor() {
    this.store = writable<ToastState>({
      notifications: []
    });
    this.subscribe = this.store.subscribe;
  }

  /**
   * Show a toast notification
   */
  show(
    type: ToastNotification['type'],
    message: string,
    duration: number = 5000,
    action?: ToastNotification['action']
  ): string {
    const id = this.generateId();
    const notification: ToastNotification = {
      id,
      type,
      message,
      duration,
      action
    };

    this.store.update(state => ({
      ...state,
      notifications: [...state.notifications, notification]
    }));

    // Auto-remove after duration (if duration > 0)
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  /**
   * Show success toast
   */
  success(message: string, duration?: number, action?: ToastNotification['action']): string {
    return this.show('success', message, duration, action);
  }

  /**
   * Show error toast
   */
  error(message: string, duration?: number, action?: ToastNotification['action']): string {
    return this.show('error', message, duration, action);
  }

  /**
   * Show info toast
   */
  info(message: string, duration?: number, action?: ToastNotification['action']): string {
    return this.show('info', message, duration, action);
  }

  /**
   * Show warning toast
   */
  warning(message: string, duration?: number, action?: ToastNotification['action']): string {
    return this.show('warning', message, duration, action);
  }

  /**
   * Remove a specific toast
   */
  remove(id: string): void {
    this.store.update(state => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.store.update(state => ({
      ...state,
      notifications: []
    }));
  }

  /**
   * Clear toasts of specific type
   */
  clearType(type: ToastNotification['type']): void {
    this.store.update(state => ({
      ...state,
      notifications: state.notifications.filter(n => n.type !== type)
    }));
  }

  /**
   * Get current notifications
   */
  getNotifications(): ToastNotification[] {
    let notifications: ToastNotification[] = [];
    this.store.subscribe(state => {
      notifications = state.notifications;
    })();
    return notifications;
  }

  /**
   * Check if there are any notifications
   */
  hasNotifications(): boolean {
    return this.getNotifications().length > 0;
  }

  /**
   * Get notifications count
   */
  getCount(): number {
    return this.getNotifications().length;
  }

  /**
   * Get notifications by type
   */
  getByType(type: ToastNotification['type']): ToastNotification[] {
    return this.getNotifications().filter(n => n.type === type);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const toastStore = new ToastStore();

// Export convenience functions
export const showToast = toastStore.show.bind(toastStore);
export const showSuccess = toastStore.success.bind(toastStore);
export const showError = toastStore.error.bind(toastStore);
export const showInfo = toastStore.info.bind(toastStore);
export const showWarning = toastStore.warning.bind(toastStore);
export const removeToast = toastStore.remove.bind(toastStore);
export const clearToasts = toastStore.clear.bind(toastStore);

// Legacy export for backward compatibility
export { showToast as default };
