/**
 * Accessibility utilities for GearGrab
 * Provides functions to enhance accessibility throughout the application
 */

/**
 * Generates a unique ID for form elements
 */
export function generateId(prefix: string = 'element'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Manages focus for modal dialogs and overlays
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  /**
   * Trap focus within a container element
   */
  trapFocus(container: HTMLElement): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.focusableElements = this.getFocusableElements(container);
    
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Release focus trap and restore previous focus
   */
  releaseFocus(container: HTMLElement): void {
    container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * Announces messages to screen readers
 */
export class ScreenReaderAnnouncer {
  private announcer: HTMLElement;

  constructor() {
    this.announcer = this.createAnnouncer();
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear the message after a short delay
    setTimeout(() => {
      this.announcer.textContent = '';
    }, 1000);
  }

  private createAnnouncer(): HTMLElement {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
    return announcer;
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation for lists and grids
   */
  static handleArrowKeys(
    event: KeyboardEvent,
    elements: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical'
  ): number {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          event.preventDefault();
          newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          event.preventDefault();
          newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = elements.length - 1;
        break;
    }

    if (newIndex !== currentIndex && elements[newIndex]) {
      elements[newIndex].focus();
    }

    return newIndex;
  }

  /**
   * Handle Enter and Space key activation
   */
  static handleActivation(event: KeyboardEvent, callback: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
  /**
   * Calculate the contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if color combination meets WCAG AA standards
   */
  static meetsWCAGAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Check if color combination meets WCAG AAA standards
   */
  static meetsWCAGAAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  private static getLuminance(color: string): number {
    // Convert color to RGB values
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    // Convert to relative luminance
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

/**
 * Reduced motion utilities
 */
export class MotionPreferences {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Apply animation only if user doesn't prefer reduced motion
   */
  static conditionalAnimation(element: HTMLElement, animation: () => void): void {
    if (!this.prefersReducedMotion()) {
      animation();
    }
  }
}

// Global instances
export const focusManager = new FocusManager();
export const announcer = new ScreenReaderAnnouncer();
