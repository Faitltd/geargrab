// Email service for sending booking notifications
// Using Resend as the email provider (you can switch to SendGrid, Mailgun, etc.)

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface BookingEmailData {
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

// Email templates
export const emailTemplates = {
  // Email to renter when booking is created
  renterBookingConfirmation: (data: BookingEmailData): EmailTemplate => ({
    to: data.renterEmail,
    subject: `Booking Confirmation - ${data.listingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .listing-info { display: flex; align-items: center; margin-bottom: 20px; }
          .listing-image { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-right: 15px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .detail-item { padding: 10px; background: #f3f4f6; border-radius: 6px; }
          .detail-label { font-weight: bold; color: #374151; font-size: 14px; }
          .detail-value { color: #111827; margin-top: 4px; }
          .price-total { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; }
          .next-steps { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Request Submitted!</h1>
            <p>Your adventure is one step closer</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.renterName},</p>
            <p>Thank you for your booking request! We've sent your request to the gear owner for approval.</p>
            
            <div class="booking-card">
              <div class="listing-info">
                <img src="${data.listingImage}" alt="${data.listingTitle}" class="listing-image">
                <div>
                  <h3 style="margin: 0; color: #111827;">${data.listingTitle}</h3>
                  <p style="margin: 5px 0; color: #6b7280;">Hosted by ${data.ownerName}</p>
                  <p style="margin: 5px 0; color: #10b981; font-weight: bold;">Confirmation #${data.confirmationNumber}</p>
                </div>
              </div>
              
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-label">Check-in</div>
                  <div class="detail-value">${data.startDate}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Check-out</div>
                  <div class="detail-value">${data.endDate}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Delivery</div>
                  <div class="detail-value">${data.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Location</div>
                  <div class="detail-value">${data.pickupLocation || 'TBD'}</div>
                </div>
              </div>
              
              <div class="price-total">
                Total: $${data.totalPrice}
              </div>
            </div>
            
            <div class="next-steps">
              <h3 style="margin-top: 0; color: #1e40af;">What happens next?</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li><strong>Owner Review:</strong> ${data.ownerName} will review your request within 24 hours</li>
                <li><strong>Confirmation:</strong> You'll receive an email when your booking is approved</li>
                <li><strong>Adventure Time:</strong> Pick up your gear and start exploring!</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://geargrab.co/dashboard/renter" class="button">View My Bookings</a>
            </div>
            
            <p><strong>Need help?</strong> Contact ${data.ownerName} directly or reach out to our support team.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 GearGrab. Happy adventuring! 🏔️</p>
            <p>This email was sent regarding booking ${data.confirmationNumber}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Booking Confirmation - ${data.listingTitle}
      
      Hi ${data.renterName},
      
      Your booking request has been submitted!
      
      Booking Details:
      - Item: ${data.listingTitle}
      - Host: ${data.ownerName}
      - Confirmation: ${data.confirmationNumber}
      - Check-in: ${data.startDate}
      - Check-out: ${data.endDate}
      - Total: $${data.totalPrice}
      
      What's next?
      1. ${data.ownerName} will review your request within 24 hours
      2. You'll receive confirmation when approved
      3. Pick up your gear and start your adventure!
      
      View your bookings: https://geargrab.co/dashboard/renter
      
      Happy adventuring!
      GearGrab Team
    `
  }),

  // Email to owner when new booking is received
  ownerNewBooking: (data: BookingEmailData): EmailTemplate => ({
    to: data.ownerEmail,
    subject: `New Booking Request - ${data.listingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .listing-info { display: flex; align-items: center; margin-bottom: 20px; }
          .listing-image { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-right: 15px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .detail-item { padding: 10px; background: #f3f4f6; border-radius: 6px; }
          .detail-label { font-weight: bold; color: #374151; font-size: 14px; }
          .detail-value { color: #111827; margin-top: 4px; }
          .price-total { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; }
          .action-buttons { display: flex; gap: 15px; justify-content: center; margin: 30px 0; }
          .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; }
          .button-approve { background: #10b981; color: white; }
          .button-decline { background: #ef4444; color: white; }
          .button-view { background: #6b7280; color: white; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Booking Request</h1>
            <p>Someone wants to rent your gear!</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.ownerName},</p>
            <p>Great news! You have a new booking request for your listing.</p>
            
            <div class="booking-card">
              <div class="listing-info">
                <img src="${data.listingImage}" alt="${data.listingTitle}" class="listing-image">
                <div>
                  <h3 style="margin: 0; color: #111827;">${data.listingTitle}</h3>
                  <p style="margin: 5px 0; color: #6b7280;">Requested by ${data.renterName}</p>
                  <p style="margin: 5px 0; color: #3b82f6; font-weight: bold;">Booking #${data.confirmationNumber}</p>
                </div>
              </div>
              
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-label">Renter</div>
                  <div class="detail-value">${data.renterName}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Email</div>
                  <div class="detail-value">${data.renterEmail}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Check-in</div>
                  <div class="detail-value">${data.startDate}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Check-out</div>
                  <div class="detail-value">${data.endDate}</div>
                </div>
              </div>
              
              <div class="price-total">
                You'll earn: $${Math.round(data.totalPrice * 0.85)} (after fees)
              </div>
            </div>
            
            <div class="action-buttons">
              <a href="https://geargrab.co/dashboard/owner/booking/${data.bookingId}?action=approve" class="button button-approve">✅ Approve</a>
              <a href="https://geargrab.co/dashboard/owner/booking/${data.bookingId}?action=decline" class="button button-decline">❌ Decline</a>
              <a href="https://geargrab.co/dashboard/owner" class="button button-view">👀 View Details</a>
            </div>
            
            <p><strong>Please respond within 24 hours</strong> to maintain your response rate and provide the best experience for renters.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 GearGrab. Share the adventure! 🏔️</p>
            <p>This email was sent regarding booking ${data.confirmationNumber}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Booking Request - ${data.listingTitle}
      
      Hi ${data.ownerName},
      
      You have a new booking request!
      
      Booking Details:
      - Item: ${data.listingTitle}
      - Renter: ${data.renterName} (${data.renterEmail})
      - Booking: ${data.confirmationNumber}
      - Check-in: ${data.startDate}
      - Check-out: ${data.endDate}
      - You'll earn: $${Math.round(data.totalPrice * 0.85)} (after fees)
      
      Please respond within 24 hours to maintain your response rate.
      
      Manage bookings: https://geargrab.co/dashboard/owner
      
      Happy sharing!
      GearGrab Team
    `
  })
};

// Send email function (server-side only)
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    // In development, just log the email
    if (!process.env.RESEND_API_KEY || process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:', {
        to: template.to,
        subject: template.subject,
        preview: template.text?.substring(0, 100) + '...'
      });

      // Show a more detailed preview in development
      console.log('📧 Full email preview:');
      console.log('To:', template.to);
      console.log('Subject:', template.subject);
      console.log('Text preview:', template.text?.substring(0, 200) + '...');
      console.log('---');

      return true;
    }

    // Production email sending with Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'GearGrab <bookings@geargrab.co>',
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email service error:', error);
      return false;
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.id);
    return true;

  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Send booking confirmation emails
