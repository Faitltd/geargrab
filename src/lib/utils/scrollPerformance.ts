// Performance utilities for scroll-heavy components

/**
 * Throttle function to limit how often a function can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = window.setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * Debounce function to delay execution until after a period of inactivity
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Request animation frame throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (rafId) {
      return;
    }
    
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Check if an element is in the viewport
 */
export function isInViewport(element: Element, threshold = 0): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= windowHeight + threshold &&
    rect.right <= windowWidth + threshold
  );
}

/**
 * Virtual scrolling helper - calculates which items should be visible
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  visibleItems: number;
}

export function calculateVirtualScroll(
  scrollTop: number,
  config: VirtualScrollConfig
): VirtualScrollResult {
  const { itemHeight, containerHeight, totalItems, overscan = 5 } = config;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);
  const offsetY = startIndex * itemHeight;
  
  return {
    startIndex,
    endIndex,
    offsetY,
    visibleItems: endIndex - startIndex + 1
  };
}

/**
 * Intersection Observer with performance optimizations
 */
export interface OptimizedIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  debounceMs?: number;
}

export function createOptimizedIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: OptimizedIntersectionObserverOptions = {}
): IntersectionObserver {
  const { threshold = 0, rootMargin = '0px', debounceMs = 100 } = options;
  
  const debouncedCallback = debounce(callback, debounceMs);
  
  return new IntersectionObserver(debouncedCallback, {
    threshold,
    rootMargin
  });
}

/**
 * Memory-efficient image loading for large lists
 */
export class LazyImageLoader {
  private observer: IntersectionObserver;
  private loadedImages = new Set<string>();
  
  constructor(options: { rootMargin?: string; threshold?: number } = {}) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1
      }
    );
  }
  
  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src && !this.loadedImages.has(src)) {
          img.src = src;
          this.loadedImages.add(src);
          this.observer.unobserve(img);
        }
      }
    });
  }
  
  observe(img: HTMLImageElement) {
    this.observer.observe(img);
  }
  
  unobserve(img: HTMLImageElement) {
    this.observer.unobserve(img);
  }
  
  disconnect() {
    this.observer.disconnect();
    this.loadedImages.clear();
  }
}

/**
 * Performance monitoring for scroll operations
 */
export class ScrollPerformanceMonitor {
  private startTime = 0;
  private frameCount = 0;
  private lastFrameTime = 0;
  
  start() {
    this.startTime = performance.now();
    this.frameCount = 0;
    this.lastFrameTime = this.startTime;
  }
  
  frame() {
    this.frameCount++;
    this.lastFrameTime = performance.now();
  }
  
  getMetrics() {
    const totalTime = this.lastFrameTime - this.startTime;
    const fps = this.frameCount / (totalTime / 1000);
    
    return {
      totalTime,
      frameCount: this.frameCount,
      fps,
      averageFrameTime: totalTime / this.frameCount
    };
  }
}
