# GearGrab Payment System

## Overview

The GearGrab payment system is designed for secure, authenticated gear rental transactions. All users must be signed in to complete payments, ensuring accountability and proper rental management.

## Key Features

### 🔐 Authentication Required
- **All payments require user authentication**
- Users must sign up/log in before renting gear
- Ensures accountability and rental tracking
- Prevents anonymous transactions

### 💳 Secure Payment Processing
- Stripe integration for secure payments
- PCI DSS compliant payment handling
- Support for all major payment methods
- Real-time payment status updates

### 🛡️ Security Features
- JWT token authentication
- Server-side payment validation
- Encrypted payment data
- Rate limiting and fraud protection

## Components

### 1. AuthGuard Component
**Location:** `src/lib/components/auth/AuthGuard.svelte`

Wraps payment forms to ensure user authentication:
```svelte
<AuthGuard message="You must be signed in to rent gear.">
  <PaymentForm />
</AuthGuard>
```

### 2. StripePaymentForm Component
**Location:** `src/lib/components/payments/StripePaymentForm.svelte`

Secure payment form with Stripe integration:
- Requires authenticated user
- Real-time validation
- Error handling
- Success/failure events

### 3. Payment Service
**Location:** `src/lib/services/payments.ts`

Core payment functionality:
- `createPaymentIntent()` - Creates Stripe payment intent
- Requires authenticated user
- Handles errors gracefully

### 4. Payment API Endpoint
**Location:** `src/routes/api/payments/create-intent/+server.ts`

Server-side payment processing:
- Validates user authentication
- Creates Stripe payment intents
- Handles mock payments in development
- Comprehensive error handling

## Usage

### Basic Payment Flow

1. **User Authentication Check**
   ```typescript
   // AuthGuard automatically checks authentication
   if (!$authStore.user) {
     // Show login prompt
   }
   ```

2. **Create Payment Intent**
   ```typescript
   import { createPaymentIntent } from '$lib/services/payments';
   
   const { clientSecret, paymentIntentId } = await createPaymentIntent(
     amount,    // Amount in dollars (e.g., 10.00)
     'usd',     // Currency
     metadata   // Additional data
   );
   ```

3. **Process Payment**
   ```svelte
   <StripePaymentForm
     {amount}
     {currency}
     {metadata}
     on:success={handleSuccess}
     on:error={handleError}
   />
   ```

### Payment Page Integration

```svelte
<!-- /payment page -->
<AuthGuard message="You must be signed in to rent gear.">
  <StripePaymentForm
    amount={rentalAmount}
    currency="usd"
    metadata={{ listingId, bookingId }}
    on:success={handlePaymentSuccess}
    on:error={handlePaymentError}
  />
</AuthGuard>
```

## Environment Configuration

### Development
```env
NODE_ENV=development
VITE_USE_EMULATORS=true
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Production
```env
NODE_ENV=production
VITE_USE_EMULATORS=false
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important**: Replace placeholder keys with actual Stripe keys from your dashboard.

## Error Handling

### Client-Side Errors
- Authentication required
- Invalid payment amount
- Stripe initialization failures
- Network errors

### Server-Side Errors
- Missing authentication
- Invalid Stripe configuration
- Payment processing failures
- Validation errors

## Security Considerations

### Authentication
- All payments require valid JWT tokens
- Server validates tokens with Firebase Admin
- No guest payments allowed

### Payment Data
- Never store payment details
- Use Stripe's secure tokenization
- PCI DSS compliance maintained

### Rate Limiting
- Prevent payment spam
- Protect against fraud
- Monitor suspicious activity

## Testing

### Production Testing
- Use Stripe test keys in staging environment
- Test with Stripe test cards (4242 4242 4242 4242)
- Verify webhook handling
- Test complete booking flow

## Deployment Checklist

- [ ] Set production Stripe keys
- [ ] Configure Firebase Admin credentials
- [ ] Enable HTTPS
- [ ] Set up webhook endpoints
- [ ] Configure rate limiting
- [ ] Test payment flow end-to-end
- [ ] Verify error handling
- [ ] Monitor payment logs

## Support

For payment-related issues:
1. Check authentication status
2. Verify Stripe configuration
3. Review server logs
4. Test with Stripe test cards
5. Contact Stripe support if needed

## Future Enhancements

- [ ] Subscription payments
- [ ] Multi-currency support
- [ ] Payment method storage
- [ ] Refund processing
- [ ] Advanced fraud detection
