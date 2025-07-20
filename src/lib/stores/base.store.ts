// Base store class with common patterns

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { LoadingState } from '$lib/types';

export interface BaseStoreState<T = any> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
  lastUpdated: Date | null;
}

export class BaseStore<T = any> {
  protected store: Writable<BaseStoreState<T>>;
  public readonly subscribe: Readable<BaseStoreState<T>>['subscribe'];

  constructor(initialData: T | null = null) {
    this.store = writable<BaseStoreState<T>>({
      data: initialData,
      loading: 'idle',
      error: null,
      lastUpdated: null
    });
    
    this.subscribe = this.store.subscribe;
  }

  /**
   * Set loading state
   */
  setLoading(loading: LoadingState = 'loading'): void {
    this.store.update(state => ({
      ...state,
      loading,
      error: loading === 'loading' ? null : state.error
    }));
  }

  /**
   * Set data and mark as success
   */
  setData(data: T): void {
    this.store.update(state => ({
      ...state,
      data,
      loading: 'success',
      error: null,
      lastUpdated: new Date()
    }));
  }

  /**
   * Set error state
   */
  setError(error: string): void {
    this.store.update(state => ({
      ...state,
      loading: 'error',
      error,
      lastUpdated: new Date()
    }));
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.store.update(state => ({
      ...state,
      error: null
    }));
  }

  /**
   * Reset store to initial state
   */
  reset(initialData: T | null = null): void {
    this.store.set({
      data: initialData,
      loading: 'idle',
      error: null,
      lastUpdated: null
    });
  }

  /**
   * Update data partially
   */
  updateData(updater: (current: T | null) => T | null): void {
    this.store.update(state => ({
      ...state,
      data: updater(state.data),
      lastUpdated: new Date()
    }));
  }

  /**
   * Get current state
   */
  getCurrentState(): BaseStoreState<T> {
    let currentState: BaseStoreState<T>;
    this.store.subscribe(state => {
      currentState = state;
    })();
    return currentState!;
  }

  /**
   * Get current data
   */
  getCurrentData(): T | null {
    return this.getCurrentState().data;
  }

  /**
   * Check if store is loading
   */
  isLoading(): boolean {
    return this.getCurrentState().loading === 'loading';
  }

  /**
   * Check if store has error
   */
  hasError(): boolean {
    return this.getCurrentState().error !== null;
  }

  /**
   * Check if store has data
   */
  hasData(): boolean {
    return this.getCurrentState().data !== null;
  }

  /**
   * Create derived store for specific property
   */
  derive<U>(selector: (state: BaseStoreState<T>) => U): Readable<U> {
    return derived(this.store, selector);
  }

  /**
   * Create derived store for data only
   */
  get data(): Readable<T | null> {
    return derived(this.store, state => state.data);
  }

  /**
   * Create derived store for loading state
   */
  get loading(): Readable<LoadingState> {
    return derived(this.store, state => state.loading);
  }

  /**
   * Create derived store for error state
   */
  get error(): Readable<string | null> {
    return derived(this.store, state => state.error);
  }
}

/**
 * Create a simple writable store with type safety
 */
export function createStore<T>(initialValue: T): Writable<T> {
  return writable<T>(initialValue);
}

/**
 * Create a store with async data loading
 */
export function createAsyncStore<T>(
  loader: () => Promise<T>,
  initialData: T | null = null
): BaseStore<T> & { load: () => Promise<void> } {
  const store = new BaseStore<T>(initialData);

  const load = async (): Promise<void> => {
    try {
      store.setLoading('loading');
      const data = await loader();
      store.setData(data);
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return {
    ...store,
    load
  };
}

/**
 * Create a cached store that persists to localStorage
 */
export function createCachedStore<T>(
  key: string,
  initialValue: T,
  serializer: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  } = {
    serialize: JSON.stringify,
    deserialize: JSON.parse
  }
): Writable<T> {
  // Try to load from localStorage
  let storedValue = initialValue;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        storedValue = serializer.deserialize(stored);
      }
    } catch (error) {
      console.warn(`Failed to load cached store ${key}:`, error);
    }
  }

  const store = writable<T>(storedValue);

  // Subscribe to changes and save to localStorage
  if (typeof window !== 'undefined') {
    store.subscribe(value => {
      try {
        localStorage.setItem(key, serializer.serialize(value));
      } catch (error) {
        console.warn(`Failed to save cached store ${key}:`, error);
      }
    });
  }

  return store;
}

/**
 * Create a store that automatically refreshes data
 */
export function createRefreshableStore<T>(
  loader: () => Promise<T>,
  refreshInterval: number = 30000,
  initialData: T | null = null
): BaseStore<T> & { 
  load: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
} {
  const store = new BaseStore<T>(initialData);
  let refreshTimer: NodeJS.Timeout | null = null;

  const load = async (): Promise<void> => {
    try {
      store.setLoading('loading');
      const data = await loader();
      store.setData(data);
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const startAutoRefresh = (): void => {
    stopAutoRefresh(); // Clear existing timer
    refreshTimer = setInterval(load, refreshInterval);
  };

  const stopAutoRefresh = (): void => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  return {
    ...store,
    load,
    startAutoRefresh,
    stopAutoRefresh
  };
}
