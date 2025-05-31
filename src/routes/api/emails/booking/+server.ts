import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendBookingEmails } from '$lib/services/email';

// Send booking confirmation emails
export const POST: RequestHandler = async ({ request }) => {
  try {
    const emailData = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'bookingId', 'confirmationNumber', 'listingTitle', 'listingImage',
      'startDate', 'endDate', 'totalPrice', 'renterName', 'renterEmail',
      'ownerName', 'ownerEmail', 'deliveryMethod'
    ];
    
    for (const field of requiredFields) {
      if (!emailData[field]) {
        return json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Send the emails
    const result = await sendBookingEmails(emailData);
    
    return json({
      success: true,
      renterEmailSent: result.renterEmailSent,
      ownerEmailSent: result.ownerEmailSent,
      message: 'Booking emails sent successfully'
    });

  } catch (error) {
    console.error('Error sending booking emails:', error);
    return json({ error: 'Failed to send booking emails' }, { status: 500 });
  }
};
