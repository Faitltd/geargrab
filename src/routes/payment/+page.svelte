<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/auth/auth-guard.svelte';
  import StripePaymentForm from '$lib/components/payments/stripe-payment-form.svelte';
  
  // Payment parameters from URL
  let amount: number = 0;
  let currency: string = 'usd';
  let metadata: Record<string, string> = {};
  let listingTitle: string = '';
  let priceBreakdown: any = null;
  let error: string = '';

  onMount(() => {
    // Get payment details from URL parameters
    const urlParams = $page.url.searchParams;

    const amountParam = urlParams.get('amount');
    if (amountParam) {
      amount = parseFloat(amountParam);
    }

    currency = urlParams.get('currency') || 'usd';
    listingTitle = urlParams.get('title') || 'Gear Rental';

    // Parse metadata
    const listingId = urlParams.get('listingId');
    const bookingId = urlParams.get('bookingId');

    if (listingId) metadata.listingId = listingId;
    if (bookingId) metadata.bookingId = bookingId;

    // Get price breakdown if available
    const dailyPrice = urlParams.get('dailyPrice');
    const days = urlParams.get('days');
    const basePrice = urlParams.get('basePrice');
    const serviceFee = urlParams.get('serviceFee');
    const deliveryFee = urlParams.get('deliveryFee');
    const insuranceFee = urlParams.get('insuranceFee');

    // Store breakdown for display
    if (dailyPrice && days && basePrice && serviceFee) {
      priceBreakdown = {
        dailyPrice: parseFloat(dailyPrice),
        days: parseInt(days),
        basePrice: parseFloat(basePrice),
        serviceFee: parseFloat(serviceFee),
        deliveryFee: parseFloat(deliveryFee || '0'),
        insuranceFee: parseFloat(insuranceFee || '0')
      };
    }

    // Validate required parameters
    if (!amount || amount <= 0) {
      error = 'Invalid payment amount. Please return to the listing page.';
    }

    console.log('Payment page loaded:', { amount, currency, metadata, listingTitle });
  });

  function handlePaymentSuccess(event: CustomEvent) {
    const { paymentIntent, paymentIntentId } = event.detail;
    console.log('Payment successful:', { paymentIntent, paymentIntentId });
    
    // Redirect to success page with payment details
    const successUrl = new URL('/payment/success', window.location.origin);
    successUrl.searchParams.set('paymentId', paymentIntentId);
    successUrl.searchParams.set('amount', amount.toString());
    if (metadata.listingId) successUrl.searchParams.set('listingId', metadata.listingId);
    if (metadata.bookingId) successUrl.searchParams.set('bookingId', metadata.bookingId);
    
    goto(successUrl.toString());
  }

  function handlePaymentError(event: CustomEvent) {
    const { error: paymentError } = event.detail;
    console.error('Payment failed:', paymentError);
    error = paymentError || 'Payment failed. Please try again.';
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Secure Payment - GearGrab</title>
  <meta name="description" content="Complete your gear rental payment securely with GearGrab" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Secure Payment</h1>
      <p class="text-gray-300">Complete your gear rental payment</p>
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="max-w-md mx-auto mb-8">
        <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Payment Content -->
    <div class="max-w-md mx-auto">
      <AuthGuard message="You must be signed in to rent gear and complete payments.">
        {#if amount > 0}
          <!-- Rental Summary -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
            <h2 class="text-lg font-semibold text-white mb-4">Rental Summary</h2>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-300">Item:</span>
                <span class="text-white font-medium">{listingTitle}</span>
              </div>

              {#if priceBreakdown}
                <!-- Detailed Price Breakdown -->
                <div class="border-t border-white/20 pt-3 mt-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-300">{formatCurrency(priceBreakdown.dailyPrice)} × {priceBreakdown.days} days</span>
                    <span class="text-white">{formatCurrency(priceBreakdown.basePrice)}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-300">Service fee</span>
                    <span class="text-white">{formatCurrency(priceBreakdown.serviceFee)}</span>
                  </div>
                  {#if priceBreakdown.deliveryFee > 0}
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-300">Delivery fee</span>
                      <span class="text-white">{formatCurrency(priceBreakdown.deliveryFee)}</span>
                    </div>
                  {/if}
                  {#if priceBreakdown.insuranceFee > 0}
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-300">Insurance</span>
                      <span class="text-white">{formatCurrency(priceBreakdown.insuranceFee)}</span>
                    </div>
                  {/if}
                  <hr class="border-white/20 my-2" />
                </div>
              {/if}

              <div class="flex justify-between">
                <span class="text-gray-300">Total Amount:</span>
                <span class="text-white font-bold text-xl">{formatCurrency(amount)}</span>
              </div>
            </div>
          </div>

          <!-- Payment Form -->
          <StripePaymentForm
            {amount}
            {currency}
            {metadata}
            on:success={handlePaymentSuccess}
            on:error={handlePaymentError}
          />

          <!-- Security Notice -->
          <div class="mt-6 text-center">
            <p class="text-xs text-gray-400 mb-2">
              🔒 Your payment is secured with 256-bit SSL encryption
            </p>
            <p class="text-xs text-gray-400">
              By completing this payment, you agree to our 
              <a href="/terms" class="text-green-400 hover:text-green-300 underline">Terms of Service</a>
              and 
              <a href="/privacy" class="text-green-400 hover:text-green-300 underline">Privacy Policy</a>
            </p>
          </div>
        {:else}
          <!-- Invalid Payment -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 text-center">
            <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Invalid Payment</h3>
            <p class="text-gray-300 mb-6">No valid payment amount was provided.</p>
            <a 
              href="/browse" 
              class="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Browse Gear
            </a>
          </div>
        {/if}
      </AuthGuard>
    </div>

    <!-- Back Link -->
    <div class="text-center mt-8">
      <a 
        href="/browse" 
        class="text-green-400 hover:text-green-300 text-sm underline"
      >
        ← Back to Browse Gear
      </a>
    </div>
  </div>
</div>
