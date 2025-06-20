import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';

// Stripe server-side integration
let stripe: any = null;

async function getStripe() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || !secretKey.startsWith('sk_')) {
      throw new Error('Invalid or missing Stripe secret key');
    }

    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

// Professional email template functions
function generateProfessionalBookingEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - GearGrab</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background-color: #f9fafb;
        }
        .email-container { max-width: 600px; margin: 0 auto; background: white; }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .booking-card {
          background: #f8fafc;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        .total-amount {
          background: #10b981;
          color: white;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🎉 Booking Request Submitted!</h1>
          <p>Your outdoor adventure is one step closer</p>
        </div>

        <div class="content">
          <h2>Hi ${data.renterName}!</h2>
          <p>Great news! Your booking request has been successfully submitted and is now pending approval from the gear owner.</p>

          <div class="booking-card">
            <h3>📋 Booking Summary</h3>
            <p><strong>Confirmation #:</strong> ${data.confirmationNumber}</p>
            <p><strong>Item:</strong> ${data.listingTitle}</p>
            <p><strong>Check-in:</strong> ${data.startDate}</p>
            <p><strong>Check-out:</strong> ${data.endDate}</p>
            <p><strong>Pickup Method:</strong> ${data.deliveryMethod === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}</p>
            ${data.pickupLocation ? `<p><strong>Location:</strong> ${data.pickupLocation}</p>` : ''}

            <div class="total-amount">
              <div>Total Amount: <strong>$${data.totalPrice}</strong></div>
            </div>
          </div>

          <p>The gear owner will review your request within 24 hours. You'll receive an email once your booking is approved.</p>

          <p>Happy adventuring!<br><strong>The GearGrab Team</strong></p>
        </div>

        <div class="footer">
          <p><strong>GearGrab</strong> - Your trusted outdoor gear rental marketplace</p>
          <p>© 2024 GearGrab. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateProfessionalBookingEmailText(data: any): string {
  return `
🎉 Booking Request Submitted - ${data.listingTitle}

Hi ${data.renterName}!

Great news! Your booking request has been successfully submitted and is now pending approval from the gear owner.

BOOKING SUMMARY
========Confirmation #: ${data.confirmationNumber}
Item: ${data.listingTitle}
Hosted by: ${data.ownerName}
Check-in: ${data.startDate}
Check-out: ${data.endDate}
Pickup Method: ${data.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
${data.pickupLocation ? `Location: ${data.pickupLocation}` : ''}
Total Amount: $${data.totalPrice}

The gear owner will review your request within 24 hours. You'll receive an email once your booking is approved.

Happy adventuring!
The GearGrab Team

---
GearGrab - Your trusted outdoor gear rental marketplace
© 2024 GearGrab. All rights reserved.
  `;
}

function generateOwnerNotificationEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Request - GearGrab</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background-color: #f9fafb;
        }
        .email-container { max-width: 600px; margin: 0 auto; background: white; }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .content { padding: 40px 30px; }
        .booking-card {
          background: #f8fafc;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        .cta-button {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>📋 New Booking Request</h1>
          <p>Someone wants to rent your gear!</p>
        </div>

        <div class="content">
          <h2>Hi ${data.ownerName}!</h2>
          <p>You have a new booking request for your listing.</p>

          <div class="booking-card">
            <h3>📋 Booking Details</h3>
            <p><strong>Renter:</strong> ${data.renterName}</p>
            <p><strong>Item:</strong> ${data.listingTitle}</p>
            <p><strong>Dates:</strong> ${data.startDate} - ${data.endDate}</p>
            <p><strong>Total:</strong> $${data.totalPrice}</p>
            <p><strong>Pickup Method:</strong> ${data.deliveryMethod}</p>
          </div>

          <div style="text-align: center;">
            <a href="https://geargrab.co/dashboard/owner" class="cta-button">
              Review & Approve Booking
            </a>
          </div>

          <p>Please review this request within 24 hours to maintain your response rate.</p>

          <p>Best regards,<br><strong>The GearGrab Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOwnerNotificationEmailText(data: any): string {
  return `
📋 New Booking Request - ${data.listingTitle}

Hi ${data.ownerName}!

You have a new booking request for your listing.

BOOKING DETAILS
========Renter: ${data.renterName}
Item: ${data.listingTitle}
Dates: ${data.startDate} - ${data.endDate}
Total: $${data.totalPrice}
Pickup Method: ${data.deliveryMethod}

Please review this request within 24 hours: https://geargrab.co/dashboard/owner

Best regards,
The GearGrab Team
  `;
}

// Create a new booking
export const POST: RequestHandler = createSecureHandler(
  async ({ request }, { auth, body }) => {
    try {
      if (!auth) {
        return json({ error: 'Authentication required. Please log in and try again.' }, { status: 401 });
      }

    const bookingData = body;

    // Validate required fields
    const requiredFields = ['listingId', 'startDate', 'endDate', 'contactInfo', 'totalPrice'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate payment intent if provided
    if (bookingData.paymentIntentId) {
      try {
        // Verify payment with Stripe
        const stripeInstance = await getStripe();
        const paymentIntent = await stripeInstance.paymentIntents.retrieve(bookingData.paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return json({ error: 'Payment not completed' }, { status: 400 });
        }

        // Verify payment amount matches booking total
        const expectedAmount = Math.round(bookingData.totalPrice * 100); // Convert to cents
        if (paymentIntent.amount !== expectedAmount) {
          return json({ error: 'Payment amount mismatch' }, { status: 400 });
        }
      } catch (paymentError) {
        console.error('Payment verification error:', paymentError);
        return json({ error: 'Payment verification failed' }, { status: 400 });
      }
    }

    // Validate contact info
    const { contactInfo } = bookingData;
    if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email || !contactInfo.phone) {
      return json({ error: 'Missing required contact information' }, { status: 400 });
    }

    // Validate dates
    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);

    if (startDate > endDate) {
      return json({ error: 'End date must be on or after start date' }, { status: 400 });
    }

    if (startDate < new Date()) {
      return json({ error: 'Start date cannot be in the past' }, { status: 400 });
    }

    // Generate booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real application, you would:
    // 1. Check listing availability
    // 2. Validate the listing exists and is active
    // 3. Create the booking in the database
    // 4. Send notifications to owner and renter
    // 5. Handle payment processing

    // Simulate booking creation
    const booking = {
      id: bookingId,
      listingId: bookingData.listingId,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      deliveryMethod: bookingData.deliveryMethod || 'pickup',
      insuranceTier: bookingData.insuranceTier || 'standard',
      totalPrice: bookingData.totalPrice,
      priceBreakdown: bookingData.priceBreakdown || {
        dailyPrice: 0,
        days: 1,
        basePrice: 0,
        serviceFee: 0,
        deliveryFee: 0,
        insuranceFee: 0
      },
      contactInfo: bookingData.contactInfo,
      specialRequests: bookingData.specialRequests || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      confirmationNumber: `GG-${Date.now().toString().slice(-6)}`
    };

    // Simulate database save delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Booking created:', booking);

    // Send professional booking confirmation emails
    try {
      const emailData = {
        bookingId: booking.id,
        confirmationNumber: booking.confirmationNumber,
        listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
        listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        startDate: new Date(bookingData.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        endDate: new Date(bookingData.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        totalPrice: bookingData.totalPrice,
        renterName: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
        renterEmail: bookingData.contactInfo.email,
        ownerName: 'David Wilson',
        ownerEmail: 'david.wilson@example.com',
        deliveryMethod: bookingData.deliveryMethod,
        pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)'
      };

      // Send professional confirmation email to renter
      const renterEmailTemplate = {
        to: emailData.renterEmail,
        subject: `🎉 Booking Request Submitted - ${emailData.listingTitle} | GearGrab`,
        html: generateProfessionalBookingEmail(emailData),
        text: generateProfessionalBookingEmailText(emailData)
      };

      // Send professional notification email to owner
      const ownerEmailTemplate = {
        to: emailData.ownerEmail,
        subject: `📋 New Booking Request - ${emailData.listingTitle} | GearGrab`,
        html: generateOwnerNotificationEmail(emailData),
        text: generateOwnerNotificationEmailText(emailData)
      };

      // In production, send via email service (Resend, SendGrid, etc.)
      console.log('📧 Professional booking emails prepared:', {
        renter: renterEmailTemplate.to,
        owner: ownerEmailTemplate.to,
        paymentStatus: bookingData.paymentIntentId ? 'Paid' : 'Pending'
      });

    } catch (emailError) {
      console.error('Error preparing booking emails:', emailError);
      // Don't fail the booking if emails fail
    }

    return json({
      success: true,
      bookingId: booking.id,
      confirmationNumber: booking.confirmationNumber,
      message: 'Booking request submitted successfully'
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return json({ error: 'Failed to create booking' }, { status: 500 });
  }
},
{
  requireAuth: true,
  rateLimit: 'api',
  inputSchema: {
    listingId: { required: true, type: 'string' as const, minLength: 1 },
    startDate: { required: true, type: 'string' as const },
    endDate: { required: true, type: 'string' as const },
    contactInfo: {
      required: true,
      type: 'object' as const,
      properties: {
        firstName: { required: true, type: 'string' as const, minLength: 1 },
        lastName: { required: true, type: 'string' as const, minLength: 1 },
        email: { required: true, type: 'email' as const },
        phone: { required: true, type: 'string' as const, minLength: 1 },
        emergencyContact: { required: false, type: 'string' as const },
        emergencyPhone: { required: false, type: 'string' as const }
      }
    },
    totalPrice: { required: true, type: 'number' as const, min: 0 },
    totalBookingCost: { required: false, type: 'number' as const, min: 0 },
    priceBreakdown: {
      required: false,
      type: 'object' as const,
      properties: {
        dailyPrice: { required: false, type: 'number' as const },
        days: { required: false, type: 'number' as const },
        basePrice: { required: false, type: 'number' as const },
        serviceFee: { required: false, type: 'number' as const },
        deliveryFee: { required: false, type: 'number' as const },
        insuranceFee: { required: false, type: 'number' as const },
        upfrontFees: { required: false, type: 'number' as const },
        laterFees: { required: false, type: 'number' as const }
      }
    },
    deliveryMethod: { required: false, type: 'string' as const },
    insuranceTier: { required: false, type: 'string' as const },
    specialRequests: { required: false, type: 'string' as const },
    paymentIntentId: { required: false, type: 'string' as const },
    paymentStage: { required: false, type: 'string' as const }
  }
}
);

// Get booking details
export const GET: RequestHandler = createSecureHandler(
  async ({ url }, { auth }) => {
    try {
      if (!auth) {
        return json({ error: 'Authentication required. Please log in and try again.' }, { status: 401 });
      }

      const bookingId = url.searchParams.get('bookingId');

      if (!bookingId) {
        return json({ error: 'Booking ID is required' }, { status: 400 });
      }

      // In a real application, you would fetch from database
      // For now, return mock data
      const booking = {
        id: bookingId,
        listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
        listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        startDate: '2024-02-15',
        endDate: '2024-02-18',
        totalPrice: 165,
        status: 'pending',
        owner: {
          name: 'David Wilson',
          email: 'david@example.com',
          phone: '(555) 123-4567'
        },
        confirmationNumber: bookingId.replace('booking_', 'GG-'),
        deliveryMethod: 'pickup',
        pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)',
        createdAt: new Date().toISOString()
      };

      return json({ booking });

    } catch (error) {
      console.error('Error fetching booking:', error);
      return json({ error: 'Failed to fetch booking' }, { status: 500 });
    }
  },
{
  requireAuth: true
}
);
