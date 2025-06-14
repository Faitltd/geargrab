<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import AuthGuard from '$lib/components/auth/AuthGuard.svelte';
  import StripePaymentForm from '$lib/components/payments/StripePaymentForm.svelte';
  import { createBookingWithPayment, calculateRentalFees, validateBookingDates } from '$lib/services/bookings';
  import type { Listing } from '$lib/types/firestore';
  
  export let listing: Listing;
  export let startDate: Date | string;
  export let endDate: Date | string;
  export let deliveryMethod: 'pickup' | 'delivery' = 'pickup';
  export let deliveryFee: number = 0;
  
  const dispatch = createEventDispatcher();
  
  let currentStep: 'details' | 'payment' | 'processing' = 'details';
  let bookingId: string = '';
  let paymentMetadata: Record<string, string> = {};
  let error: string = '';
  let processing: boolean = false;
  
  // Calculate rental fees
  $: rentalFees = calculateRentalFees(
    listing.dailyPrice,
    startDate,
    endDate,
    deliveryMethod,
    deliveryFee
  );
  
  // Validate dates
  $: dateValidation = validateBookingDates(startDate, endDate);
  $: canProceed = dateValidation.valid && $authStore.user;

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  async function proceedToPayment() {
    if (!canProceed) {
      error = dateValidation.error || 'Please log in to continue';
      return;
    }

    try {
      processing = true;
      error = '';

      // Create booking with payment setup
      const result = await createBookingWithPayment(
        listing.id,
        listing.title,
        listing.images[0] || '',
        listing.ownerUid,
        $authStore.user!.uid,
        startDate,
        endDate,
        rentalFees.totalPrice,
        deliveryMethod
      );

      bookingId = result.bookingId;
      paymentMetadata = result.paymentMetadata;
      
      console.log('✅ Booking created, proceeding to payment:', { bookingId, paymentMetadata });
      
      currentStep = 'payment';
    } catch (err) {
      console.error('❌ Error creating booking:', err);
      error = err.message || 'Failed to create booking. Please try again.';
    } finally {
      processing = false;
    }
  }

  function handlePaymentSuccess(event: CustomEvent) {
    const { paymentIntent, paymentIntentId } = event.detail;
    console.log('✅ Payment successful:', { paymentIntent, paymentIntentId });
    
    // Redirect to success page
    const successUrl = new URL('/payment/success', window.location.origin);
    successUrl.searchParams.set('paymentId', paymentIntentId);
    successUrl.searchParams.set('amount', rentalFees.totalPrice.toString());
    successUrl.searchParams.set('bookingId', bookingId);
    successUrl.searchParams.set('listingId', listing.id);
    
    goto(successUrl.toString());
  }

  function handlePaymentError(event: CustomEvent) {
    const { error: paymentError } = event.detail;
    console.error('❌ Payment failed:', paymentError);
    error = paymentError || 'Payment failed. Please try again.';
    currentStep = 'details'; // Go back to details step
  }

  function goBack() {
    if (currentStep === 'payment') {
      currentStep = 'details';
    } else {
      dispatch('cancel');
    }
  }
</script>

