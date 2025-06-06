import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  emailTemplates, 
  paymentEmailTemplates, 
  backgroundCheckEmailTemplates,
  verificationEmailTemplates,
  sendEmail 
} from '$lib/services/email';

// Test endpoint for email templates
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { type, recipientEmail, recipientName, data } = await request.json();

    if (!type || !recipientEmail) {
      return json({ 
        error: 'Missing required fields: type, recipientEmail' 
      }, { status: 400 });
    }

    // Prepare email data based on type
    let emailTemplate;
    const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    switch (type) {
      case 'booking_confirmation':
        const bookingData = {
          bookingId: data.bookingId || testId,
          confirmationNumber: data.confirmationNumber || `GG-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          listingTitle: data.listingTitle || 'Professional DSLR Camera',
          listingImage: data.listingImage || 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
          startDate: data.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: data.endDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalPrice: data.totalPrice || 150,
          renterName: recipientName || 'Test User',
          renterEmail: recipientEmail,
          ownerName: data.ownerName || 'Camera Owner',
          ownerEmail: data.ownerEmail || 'owner@example.com',
          deliveryMethod: data.deliveryMethod || 'pickup',
          pickupLocation: data.pickupLocation || '123 Main St, Salt Lake City, UT'
        };
        emailTemplate = emailTemplates.renterBookingConfirmation(bookingData);
        break;

      case 'booking_owner_notification':
        const ownerBookingData = {
          bookingId: data.bookingId || testId,
          confirmationNumber: data.confirmationNumber || `GG-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          listingTitle: data.listingTitle || 'Professional DSLR Camera',
          listingImage: data.listingImage || 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
          startDate: data.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: data.endDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalPrice: data.totalPrice || 150,
          renterName: data.renterName || 'Test Renter',
          renterEmail: data.renterEmail || 'renter@example.com',
          ownerName: recipientName || 'Test Owner',
          ownerEmail: recipientEmail,
          deliveryMethod: data.deliveryMethod || 'pickup',
          pickupLocation: data.pickupLocation || '123 Main St, Salt Lake City, UT'
        };
        emailTemplate = emailTemplates.ownerNewBooking(ownerBookingData);
        break;

      case 'payment_confirmation':
        const paymentData = {
          userId: testId,
          userEmail: recipientEmail,
          userName: recipientName || 'Test User',
          amount: data.amount || 150,
          currency: data.currency || 'usd',
          paymentIntentId: data.paymentIntentId || `pi_${testId}`,
          service: data.service || 'booking',
          bookingId: data.bookingId,
          listingTitle: data.listingTitle || 'Professional DSLR Camera'
        };
        emailTemplate = paymentEmailTemplates.paymentConfirmation(paymentData);
        break;

      case 'payment_failed':
        const failedPaymentData = {
          userId: testId,
          userEmail: recipientEmail,
          userName: recipientName || 'Test User',
          amount: data.amount || 150,
          currency: data.currency || 'usd',
          paymentIntentId: data.paymentIntentId || `pi_${testId}`,
          service: data.service || 'booking',
          bookingId: data.bookingId,
          listingTitle: data.listingTitle || 'Professional DSLR Camera'
        };
        emailTemplate = paymentEmailTemplates.paymentFailed(failedPaymentData);
        break;

      case 'background_check_initiated':
        const bgCheckInitiatedData = {
          userId: testId,
          userEmail: recipientEmail,
          userName: recipientName || 'Test User',
          requestId: data.requestId || `req_${testId}`,
          checkType: data.checkType || 'standard',
          provider: data.provider || 'checkr',
          status: 'initiated',
          externalId: data.externalId || `ext_${testId}`
        };
        emailTemplate = backgroundCheckEmailTemplates.checkInitiated(bgCheckInitiatedData);
        break;

      case 'background_check_completed':
        const bgCheckCompletedData = {
          userId: testId,
          userEmail: recipientEmail,
          userName: recipientName || 'Test User',
          requestId: data.requestId || `req_${testId}`,
          checkType: data.checkType || 'standard',
          provider: data.provider || 'checkr',
          status: data.status || 'completed',
          externalId: data.externalId || `ext_${testId}`
        };
        emailTemplate = backgroundCheckEmailTemplates.checkCompleted(bgCheckCompletedData);
        break;

      case 'identity_verified':
        const identityVerifiedData = {
          userId: testId,
          userEmail: recipientEmail,
          userName: recipientName || 'Test User',
          verificationType: 'identity',
          status: 'verified',
          requestId: data.requestId || `ver_${testId}`
        };
        emailTemplate = verificationEmailTemplates.identityVerified(identityVerifiedData);
        break;

      case 'phone_verified':
        const phoneVerifiedData = {
          userId: testId,
          userEmail: recipientEmail,
          userName: recipientName || 'Test User',
          verificationType: 'phone',
          status: 'verified',
          requestId: data.requestId || `ver_${testId}`
        };
        emailTemplate = verificationEmailTemplates.phoneVerified(phoneVerifiedData);
        break;

      default:
        return json({ 
          error: `Unknown email type: ${type}` 
        }, { status: 400 });
    }

    // Send the test email
    const emailSent = await sendEmail(emailTemplate);

    if (emailSent) {
      return json({
        success: true,
        message: `Test email sent successfully to ${recipientEmail}`,
        emailId: testId,
        type,
        recipient: recipientEmail,
        subject: emailTemplate.subject
      });
    } else {
      return json({
        error: 'Failed to send test email',
        type,
        recipient: recipientEmail
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Email test error:', error);
    return json({ 
      error: 'Failed to process email test' 
    }, { status: 500 });
  }
};

// Get available email types
export const GET: RequestHandler = async () => {
  try {
    const emailTypes = [
      {
        id: 'booking_confirmation',
        name: 'Booking Confirmation (Renter)',
        description: 'Sent to renter when booking is created',
        category: 'booking'
      },
      {
        id: 'booking_owner_notification',
        name: 'New Booking (Owner)',
        description: 'Sent to owner when new booking is received',
        category: 'booking'
      },
      {
        id: 'payment_confirmation',
        name: 'Payment Confirmation',
        description: 'Sent when payment is successfully processed',
        category: 'payment'
      },
      {
        id: 'payment_failed',
        name: 'Payment Failed',
        description: 'Sent when payment processing fails',
        category: 'payment'
      },
      {
        id: 'background_check_initiated',
        name: 'Background Check Initiated',
        description: 'Sent when background check is started',
        category: 'verification'
      },
      {
        id: 'background_check_completed',
        name: 'Background Check Completed',
        description: 'Sent when background check is finished',
        category: 'verification'
      },
      {
        id: 'identity_verified',
        name: 'Identity Verified',
        description: 'Sent when identity verification is complete',
        category: 'verification'
      },
      {
        id: 'phone_verified',
        name: 'Phone Verified',
        description: 'Sent when phone number is verified',
        category: 'verification'
      }
    ];

    return json({
      success: true,
      emailTypes,
      totalTypes: emailTypes.length
    });

  } catch (error) {
    console.error('Error fetching email types:', error);
    return json({ 
      error: 'Failed to fetch email types' 
    }, { status: 500 });
  }
};