export async function sendBookingEmails(bookingData: BookingEmailData): Promise<{
  renterEmailSent: boolean;
  ownerEmailSent: boolean;
}> {
  const renterTemplate = emailTemplates.renterBookingConfirmation(bookingData);
  const ownerTemplate = emailTemplates.ownerNewBooking(bookingData);

  const [renterEmailSent, ownerEmailSent] = await Promise.all([
    sendEmail(renterTemplate),
    sendEmail(ownerTemplate)
  ]);

  return {
    renterEmailSent,
    ownerEmailSent
  };
}

// Additional email types for comprehensive system
interface PaymentEmailData {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  service: string;
  bookingId?: string;
  listingTitle?: string;
}

interface BackgroundCheckEmailData {
  userId: string;
  userEmail: string;
  userName: string;
  requestId: string;
  checkType: string;
  provider: string;
  status: string;
  externalId?: string;
}

interface VerificationEmailData {
  userId: string;
  userEmail: string;
  userName: string;
  verificationType: string;
  status: string;
  requestId: string;
}

// Payment email templates
export const paymentEmailTemplates = {
  paymentConfirmation: (data: PaymentEmailData): EmailTemplate => ({
    to: data.userEmail,
    subject: `Payment Confirmation - $${data.amount} | GearGrab`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #10b981; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your payment has been successfully processed!</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Payment Details</h3>
              <p><strong>Amount:</strong> <span class="amount">$${data.amount}</span></p>
              <p><strong>Service:</strong> ${data.service}</p>
              <p><strong>Payment ID:</strong> ${data.paymentIntentId}</p>
              ${data.listingTitle ? `<p><strong>Item:</strong> ${data.listingTitle}</p>` : ''}
            </div>

            <p>You can view your payment history in your dashboard.</p>
            <p><a href="https://geargrab.co/dashboard" style="color: #10b981;">View Dashboard</a></p>
          </div>
          <div class="footer">
            <p>© 2024 GearGrab. Secure payments for outdoor adventures! 🏔️</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Payment Confirmation - $${data.amount}

      Hi ${data.userName},

      Your payment has been successfully processed!

      Payment Details:
      - Amount: $${data.amount}
      - Service: ${data.service}
      - Payment ID: ${data.paymentIntentId}
      ${data.listingTitle ? `- Item: ${data.listingTitle}` : ''}

      View your dashboard: https://geargrab.co/dashboard

      GearGrab Team
    `
  }),

  paymentFailed: (data: PaymentEmailData): EmailTemplate => ({
    to: data.userEmail,
    subject: `Payment Failed - Action Required | GearGrab`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>We were unable to process your payment for ${data.service}.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Payment Details</h3>
              <p><strong>Amount:</strong> $${data.amount}</p>
              <p><strong>Service:</strong> ${data.service}</p>
              ${data.listingTitle ? `<p><strong>Item:</strong> ${data.listingTitle}</p>` : ''}
            </div>

            <p>Please try again with a different payment method or contact your bank if the issue persists.</p>
            <a href="https://geargrab.co/dashboard" class="button">Retry Payment</a>
          </div>
          <div class="footer">
            <p>© 2024 GearGrab. Need help? Contact support@geargrab.co</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Payment Failed - Action Required

      Hi ${data.userName},

      We were unable to process your payment for ${data.service}.

      Payment Details:
      - Amount: $${data.amount}
      - Service: ${data.service}
      ${data.listingTitle ? `- Item: ${data.listingTitle}` : ''}

      Please try again with a different payment method or contact your bank.

      Retry payment: https://geargrab.co/dashboard

      GearGrab Team
    `
  })
};

