import nodemailer from 'nodemailer';
import { adminFirestore } from '$lib/firebase/server';
import { professionalEmailTemplates } from './professionalEmails';

type EmailRecipient = string | string[];

interface EmailOptions {
  to: EmailRecipient;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: EmailRecipient;
  bcc?: EmailRecipient;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_SMTP_HOST;
  const port = process.env.EMAIL_SMTP_PORT ? parseInt(process.env.EMAIL_SMTP_PORT, 10) : 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    console.warn('Email transporter not configured (missing SMTP credentials).');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const from = options.from || process.env.COMPANY_FROM_EMAIL || 'no-reply@geargrab.co';
  const transport = getTransporter();

  if (!transport) {
    console.info('📧 Email (simulated):', { from, ...options });
    return { success: true, messageId: 'simulated-message' };
  }

  try {
    const info = await transport.sendMail({
      from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      html: options.html,
      text: options.text
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface BookingEmailPayload {
  bookingId: string;
  confirmationNumber?: string;
  listingTitle?: string;
  listingImage?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  renterName?: string;
  renterEmail?: string;
  ownerName?: string;
  ownerEmail?: string;
  deliveryMethod?: string;
}

async function sendBookingEmailToRecipient(recipient: string | undefined, subject: string, html: string, text?: string) {
  if (!recipient) return { success: false, error: 'Missing recipient' };
  return sendEmail({ to: recipient, subject, html, text });
}

async function sendBookingEmail(
  payloadOrId: BookingEmailPayload | string,
  template: 'new_booking' | 'booking_confirmed' | 'booking_cancelled' | 'generic' = 'generic'
): Promise<EmailResult> {
  const payload: BookingEmailPayload =
    typeof payloadOrId === 'string'
      ? { bookingId: payloadOrId, listingTitle: 'GearGrab Booking' }
      : payloadOrId;

  const confirmationNumber =
    payload.confirmationNumber || payload.bookingId?.slice(0, 8).toUpperCase();

  let subject = `Booking Update - ${payload.listingTitle || 'GearGrab'}`;
  if (template === 'new_booking') {
    subject = `New Booking Request - ${payload.listingTitle || 'GearGrab'}`;
  } else if (template === 'booking_confirmed') {
    subject = `Booking Confirmed - ${payload.listingTitle || 'GearGrab'}`;
  } else if (template === 'booking_cancelled') {
    subject = `Booking Cancelled - ${payload.listingTitle || 'GearGrab'}`;
  }

  const htmlTemplate =
    professionalEmailTemplates?.renterBookingConfirmation &&
    professionalEmailTemplates.renterBookingConfirmation({
      bookingId: payload.bookingId,
      confirmationNumber: confirmationNumber || payload.bookingId,
      listingTitle: payload.listingTitle || 'GearGrab Booking',
      listingImage: payload.listingImage || '',
      startDate: payload.startDate || '',
      endDate: payload.endDate || '',
      totalPrice: payload.totalPrice || 0,
      renterName: payload.renterName || 'GearGrab Guest',
      renterEmail: payload.renterEmail || '',
      ownerName: payload.ownerName || 'Gear Owner',
      ownerEmail: payload.ownerEmail || '',
      deliveryMethod: payload.deliveryMethod || 'pickup'
    });

  const html =
    htmlTemplate?.html ||
    `<p>Booking ID: <strong>${payload.bookingId}</strong></p>
     <p>Listing: ${payload.listingTitle || 'GearGrab Listing'}</p>
     <p>Dates: ${payload.startDate || 'TBD'} - ${payload.endDate || 'TBD'}</p>
     <p>Total: $${((payload.totalPrice || 0) / 100).toFixed(2)}</p>`;

  const text =
    htmlTemplate?.text ||
    `Booking ${payload.bookingId} for ${payload.listingTitle || 'GearGrab Listing'}`;

  // Send to renter and owner if emails provided
  if (payload.renterEmail) {
    await sendBookingEmailToRecipient(payload.renterEmail, subject, html, text);
  }

  if (payload.ownerEmail) {
    await sendBookingEmailToRecipient(payload.ownerEmail, `${subject} (Owner Copy)`, html, text);
  }

  return { success: true, messageId: payload.bookingId };
}

export const sendBookingEmails = Object.assign(sendBookingEmail, {
  sendBookingConfirmation: (payload: BookingEmailPayload) =>
    sendBookingEmail(payload, 'booking_confirmed'),
  sendOwnerNotification: (payload: BookingEmailPayload) =>
    sendBookingEmail(payload, 'new_booking'),
  sendCancellation: (payload: BookingEmailPayload) =>
    sendBookingEmail(payload, 'booking_cancelled')
});

interface PaymentEmailPayload {
  to: string;
  amount: number;
  currency?: string;
  status: string;
  paymentIntentId?: string;
  description?: string;
}

export async function sendPaymentEmails(payload: PaymentEmailPayload): Promise<EmailResult> {
  const subject = `Payment ${payload.status}`;
  const amount = (payload.amount / 100).toFixed(2);
  const currency = (payload.currency || 'USD').toUpperCase();

  const html = `
    <p>Your payment has been processed.</p>
    <ul>
      <li>Status: <strong>${payload.status}</strong></li>
      <li>Amount: <strong>${currency} ${amount}</strong></li>
      ${payload.paymentIntentId ? `<li>Payment ID: ${payload.paymentIntentId}</li>` : ''}
      ${payload.description ? `<li>Description: ${payload.description}</li>` : ''}
    </ul>
  `;

  return sendEmail({
    to: payload.to,
    subject,
    html,
    text: `Payment ${payload.status}: ${currency} ${amount}`
  });
}

interface BackgroundCheckEmailPayload {
  userId: string;
  requestId: string;
  checkType: string;
  provider: string;
  status: string;
  results?: Record<string, unknown>;
}

export async function sendBackgroundCheckEmails(payload: BackgroundCheckEmailPayload): Promise<EmailResult> {
  if (!adminFirestore) {
    console.warn('Cannot send background check email without Firebase Admin.');
    return { success: false, error: 'Firebase Admin not configured' };
  }

  const userDoc = await adminFirestore.collection('users').doc(payload.userId).get();
  const userData = userDoc.data();
  const email = userData?.email;

  if (!email) {
    console.warn('User email not found for background check notification:', payload.userId);
    return { success: false, error: 'User email missing' };
  }

  const subject = `Background Check ${payload.status === 'approved' ? 'Approved' : 'Update'}`;
  const html = `
    <p>Your background check request has an update.</p>
    <ul>
      <li>Status: <strong>${payload.status}</strong></li>
      <li>Provider: ${payload.provider}</li>
      <li>Check Type: ${payload.checkType}</li>
      <li>Request ID: ${payload.requestId}</li>
    </ul>
  `;

  return sendEmail({ to: email, subject, html });
}

type EmailTemplateName = 'phoneVerified';

export async function sendEmailTemplate(
  template: EmailTemplateName,
  data: Record<string, string>
): Promise<EmailResult> {
  if (template === 'phoneVerified') {
    const html = `
      <p>Hi ${data.userName || 'there'},</p>
      <p>Your phone number <strong>${data.phoneNumber}</strong> has been verified successfully.</p>
      <p>You can now access features that require a verified phone number.</p>
      <p>Thank you for keeping your account secure.<br/>— The GearGrab Team</p>
    `;

    return sendEmail({
      to: data.userEmail,
      subject: 'Phone Number Verified',
      html,
      text: `Your phone number ${data.phoneNumber} has been verified.`
    });
  }

  throw new Error(`Unknown email template: ${template}`);
}
