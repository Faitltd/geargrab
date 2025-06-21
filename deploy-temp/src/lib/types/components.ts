/**
 * TypeScript interfaces for component props
 * Provides type safety and documentation for all component properties
 */

import type { Listing, User } from './firestore';

// =====================================================================// SEARCH COMPONENTS
// =====================================================================
export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface SearchSuggestion {
  /** Suggestion text to display */
  text: string;
  /** Type of suggestion for icon display */
  type: 'category' | 'feature' | 'location' | 'query' | 'brand';
  /** Number of items for this suggestion */
  count?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface SearchSuggestionsProps {
  /** Array of suggestions to display */
  suggestions: SearchSuggestion[];
  /** Whether to show the suggestions dropdown */
  show: boolean;
  /** Maximum height of suggestions container */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface SearchFormProps {
  /** Initial search query */
  query?: string;
  /** Initial category filter */
  category?: string;
  /** Initial location filter */
  location?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =====================================================================// CARD COMPONENTS
// =====================================================================
export interface UniverseCardProps {
  /** Listing data to display */
  listing: Listing;
  /** Optional click handler */
  onClick?: () => void;
  /** Card width */
  width?: string;
  /** Card height */
  height?: string;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface GearCardProps {
  /** Gear item data */
  gear: {
    id: string;
    image: string;
    title: string;
    price: number;
    condition: 'New' | 'Good' | 'Used';
    rating: number;
    location: string;
  };
  /** Card variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Whether to show hover effects */
  showHover?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =====================================================================// FORM COMPONENTS
// =====================================================================
export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Unique field ID */
  id: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  /** Current field value */
  value: string | number;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Autocomplete attribute */
  autocomplete?: string;
  /** Min value for number inputs */
  min?: number;
  /** Max value for number inputs */
  max?: number;
  /** Step value for number inputs */
  step?: number;
  /** Max length for text inputs */
  maxlength?: number;
  /** Number of rows for textarea */
  rows?: number;
  /** Options for select inputs */
  options?: Array<{ value: string; label: string }>;
  /** Additional CSS classes */
  className?: string;
}

export interface FormButtonProps {
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether to show loading state */
  loading?: boolean;
  /** Whether button should take full width */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =====================================================================// BOOKING COMPONENTS
// =====================================================================
export interface RentalFees {
  /** Number of rental days */
  days: number;
  /** Base rental fee */
  rentalFee: number;
  /** Service fee */
  serviceFee: number;
  /** Delivery fee */
  deliveryFee: number;
  /** Insurance fee */
  insuranceFee?: number;
  /** Security deposit */
  securityDeposit?: number;
  /** Total price */
  totalPrice: number;
}

export interface DateValidation {
  /** Whether dates are valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

export interface BookingDetailsProps {
  /** Listing being booked */
  listing: Listing;
  /** Rental start date */
  startDate: Date | string;
  /** Rental end date */
  endDate: Date | string;
  /** Delivery method */
  deliveryMethod: 'pickup' | 'delivery';
  /** Calculated rental fees */
  rentalFees: RentalFees;
  /** Date validation result */
  dateValidation: DateValidation;
  /** Whether user can proceed */
  canProceed: boolean;
  /** Whether booking is being processed */
  processing: boolean;
}

export interface BookingPaymentProps {
  /** Listing being booked */
  listing: Listing;
  /** Calculated rental fees */
  rentalFees: RentalFees;
  /** Payment metadata */
  paymentMetadata: Record<string, string>;
}

export interface BookingWizardProps {
  /** Listing being booked */
  listing: Listing;
  /** Rental start date */
  startDate: Date | string;
  /** Rental end date */
  endDate: Date | string;
  /** Delivery method */
  deliveryMethod?: 'pickup' | 'delivery';
  /** Delivery fee */
  deliveryFee?: number;
}

// =====================================================================// UI COMPONENTS
// =====================================================================
export interface StepIndicatorProps {
  /** Array of steps */
  steps: Array<{ label: string; completed?: boolean }>;
  /** Current active step index */
  currentStep: number;
  /** Layout variant */
  variant?: 'horizontal' | 'vertical';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

export interface ModalProps {
  /** Whether modal is visible */
  show: boolean;
  /** Modal title */
  title?: string;
  /** Maximum width */
  maxWidth?: string;
  /** Maximum height */
  maxHeight?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal */
  closeOnBackdrop?: boolean;
  /** Whether escape key closes modal */
  closeOnEscape?: boolean;
}

export interface CheckboxProps {
  /** Whether checkbox is checked */
  checked: boolean;
  /** Checkbox label */
  label?: string;
  /** Input name attribute */
  name?: string;
  /** Input value attribute */
  value?: string;
  /** Whether checkbox is disabled */
  disabled?: boolean;
  /** Unique ID */
  id?: string;
  /** Whether checkbox is required */
  required?: boolean;
  /** Label CSS classes */
  labelClass?: string;
  /** Wrapper CSS classes */
  wrapperClass?: string;
}

// =====================================================================// LAYOUT COMPONENTS
// =====================================================================
export interface VideoBackgroundProps {
  /** Video source URL */
  videoSrc?: string;
  /** Fallback image source URL */
  imageSrc?: string;
  /** Alt text for fallback image */
  imageAlt?: string;
  /** Overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Whether video should autoplay */
  autoplay?: boolean;
  /** Whether video should loop */
  loop?: boolean;
  /** Whether video should be muted */
  muted?: boolean;
}

export interface GeometricBackgroundProps {
  /** Background variant */
  variant?: 'skewed' | 'egg' | 'mountain' | 'wave';
  /** Background color */
  color?: string;
  /** Background opacity */
  opacity?: number;
  /** Container height */
  height?: string;
  /** Skew angle for skewed variant */
  skewAngle?: number;
  /** Position of the background */
  position?: 'top' | 'bottom' | 'center';
}

// =====================================================================// EVENT TYPES
// =====================================================================
export interface SearchEvent {
  query: string;
  category: string;
  location: string;
}

export interface BookingEvent {
  bookingId: string;
  listingId: string;
  status: string;
}

export interface PaymentEvent {
  paymentIntentId: string;
  amount: number;
  status: string;
}
