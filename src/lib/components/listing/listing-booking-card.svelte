<script lang="ts">
  import type { Listing } from '$lib/services/listing';
  import { listingService } from '$lib/services/listing';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import AuthGuard from '$lib/components/auth/auth-guard.svelte';

  export let listing: Listing;
  export let startDate: string = '';
  export let endDate: string = '';
  export let deliveryMethod: string = 'pickup';
  export let insuranceTier: string = 'none';
  export let rentalPeriod: string = 'daily';
  export let handleBooking: () => void;
  export let handleStartDateClick: (e: Event) => void;
  export let handleEndDateClick: (e: Event) => void;

  const formatCurrency = listingService.formatCurrency;

  // Calculate derived values
  $: days = startDate && endDate ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) : 0;
  $: serviceFee = days > 0 ? Math.max(5, days * 2) : 0;
  $: deliveryFee = deliveryMethod === 'dropoff' ? 10 : deliveryMethod === 'shipping' ? 15 : 0;
  $: insuranceFee = days > 0 ? (insuranceTier === 'basic' ? days * 5 : insuranceTier === 'standard' ? days * 10 : insuranceTier === 'premium' ? days * 15 : 0) : 0;
  
  $: basePrice = (() => {
    if (days <= 0) return 0;
    if (rentalPeriod === 'weekly') return (listing.weeklyPrice || listing.dailyPrice * 7) * Math.ceil(days / 7);
    if (rentalPeriod === 'monthly') return (listing.monthlyPrice || listing.dailyPrice * 30) * Math.ceil(days / 30);
    return listing.dailyPrice * days;
  })();
  
  $: totalPrice = basePrice + serviceFee + deliveryFee + insuranceFee;
</script>

