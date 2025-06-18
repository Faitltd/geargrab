// Enhanced error handling utilities for Stripe integration

export interface SecureErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  support?: string;
  action?: string;
}

export class StripeErrorHandler {
  // Create user-friendly error responses
  static createUserFriendlyError(
    message: string, 
    code: string, 
    status: number,
    action?: string
  ): Response {
    const response: SecureErrorResponse = {
      error: message,
      code,
      timestamp: new Date().toISOString(),
      action
    };

    if (status >= 500) {
      response.support = "Please contact support if this issue persists";
    }

    return json(response, { status });
  }

  // Handle Stripe-specific errors
  static handleStripeError(stripeError: any): Response {
    const errorMap = {
      'card_declined': {
        message: 'Your card was declined. Please try a different payment method.',
        status: 400,
        action: 'try_different_card'
      },
      'expired_card': {
        message: 'Your card has expired. Please use a different payment method.',
        status: 400,
        action: 'update_card'
      },
      'insufficient_funds': {
        message: 'Insufficient funds. Please check your account balance or use a different card.',
        status: 400,
        action: 'check_balance'
      },
      'incorrect_cvc': {
        message: 'Your card security code is incorrect. Please check and try again.',
        status: 400,
        action: 'check_cvc'
      },
      'processing_error': {
        message: 'Payment processing failed. Please try again in a moment.',
        status: 400,
        action: 'retry_payment'
      },
      'rate_limit': {
        message: 'Too many payment attempts. Please wait a moment and try again.',
        status: 429,
        action: 'wait_and_retry'
      }
    };

    const errorInfo = errorMap[stripeError.code] || {
      message: 'Payment processing failed. Please try again.',
      status: 400,
      action: 'retry_payment'
    };

    return this.createUserFriendlyError(
      errorInfo.message,
      stripeError.code || 'PAYMENT_ERROR',
      errorInfo.status,
      errorInfo.action
    );
  }

  // Validate payment inputs
  static validatePaymentInput(body: any): Response | null {
    if (!body || typeof body !== 'object') {
      return this.createUserFriendlyError(
        'Invalid payment request. Please refresh the page and try again.',
        'INVALID_REQUEST',
        400,
        'refresh_page'
      );
    }

    if (!body.amount || typeof body.amount !== 'number') {
      return this.createUserFriendlyError(
        'Payment amount is required. Please enter a valid amount.',
        'MISSING_AMOUNT',
        400,
        'enter_amount'
      );
    }

    if (body.amount < 50) {
      return this.createUserFriendlyError(
        'Minimum payment amount is $0.50. Please increase the amount.',
        'AMOUNT_TOO_LOW',
        400,
        'increase_amount'
      );
    }

    return null; // Valid input
  }

  // Log security events
  static logSecurityEvent(event: string, details: any) {
    console.error(`Security Event: ${event}`, {
      timestamp: new Date().toISOString(),
      event,
      ...details
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureMessage(event, 'error', { extra: details });
    }
  }
}