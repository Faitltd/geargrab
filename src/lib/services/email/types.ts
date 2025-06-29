// Email service types and interfaces

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BookingEmailData {
  bookingId: string;
  confirmationNumber: string;
  listingTitle: string;
  listingImage: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  renterName: string;
  renterEmail: string;
  ownerName: string;
  ownerEmail: string;
  deliveryMethod: string;
  pickupLocation?: string;
}

export interface PaymentEmailData {
  userEmail: string;
  userName: string;
  amount: number;
  service: string;
  paymentIntentId?: string;
  listingTitle?: string;
}

export interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  verificationLink?: string;
}

export interface NotificationEmailData {
  userEmail: string;
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

// Email configuration
export interface EmailConfig {
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  isDevelopment: boolean;
}

// Email sending result
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
