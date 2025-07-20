<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { getRental, getNextAction, formatRentalDates, getRentalDuration, type RentalData } from '$lib/services/rentals';
  import { getRentalConditionChecks, type ConditionCheck } from '$lib/services/conditionCheck';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { showToast } from '$lib/stores/toast.store';

  // URL parameters
  let rentalId: string;
  
  // State
  let rental: RentalData | null = null;
  let conditionChecks: { before?: ConditionCheck; after?: ConditionCheck } = {};
  let isLoading = true;
  let error = '';

  onMount(async () => {
    rentalId = $page.params.id || '';

    // Check authentication
    if (!$authStore.user) {
      showToast('error', 'Please sign in to continue');
      goto('/auth/signin');
      return;
    }

    await loadRentalData();
  });

  const loadRentalData = async () => {
    if (!rentalId) return;

    try {
      // Load rental data
      rental = await getRental(rentalId);
      
      if (!rental) {
        error = 'Rental not found';
        return;
      }

      // Verify user has access to this rental
      if (rental.renterId !== $authStore.user?.uid && rental.ownerId !== $authStore.user?.uid) {
        error = 'You do not have access to this rental';
        return;
      }

      // Load condition checks
      try {
        conditionChecks = await getRentalConditionChecks(rentalId);
      } catch (err) {
        console.warn('Failed to load condition checks:', err);
      }

    } catch (err: any) {
      console.error('Error loading rental data:', err);
      error = err.message || 'Failed to load rental data';
    } finally {
      isLoading = false;
    }
  };

  const handleNextAction = () => {
    if (!rental) return;
    
    const nextAction = getNextAction(rental);
    if (nextAction.url) {
      goto(nextAction.url);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Computed values
  $: nextAction = rental ? getNextAction(rental) : null;
  $: rentalDates = rental ? formatRentalDates(rental) : '';
  $: duration = rental ? getRentalDuration(rental) : 0;
  $: isRenter = rental && $authStore.user && rental.renterId === $authStore.user.uid;
  $: beforeCheck = conditionChecks.before;
  $: afterCheck = conditionChecks.after;
  $: hasConditionChecks = beforeCheck || afterCheck;
</script>

<svelte:head>
  <title>Rental Details - GearGrab</title>
  <meta name="description" content="View rental booking details and status" />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
  <div class="max-w-4xl mx-auto px-4 py-8">
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="primary" text="Loading rental details..." />
      </div>
      
    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-semibold text-red-900 mb-2">Error</h2>
        <p class="text-red-700 mb-4">{error}</p>
        <button
          on:click={() => goto('/dashboard/renter')}
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
      
    {:else if rental}
      <!-- Rental Details -->
      <div class="space-y-8">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-neutral-900 mb-2">
                {rental.listingTitle}
              </h1>
              <p class="text-neutral-600 mb-4">
                Rental ID: {rental.id}
              </p>
              
              <!-- Status and Action -->
              <div class="flex items-center space-x-4">
                <span class="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                  {rental.status}
                </span>
                
                {#if nextAction && nextAction.url}
                  <button
                    on:click={handleNextAction}
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {
                      nextAction.urgent 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }"
                  >
                    {nextAction.label}
                  </button>
                {/if}
              </div>
            </div>
            
            <!-- Rental Image -->
            {#if rental.listingImageUrl}
              <div class="flex-shrink-0 w-32 h-32 bg-neutral-100 rounded-xl overflow-hidden ml-6">
                <img
                  src={rental.listingImageUrl}
                  alt={rental.listingTitle}
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            {/if}
          </div>
        </div>

        <!-- Next Action Alert -->
        {#if nextAction && nextAction.type !== 'none'}
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div class="flex items-start space-x-3">
              <svg class="w-6 h-6 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">
                  {nextAction.label}
                </h3>
                <p class="text-blue-800 mb-4">
                  {nextAction.description}
                </p>
                {#if nextAction.url}
                  <a
                    href={nextAction.url}
                    class="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {nextAction.label}
                    <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Rental Information -->
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Rental Details -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-neutral-900 mb-4">
              Rental Details
            </h2>
            
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-neutral-600">Rental Period:</span>
                <span class="font-medium text-neutral-900">{rentalDates}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Duration:</span>
                <span class="font-medium text-neutral-900">{duration} {duration === 1 ? 'day' : 'days'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Start Date:</span>
                <span class="font-medium text-neutral-900">{formatDate(rental.startDate)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">End Date:</span>
                <span class="font-medium text-neutral-900">{formatDate(rental.endDate)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Delivery:</span>
                <span class="font-medium text-neutral-900">
                  {rental.deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Insurance:</span>
                <span class="font-medium text-neutral-900">
                  {rental.insuranceOption ? 'Yes' : 'No'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Booked:</span>
                <span class="font-medium text-neutral-900">{formatDateTime(rental.createdAt)}</span>
              </div>
            </div>
          </div>

          <!-- Cost Breakdown -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-neutral-900 mb-4">
              Cost Breakdown
            </h2>
            
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-neutral-600">Base Price ({rental.breakdown.days} days):</span>
                <span class="font-medium text-neutral-900">${rental.breakdown.basePrice.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Subtotal:</span>
                <span class="font-medium text-neutral-900">${rental.breakdown.subtotal.toFixed(2)}</span>
              </div>
              {#if rental.breakdown.deliveryFee > 0}
                <div class="flex justify-between">
                  <span class="text-neutral-600">Delivery Fee:</span>
                  <span class="font-medium text-neutral-900">${rental.breakdown.deliveryFee.toFixed(2)}</span>
                </div>
              {/if}
              {#if rental.breakdown.insuranceFee > 0}
                <div class="flex justify-between">
                  <span class="text-neutral-600">Insurance Fee:</span>
                  <span class="font-medium text-neutral-900">${rental.breakdown.insuranceFee.toFixed(2)}</span>
                </div>
              {/if}
              <div class="flex justify-between">
                <span class="text-neutral-600">Tax:</span>
                <span class="font-medium text-neutral-900">${rental.breakdown.taxAmount.toFixed(2)}</span>
              </div>
              <div class="border-t border-neutral-200 pt-3">
                <div class="flex justify-between">
                  <span class="text-lg font-semibold text-neutral-900">Total:</span>
                  <span class="text-lg font-bold text-neutral-900">${rental.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Condition Checks -->
        {#if hasConditionChecks}
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-neutral-900 mb-4">
              Condition Checks
            </h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              <!-- Before Photos -->
              <div>
                <h3 class="font-semibold text-neutral-900 mb-3">Before Pickup</h3>
                {#if beforeCheck}
                  <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-sm text-green-700">Completed</span>
                    </div>
                    <p class="text-sm text-neutral-600">
                      {beforeCheck.photos.length} photos uploaded on {formatDateTime(beforeCheck.completedAt)}
                    </p>
                    {#if beforeCheck.notes}
                      <p class="text-sm text-neutral-700 bg-neutral-50 p-2 rounded">
                        {beforeCheck.notes}
                      </p>
                    {/if}
                    <!-- View Photos Button -->
                    <button
                      on:click={() => goto(`/verification/before?rentalId=${rentalId}&listingId=${rental?.listingId}&view=true`)}
                      class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Photos ({beforeCheck?.photos?.length || 0})
                    </button>
                  </div>
                {:else}
                  <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-sm text-neutral-500">Not completed</span>
                    </div>
                    <!-- Upload Photos Button for Renter -->
                    {#if rental.renterId === $authStore.user?.uid && rental.status === 'confirmed'}
                      <button
                        on:click={() => goto(`/rentals/${rentalId}/before-pickup`)}
                        class="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                      >
                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Upload Photos
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>

              <!-- After Photos -->
              <div>
                <h3 class="font-semibold text-neutral-900 mb-3">After Return</h3>
                {#if afterCheck}
                  <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-sm text-green-700">Completed</span>
                    </div>
                    <p class="text-sm text-neutral-600">
                      {afterCheck.photos.length} photos uploaded on {formatDateTime(afterCheck.completedAt)}
                    </p>
                    {#if afterCheck.notes}
                      <p class="text-sm text-neutral-700 bg-neutral-50 p-2 rounded">
                        {afterCheck.notes}
                      </p>
                    {/if}
                  </div>
                {:else}
                  <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-sm text-neutral-500">Not completed</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Back Button -->
        <div class="text-center">
          <button
            on:click={() => goto('/dashboard/renter')}
            class="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-colors"
          >
            Back to My Rentals
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
