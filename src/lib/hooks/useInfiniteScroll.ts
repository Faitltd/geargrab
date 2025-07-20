import { onMount, onDestroy } from 'svelte';
import { writable, type Writable } from 'svelte/store';

export interface InfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export interface InfiniteScrollState {
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
}

export function useInfiniteScroll(
  loadMore: () => Promise<boolean>,
  options: InfiniteScrollOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    enabled = true,
    debounceMs = 100
  } = options;

  // State stores
  const isLoading = writable(false);
  const hasMore = writable(true);
  const error = writable<string | null>(null);

  let observer: IntersectionObserver | null = null;
  let triggerElement: HTMLElement | null = null;
  let debounceTimer: number | null = null;
  let isLoadingValue = false;
  let hasMoreValue = true;

  // Subscribe to state changes to keep local values in sync
  const unsubscribeLoading = isLoading.subscribe(value => {
    isLoadingValue = value;
  });

  const unsubscribeHasMore = hasMore.subscribe(value => {
    hasMoreValue = value;
  });

  const debouncedLoadMore = async () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(async () => {
      if (isLoadingValue || !hasMoreValue || !enabled) {
        return;
      }

      try {
        isLoading.set(true);
        error.set(null);

        const stillHasMore = await loadMore();
        hasMore.set(stillHasMore);

        if (!stillHasMore) {
          cleanup();
        }
      } catch (err) {
        console.error('Infinite scroll load error:', err);
        error.set(err instanceof Error ? err.message : 'Failed to load more items');
      } finally {
        isLoading.set(false);
      }
    }, debounceMs);
  };

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    if (entry.isIntersecting) {
      debouncedLoadMore();
    }
  };

  const setupObserver = () => {
    if (!triggerElement || observer) return;

    observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observer.observe(triggerElement);
  };

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const setTriggerElement = (element: HTMLElement | null) => {
    if (triggerElement === element) return;

    cleanup();
    triggerElement = element;

    if (element && enabled && hasMoreValue) {
      setupObserver();
    }
  };

  const reset = () => {
    cleanup();
    isLoading.set(false);
    hasMore.set(true);
    error.set(null);
    
    if (triggerElement && enabled) {
      setupObserver();
    }
  };

  const loadMoreManually = async () => {
    if (isLoadingValue || !hasMoreValue) return;
    await debouncedLoadMore();
  };

  onDestroy(() => {
    cleanup();
    unsubscribeLoading();
    unsubscribeHasMore();
  });

  return {
    // State stores
    isLoading,
    hasMore,
    error,
    
    // Methods
    setTriggerElement,
    reset,
    loadMore: loadMoreManually,
    
    // Utilities
    cleanup
  };
}

// Action for use with Svelte elements
export function infiniteScrollTrigger(
  element: HTMLElement,
  { setTriggerElement }: { setTriggerElement: (el: HTMLElement | null) => void }
) {
  setTriggerElement(element);

  return {
    destroy() {
      setTriggerElement(null);
    }
  };
}
