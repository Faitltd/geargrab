<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import type { ListingData } from '$lib/services/listings';
  import { checkDateOverlap, type DateOverlapResult } from '$lib/services/bookings';
  import { shakeModal, ensureAnimationKeyframes } from '$lib/utils/animations';
  import InlineAlert from '$lib/components/ui/InlineAlert.svelte';
  import { rentalCheckoutAndRedirect, handleCheckoutError } from '$lib/services/checkout';
  import { authStore } from '$lib/stores/auth.store';
  
  export let isOpen = false;
  export let listing: ListingData;
  export let step: 'dates' | 'confirmation' | 'success' = 'dates';
  
  const dispatch = createEventDispatcher<{
    close: void;
    dateSelect: { dates: string[]; startDate: string | null; endDate: string | null };
    confirm: { booking: BookingDetails };
    back: void;
  }>();
  
  interface BookingDetails {
    listing: ListingData;
    dates: string[];
    startDate: string | null;
    endDate: string | null;
    deliveryOption: 'pickup' | 'delivery';
    insuranceOption: boolean;
    totalCost: number;
    breakdown: CostBreakdown;
  }
  
  interface CostBreakdown {
    basePrice: number;
    days: number;
    subtotal: number;
    deliveryFee: number;
    insuranceFee: number;
    taxAmount: number;
    total: number;
  }
  
  // State
  let selectedDates: string[] = [];
  let deliveryOption: 'pickup' | 'delivery' = 'pickup';
  let insuranceOption = false;
  let modalElement: HTMLElement;
  let isAnimating = false;

  // Booking conflict state
  let hasDateConflict = false;
  let conflictMessage = '';
  let isCheckingDates = false;

  // Checkout state
  let isProcessingCheckout = false;
  let checkoutError = '';
  
  // Constants
  const deliveryFee = 15;
  const insuranceFee = 8;
  const taxRate = 0.0875;
  
  // Computed values
  $: basePrice = parseFloat(listing?.rentalPrice || '0');
  $: rentalDays = selectedDates.length || 1;
  $: subtotal = basePrice * rentalDays;
  $: currentDeliveryFee = deliveryOption === 'delivery' ? deliveryFee : 0;
  $: currentInsuranceFee = insuranceOption ? insuranceFee : 0;
  $: taxableAmount = subtotal + currentDeliveryFee + currentInsuranceFee;
  $: taxAmount = taxableAmount * taxRate;
  $: totalCost = taxableAmount + taxAmount;
  
  $: costBreakdown: CostBreakdown = {
    basePrice,
    days: rentalDays,
    subtotal,
    deliveryFee: currentDeliveryFee,
    insuranceFee: currentInsuranceFee,
    taxAmount,
    total: totalCost
  };
  
  $: startDate = selectedDates.length > 0 ? selectedDates[0] : null;
  $: endDate = selectedDates.length > 1 ? selectedDates[selectedDates.length - 1] : null;
  
  // Event handlers
  const handleClose = () => {
    if (isAnimating) return;
    dispatch('close');
  };
  
  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };
  
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };
  
  const handleDateSelect = async (event: CustomEvent) => {
    const { dates, startDate: start, endDate: end } = event.detail;
    selectedDates = dates;

    // Check for date conflicts if dates are selected
    if (dates.length > 0) {
      await checkForDateConflicts(dates);
    } else {
      // Clear conflict state when no dates selected
      hasDateConflict = false;
      conflictMessage = '';
    }

    dispatch('dateSelect', { dates, startDate: start, endDate: end });
  };

  // Check for booking conflicts
  const checkForDateConflicts = async (dates: string[]) => {
    if (!listing?.id) return;

    isCheckingDates = true;
    hasDateConflict = false;
    conflictMessage = '';

    try {
      const overlapResult = await checkDateOverlap(listing.id, dates);

      if (overlapResult.hasOverlap) {
        hasDateConflict = true;
        const conflictCount = overlapResult.conflictingDates.length;
        const dateText = conflictCount === 1 ? 'date' : 'dates';
        conflictMessage = `Selected ${dateText} conflict with existing bookings: ${overlapResult.conflictingDates.join(', ')}`;

        // Shake the modal to draw attention
        if (modalElement) {
          await shakeModal(modalElement, { duration: 500, intensity: 8 });
        }
      }
    } catch (error) {
      console.error('Error checking date conflicts:', error);
      hasDateConflict = true;
      conflictMessage = 'Unable to verify date availability. Please try again.';
    } finally {
      isCheckingDates = false;
    }
  };
  
  const handleContinue = async () => {
    if (selectedDates.length === 0) return;

    // Prevent proceeding if there are date conflicts
    if (hasDateConflict) {
      if (modalElement) {
        shakeModal(modalElement, { duration: 300, intensity: 6 });
      }
      return;
    }

    if (step === 'dates') {
      step = 'confirmation';
    } else if (step === 'confirmation') {
      // Check if user is authenticated
      if (!$authStore.user) {
        checkoutError = 'Please sign in to complete your booking';
        return;
      }

      // Proceed with Stripe checkout
      await processCheckout();
    }
  };

  const processCheckout = async () => {
    if (!listing?.id) return;

    isProcessingCheckout = true;
    checkoutError = '';

    try {
      // Prepare booking data for checkout
      const bookingData = {
        dates: selectedDates,
        startDate: startDate || selectedDates[0],
        endDate: endDate || selectedDates[selectedDates.length - 1],
        deliveryOption,
        insuranceOption,
        totalCost,
        breakdown: {
          basePrice,
          days: rentalDays,
          subtotal,
          deliveryFee: currentDeliveryFee,
          insuranceFee: currentInsuranceFee,
          taxAmount,
          total: totalCost
        }
      };

      // Create checkout session and redirect to Stripe
      await rentalCheckoutAndRedirect(listing.id, bookingData);

      // If we reach here, something went wrong (user didn't get redirected)
      checkoutError = 'Failed to redirect to checkout. Please try again.';

    } catch (error) {
      console.error('Checkout error:', error);
      checkoutError = handleCheckoutError(error);

      // Shake modal to draw attention to error
      if (modalElement) {
        shakeModal(modalElement, { duration: 400, intensity: 8 });
      }
    } finally {
      isProcessingCheckout = false;
    }
  };
  
  const handleBack = () => {
    if (step === 'confirmation') {
      step = 'dates';
    } else if (step === 'success') {
      step = 'confirmation';
    }
    dispatch('back');
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDateRange = (dates: string[]): string => {
    if (dates.length === 0) return 'No dates selected';
    if (dates.length === 1) return new Date(dates[0]).toLocaleDateString();
    
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };
  
  // Lifecycle
  onMount(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalElement?.focus();
    }
    // Ensure animation keyframes are available
    ensureAnimationKeyframes();
  });
  
  onDestroy(() => {
    document.body.style.overflow = '';
  });
  
  // Reactive effects
  $: if (isOpen) {
    document.body.style.overflow = 'hidden';
    setTimeout(() => modalElement?.focus(), 100);
  } else {
    document.body.style.overflow = '';
  }
  
  // Step titles
  $: stepTitle = {
    dates: 'Select Rental Dates',
    confirmation: 'Confirm Your Booking',
    success: 'Booking Confirmed!'
  }[step];
  
  // Progress indicator
  $: progressSteps = [
    { id: 'dates', label: 'Dates', active: step === 'dates', completed: ['confirmation', 'success'].includes(step) },
    { id: 'confirmation', label: 'Confirm', active: step === 'confirmation', completed: step === 'success' },
    { id: 'success', label: 'Complete', active: step === 'success', completed: false }
  ];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    transition:fade={{ duration: 200 }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <!-- Modal Panel -->
    <div
      bind:this={modalElement}
      class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      transition:scale={{ duration: 200, start: 0.95 }}
      tabindex="-1"
      on:click|stopPropagation
    >
      <!-- Modal Header -->
      <div class="bg-primary-500 text-white px-8 py-6">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h2 id="modal-title" class="text-2xl font-bold mb-2">
              {stepTitle}
            </h2>
            <p class="text-primary-100 text-sm">
              {listing?.title || 'Rental Item'}
            </p>
          </div>
          
          <button
            on:click={handleClose}
            class="p-2 hover:bg-primary-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Progress Indicator -->
        <div class="mt-6">
          <div class="flex items-center space-x-4">
            {#each progressSteps as progressStep, index}
              <div class="flex items-center">
                <!-- Step Circle -->
                <div class="
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
                  {progressStep.completed 
                    ? 'bg-white text-primary-500' 
                    : progressStep.active 
                      ? 'bg-accent-500 text-white' 
                      : 'bg-primary-400 text-primary-100'
                  }
                ">
                  {#if progressStep.completed}
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  {:else}
                    {index + 1}
                  {/if}
                </div>
                
                <!-- Step Label -->
                <span class="ml-2 text-sm font-medium text-primary-100">
                  {progressStep.label}
                </span>
                
                <!-- Connector Line -->
                {#if index < progressSteps.length - 1}
                  <div class="w-8 h-0.5 bg-primary-400 mx-4"></div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Booking Conflict Alert -->
      {#if hasDateConflict && conflictMessage}
        <div class="px-8 pt-4">
          <InlineAlert
            type="error"
            message={conflictMessage}
            visible={true}
            dismissible={false}
          />
        </div>
      {/if}

      <!-- Date Checking Loading State -->
      {#if isCheckingDates}
        <div class="px-8 pt-4">
          <InlineAlert
            type="info"
            message="Checking date availability..."
            visible={true}
            dismissible={false}
            icon={false}
          >
            <div class="flex items-center space-x-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Checking date availability...</span>
            </div>
          </InlineAlert>
        </div>
      {/if}

      <!-- Checkout Error Alert -->
      {#if checkoutError}
        <div class="px-8 pt-4">
          <InlineAlert
            type="error"
            message={checkoutError}
            visible={true}
            dismissible={true}
            on:dismiss={() => checkoutError = ''}
          />
        </div>
      {/if}

      <!-- Checkout Processing State -->
      {#if isProcessingCheckout}
        <div class="px-8 pt-4">
          <InlineAlert
            type="info"
            message="Redirecting to secure checkout..."
            visible={true}
            dismissible={false}
            icon={false}
          >
            <div class="flex items-center space-x-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Redirecting to secure checkout...</span>
            </div>
          </InlineAlert>
        </div>
      {/if}

      <!-- Modal Content -->
      <div class="overflow-y-auto max-h-[calc(90vh-200px)]">
        <slot {step} {selectedDates} {deliveryOption} {insuranceOption} {costBreakdown} {handleDateSelect} {formatCurrency} {formatDateRange}>
          <!-- Default content if no slot provided -->
          <div class="p-8 text-center">
            <p class="text-neutral-600">Modal content will be displayed here.</p>
          </div>
        </slot>
      </div>
      
      <!-- Modal Footer -->
      <div class="bg-neutral-50 px-8 py-6 border-t border-neutral-200">
        <div class="flex items-center justify-between">
          <!-- Back Button -->
          {#if step !== 'dates'}
            <button
              on:click={handleBack}
              class="px-6 py-3 text-neutral-700 font-medium border border-neutral-300 rounded-lg hover:bg-neutral-100 hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              Back
            </button>
          {:else}
            <div></div>
          {/if}
          
          <!-- Continue/Confirm Button -->
          <button
            on:click={handleContinue}
            disabled={(selectedDates.length === 0 && step === 'dates') || hasDateConflict || isCheckingDates || isProcessingCheckout}
            class="
              px-8 py-3 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center space-x-2
              {step === 'success'
                ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
                : 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed'
              }
            "
          >
            {#if isProcessingCheckout}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            {:else if step === 'dates'}
              <span>Continue to Confirmation</span>
            {:else if step === 'confirmation'}
              <span>Proceed to Checkout</span>
            {:else}
              <span>Done</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