// Background check email templates
export const backgroundCheckEmailTemplates = {
  checkInitiated: (data: BackgroundCheckEmailData): EmailTemplate => ({
    to: data.userEmail,
    subject: `Background Check Initiated | GearGrab`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Background Check Initiated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔍 Background Check Started</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your background check has been successfully initiated and is now being processed.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Check Details</h3>
              <p><strong>Type:</strong> ${data.checkType.charAt(0).toUpperCase() + data.checkType.slice(1)}</p>
              <p><strong>Provider:</strong> ${data.provider.charAt(0).toUpperCase() + data.provider.slice(1)}</p>
              <p><strong>Request ID:</strong> ${data.requestId}</p>
              ${data.externalId ? `<p><strong>External ID:</strong> ${data.externalId}</p>` : ''}
            </div>

            <p>We'll notify you as soon as your background check is complete. This typically takes 1-3 business days.</p>
            <p><a href="https://geargrab.co/dashboard/verification" style="color: #3b82f6;">Check Status</a></p>
          </div>
          <div class="footer">
            <p>© 2024 GearGrab. Building trust in our community! 🏔️</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Background Check Initiated

      Hi ${data.userName},

      Your background check has been successfully initiated and is now being processed.

      Check Details:
      - Type: ${data.checkType.charAt(0).toUpperCase() + data.checkType.slice(1)}
      - Provider: ${data.provider.charAt(0).toUpperCase() + data.provider.slice(1)}
      - Request ID: ${data.requestId}
      ${data.externalId ? `- External ID: ${data.externalId}` : ''}

      We'll notify you as soon as your background check is complete.

      Check status: https://geargrab.co/dashboard/verification

      GearGrab Team
    `
  }),

  checkCompleted: (data: BackgroundCheckEmailData): EmailTemplate => ({
    to: data.userEmail,
    subject: `Background Check Complete | GearGrab`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Background Check Complete</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Background Check Complete</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Great news! Your background check has been completed and your verification status has been updated.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Check Results</h3>
              <p><strong>Status:</strong> ${data.status}</p>
              <p><strong>Type:</strong> ${data.checkType.charAt(0).toUpperCase() + data.checkType.slice(1)}</p>
              <p><strong>Request ID:</strong> ${data.requestId}</p>
            </div>

            <p>You can now access premium features and build more trust with other users.</p>
            <a href="https://geargrab.co/dashboard/verification" class="button">View Results</a>
          </div>
          <div class="footer">
            <p>© 2024 GearGrab. Verified and ready to adventure! 🏔️</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Background Check Complete

      Hi ${data.userName},

      Great news! Your background check has been completed and your verification status has been updated.

      Check Results:
      - Status: ${data.status}
      - Type: ${data.checkType.charAt(0).toUpperCase() + data.checkType.slice(1)}
      - Request ID: ${data.requestId}

      You can now access premium features and build more trust with other users.

      View results: https://geargrab.co/dashboard/verification

      GearGrab Team
    `
  })
};

