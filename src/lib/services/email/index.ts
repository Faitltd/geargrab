// Main email service exports
export * from './types';
export * from './styles';
export * from './booking-templates';
export * from './payment-templates';
export * from './sender';

// Re-export commonly used functions for convenience
export { sendEmail, sendEmails, emailSender } from './sender';
export { bookingTemplates } from './booking-templates';
export { paymentTemplates } from './payment-templates';

// Quick access template functions
import { bookingTemplates } from './booking-templates';
import { paymentTemplates } from './payment-templates';
import { sendEmail } from './sender';
import type { BookingEmailData, PaymentEmailData } from './types';

// Convenience functions for common email operations
export const emailService = {
  // Booking emails
  async sendBookingConfirmation(data: BookingEmailData) {
    const template = bookingTemplates.renterBookingConfirmation(data);
    return sendEmail(template);
  },

  async sendOwnerNotification(data: BookingEmailData) {
    const template = bookingTemplates.ownerBookingNotification(data);
    return sendEmail(template);
  },

  async sendBookingApproved(data: BookingEmailData) {
    const template = bookingTemplates.bookingApproved(data);
    return sendEmail(template);
  },

  async sendBookingDeclined(data: BookingEmailData) {
    const template = bookingTemplates.bookingDeclined(data);
    return sendEmail(template);
  },

  // Payment emails
  async sendPaymentConfirmation(data: PaymentEmailData) {
    const template = paymentTemplates.paymentConfirmation(data);
    return sendEmail(template);
  },

  async sendPaymentFailed(data: PaymentEmailData) {
    const template = paymentTemplates.paymentFailed(data);
    return sendEmail(template);
  },

  async sendRefundProcessed(data: PaymentEmailData) {
    const template = paymentTemplates.refundProcessed(data);
    return sendEmail(template);
  },

  // Booking workflow - send both renter and owner emails
  async sendBookingRequestEmails(data: BookingEmailData) {
    const renterTemplate = bookingTemplates.renterBookingConfirmation(data);
    const ownerTemplate = bookingTemplates.ownerBookingNotification(data);

    const results = await Promise.allSettled([
      sendEmail(renterTemplate),
      sendEmail(ownerTemplate)
    ]);

    return {
      renterEmail: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: 'Failed to send renter email' },
      ownerEmail: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: 'Failed to send owner email' }
    };
  }
};

// Temporary placeholder for background check emails - will implement properly later
export async function sendBackgroundCheckEmails(data: any) {
  console.log('Background check emails temporarily disabled during deployment fix');
  return { success: false, message: 'Background check emails temporarily disabled' };
}

// Temporary placeholder for booking emails - will implement properly later
export async function sendBookingEmails(data: any) {
  console.log('Booking emails temporarily disabled during deployment fix');
  return { success: false, message: 'Booking emails temporarily disabled' };
}

// Temporary placeholder for email template sending - will implement properly later
export async function sendEmailTemplate(data: any) {
  console.log('Email template sending temporarily disabled during deployment fix');
  return { success: false, message: 'Email template sending temporarily disabled' };
}

// Temporary placeholder for payment emails - will implement properly later
export async function sendPaymentEmails(data: any) {
  console.log('Payment emails temporarily disabled during deployment fix');
  return { success: false, message: 'Payment emails temporarily disabled' };
}
