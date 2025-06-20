/**
 * Booking Context Persistence System
 * Handles saving and restoring booking form data during authentication flows
 */

export interface BookingContext {
  // URL parameters
  listingId: string;
  startDate: string;
  endDate: string;
  deliveryMethod: string;
  insuranceTier: string;
  totalPrice: number;

  // Form data
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  specialRequests: string;
  agreeToTerms: boolean;

  // Context metadata
  currentStep: 'details' | 'payment';
  timestamp: number;
  returnUrl: string;
}

const BOOKING_CONTEXT_KEY = 'geargrab_booking_context';
const CONTEXT_EXPIRY_HOURS = 2; // Context expires after 2 hours

export class BookingContextManager {
  /**
   * Save booking context to localStorage
   */
  static saveContext(context: Partial<BookingContext>): boolean {
    try {
      const fullContext: BookingContext = {
        listingId: '',
        startDate: '',
        endDate: '',
        deliveryMethod: 'pickup',
        insuranceTier: 'standard',
        totalPrice: 0,
        contactInfo: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          emergencyContact: '',
          emergencyPhone: ''
        },
        specialRequests: '',
        agreeToTerms: false,
        currentStep: 'details',
        timestamp: Date.now(),
        returnUrl: window.location.href,
        ...context
      };

      localStorage.setItem(BOOKING_CONTEXT_KEY, JSON.stringify(fullContext));
      console.log('💾 Booking context saved:', fullContext);
      return true;
    } catch (error) {
      console.error('❌ Failed to save booking context:', error);
      return false;
    }
  }

  /**
   * Restore booking context from localStorage
   */
  static restoreContext(): BookingContext | null {
    try {
      const savedContext = localStorage.getItem(BOOKING_CONTEXT_KEY);
      if (!savedContext) {
        console.log('📭 No booking context found');
        return null;
      }

      const context: BookingContext = JSON.parse(savedContext);
      
      // Check if context has expired
      const hoursAgo = (Date.now() - context.timestamp) / (1000 * 60 * 60);
      if (hoursAgo > CONTEXT_EXPIRY_HOURS) {
        console.log('⏰ Booking context expired, clearing...');
        this.clearContext();
        return null;
      }

      console.log('📥 Booking context restored:', context);
      return context;
    } catch (error) {
      console.error('❌ Failed to restore booking context:', error);
      this.clearContext(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Clear booking context from localStorage
   */
  static clearContext(): void {
    try {
      localStorage.removeItem(BOOKING_CONTEXT_KEY);
      console.log('🗑️ Booking context cleared');
    } catch (error) {
      console.error('❌ Failed to clear booking context:', error);
    }
  }

  /**
   * Update existing context with new data
   */
  static updateContext(updates: Partial<BookingContext>): boolean {
    const existing = this.restoreContext();
    if (!existing) {
      return this.saveContext(updates);
    }

    return this.saveContext({
      ...existing,
      ...updates,
      timestamp: Date.now() // Update timestamp
    });
  }

  /**
   * Check if we're returning from a Google auth redirect
   */
  static isReturningFromAuth(): boolean {
    const context = this.restoreContext();
    if (!context) return false;

    // Check if current URL matches the return URL pattern
    const currentUrl = window.location.href;
    const returnUrl = context.returnUrl;

    // If we have a context and we're on a booking page, we might be returning from auth
    return currentUrl.includes('/book/confirm') && returnUrl.includes('/book/confirm');
  }

  /**
   * Get the return URL for after authentication
   */
  static getReturnUrl(): string {
    const context = this.restoreContext();
    return context?.returnUrl || '/';
  }

  /**
   * Mark authentication as completed and prepare for booking continuation
   */
  static markAuthCompleted(): void {
    this.updateContext({
      currentStep: 'payment',
      timestamp: Date.now()
    });
  }
}
