// Application Constants

// App Information
export const APP_NAME = 'GearGrab';
export const APP_DESCRIPTION = 'Rent outdoor gear from locals';
export const APP_VERSION = '1.0.0';

// Routes
export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  LIST_GEAR: '/list-gear',
  SELL_GEAR: '/sell-gear',
  BROWSE_SALES: '/browse-sales',
  BECOME_GUIDE: '/become-guide',
  BROWSE_GUIDES: '/browse-guides',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  RESET_PASSWORD: '/auth/reset-password',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  HELP: '/help'
} as const;

// Gear Categories
export const GEAR_CATEGORIES = [
  { id: 'camping', name: 'Camping', icon: '⛺' },
  { id: 'hiking', name: 'Hiking', icon: '🥾' },
  { id: 'skiing', name: 'Skiing', icon: '⛷️' },
  { id: 'water-sports', name: 'Water Sports', icon: '🏄' },
  { id: 'climbing', name: 'Climbing', icon: '🧗' },
  { id: 'biking', name: 'Biking', icon: '🚴' },
  { id: 'rollerblades', name: 'Rollerblades', icon: '🛼' },
  { id: 'one-wheels', name: 'One Wheels', icon: '🛹' },
  { id: 'bicycles', name: 'Bicycles', icon: '🚲' }
] as const;

// Gear Conditions
export const GEAR_CONDITIONS = [
  { value: 'New', label: 'New', description: 'Brand new, never used' },
  { value: 'Like New', label: 'Like New', description: 'Excellent condition, minimal use' },
  { value: 'Good', label: 'Good', description: 'Good condition, normal wear' },
  { value: 'Fair', label: 'Fair', description: 'Fair condition, shows wear' },
  { value: 'Poor', label: 'Poor', description: 'Poor condition, significant wear' }
] as const;

// Booking Statuses
export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'disputed'
] as const;

// Payment Statuses
export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'refunded',
  'partially_refunded',
  'failed'
] as const;

// Delivery Methods
export const DELIVERY_METHODS = [
  { value: 'pickup', label: 'Pickup', description: 'Pick up from owner location' },
  { value: 'dropoff', label: 'Delivery', description: 'Owner delivers to you' },
  { value: 'shipping', label: 'Shipping', description: 'Shipped via carrier' }
] as const;

// Insurance Tiers
export const INSURANCE_TIERS = [
  { value: 'none', label: 'No Insurance', cost: 0 },
  { value: 'basic', label: 'Basic Coverage', cost: 5 },
  { value: 'standard', label: 'Standard Coverage', cost: 10 },
  { value: 'premium', label: 'Premium Coverage', cost: 20 }
] as const;

// Cancellation Policies
export const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible', description: 'Full refund 24 hours before' },
  { value: 'moderate', label: 'Moderate', description: 'Full refund 5 days before' },
  { value: 'strict', label: 'Strict', description: 'Full refund 14 days before' }
] as const;

// Sale Statuses
export const SALE_STATUSES = [
  'active',
  'sold',
  'inactive',
  'pending'
] as const;

// Sale Purchase Statuses
export const SALE_PURCHASE_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'completed',
  'cancelled'
] as const;

// Sale Delivery Methods
export const SALE_DELIVERY_METHODS = [
  { value: 'pickup', label: 'Pickup', description: 'Pick up from seller location' },
  { value: 'shipping', label: 'Shipping', description: 'Shipped via carrier' },
  { value: 'local_delivery', label: 'Local Delivery', description: 'Seller delivers locally' }
] as const;

// Guide Specialties
export const GUIDE_SPECIALTIES = [
  { id: 'rock-climbing', name: 'Rock Climbing', icon: '🧗' },
  { id: 'mountaineering', name: 'Mountaineering', icon: '⛰️' },
  { id: 'hiking', name: 'Hiking & Backpacking', icon: '🥾' },
  { id: 'skiing', name: 'Skiing & Snowboarding', icon: '⛷️' },
  { id: 'kayaking', name: 'Kayaking & Canoeing', icon: '🛶' },
  { id: 'surfing', name: 'Surfing', icon: '🏄' },
  { id: 'mountain-biking', name: 'Mountain Biking', icon: '🚵' },
  { id: 'photography', name: 'Outdoor Photography', icon: '📸' },
  { id: 'fishing', name: 'Fishing & Fly Fishing', icon: '🎣' },
  { id: 'camping', name: 'Camping & Survival', icon: '⛺' },
  { id: 'wildlife', name: 'Wildlife Watching', icon: '🦅' },
  { id: 'navigation', name: 'Navigation & Orienteering', icon: '🧭' }
] as const;

