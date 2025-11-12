import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || !secretKey.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY is not configured correctly.');
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2023-10-16'
  });

  return stripeClient;
}