// Send payment emails
export const sendPaymentEmails = {
  async sendPaymentConfirmation(data: PaymentEmailData): Promise<boolean> {
    const template = paymentEmailTemplates.paymentConfirmation(data);
    return await sendEmail(template);
  },

  async sendPaymentFailure(data: PaymentEmailData): Promise<boolean> {
    const template = paymentEmailTemplates.paymentFailed(data);
    return await sendEmail(template);
  }
};

// Send background check emails
export const sendBackgroundCheckEmails = {
  async sendCheckInitiated(data: BackgroundCheckEmailData): Promise<boolean> {
    const template = backgroundCheckEmailTemplates.checkInitiated(data);
    return await sendEmail(template);
  },

  async sendCheckCompleted(data: BackgroundCheckEmailData): Promise<boolean> {
    const template = backgroundCheckEmailTemplates.checkCompleted(data);
    return await sendEmail(template);
  }
};

// Verification email templates
export const verificationEmailTemplates = {
  identityVerified: (data: VerificationEmailData): EmailTemplate => ({
    to: data.userEmail,
    subject: `Identity Verified ✅ | GearGrab`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Identity Verified</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Identity Verified!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Congratulations! Your identity has been successfully verified.</p>

            <div style="text-align: center; margin: 30px 0;">
              <span class="badge">✅ VERIFIED USER</span>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Verification Benefits</h3>
              <ul>
                <li>✅ Verified badge on your profile</li>
                <li>🔒 Increased trust from other users</li>
                <li>⭐ Access to premium listings</li>
                <li>💰 Higher earning potential as an owner</li>
                <li>🚀 Priority customer support</li>
              </ul>
            </div>

            <p>Your verified status will be displayed on your profile and listings, helping you build trust with the GearGrab community.</p>
            <p><a href="https://geargrab.co/profile" style="color: #10b981;">View Your Profile</a></p>
          </div>
          <div class="footer">
            <p>© 2024 GearGrab. Verified and trusted! 🏔️</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Identity Verified!

      Hi ${data.userName},

      Congratulations! Your identity has been successfully verified.

      Verification Benefits:
      - Verified badge on your profile
      - Increased trust from other users
      - Access to premium listings
      - Higher earning potential as an owner
      - Priority customer support

      Your verified status will be displayed on your profile and listings.

      View your profile: https://geargrab.co/profile

      GearGrab Team
    `
  }),

  phoneVerified: (data: VerificationEmailData): EmailTemplate => ({
    to: data.userEmail,
    subject: `Phone Number Verified 📱 | GearGrab`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Phone Verified</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📱 Phone Verified!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your phone number has been successfully verified! This helps keep our community safe and enables important notifications.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>What's Next?</h3>
              <p>With your phone verified, you can now:</p>
              <ul>
                <li>📞 Receive booking notifications via SMS</li>
                <li>🔐 Use two-factor authentication</li>
                <li>⚡ Get instant alerts for urgent messages</li>
                <li>🛡️ Enhanced account security</li>
              </ul>
            </div>

            <p>You're one step closer to being fully verified on GearGrab!</p>
            <p><a href="https://geargrab.co/dashboard/verification" style="color: #3b82f6;">Continue Verification</a></p>
          </div>
          <div class="footer">
            <p>© 2024 GearGrab. Stay connected! 🏔️</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Phone Verified!

      Hi ${data.userName},

      Your phone number has been successfully verified!

      What's Next?
      With your phone verified, you can now:
      - Receive booking notifications via SMS
      - Use two-factor authentication
      - Get instant alerts for urgent messages
      - Enhanced account security

      You're one step closer to being fully verified on GearGrab!

      Continue verification: https://geargrab.co/dashboard/verification

      GearGrab Team
    `
  })
};