<div class="booking-flow">
  <!-- Step Indicator -->
  <div class="flex items-center justify-center mb-8">
    <div class="flex items-center space-x-4">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full {currentStep === 'details' ? 'bg-green-500' : 'bg-green-500'} flex items-center justify-center">
          <span class="text-white text-sm font-medium">1</span>
        </div>
        <span class="ml-2 text-sm {currentStep === 'details' ? 'text-white' : 'text-gray-300'}">Details</span>
      </div>
      
      <div class="w-8 h-0.5 {currentStep === 'payment' ? 'bg-green-500' : 'bg-gray-600'}"></div>
      
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full {currentStep === 'payment' ? 'bg-green-500' : 'bg-gray-600'} flex items-center justify-center">
          <span class="text-white text-sm font-medium">2</span>
        </div>
        <span class="ml-2 text-sm {currentStep === 'payment' ? 'text-white' : 'text-gray-300'}">Payment</span>
      </div>
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-red-200 text-sm">{error}</p>
      </div>
    </div>
  {/if}

  {#if currentStep === 'details'}
    <!-- Booking Details Step -->
    <div class="space-y-6">
      <!-- Listing Summary -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <div class="flex items-start space-x-4">
          {#if listing.images[0]}
            <img 
              src={listing.images[0]} 
              alt={listing.title}
              class="w-20 h-20 object-cover rounded-lg"
            />
          {/if}
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-white mb-2">{listing.title}</h3>
            <p class="text-gray-300 text-sm mb-2">{listing.description}</p>
            <p class="text-green-400 font-medium">{formatCurrency(listing.dailyPrice)}/day</p>
          </div>
        </div>
      </div>

      <!-- Rental Details -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h4 class="text-lg font-semibold text-white mb-4">Rental Details</h4>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-300">Pickup Date:</span>
            <span class="text-white">{formatDate(startDate)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Return Date:</span>
            <span class="text-white">{formatDate(endDate)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Duration:</span>
            <span class="text-white">{rentalFees.days} day{rentalFees.days !== 1 ? 's' : ''}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Delivery Method:</span>
            <span class="text-white capitalize">{deliveryMethod}</span>
          </div>
        </div>
      </div>

      <!-- Price Breakdown -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h4 class="text-lg font-semibold text-white mb-4">Price Breakdown</h4>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-300">Rental Fee ({rentalFees.days} days):</span>
            <span class="text-white">{formatCurrency(rentalFees.rentalFee)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Service Fee:</span>
            <span class="text-white">{formatCurrency(rentalFees.serviceFee)}</span>
          </div>
          {#if rentalFees.deliveryFee > 0}
            <div class="flex justify-between">
              <span class="text-gray-300">Delivery Fee:</span>
              <span class="text-white">{formatCurrency(rentalFees.deliveryFee)}</span>
            </div>
          {/if}
          <div class="border-t border-white/20 pt-2 mt-2">
            <div class="flex justify-between">
              <span class="text-white font-semibold">Total:</span>
              <span class="text-white font-bold text-xl">{formatCurrency(rentalFees.totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Validation -->
      {#if !dateValidation.valid}
        <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <p class="text-yellow-200 text-sm">{dateValidation.error}</p>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex space-x-4">
        <button
          on:click={goBack}
          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Cancel
        </button>
        
        <AuthGuard message="You must be signed in to rent gear.">
          <button
            on:click={proceedToPayment}
            disabled={!canProceed || processing}
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {#if processing}
              <div class="flex items-center justify-center">
                <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Creating Booking...
              </div>
            {:else}
              Proceed to Payment
            {/if}
          </button>
        </AuthGuard>
      </div>
    </div>

  {:else if currentStep === 'payment'}
    <!-- Payment Step -->
    <div class="space-y-6">
      <!-- Booking Summary -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h4 class="text-lg font-semibold text-white mb-4">Booking Summary</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-300">Item:</span>
            <span class="text-white">{listing.title}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Duration:</span>
            <span class="text-white">{rentalFees.days} day{rentalFees.days !== 1 ? 's' : ''}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Total Amount:</span>
            <span class="text-white font-bold">{formatCurrency(rentalFees.totalPrice)}</span>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <StripePaymentForm
        amount={rentalFees.totalPrice}
        currency="usd"
        metadata={paymentMetadata}
        on:success={handlePaymentSuccess}
        on:error={handlePaymentError}
      />

      <!-- Back Button -->
      <button
        on:click={goBack}
        class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        ← Back to Details
      </button>
    </div>
  {/if}
</div>

<style>
  .booking-flow {
    max-width: 500px;
    margin: 0 auto;
  }
</style>
