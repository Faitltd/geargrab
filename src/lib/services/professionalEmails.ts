// Professional email templates for GearGrab
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

// Professional email templates
export const professionalEmailTemplates = {
  // Enhanced renter booking confirmation
  renterBookingConfirmation: (data: BookingEmailData): EmailTemplate => ({
    to: data.renterEmail,
    subject: `🎉 Booking Request Submitted - ${data.listingTitle} | GearGrab`,
    html: `
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
          .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #1f2937; }
          .intro { font-size: 16px; margin-bottom: 30px; color: #4b5563; }
          .booking-card { 
            background: #f8fafc; 
            border: 2px solid #e5e7eb; 
            border-radius: 12px; 
            padding: 24px; 
            margin: 24px 0; 
          }
          .booking-card h3 { 
            font-size: 18px; 
            font-weight: 600; 
            margin-bottom: 16px; 
            color: #1f2937;
            display: flex;
            align-items: center;
          }
          .gear-info { 
            display: flex; 
            align-items: center; 
            margin-bottom: 20px; 
            padding: 16px; 
            background: white; 
            border-radius: 8px; 
          }
          .gear-image { 
            width: 80px; 
            height: 80px; 
            border-radius: 8px; 
            object-fit: cover; 
            margin-right: 16px; 
          }
          .gear-details h4 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
          .gear-details p { font-size: 14px; color: #6b7280; }
          .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .detail-item { }
          .detail-label { font-size: 14px; color: #6b7280; margin-bottom: 4px; }
          .detail-value { font-size: 16px; font-weight: 600; color: #1f2937; }
          .total-amount { 
            background: #10b981; 
            color: white; 
            padding: 16px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 20px 0; 
          }
          .total-amount .label { font-size: 14px; opacity: 0.9; }
          .total-amount .amount { font-size: 24px; font-weight: 700; }
          .steps { margin: 30px 0; }
          .steps h3 { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
          .step { 
            display: flex; 
            align-items: flex-start; 
            margin-bottom: 16px; 
            padding: 16px; 
            background: #f8fafc; 
            border-radius: 8px; 
          }
          .step-number { 
            background: #10b981; 
            color: white; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 12px; 
            font-weight: 600; 
            margin-right: 12px; 
            flex-shrink: 0; 
          }
          .step-content h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
          .step-content p { font-size: 14px; color: #6b7280; }
          .cta-button { 
            display: inline-block; 
            background: #10b981; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 20px 0; 
            text-align: center;
          }
          .cta-button:hover { background: #059669; }
          .contact-info { 
            background: #eff6ff; 
            border: 1px solid #dbeafe; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 24px 0; 
          }
          .contact-info h4 { color: #1e40af; margin-bottom: 8px; }
          .contact-info p { color: #1e40af; font-size: 14px; }
          .footer { 
            background: #f9fafb; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
          }
          .footer p { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
          .footer a { color: #10b981; text-decoration: none; }
          @media (max-width: 600px) {
            .content { padding: 20px; }
            .detail-grid { grid-template-columns: 1fr; }
            .gear-info { flex-direction: column; text-align: center; }
            .gear-image { margin-right: 0; margin-bottom: 12px; }
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
            <div class="greeting">Hi ${data.renterName}!</div>
            <div class="intro">
              Great news! Your booking request has been successfully submitted and is now pending approval from the gear owner. 
              We'll notify you as soon as they respond.
            </div>
            
            <div class="booking-card">
              <h3>📋 Booking Summary</h3>
              
              <div class="gear-info">
                <img src="${data.listingImage}" alt="${data.listingTitle}" class="gear-image" />
                <div class="gear-details">
                  <h4>${data.listingTitle}</h4>
                  <p>Hosted by ${data.ownerName}</p>
                </div>
              </div>
              
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-label">Confirmation Number</div>
                  <div class="detail-value">${data.confirmationNumber}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Booking ID</div>
                  <div class="detail-value">${data.bookingId}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Check-in Date</div>
                  <div class="detail-value">${data.startDate}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Check-out Date</div>
                  <div class="detail-value">${data.endDate}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Pickup Method</div>
                  <div class="detail-value">${data.deliveryMethod === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}</div>
                </div>
                ${data.pickupLocation ? `
                <div class="detail-item">
                  <div class="detail-label">Pickup Location</div>
                  <div class="detail-value">${data.pickupLocation}</div>
                </div>
                ` : ''}
              </div>
              
              <div class="total-amount">
                <div class="label">Total Amount</div>
                <div class="amount">$${data.totalPrice}</div>
              </div>
            </div>
            
            <div class="steps">
              <h3>🔄 What Happens Next?</h3>
              
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Owner Review (Within 24 hours)</h4>
                  <p>${data.ownerName} will review your booking request and rental dates for availability.</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Booking Confirmation</h4>
                  <p>You'll receive an email notification once your booking is approved with pickup instructions.</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Secure Payment Processing</h4>
                  <p>Payment will be securely processed only after the owner approves your booking.</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h4>Adventure Time!</h4>
                  <p>Pick up your gear and start your outdoor adventure. Have an amazing time!</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="https://geargrab.co/dashboard/renter" class="cta-button">
                View My Bookings
              </a>
            </div>
            
            <div class="contact-info">
              <h4>💬 Need to Contact the Owner?</h4>
              <p>You can message ${data.ownerName} directly through your GearGrab dashboard or our messaging system.</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                <strong>Important:</strong> You will only be charged after the owner approves your booking. 
                Cancellation is free until the booking is confirmed.
              </p>
            </div>
            
            <div style="margin-top: 20px;">
              <p style="color: #1f2937;">
                Happy adventuring!<br>
                <strong>The GearGrab Team</strong>
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>GearGrab</strong> - Your trusted outdoor gear rental marketplace</p>
            <p>© 2024 GearGrab. All rights reserved.</p>
            <p>
              <a href="https://geargrab.co/help">Help Center</a> | 
              <a href="https://geargrab.co/contact">Contact Support</a> | 
              <a href="https://geargrab.co/terms">Terms of Service</a>
            </p>
            <p style="margin-top: 16px; font-size: 12px;">
              This email was sent regarding booking ${data.confirmationNumber}. 
              If you have questions, please contact us at support@geargrab.co
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
🎉 Booking Request Submitted - ${data.listingTitle}

Hi ${data.renterName}!

Great news! Your booking request has been successfully submitted and is now pending approval from the gear owner.

BOOKING SUMMARY
========Confirmation #: ${data.confirmationNumber}
Booking ID: ${data.bookingId}
Item: ${data.listingTitle}
Hosted by: ${data.ownerName}
Check-in: ${data.startDate}
Check-out: ${data.endDate}
Pickup Method: ${data.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
${data.pickupLocation ? `Pickup Location: ${data.pickupLocation}` : ''}
Total Amount: $${data.totalPrice}

WHAT HAPPENS NEXT?
===========1. Owner Review (Within 24 hours)
   ${data.ownerName} will review your booking request and rental dates.

2. Booking Confirmation
   You'll receive an email once your booking is approved.

3. Secure Payment Processing
   Payment will be processed only after approval.

4. Adventure Time!
   Pick up your gear and start your outdoor adventure!

View your bookings: https://geargrab.co/dashboard/renter

Questions? Contact ${data.ownerName} through our messaging system or reach out to our support team at support@geargrab.co

Happy adventuring!
The GearGrab Team

---
GearGrab - Your trusted outdoor gear rental marketplace
© 2024 GearGrab. All rights reserved.
    `
  })
};

// Send professional email function
export async function sendProfessionalEmail(template: EmailTemplate): Promise<boolean> {
  try {
    // In development, just log the email
    if (!process.env.RESEND_API_KEY || process.env.NODE_ENV === 'development') {
      console.log('📧 Professional Email would be sent:', {
        to: template.to,
        subject: template.subject,
        preview: template.text?.substring(0, 100) + '...'
      });
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
    console.log('Professional email sent successfully:', result.id);
    return true;

  } catch (error) {
    console.error('Failed to send professional email:', error);
    return false;
  }
}
