import twilio, { type Twilio } from 'twilio';

let twilioClient: Twilio | null = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn('Twilio credentials are not configured.');
    return null;
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validatePhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/[^\d+]/g, '');
  const isValid = /^\+?[1-9]\d{9,14}$/.test(digits);

  if (!isValid) {
    return {
      isValid: false,
      error: 'Phone number must be in international format (+12345678900)'
    };
  }

  return {
    isValid: true,
    formatted: digits.startsWith('+') ? digits : `+${digits}`
  };
}

export async function sendVerificationSMS(phoneNumber: string, code: string) {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !fromNumber) {
    const error = 'Twilio is not configured';
    console.warn(error);
    return { success: false, error };
  }

  try {
    const message = await client.messages.create({
      to: phoneNumber,
      from: fromNumber,
      body: `GearGrab verification code: ${code}`
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Failed to send Twilio SMS:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
