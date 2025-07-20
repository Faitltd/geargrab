<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { 
    getNextAction, 
    formatRentalDates, 
    getRentalDuration,
    type RentalData 
  } from '$lib/services/rentals';

  export let rental: RentalData;
  export let compact: boolean = false;

  const dispatch = createEventDispatcher<{
    action: { rental: RentalData; action: any };
    view: { rentalId: string };
  }>();

  const handleAction = () => {
    const nextAction = getNextAction(rental);
    dispatch('action', { rental, action: nextAction });
  };

  const handleView = () => {
    dispatch('view', { rentalId: rental.id! });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Computed values
  $: nextAction = getNextAction(rental);
  $: statusColorClass = getStatusColor(rental.status);
  $: statusLabel = getStatusLabel(rental.status);
  $: rentalDates = formatRentalDates(rental);
  $: duration = getRentalDuration(rental);
  $: hasImage = rental.listingImageUrl && rental.listingImageUrl.length > 0;
  $: deliveryLabel = rental.deliveryOption === 'delivery' ? 'Delivery' : 'Pickup';
  $: insuranceLabel = rental.insuranceOption ? 'With Insurance' : 'No Insurance';
</script>

<div 
  class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-200 {compact ? 'p-4' : ''}"
>
  {#if !compact}
    <!-- Full Card Layout -->
    <!-- Image Section -->
    <div class="relative aspect-video bg-neutral-100">
      {#if hasImage}
        <img
          src={rental.listingImageUrl}
          alt={rental.listingTitle}
          class="w-full h-full object-cover cursor-pointer"
          on:click={handleView}
          loading="lazy"
        />
      {:else}
        <!-- Placeholder Image -->
        <div 
          class="w-full h-full flex items-center justify-center bg-neutral-200 cursor-pointer"
          on:click={handleView}
        >
          <svg class="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      {/if}

      <!-- Status Badge -->
      <div class="absolute top-3 left-3">
        <span class="px-2 py-1 text-xs font-semibold rounded-full {statusColorClass}">
          {statusLabel}
        </span>
      </div>

      <!-- Urgent Action Badge -->
      {#if nextAction.urgent}
        <div class="absolute top-3 right-3">
          <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">
            Action Required
          </span>
        </div>
      {/if}
    </div>

    <!-- Content Section -->
    <div class="p-4">
      <!-- Title -->
      <h3 
        class="font-semibold text-neutral-900 mb-2 leading-tight cursor-pointer hover:text-primary-600 transition-colors line-clamp-2"
        on:click={handleView}
      >
        {rental.listingTitle}
      </h3>

      <!-- Rental Details -->
      <div class="space-y-2 mb-4">
        <!-- Dates -->
        <div class="flex items-center text-sm text-neutral-600">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0h6" />
          </svg>
          <span>{rentalDates} ({duration} {duration === 1 ? 'day' : 'days'})</span>
        </div>

        <!-- Delivery Option -->
        <div class="flex items-center text-sm text-neutral-600">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>{deliveryLabel} • {insuranceLabel}</span>
        </div>

        <!-- Total Cost -->
        <div class="flex items-center text-sm text-neutral-600">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span class="font-semibold">${rental.totalCost.toFixed(2)}</span>
        </div>
      </div>

      <!-- Next Action -->
      {#if nextAction.type !== 'none'}
        <div class="bg-neutral-50 rounded-lg p-3 mb-4">
          <div class="flex items-start space-x-2">
            <div class="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-neutral-900">
                {nextAction.label}
              </p>
              <p class="text-xs text-neutral-600 mt-1">
                {nextAction.description}
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex space-x-2">
        <button
          on:click={handleView}
          class="flex-1 px-3 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
        >
          View Details
        </button>
        {#if nextAction.url}
          <button
            on:click={handleAction}
            class="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors {
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
  {:else}
    <!-- Compact Card Layout -->
    <div class="flex items-center space-x-4">
      <!-- Thumbnail -->
      <div class="flex-shrink-0 w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden">
        {#if hasImage}
          <img
            src={rental.listingImageUrl}
            alt={rental.listingTitle}
            class="w-full h-full object-cover cursor-pointer"
            on:click={handleView}
            loading="lazy"
          />
        {:else}
          <div 
            class="w-full h-full flex items-center justify-center bg-neutral-200 cursor-pointer"
            on:click={handleView}
          >
            <svg class="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 
              class="font-semibold text-neutral-900 cursor-pointer hover:text-primary-600 transition-colors truncate"
              on:click={handleView}
            >
              {rental.listingTitle}
            </h3>
            <p class="text-sm text-neutral-600 mt-1">
              {rentalDates} • ${rental.totalCost.toFixed(2)}
            </p>
            {#if nextAction.type !== 'none'}
              <p class="text-xs text-neutral-500 mt-1">
                {nextAction.description}
              </p>
            {/if}
          </div>

          <div class="flex items-center space-x-2 ml-4">
            <!-- Status Badge -->
            <span class="px-2 py-1 text-xs font-semibold rounded-full {statusColorClass}">
              {statusLabel}
            </span>

            <!-- Action Button -->
            {#if nextAction.url}
              <button
                on:click={handleAction}
                class="px-2 py-1 text-xs font-medium rounded transition-colors {
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
      </div>
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
