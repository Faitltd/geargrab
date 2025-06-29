import type { EmailTemplate, BookingEmailData } from './types';
import { createEmailHTML, createHeader, createBookingCard, createActionButtons } from './styles';

export const bookingTemplates = {
  // Email to renter when booking is created
  renterBookingConfirmation: (data: BookingEmailData): EmailTemplate => {
    const header = createHeader('🎉 Booking Request Submitted!', 'Your adventure is one step closer');
    const bookingCard = createBookingCard({
      listingTitle: data.listingTitle,
      listingImage: data.listingImage,
      confirmationNumber: data.confirmationNumber,
      ownerName: data.ownerName,
      startDate: data.startDate,
      endDate: data.endDate,
      deliveryMethod: data.deliveryMethod,
      pickupLocation: data.pickupLocation,
      totalPrice: data.totalPrice
    });

    const content = `
      ${header}
      <div class="content">
        <p>Hi ${data.renterName},</p>
        <p>Thank you for your booking request! We've sent your request to the gear owner for approval.</p>
        
        ${bookingCard}
        
        <div class="next-steps">
          <h3>What happens next?</h3>
          <ol>
            <li><strong>Owner Review:</strong> ${data.ownerName} will review your request within 24 hours</li>
            <li><strong>Approval:</strong> Once approved, you'll receive payment instructions</li>
            <li><strong>Payment:</strong> Complete payment to secure your booking</li>
            <li><strong>Adventure:</strong> Pick up your gear and enjoy your adventure!</li>
          </ol>
        </div>
        
        <p>We'll keep you updated via email. You can also check your booking status in your dashboard.</p>
        <p><a href="https://geargrab.co/dashboard" class="button">View Dashboard</a></p>
        
        <p>Questions? Feel free to message ${data.ownerName} directly through our platform.</p>
      </div>
    `;

    return {
      to: data.renterEmail,
      subject: `Booking Confirmation - ${data.listingTitle}`,
      html: createEmailHTML(content),
      text: `
        Booking Request Submitted - ${data.listingTitle}
        
        Hi ${data.renterName},
        
        Thank you for your booking request! We've sent your request to the gear owner for approval.
        
        Booking Details:
        - Item: ${data.listingTitle}
        - Hosted by: ${data.ownerName}
        - Confirmation: ${data.confirmationNumber}
        - Check-in: ${data.startDate}
        - Check-out: ${data.endDate}
        - Total: $${data.totalPrice}
        
        What happens next?
        1. Owner Review: ${data.ownerName} will review your request within 24 hours
        2. Approval: Once approved, you'll receive payment instructions
        3. Payment: Complete payment to secure your booking
        4. Adventure: Pick up your gear and enjoy your adventure!
        
        View your dashboard: https://geargrab.co/dashboard
        
        Happy adventuring!
        GearGrab Team
      `
    };
  },

  // Email to owner when new booking request is received
  ownerBookingNotification: (data: BookingEmailData): EmailTemplate => {
    const header = createHeader('📬 New Booking Request!', 'Someone wants to rent your gear');
    const bookingCard = createBookingCard({
      listingTitle: data.listingTitle,
      listingImage: data.listingImage,
      confirmationNumber: data.confirmationNumber,
      renterName: data.renterName,
      startDate: data.startDate,
      endDate: data.endDate,
      deliveryMethod: data.deliveryMethod,
      pickupLocation: data.pickupLocation,
      totalPrice: data.totalPrice,
      showEarnings: true
    });

    const actionButtons = createActionButtons([
      { url: `https://geargrab.co/dashboard/owner/booking/${data.bookingId}?action=approve`, text: '✅ Approve', type: 'approve' },
      { url: `https://geargrab.co/dashboard/owner/booking/${data.bookingId}?action=decline`, text: '❌ Decline', type: 'decline' },
      { url: `https://geargrab.co/dashboard/owner`, text: '👀 View Details', type: 'view' }
    ]);

    const content = `
      ${header}
      <div class="content">
        <p>Hi ${data.ownerName},</p>
        <p>Great news! You have a new booking request for your ${data.listingTitle}.</p>
        
        ${bookingCard}
        
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Renter</div>
            <div class="detail-value">${data.renterName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Email</div>
            <div class="detail-value">${data.renterEmail}</div>
          </div>
        </div>
        
        ${actionButtons}
        
        <p><strong>Please respond within 24 hours</strong> to maintain your response rate and provide the best experience for renters.</p>
        
        <div class="success-box">
          <p><strong>💡 Pro Tip:</strong> Quick responses lead to more bookings and better reviews!</p>
        </div>
      </div>
    `;

    return {
      to: data.ownerEmail,
      subject: `New Booking Request - ${data.listingTitle}`,
      html: createEmailHTML(content),
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
        
        Approve: https://geargrab.co/dashboard/owner/booking/${data.bookingId}?action=approve
        Decline: https://geargrab.co/dashboard/owner/booking/${data.bookingId}?action=decline
        Manage bookings: https://geargrab.co/dashboard/owner
        
        Happy sharing!
        GearGrab Team
      `
    };
  },

  // Email when booking is approved
  bookingApproved: (data: BookingEmailData): EmailTemplate => {
    const header = createHeader('🎉 Booking Approved!', 'Time to complete your payment', 'success');
    const bookingCard = createBookingCard({
      listingTitle: data.listingTitle,
      listingImage: data.listingImage,
      confirmationNumber: data.confirmationNumber,
      ownerName: data.ownerName,
      startDate: data.startDate,
      endDate: data.endDate,
      deliveryMethod: data.deliveryMethod,
      pickupLocation: data.pickupLocation,
      totalPrice: data.totalPrice
    });

    const content = `
      ${header}
      <div class="content">
        <p>Hi ${data.renterName},</p>
        <p>Excellent news! ${data.ownerName} has approved your booking request.</p>
        
        ${bookingCard}
        
        <div class="next-steps">
          <h3>Complete Your Booking</h3>
          <p>To secure your reservation, please complete payment within 24 hours.</p>
          <p><a href="https://geargrab.co/book/payment/${data.bookingId}" class="button">Complete Payment</a></p>
        </div>
        
        <div class="warning-box">
          <p><strong>⏰ Payment Required:</strong> Your booking will be automatically cancelled if payment is not completed within 24 hours.</p>
        </div>
      </div>
    `;

    return {
      to: data.renterEmail,
      subject: `Booking Approved - Complete Payment for ${data.listingTitle}`,
      html: createEmailHTML(content),
      text: `
        Booking Approved - ${data.listingTitle}
        
        Hi ${data.renterName},
        
        Excellent news! ${data.ownerName} has approved your booking request.
        
        Booking Details:
        - Item: ${data.listingTitle}
        - Confirmation: ${data.confirmationNumber}
        - Check-in: ${data.startDate}
        - Check-out: ${data.endDate}
        - Total: $${data.totalPrice}
        
        Complete payment within 24 hours to secure your booking:
        https://geargrab.co/book/payment/${data.bookingId}
        
        Your booking will be automatically cancelled if payment is not completed within 24 hours.
        
        GearGrab Team
      `
    };
  },

  // Email when booking is declined
  bookingDeclined: (data: BookingEmailData): EmailTemplate => {
    const header = createHeader('📝 Booking Update', 'Your booking request status', 'warning');

    const content = `
      ${header}
      <div class="content">
        <p>Hi ${data.renterName},</p>
        <p>Unfortunately, ${data.ownerName} is unable to accommodate your booking request for ${data.listingTitle} on the requested dates.</p>
        
        <div class="booking-card">
          <h3>${data.listingTitle}</h3>
          <p><strong>Requested dates:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Confirmation:</strong> ${data.confirmationNumber}</p>
        </div>
        
        <div class="next-steps">
          <h3>Don't worry - we've got you covered!</h3>
          <p>Here are some options to help you find the perfect gear:</p>
          <ul>
            <li>Try different dates for the same item</li>
            <li>Browse similar gear from other owners</li>
            <li>Set up alerts for when this item becomes available</li>
          </ul>
          <p><a href="https://geargrab.co/browse" class="button">Browse Similar Gear</a></p>
        </div>
      </div>
    `;

    return {
      to: data.renterEmail,
      subject: `Booking Update - ${data.listingTitle}`,
      html: createEmailHTML(content),
      text: `
        Booking Update - ${data.listingTitle}
        
        Hi ${data.renterName},
        
        Unfortunately, ${data.ownerName} is unable to accommodate your booking request for ${data.listingTitle} on the requested dates (${data.startDate} to ${data.endDate}).
        
        Don't worry - we've got you covered! Here are some options:
        - Try different dates for the same item
        - Browse similar gear from other owners
        - Set up alerts for when this item becomes available
        
        Browse similar gear: https://geargrab.co/browse
        
        Happy adventuring!
        GearGrab Team
      `
    };
  }
};
