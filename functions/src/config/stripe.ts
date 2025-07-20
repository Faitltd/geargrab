import Stripe from "stripe";
import * as functions from "firebase-functions";

// Initialize Stripe with secret key
const stripeSecretKey = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Stripe secret key is not configured. Please set STRIPE_SECRET_KEY environment variable.");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
  typescript: true,
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: "usd",
  paymentMethodTypes: ["card"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
  mode: {
    payment: "payment" as const,
    subscription: "subscription" as const,
  },
  billingAddressCollection: "required" as const,
  shippingAddressCollection: {
    allowedCountries: ["US", "CA"] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
  },
};

// Get frontend URL from environment
export const getFrontendUrl = (): string => {
  return functions.config().app?.url || process.env.FRONTEND_URL || "http://localhost:5173";
};

// Stripe webhook secret
export const getWebhookSecret = (): string => {
  const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured. Please set STRIPE_WEBHOOK_SECRET environment variable.");
  }
  return webhookSecret;
};
