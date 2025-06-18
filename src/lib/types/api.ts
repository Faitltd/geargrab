// API Request/Response Types for GearGrab

// ============================================================================
// PAYMENT API TYPES
// ============================================================================

export interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency?: string; // Default: 'usd'
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentIntentErrorResponse {
  error: string;
  code: 'INVALID_AMOUNT' | 'PAYMENT_CONFIG_ERROR' | 'STRIPE_ERROR' | 'INTERNAL_ERROR' | 'AUTH_REQUIRED';
  debugInfo?: any;
}

// ============================================================================
// BOOKING API TYPES
// ============================================================================

export interface CreateBookingRequest {
  listingId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  totalPrice: number;
  deliveryMethod?: 'pickup' | 'delivery';
  insuranceTier?: 'basic' | 'standard' | 'premium' | 'none';
  specialRequests?: string;
  paymentIntentId?: string;
}

export interface CreateBookingResponse {
  success: boolean;
  bookingId: string;
  message: string;
}

export interface GetBookingsResponse {
  bookings: Array<{
    id: string;
    listingId: string;
    listingTitle: string;
    listingImage: string;
    ownerId: string;
    renterId: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
    totalPrice: number;
    paymentStatus: 'pending' | 'paid' | 'refunded';
    createdAt: string;
    updatedAt: string;
  }>;
}

// ============================================================================
// AUTH API TYPES
// ============================================================================

export interface CreateSessionRequest {
  idToken: string;
  expiresIn?: number; // Milliseconds
  deviceInfo?: string;
}

export interface CreateSessionResponse {
  success: boolean;
  message: string;
  sessionId: string;
  expiresAt: string;
}

export interface SessionStatusResponse {
  isAuthenticated: boolean;
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  };
  sessionInfo?: {
    sessionId: string;
    createdAt: string;
    lastActivity: string;
    expiresAt: string;
  };
}

// ============================================================================
// GEOCODING API TYPES
// ============================================================================

export interface GeocodeRequest {
  address?: string; // For forward geocoding
  lat?: string; // For reverse geocoding
  lng?: string; // For reverse geocoding
}

export interface GeocodeResponse {
  success: boolean;
  result?: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    components: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
  };
  error?: string;
}

// ============================================================================
// VERIFICATION API TYPES
// ============================================================================

export interface RequestPhoneVerificationRequest {
  phoneNumber: string;
}

export interface RequestPhoneVerificationResponse {
  success: boolean;
  message: string;
  verificationId: string;
}

export interface VerifyPhoneCodeRequest {
  phoneNumber: string;
  verificationCode: string;
  verificationId: string;
}

export interface VerifyPhoneCodeResponse {
  success: boolean;
  message: string;
  verified: boolean;
}

// ============================================================================
// HEALTH CHECK API TYPES
// ============================================================================

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  timestamp: string;
  environment: string;
  services?: {
    database: 'healthy' | 'unhealthy';
    storage: 'healthy' | 'unhealthy';
    payments: 'healthy' | 'unhealthy';
    auth: 'healthy' | 'unhealthy';
  };
}

export interface WebhookHealthResponse {
  success: boolean;
  message: string;
  endpoints: string[];
  configuration: {
    hasStripeKey: boolean;
    hasWebhookSecret: boolean;
    stripeConfigured: boolean;
  };
  supportedEvents: string[];
  timestamp: string;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
  timestamp?: string;
}

export interface ValidationErrorResponse {
  error: string;
  code: 'VALIDATION_ERROR';
  fields: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================================================
// COMMON API TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ============================================================================
// STRIPE WEBHOOK TYPES
// ============================================================================

export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
}

export interface StripePaymentIntentWebhook {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  metadata: Record<string, string>;
  client_secret: string;
}
