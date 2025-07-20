# Stripe Checkout Integration Setup Guide

This guide will help you set up the Stripe Checkout integration for GearGrab's rental and sales functionality.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Firebase Project**: Ensure your Firebase project is set up with Functions enabled
3. **Node.js**: Version 18 or higher for Firebase Functions

## 1. Stripe Configuration

### Get Your Stripe Keys

1. Log in to your Stripe Dashboard
2. Go to **Developers** > **API keys**
3. Copy your **Publishable key** and **Secret key**
4. For webhooks, you'll also need the **Webhook signing secret** (we'll set this up later)

### Environment Variables

#### For Firebase Functions (`functions/.env`)

Create a `.env` file in the `functions` directory:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# SendGrid Configuration (for email notifications)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=noreply@geargrab.com
REPLY_TO_EMAIL=support@geargrab.com

# Application Configuration
APP_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Firebase Project Configuration
FIREBASE_PROJECT_ID=your-project-id
```

#### For SvelteKit App (`.env`)

Add to your main `.env` file:

```bash
# Stripe Publishable Key (safe for client-side)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## 2. Firebase Functions Setup

### Install Dependencies

```bash
cd functions
npm install
```

### Deploy Functions

```bash
# Build the functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

### Set Environment Variables (Alternative Method)

If you prefer using Firebase CLI for environment variables:

```bash
firebase functions:config:set stripe.secret_key="sk_test_your_key_here"
firebase functions:config:set stripe.publishable_key="pk_test_your_key_here"
firebase functions:config:set stripe.webhook_secret="whsec_your_secret_here"
firebase functions:config:set app.url="https://your-domain.com"
```

## 3. Stripe Webhook Setup

### Create Webhook Endpoint

1. Go to **Stripe Dashboard** > **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-region-your-project.cloudfunctions.net/stripeWebhook`
4. Select the following events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** and add it to your environment variables

### Webhook URL Format

The webhook URL follows this pattern:
```
https://[REGION]-[PROJECT_ID].cloudfunctions.net/stripeWebhook
```

For example:
```
https://us-central1-geargrab-dev.cloudfunctions.net/stripeWebhook
```

## 4. Testing the Integration

### Test Mode

- Use Stripe's test mode during development
- Test card numbers: `4242 4242 4242 4242` (Visa)
- Any future expiry date and any 3-digit CVC

### Local Testing

1. Start the Firebase emulator:
```bash
cd functions
npm run serve
```

2. Start your SvelteKit app:
```bash
npm run dev
```

3. Test the booking flow with a rental item

### Webhook Testing

Use Stripe CLI to forward webhooks to your local development:

```bash
# Install Stripe CLI
# Forward webhooks to local emulator
stripe listen --forward-to localhost:5001/your-project/us-central1/stripeWebhook
```

## 5. Production Deployment

### Environment Variables

1. Set production Stripe keys in your Firebase Functions environment
2. Update the `APP_URL` to your production domain
3. Update webhook endpoint URL in Stripe Dashboard

### Security Checklist

- [ ] Use production Stripe keys
- [ ] Enable Stripe webhook signature verification
- [ ] Set proper CORS origins
- [ ] Review Firestore security rules
- [ ] Test payment flows thoroughly

## 6. Email Notifications Setup

### SendGrid Configuration

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate an API key in SendGrid Dashboard
3. Add the API key to your environment variables
4. Configure sender email addresses

### Email Templates

The integration includes branded HTML email templates for:
- **Rental confirmations** (sent to renters)
- **Rental notifications** (sent to owners)
- **Sale confirmations** (sent to buyers)
- **Sale notifications** (sent to sellers)

### Notification Preferences

Users can control their email preferences through:
- Email notifications on/off
- Rental confirmation emails
- Sale confirmation emails
- Marketing emails

## 7. Firestore Collections

The integration creates the following collections:

### `checkout_sessions`
- Tracks Stripe checkout sessions
- Links sessions to users and listings
- Stores session metadata

### `rentals` (Primary)
- Created when rental payments are successful
- Contains rental details and payment information
- Status: confirmed → active → completed/returned

### `sales` (Primary)
- Created when sale payments are successful
- Contains purchase details and shipping information
- Status: confirmed → shipped → delivered/completed

### `bookings` (Backward Compatibility)
- Legacy collection for rental bookings
- Links to new `rentals` collection

### `purchases` (Backward Compatibility)
- Legacy collection for purchases
- Links to new `sales` collection

### `users`
- User profile information
- Notification preferences
- Contact details for emails

### `user_activity`
- Activity logs for analytics
- Tracks rental/sale confirmations
- User engagement metrics

## 7. Usage in Code

### Create Rental Checkout

```typescript
import { rentalCheckoutAndRedirect } from '$lib/services/checkout';

const bookingData = {
  dates: ['2024-01-15', '2024-01-16'],
  startDate: '2024-01-15',
  endDate: '2024-01-16',
  deliveryOption: 'pickup',
  insuranceOption: false,
  totalCost: 108.75,
  breakdown: {
    basePrice: 50,
    days: 2,
    subtotal: 100,
    deliveryFee: 0,
    insuranceFee: 0,
    taxAmount: 8.75,
    total: 108.75
  }
};

await rentalCheckoutAndRedirect('listing-id', bookingData);
```

### Create Sale Checkout

```typescript
import { saleCheckoutAndRedirect } from '$lib/services/checkout';

await saleCheckoutAndRedirect('listing-id');
```

## 8. Error Handling

The integration includes comprehensive error handling:

- Authentication errors
- Invalid listing states
- Date conflicts for rentals
- Stripe API errors
- Network failures

## 9. Monitoring

Monitor your integration through:

- **Stripe Dashboard**: Payment events and webhooks
- **Firebase Console**: Function logs and errors
- **Application logs**: Client-side error tracking

## Support

For issues with this integration:

1. Check Firebase Functions logs
2. Verify Stripe webhook delivery
3. Test with Stripe's test mode
4. Review Firestore security rules

## Next Steps

- Implement email notifications for successful bookings
- Add refund functionality
- Set up automated testing
- Configure monitoring and alerts