<ScrollLinkedAnimator animation="fade-right" startOffset="{0.3}" endOffset="{0.9}">
  <div class="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-w-2xl mx-auto hover:bg-white/25 transition-all duration-300">
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="text-2xl font-bold text-green-400">{formatCurrency(listing.dailyPrice)}<span class="text-white/70 text-base font-normal">/day</span></div>
          {#if listing.weeklyPrice}
            <div class="text-sm text-white/70">
              {formatCurrency(listing.weeklyPrice)}/week · {formatCurrency(listing.monthlyPrice)}/month
            </div>
          {/if}
        </div>
        {#if listing.securityDeposit && listing.securityDeposit > 0}
          <div class="text-sm text-white/70 text-right">
            {formatCurrency(listing.securityDeposit)} <br />security deposit
          </div>
        {/if}
      </div>

      <!-- Booking Form -->
      <form class="space-y-4">
        <!-- Rental Period -->
        <fieldset>
          <legend class="block text-sm font-medium text-white mb-2">Rental Period</legend>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'daily' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
              on:click={() => rentalPeriod = 'daily'}
              aria-pressed={rentalPeriod === 'daily'}
            >
              Daily
            </button>
            <button
              type="button"
              class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'weekly' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
              on:click={() => rentalPeriod = 'weekly'}
              aria-pressed={rentalPeriod === 'weekly'}
            >
              Weekly
            </button>
            <button
              type="button"
              class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'monthly' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
              on:click={() => rentalPeriod = 'monthly'}
              aria-pressed={rentalPeriod === 'monthly'}
            >
              Monthly
            </button>
          </div>
        </fieldset>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="start-date" class="block text-sm font-medium text-white mb-2">Start Date</label>
            <input
              type="date"
              id="start-date"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent cursor-pointer"
              bind:value={startDate}
              min={new Date().toISOString().split('T')[0]}
              on:click={handleStartDateClick}
            />
          </div>
          <div>
            <label for="end-date" class="block text-sm font-medium text-white mb-2">End Date</label>
            <input
              type="date"
              id="end-date"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent cursor-pointer"
              bind:value={endDate}
              min={startDate || new Date().toISOString().split('T')[0]}
              on:click={handleEndDateClick}
            />
          </div>
        </div>

        <!-- Transfer Method -->
        <fieldset>
          <legend class="block text-sm font-medium text-white mb-2">Transfer Method</legend>
          <div class="space-y-3">
            {#if listing.deliveryOptions.pickup}
              <div class="flex items-center">
                <input
                  type="radio"
                  id="pickup"
                  name="delivery"
                  value="pickup"
                  class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                  bind:group="{deliveryMethod}"
                />
                <label for="pickup" class="ml-3 block text-sm text-white">Pickup ({listing.deliveryOptions.pickupLocation})</label>
              </div>
            {/if}

            {#if listing.deliveryOptions.dropoff}
              <div class="flex items-center">
                <input
                  type="radio"
                  id="dropoff"
                  name="delivery"
                  value="dropoff"
                  class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                  bind:group="{deliveryMethod}"
                />
                <label for="dropoff" class="ml-3 block text-sm text-white">Delivery (within {listing.deliveryOptions.dropoffDistance} miles)</label>
              </div>
            {/if}

            {#if listing.deliveryOptions.shipping}
              <div class="flex items-center">
                <input
                  type="radio"
                  id="shipping"
                  name="delivery"
                  value="shipping"
                  class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                  bind:group="{deliveryMethod}"
                />
                <label for="shipping" class="ml-3 block text-sm text-white">Shipping</label>
              </div>
            {/if}
          </div>
        </fieldset>

        <!-- Insurance -->
        <fieldset>
          <legend class="block text-sm font-medium text-white mb-2">Insurance</legend>
          <div class="space-y-3">
            <div class="flex items-center">
              <input
                type="radio"
                id="insurance-none"
                name="insurance"
                value="none"
                class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                bind:group="{insuranceTier}"
              />
              <label for="insurance-none" class="ml-3 block text-sm text-white">No additional insurance</label>
            </div>

            <div class="flex items-center">
              <input
                type="radio"
                id="insurance-basic"
                name="insurance"
                value="basic"
                class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                bind:group="{insuranceTier}"
              />
              <label for="insurance-basic" class="ml-3 block text-sm text-white">Basic ($5/day)</label>
            </div>

            <div class="flex items-center">
              <input
                type="radio"
                id="insurance-standard"
                name="insurance"
                value="standard"
                class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                bind:group="{insuranceTier}"
              />
              <label for="insurance-standard" class="ml-3 block text-sm text-white">Standard ($10/day)</label>
            </div>

            <div class="flex items-center">
              <input
                type="radio"
                id="insurance-premium"
                name="insurance"
                value="premium"
                class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                bind:group="{insuranceTier}"
              />
              <label for="insurance-premium" class="ml-3 block text-sm text-white">Premium ($15/day)</label>
            </div>
          </div>
        </fieldset>

        {#if days > 0}
          <div class="border-t border-white/20 pt-4 mt-4">
            <div class="space-y-2 text-white">
              {#if rentalPeriod === 'daily'}
                <div class="flex justify-between">
                  <span>{formatCurrency(listing.dailyPrice)} × {days} days</span>
                  <span>{formatCurrency(listing.dailyPrice * days)}</span>
                </div>
              {:else if rentalPeriod === 'weekly'}
                <div class="flex justify-between">
                  <span>{formatCurrency(listing.weeklyPrice)} × {Math.ceil(days / 7)} weeks</span>
                  <span>{formatCurrency(listing.weeklyPrice * Math.ceil(days / 7))}</span>
                </div>
              {:else}
                <div class="flex justify-between">
                  <span>{formatCurrency(listing.monthlyPrice)} × {Math.ceil(days / 30)} months</span>
                  <span>{formatCurrency(listing.monthlyPrice * Math.ceil(days / 30))}</span>
                </div>
              {/if}

              <div class="flex justify-between">
                <span>Service fee</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>

              {#if deliveryFee > 0}
                <div class="flex justify-between">
                  <span>{deliveryMethod === 'dropoff' ? 'Delivery fee' : 'Shipping fee'}</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              {/if}

              {#if insuranceFee > 0}
                <div class="flex justify-between">
                  <span>Insurance ({insuranceTier})</span>
                  <span>{formatCurrency(insuranceFee)}</span>
                </div>
              {/if}

              <div class="flex justify-between font-bold pt-2 border-t border-white/20 text-green-400">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        {/if}

        <AuthGuard message="You must be signed in to rent gear. Create an account to book this item and enjoy secure rentals with verified owners.">
          <button
            type="button"
            class="w-full bg-green-400 hover:bg-green-500 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={handleBooking}
            disabled={!startDate || !endDate}
          >
            Book Now
          </button>
        </AuthGuard>
      </form>
    </div>
  </div>
</ScrollLinkedAnimator>
