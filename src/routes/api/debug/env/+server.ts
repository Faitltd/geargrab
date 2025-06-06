import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    allTwilioVars: {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '***' : undefined,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER
    }
  });
};
