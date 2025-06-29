import type { EmailTemplate, PaymentEmailData } from './types';
import { createEmailHTML, createHeader } from './styles';

export const paymentTemplates = {
  paymentConfirmation: (data: PaymentEmailData): EmailTemplate => {
    const header = createHeader('✅ Payment Confirmed', undefined, 'success');

    const content = `
      ${header}
      <div class="content">
        <p>Hi ${data.userName},</p>
        <p>Your payment has been successfully processed!</p>

        <div class="booking-card">
          <h3>Payment Details</h3>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Amount</div>
              <div class="detail-value"><span class="amount">$${data.amount}</span></div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Service</div>
              <div class="detail-value">${data.service}</div>
            </div>
            ${data.paymentIntentId ? `
            <div class="detail-item">
              <div class="detail-label">Payment ID</div>
              <div class="detail-value">${data.paymentIntentId}</div>
            </div>
            ` : ''}
            ${data.listingTitle ? `
            <div class="detail-item">
              <div class="detail-label">Item</div>
              <div class="detail-value">${data.listingTitle}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="success-box">
          <p><strong>🎉 You're all set!</strong> Your booking is now confirmed and you'll receive pickup/delivery details soon.</p>
        </div>

        <p>You can view your payment history and booking details in your dashboard.</p>
        <p><a href="https://geargrab.co/dashboard" class="button">View Dashboard</a></p>
      </div>
    `;

    return {
      to: data.userEmail,
      subject: `Payment Confirmation - $${data.amount} | GearGrab`,
      html: createEmailHTML(content),
      text: `
        Payment Confirmation - $${data.amount}

        Hi ${data.userName},

        Your payment has been successfully processed!

        Payment Details:
        - Amount: $${data.amount}
        - Service: ${data.service}
        ${data.paymentIntentId ? `- Payment ID: ${data.paymentIntentId}` : ''}
        ${data.listingTitle ? `- Item: ${data.listingTitle}` : ''}

        Your booking is now confirmed! You can view your payment history and booking details in your dashboard.

        View your dashboard: https://geargrab.co/dashboard

        GearGrab Team
      `
    };
  },

  paymentFailed: (data: PaymentEmailData): EmailTemplate => {
    const header = createHeader('❌ Payment Failed', 'Action Required', 'error');

    const content = `
      ${header}
      <div class="content">
        <p>Hi ${data.userName},</p>
        <p>We were unable to process your payment for ${data.service}.</p>

        <div class="booking-card">
          <h3>Payment Details</h3>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Amount</div>
              <div class="detail-value">$${data.amount}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Service</div>
              <div class="detail-value">${data.service}</div>
            </div>
            ${data.listingTitle ? `
            <div class="detail-item">
              <div class="detail-label">Item</div>
              <div class="detail-value">${data.listingTitle}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="error-box">
          <h3>Common reasons for payment failure:</h3>
          <ul>
            <li>Insufficient funds</li>
            <li>Expired or invalid card</li>
            <li>Bank security restrictions</li>
            <li>Incorrect billing information</li>
          </ul>
        </div>

        <p>Please try again with a different payment method or contact your bank if the issue persists.</p>
        <p><a href="https://geargrab.co/dashboard" class="button">Retry Payment</a></p>

        <p>Need help? Our support team is here to assist you at support@geargrab.co</p>
      </div>
    `;

    return {
      to: data.userEmail,
      subject: `Payment Failed - Action Required | GearGrab`,
      html: createEmailHTML(content),
      text: `
        Payment Failed - Action Required

        Hi ${data.userName},

        We were unable to process your payment for ${data.service}.

        Payment Details:
        - Amount: $${data.amount}
        - Service: ${data.service}
        ${data.listingTitle ? `- Item: ${data.listingTitle}` : ''}

        Common reasons for payment failure:
        - Insufficient funds
        - Expired or invalid card
        - Bank security restrictions
        - Incorrect billing information

        Please try again with a different payment method or contact your bank if the issue persists.

        Retry payment: https://geargrab.co/dashboard

        Need help? Contact support@geargrab.co

        GearGrab Team
      `
    };
  },

  refundProcessed: (data: PaymentEmailData): EmailTemplate => {
    const header = createHeader('💰 Refund Processed', 'Your refund is on the way', 'success');

    const content = `
      ${header}
      <div class="content">
        <p>Hi ${data.userName},</p>
        <p>Your refund has been successfully processed and will appear in your account within 3-5 business days.</p>

        <div class="booking-card">
          <h3>Refund Details</h3>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Refund Amount</div>
              <div class="detail-value"><span class="amount">$${data.amount}</span></div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Original Service</div>
              <div class="detail-value">${data.service}</div>
            </div>
            ${data.paymentIntentId ? `
            <div class="detail-item">
              <div class="detail-label">Reference ID</div>
              <div class="detail-value">${data.paymentIntentId}</div>
            </div>
            ` : ''}
            ${data.listingTitle ? `
            <div class="detail-item">
              <div class="detail-label">Item</div>
              <div class="detail-value">${data.listingTitle}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="success-box">
          <p><strong>⏰ Processing Time:</strong> Refunds typically appear in your account within 3-5 business days, depending on your bank or card issuer.</p>
        </div>

        <p>If you don't see the refund after 5 business days, please contact your bank or reach out to our support team.</p>
        <p><a href="https://geargrab.co/dashboard" class="button">View Dashboard</a></p>
      </div>
    `;

    return {
      to: data.userEmail,
      subject: `Refund Processed - $${data.amount} | GearGrab`,
      html: createEmailHTML(content),
      text: `
        Refund Processed - $${data.amount}

        Hi ${data.userName},

        Your refund has been successfully processed and will appear in your account within 3-5 business days.

        Refund Details:
        - Refund Amount: $${data.amount}
        - Original Service: ${data.service}
        ${data.paymentIntentId ? `- Reference ID: ${data.paymentIntentId}` : ''}
        ${data.listingTitle ? `- Item: ${data.listingTitle}` : ''}

        Processing Time: Refunds typically appear in your account within 3-5 business days, depending on your bank or card issuer.

        If you don't see the refund after 5 business days, please contact your bank or reach out to our support team at support@geargrab.co.

        View your dashboard: https://geargrab.co/dashboard

        GearGrab Team
      `
    };
  }
};
