import { writable } from 'svelte/store';

interface LoadingState {
  [key: string]: boolean;
}

// Global loading state store
export const loadingStore = writable<LoadingState>({});

// Helper functions to manage loading states
export const setLoading = (key: string, isLoading: boolean) => {
  loadingStore.update(state => ({
    ...state,
    [key]: isLoading
  }));
};

export const getLoading = (key: string) => {
  let currentState: LoadingState = {};
  loadingStore.subscribe(state => currentState = state)();
  return currentState[key] || false;
};

export const clearLoading = (key: string) => {
  loadingStore.update(state => {
    const newState = { ...state };
    delete newState[key];
    return newState;
  });
};

// Page-specific loading states
export const pageLoading = {
  homepage: writable(false),
  browse: writable(false),
  dashboard: writable(false),
  admin: writable(false),
  listing: writable(false)
};

// Component-specific loading states
export const componentLoading = {
  gearGrid: writable(false),
  userTable: writable(false),
  adminStats: writable(false),
  navbar: writable(false)
};

// Async operation helpers
export const withLoading = async <T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> => {
  setLoading(key, true);
  try {
    const result = await operation();
    return result;
  } finally {
    setLoading(key, false);
  }
};

// Progressive loading helper
export const createProgressiveLoader = (items: any[], delay: number = 100) => {
  const visibleItems = writable<any[]>([]);
  
  items.forEach((item, index) => {
    setTimeout(() => {
      visibleItems.update(current => [...current, item]);
    }, index * delay);
  });
  
  return visibleItems;
};