// Guide Service Types
export const GUIDE_SERVICE_TYPES = [
  { value: 'instruction', label: 'Instruction', description: 'Learn new skills and techniques' },
  { value: 'guided_tour', label: 'Guided Tour', description: 'Explore with an expert guide' },
  { value: 'consultation', label: 'Consultation', description: 'Get expert advice and planning' },
  { value: 'equipment_demo', label: 'Equipment Demo', description: 'Learn about gear and equipment' },
  { value: 'custom', label: 'Custom Service', description: 'Tailored to your specific needs' }
] as const;

// Guide Skill Levels
export const GUIDE_SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to the activity' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced and skilled' },
  { value: 'mixed', label: 'Mixed Group', description: 'Various skill levels' }
] as const;

// Guide Booking Statuses
export const GUIDE_BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
] as const;

// Guide Statuses
export const GUIDE_STATUSES = [
  'active',
  'inactive',
  'pending',
  'suspended'
] as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE_REGEX: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  ZIP_CODE_REGEX: /^\d{5}(-\d{4})?$/,
  PRICE_MIN: 1,
  PRICE_MAX: 10000,
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 2000
} as const;

// UI Constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  TOAST_TIMEOUT: 5000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_SIZE: 12,
  MAX_IMAGES_PER_LISTING: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp']
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size must be less than 5MB.',
  INVALID_FILE_TYPE: 'Please upload a valid image file (JPEG, PNG, or WebP).',
  EMAIL_INVALID: 'Please enter a valid email address.',
  PASSWORD_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, and number.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  REQUIRED_FIELD: 'This field is required.',
  PRICE_INVALID: 'Price must be between $1 and $10,000.',
  TITLE_TOO_SHORT: 'Title must be at least 3 characters.',
  TITLE_TOO_LONG: 'Title must be less than 100 characters.',
  DESCRIPTION_TOO_SHORT: 'Description must be at least 10 characters.',
  DESCRIPTION_TOO_LONG: 'Description must be less than 2000 characters.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Account created successfully! Welcome to GearGrab!',
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  LISTING_CREATED: 'Your gear has been listed successfully!',
  LISTING_UPDATED: 'Listing updated successfully!',
  LISTING_DELETED: 'Listing deleted successfully!',
  SALE_CREATED: 'Your gear has been listed for sale successfully!',
  SALE_UPDATED: 'Sale listing updated successfully!',
  SALE_DELETED: 'Sale listing deleted successfully!',
  SALE_PURCHASED: 'Purchase completed successfully!',
  GUIDE_PROFILE_CREATED: 'Your guide profile has been created successfully!',
  GUIDE_PROFILE_UPDATED: 'Guide profile updated successfully!',
  GUIDE_PROFILE_DELETED: 'Guide profile deleted successfully!',
  GUIDE_BOOKING_CREATED: 'Guide booking request sent successfully!',
  GUIDE_BOOKING_CONFIRMED: 'Guide booking confirmed!',
  GUIDE_BOOKING_CANCELLED: 'Guide booking cancelled successfully!',
  BOOKING_CREATED: 'Booking request sent successfully!',
  BOOKING_CONFIRMED: 'Booking confirmed!',
  BOOKING_CANCELLED: 'Booking cancelled successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_RESET_SENT: 'Password reset email sent!',
  EMAIL_VERIFIED: 'Email verified successfully!'
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  BACKGROUND_CHECKS: false, // Disabled per user preference
  CHAT_SYSTEM: true,
  PUSH_NOTIFICATIONS: true,
  INSURANCE_CLAIMS: true,
  ADVANCED_SEARCH: true,
  SOCIAL_LOGIN: true,
  PAYMENT_PROCESSING: true,
  GEOLOCATION: true
} as const;

// API Endpoints (if using external APIs)
export const API_ENDPOINTS = {
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  TWILIO_ACCOUNT_SID: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
} as const;

// Type exports for better TypeScript support
export type GearCategory = typeof GEAR_CATEGORIES[number]['id'];
export type GearCondition = typeof GEAR_CONDITIONS[number]['value'];
export type BookingStatus = typeof BOOKING_STATUSES[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export type DeliveryMethod = typeof DELIVERY_METHODS[number]['value'];
export type InsuranceTier = typeof INSURANCE_TIERS[number]['value'];
export type CancellationPolicy = typeof CANCELLATION_POLICIES[number]['value'];
export type SaleStatus = typeof SALE_STATUSES[number];
export type SalePurchaseStatus = typeof SALE_PURCHASE_STATUSES[number];
export type SaleDeliveryMethod = typeof SALE_DELIVERY_METHODS[number]['value'];
export type GuideSpecialty = typeof GUIDE_SPECIALTIES[number]['id'];
export type GuideServiceType = typeof GUIDE_SERVICE_TYPES[number]['value'];
export type GuideSkillLevel = typeof GUIDE_SKILL_LEVELS[number]['value'];
export type GuideBookingStatus = typeof GUIDE_BOOKING_STATUSES[number];
export type GuideStatus = typeof GUIDE_STATUSES[number];
