/**
 * Scroll-linked animation utilities
 * Provides smooth, reversible animations tied directly to scroll position
 */

export interface ScrollAnimationConfig {
  element: HTMLElement;
  animation: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in' | 'slide-down';
  startOffset?: number; // 0-1, when animation starts relative to viewport entry
  endOffset?: number; // 0-1, when animation completes relative to viewport
  reverseOnScrollUp?: boolean;
  smoothness?: number; // 0-1, animation smoothness
}

export interface SequentialAnimationConfig {
  container: HTMLElement;
  animation: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in' | 'slide-down';
  baseDelay?: number; // 0-1, base delay for first element
  incrementDelay?: number; // 0-1, delay increment between elements
  startOffset?: number;
  endOffset?: number;
  reverseOnScrollUp?: boolean;
  smoothness?: number;
}

class ScrollLinkedAnimationManager {
  private animations: Map<HTMLElement, ScrollAnimationConfig> = new Map();
  private sequentialAnimations: Map<HTMLElement, SequentialAnimationConfig> = new Map();
  private rafId: number | null = null;
  private isRunning = false;

  constructor() {
    this.startAnimationLoop();
  }

  addAnimation(config: ScrollAnimationConfig) {
    // Set default values
    const fullConfig: ScrollAnimationConfig = {
      startOffset: 0,
      endOffset: 0.5,
      reverseOnScrollUp: true,
      smoothness: 0.1,
      ...config
    };

    this.animations.set(config.element, fullConfig);
    
    // Initialize element
    config.element.style.opacity = '0';
    config.element.style.willChange = 'transform, opacity';
  }

  addSequentialAnimation(config: SequentialAnimationConfig) {
    // Set default values
    const fullConfig: SequentialAnimationConfig = {
      baseDelay: 0,
      incrementDelay: 0.1,
      startOffset: 0,
      endOffset: 0.8,
      reverseOnScrollUp: true,
      smoothness: 0.1,
      ...config
    };

    this.sequentialAnimations.set(config.container, fullConfig);
    
    // Initialize child elements
    const children = Array.from(config.container.children) as HTMLElement[];
    children.forEach(child => {
      child.style.opacity = '0';
      child.style.willChange = 'transform, opacity';
    });
  }

  removeAnimation(element: HTMLElement) {
    this.animations.delete(element);
    this.sequentialAnimations.delete(element);
  }

  private startAnimationLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    const animate = () => {
      this.updateAnimations();
      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  private updateAnimations() {
    const windowHeight = window.innerHeight;

    // Update single element animations
    this.animations.forEach((config, element) => {
      this.updateSingleAnimation(element, config, windowHeight);
    });

    // Update sequential animations
    this.sequentialAnimations.forEach((config, container) => {
      this.updateSequentialAnimation(container, config, windowHeight);
    });
  }

  private updateSingleAnimation(element: HTMLElement, config: ScrollAnimationConfig, windowHeight: number) {
    const rect = element.getBoundingClientRect();
    const elementHeight = rect.height;
    const elementTop = rect.top;
    const elementBottom = rect.bottom;

    const isVisible = elementBottom > 0 && elementTop < windowHeight;
    let targetProgress = 0;

    if (isVisible) {
      const startPoint = windowHeight - (elementHeight * config.startOffset!);
      const endPoint = windowHeight * (1 - config.endOffset!);
      
      targetProgress = Math.max(0, Math.min(1, 
        (startPoint - elementTop) / (startPoint - endPoint)
      ));
    } else if (elementTop > windowHeight) {
      targetProgress = 0;
    } else if (elementBottom < 0) {
      targetProgress = config.reverseOnScrollUp ? 0 : 1;
    }

    // Get current progress from element data or initialize
    const currentProgress = parseFloat(element.dataset.animationProgress || '0');
    const newProgress = currentProgress + (targetProgress - currentProgress) * config.smoothness!;
    
    element.dataset.animationProgress = newProgress.toString();
    this.applyAnimation(element, config.animation, newProgress);
  }

  private updateSequentialAnimation(container: HTMLElement, config: SequentialAnimationConfig, windowHeight: number) {
    const rect = container.getBoundingClientRect();
    const elementHeight = rect.height;
    const elementTop = rect.top;
    const elementBottom = rect.bottom;

    const isVisible = elementBottom > 0 && elementTop < windowHeight;
    let targetProgress = 0;

    if (isVisible) {
      const startPoint = windowHeight - (elementHeight * config.startOffset!);
      const endPoint = windowHeight * (1 - config.endOffset!);
      
      targetProgress = Math.max(0, Math.min(1, 
        (startPoint - elementTop) / (startPoint - endPoint)
      ));
    } else if (elementTop > windowHeight) {
      targetProgress = 0;
    } else if (elementBottom < 0) {
      targetProgress = config.reverseOnScrollUp ? 0 : 1;
    }

    // Get current progress from container data or initialize
    const currentProgress = parseFloat(container.dataset.animationProgress || '0');
    const newProgress = currentProgress + (targetProgress - currentProgress) * config.smoothness!;
    
    container.dataset.animationProgress = newProgress.toString();

    // Apply to children with staggered timing
    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child, index) => {
      const childDelay = config.baseDelay! + (index * config.incrementDelay!);
      const childProgress = Math.max(0, Math.min(1, 
        (newProgress - childDelay) / (1 - childDelay)
      ));
      
      this.applyAnimation(child, config.animation, childProgress);
    });
  }

  private applyAnimation(element: HTMLElement, animation: string, progress: number) {
    progress = Math.max(0, Math.min(1, progress));
    const easedProgress = this.easeOutCubic(progress);

    switch (animation) {
      case 'fade-up':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateY(${(1 - easedProgress) * 30}px)`;
        break;
        
      case 'fade-left':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateX(${(1 - easedProgress) * 30}px)`;
        break;
        
      case 'fade-right':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateX(${(easedProgress - 1) * 30}px)`;
        break;
        
      case 'scale-in':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `scale(${0.9 + (easedProgress * 0.1)})`;
        break;
        
      case 'slide-down':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateY(${(easedProgress - 1) * 30}px)`;
        break;
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  destroy() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.animations.clear();
    this.sequentialAnimations.clear();
  }
}

// Global instance
export const scrollAnimationManager = new ScrollLinkedAnimationManager();
