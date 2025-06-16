<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  
  let paymentId: string = '';
  let amount: string = '';
  let listingId: string = '';
  let bookingId: string = '';
  let userEmail: string = '';
  let priceBreakdown: any = null;

  onMount(() => {
    // Get payment details from URL parameters
    const urlParams = $page.url.searchParams;

    paymentId = urlParams.get('paymentId') || '';
    amount = urlParams.get('amount') || '';
    listingId = urlParams.get('listingId') || '';
    bookingId = urlParams.get('bookingId') || '';

    // Get price breakdown if available
    const dailyPrice = urlParams.get('dailyPrice');
    const days = urlParams.get('days');
    const basePrice = urlParams.get('basePrice');
    const serviceFee = urlParams.get('serviceFee');
    const deliveryFee = urlParams.get('deliveryFee');

    if (dailyPrice && days && basePrice && serviceFee) {
      priceBreakdown = {
        dailyPrice: parseFloat(dailyPrice),
        days: parseInt(days),
        basePrice: parseFloat(basePrice),
        serviceFee: parseFloat(serviceFee),
        deliveryFee: parseFloat(deliveryFee || '0')
      };
    }

    // Get user email from auth store
    if ($authStore.user?.email) {
      userEmail = $authStore.user.email;
    }

    console.log('Payment success page loaded:', { paymentId, amount, listingId, bookingId, priceBreakdown });
  });

  function formatCurrency(amount: string): string {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  }
</script>

<svelte:head>
  <title>Payment Successful - GearGrab</title>
  <meta name="description" content="Your gear rental payment was successful" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900">
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-md mx-auto">
      <!-- Success Message -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 text-center">
        <!-- Success Icon -->
        <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <!-- Success Title -->
        <h1 class="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p class="text-gray-300 mb-6">Your gear rental payment has been processed successfully.</p>

        <!-- Payment Details -->
        <div class="bg-white/5 rounded-lg p-4 mb-6 text-left">
          <h3 class="text-sm font-semibold text-white mb-3">Payment Details</h3>
          <div class="space-y-2 text-sm">
            {#if paymentId}
              <div class="flex justify-between">
                <span class="text-gray-400">Payment ID:</span>
                <span class="text-white font-mono text-xs">{paymentId}</span>
              </div>
            {/if}

            {#if priceBreakdown}
              <!-- Detailed Price Breakdown -->
              <div class="border-t border-white/20 pt-2 mt-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">{formatCurrency(priceBreakdown.dailyPrice)} × {priceBreakdown.days} days:</span>
                  <span class="text-white">{formatCurrency(priceBreakdown.basePrice)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Service fee:</span>
                  <span class="text-white">{formatCurrency(priceBreakdown.serviceFee)}</span>
                </div>
                {#if priceBreakdown.deliveryFee > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-400">Delivery fee:</span>
                    <span class="text-white">{formatCurrency(priceBreakdown.deliveryFee)}</span>
                  </div>
                {/if}
                <hr class="border-white/20 my-1" />
              </div>
            {/if}

            {#if amount}
              <div class="flex justify-between font-semibold">
                <span class="text-gray-400">Total Amount:</span>
                <span class="text-white">{formatCurrency(amount)}</span>
              </div>
            {/if}
            {#if userEmail}
              <div class="flex justify-between">
                <span class="text-gray-400">Receipt sent to:</span>
                <span class="text-white">{userEmail}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Next Steps -->
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h3 class="text-sm font-semibold text-blue-200 mb-2">What's Next?</h3>
          <ul class="text-xs text-blue-100 space-y-1 text-left">
            <li>• You'll receive a confirmation email shortly</li>
            <li>• The gear owner will be notified of your rental</li>
            <li>• Check your dashboard for rental details</li>
            <li>• Coordinate pickup/delivery with the owner</li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <a 
            href="/dashboard/rentals"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block"
          >
            View My Rentals
          </a>
          
          <a 
            href="/browse"
            class="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block"
          >
            Browse More Gear
          </a>
        </div>

        <!-- Support -->
        <div class="mt-6 pt-6 border-t border-white/10">
          <p class="text-xs text-gray-400 mb-2">
            Need help with your rental?
          </p>
          <a 
            href="/support" 
            class="text-green-400 hover:text-green-300 text-sm underline"
          >
            Contact Support
          </a>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-400">
          Keep this page bookmarked for your records. You can also find all your rental details in your dashboard.
        </p>
      </div>
    </div>
  </div>
</div>
