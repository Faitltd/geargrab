/**
 * Twilio SMS Service for Phone Verification
 * Handles sending SMS verification codes and managing phone verification flow
 */

import twilio from 'twilio';
import { dev } from '$app/environment';

// Twilio client instance
let twilioClient: twilio.Twilio | null = null;

// Initialize Twilio client
function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  
  return twilioClient;
}

// Phone number validation
export function validatePhoneNumber(phoneNumber: string): { isValid: boolean; formatted: string; error?: string } {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits) or international (with country code)
  if (cleaned.length === 10) {
    // US number without country code
    return {
      isValid: true,
      formatted: `+1${cleaned}`
    };
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US number with country code
    return {
      isValid: true,
      formatted: `+${cleaned}`
    };
  } else if (cleaned.length >= 10 && cleaned.length <= 15) {
    // International number
    return {
      isValid: true,
      formatted: `+${cleaned}`
    };
  } else {
    return {
      isValid: false,
      formatted: phoneNumber,
      error: 'Invalid phone number format'
    };
  }
}

// Generate random 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS verification code
export async function sendVerificationSMS(phoneNumber: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate phone number first
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Invalid phone number'
      };
    }

    // In development, just log the code
    if (dev) {
      console.log(`📱 SMS Verification Code for ${validation.formatted}: ${code}`);
      return {
        success: true,
        messageId: `dev_message_${Date.now()}`
      };
    }

    // Send actual SMS in production
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!fromNumber) {
      throw new Error('Twilio phone number not configured');
    }

    const message = await client.messages.create({
      body: `Your GearGrab verification code is: ${code}. This code expires in 10 minutes.`,
      from: fromNumber,
      to: validation.formatted
    });

    return {
      success: true,
      messageId: message.sid
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}

// Send SMS notification (for other purposes)
export async function sendSMSNotification(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Invalid phone number'
      };
    }

    if (dev) {
      console.log(`📱 SMS Notification to ${validation.formatted}: ${message}`);
      return {
        success: true,
        messageId: `dev_notification_${Date.now()}`
      };
    }

    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!fromNumber) {
      throw new Error('Twilio phone number not configured');
    }

    const sms = await client.messages.create({
      body: message,
      from: fromNumber,
      to: validation.formatted
    });

    return {
      success: true,
      messageId: sms.sid
    };
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}

// Check Twilio service health
export async function checkTwilioHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    if (dev) {
      return { healthy: true };
    }

    const client = getTwilioClient();
    
    // Try to fetch account info to verify connection
    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Twilio health check failed'
    };
  }
}

// SMS templates for different notifications
export const SMS_TEMPLATES = {
  verification: (code: string) => 
    `Your GearGrab verification code is: ${code}. This code expires in 10 minutes.`,
  
  bookingConfirmation: (listingTitle: string, dates: string) =>
    `Your GearGrab booking for "${listingTitle}" (${dates}) has been confirmed! Check the app for details.`,
  
  bookingReminder: (listingTitle: string, hours: number) =>
    `Reminder: Your GearGrab booking for "${listingTitle}" starts in ${hours} hours. Safe travels!`,
  
  paymentReceived: (amount: string) =>
    `Payment of ${amount} received for your GearGrab booking. Thank you!`,
  
  securityAlert: (action: string) =>
    `Security alert: ${action} on your GearGrab account. If this wasn't you, please contact support immediately.`
};
