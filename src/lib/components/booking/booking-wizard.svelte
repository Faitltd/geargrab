<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import AuthGuard from '$lib/components/auth/auth-guard.svelte';
  import StepIndicator from '$lib/components/ui/step-indicator.svelte';
  import BookingDetails from './booking-details.svelte';
  import BookingPayment from './booking-payment.svelte';
  import { createBookingWithPayment, calculateRentalFees, validateBookingDates } from '$lib/services/bookings';
  import type { Listing } from '$lib/types/firestore';
  
  export let listing: Listing;
  export let startDate: Date | string;
  export let endDate: Date | string;
  export let deliveryMethod: 'pickup' | 'delivery' = 'pickup';
  export let deliveryFee: number = 0;
  
  const dispatch = createEventDispatcher();
  
  let currentStep: 'details' | 'payment' = 'details';
  let bookingId: string = '';
  let paymentMetadata: Record<string, string> = {};
  let error: string = '';
  let processing: boolean = false;

  // Step configuration for StepIndicator
  const steps = [
    { label: 'Details' },
    { label: 'Payment' }
  ];

  // Convert currentStep to index for StepIndicator
  $: currentStepIndex = currentStep === 'details' ? 0 : 1;
  
  // Calculate rental fees
  $: rentalFees = calculateRentalFees(
    listing.dailyPrice,
    startDate,
    endDate,
    deliveryMethod,
    deliveryFee
  );
  
  // Use simple auth system
  $: authState = simpleAuth.authState;

  // Validate dates
  $: dateValidation = validateBookingDates(startDate, endDate);
  $: canProceed = dateValidation.valid && $authState.isAuthenticated;

  async function handleProceedToPayment() {
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
        $authState.user!.uid,
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

    // Redirect to success page with detailed price breakdown
    const successUrl = new URL('/payment/success', window.location.origin);
    successUrl.searchParams.set('paymentId', paymentIntentId);
    successUrl.searchParams.set('amount', rentalFees.totalPrice.toString());
    successUrl.searchParams.set('bookingId', bookingId);
    successUrl.searchParams.set('listingId', listing.id);

    // Add price breakdown details
    successUrl.searchParams.set('dailyPrice', listing.dailyPrice.toString());
    successUrl.searchParams.set('days', rentalFees.days.toString());
    successUrl.searchParams.set('basePrice', rentalFees.rentalFee.toString());
    successUrl.searchParams.set('serviceFee', rentalFees.serviceFee.toString());
    successUrl.searchParams.set('deliveryFee', rentalFees.deliveryFee.toString());

    goto(successUrl.toString());
  }

  function handlePaymentError(event: CustomEvent) {
    const { error: paymentError } = event.detail;
    console.error('❌ Payment failed:', paymentError);
    error = paymentError || 'Payment failed. Please try again.';
    currentStep = 'details'; // Go back to details step
  }

  function handleBack() {
    if (currentStep === 'payment') {
      currentStep = 'details';
    } else {
      dispatch('cancel');
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="booking-wizard">
  <!-- Step Indicator -->
  <div class="mb-8">
    <StepIndicator {steps} currentStep={currentStepIndex} />
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

  <!-- Step Content -->
  {#if currentStep === 'details'}
    <AuthGuard message="You must be signed in to rent gear.">
      <BookingDetails
        {listing}
        {startDate}
        {endDate}
        {deliveryMethod}
        {rentalFees}
        {dateValidation}
        {canProceed}
        {processing}
        on:proceed={handleProceedToPayment}
        on:cancel={handleCancel}
      />
    </AuthGuard>
  {:else if currentStep === 'payment'}
    <BookingPayment
      {listing}
      {rentalFees}
      {paymentMetadata}
      on:success={handlePaymentSuccess}
      on:error={handlePaymentError}
      on:back={handleBack}
    />
  {/if}
</div>

<style>
  .booking-wizard {
    max-width: 500px;
    margin: 0 auto;
  }
</style>