// Send verification emails
export const sendVerificationEmails = {
  async sendIdentityVerified(data: VerificationEmailData): Promise<boolean> {
    const template = verificationEmailTemplates.identityVerified(data);
    return await sendEmail(template);
  },

  async sendPhoneVerified(data: VerificationEmailData): Promise<boolean> {
    const template = verificationEmailTemplates.phoneVerified(data);
    return await sendEmail(template);
  }
};

// Email automation service
export class EmailAutomationService {
  // Trigger booking emails automatically
  static async triggerBookingEmails(bookingData: BookingEmailData): Promise<void> {
    try {
      await sendBookingEmails(bookingData);
      console.log(`Booking emails sent for booking ${bookingData.bookingId}`);
    } catch (error) {
      console.error('Failed to send booking emails:', error);
    }
  }

  // Trigger payment emails automatically
  static async triggerPaymentEmails(paymentData: PaymentEmailData, type: 'confirmation' | 'failure'): Promise<void> {
    try {
      if (type === 'confirmation') {
        await sendPaymentEmails.sendPaymentConfirmation(paymentData);
      } else {
        await sendPaymentEmails.sendPaymentFailure(paymentData);
      }
      console.log(`Payment ${type} email sent for user ${paymentData.userId}`);
    } catch (error) {
      console.error(`Failed to send payment ${type} email:`, error);
    }
  }

  // Trigger background check emails automatically
  static async triggerBackgroundCheckEmails(checkData: BackgroundCheckEmailData, type: 'initiated' | 'completed'): Promise<void> {
    try {
      if (type === 'initiated') {
        await sendBackgroundCheckEmails.sendCheckInitiated(checkData);
      } else {
        await sendBackgroundCheckEmails.sendCheckCompleted(checkData);
      }
      console.log(`Background check ${type} email sent for user ${checkData.userId}`);
    } catch (error) {
      console.error(`Failed to send background check ${type} email:`, error);
    }
  }

  // Trigger verification emails automatically
  static async triggerVerificationEmails(verificationData: VerificationEmailData): Promise<void> {
    try {
      if (verificationData.verificationType === 'identity') {
        await sendVerificationEmails.sendIdentityVerified(verificationData);
      } else if (verificationData.verificationType === 'phone') {
        await sendVerificationEmails.sendPhoneVerified(verificationData);
      }
      console.log(`Verification email sent for user ${verificationData.userId}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  }
}
