<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ListingData } from '$lib/services/listings';
  import { authStore } from '$lib/stores/auth.store';
  import { getListingPermissions } from '$lib/utils/ownership';
  
  export let listing: ListingData;
  export let showActions = true;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const dispatch = createEventDispatcher<{
    buy: { listing: ListingData };
    rent: { listing: ListingData };
    makeOffer: { listing: ListingData };
    addToWishlist: { listing: ListingData };
  }>();
  
  $: ({ user } = $authStore);
  $: permissions = getListingPermissions(listing, user);
  $: isOwner = permissions.isOwner;
  $: canBuy = permissions.canMakeOffer && listing.listingType === 'sale';
  $: canRent = permissions.canRent && listing.listingType === 'rent';
  
  // Size configurations
  const sizeConfig = {
    sm: {
      priceText: 'text-2xl',
      periodText: 'text-base',
      originalText: 'text-sm',
      button: 'px-4 py-2 text-sm',
      spacing: 'space-y-3'
    },
    md: {
      priceText: 'text-3xl',
      periodText: 'text-lg',
      originalText: 'text-base',
      button: 'px-6 py-3 text-base',
      spacing: 'space-y-4'
    },
    lg: {
      priceText: 'text-4xl',
      periodText: 'text-xl',
      originalText: 'text-lg',
      button: 'px-8 py-4 text-lg',
      spacing: 'space-y-6'
    }
  };
  
  $: config = sizeConfig[size];
  
  const formatPrice = (price: string | undefined): string => {
    if (!price) return '$0';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  };
  
  const calculateSavings = (original: string, current: string): number => {
    const originalPrice = parseFloat(original);
    const currentPrice = parseFloat(current);
    
    if (isNaN(originalPrice) || isNaN(currentPrice) || originalPrice <= currentPrice) {
      return 0;
    }
    
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };
  
  // Mock original price for demonstration - in production this would come from listing data
  $: originalPrice = listing.listingType === 'sale' && listing.price 
    ? (parseFloat(listing.price) * 1.3).toString() 
    : undefined;
  
  $: savings = originalPrice && listing.price 
    ? calculateSavings(originalPrice, listing.price) 
    : 0;
  
  const handleBuy = () => {
    dispatch('buy', { listing });
  };
  
  const handleRent = () => {
    dispatch('rent', { listing });
  };
  
  const handleMakeOffer = () => {
    dispatch('makeOffer', { listing });
  };
  
  const handleAddToWishlist = () => {
    dispatch('addToWishlist', { listing });
  };
</script>

<!-- Price Block -->
<div class="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200 {config.spacing}">
  <!-- Status Badge -->
  {#if listing.status !== 'active'}
    <div class="mb-4">
      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        {listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
         listing.status === 'rented' ? 'bg-purple-100 text-purple-800' :
         'bg-neutral-100 text-neutral-800'}">
        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
      </span>
    </div>
  {/if}
  
  <!-- Pricing Section -->
  <div class="mb-6">
    {#if listing.listingType === 'sale'}
      <!-- Sale Price -->
      <div class="flex items-baseline space-x-3 mb-2">
        <span class="font-bold text-primary-500 {config.priceText}">
          {formatPrice(listing.price)}
        </span>
        
        {#if originalPrice && savings > 0}
          <span class="text-neutral-500 line-through {config.originalText}">
            {formatPrice(originalPrice)}
          </span>
        {/if}
      </div>
      
      {#if savings > 0}
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Save {savings}%
          </span>
          <span class="text-sm text-neutral-600">
            vs. retail price
          </span>
        </div>
      {/if}
      
    {:else}
      <!-- Rental Price -->
      <div class="flex items-baseline space-x-2 mb-2">
        <span class="font-bold text-primary-500 {config.priceText}">
          {formatPrice(listing.rentalPrice)}
        </span>
        <span class="text-neutral-600 {config.periodText}">
          / {listing.rentalPeriod}
        </span>
      </div>
      
      <!-- Rental Period Options -->
      <div class="text-sm text-neutral-600">
        <p>Minimum rental: 1 {listing.rentalPeriod}</p>
        {#if listing.availabilityDates && listing.availabilityDates.length > 0}
          <p class="text-green-600 font-medium">Available dates selected</p>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Action Buttons -->
  {#if showActions && !isOwner && listing.status === 'active'}
    <div class="space-y-3">
      {#if listing.listingType === 'sale'}
        <!-- Buy Actions -->
        {#if canBuy}
          <button
            on:click={handleBuy}
            class="w-full bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 {config.button}"
          >
            Buy Now
          </button>
          
          <button
            on:click={handleMakeOffer}
            class="w-full bg-white text-accent-500 font-semibold border-2 border-accent-500 rounded-lg hover:bg-accent-50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 {config.button}"
          >
            Make Offer
          </button>
        {:else}
          <div class="text-center py-4">
            <p class="text-neutral-600 mb-2">This item is not available for purchase</p>
            <p class="text-sm text-neutral-500">
              {listing.status === 'sold' ? 'Already sold' : 
               listing.status === 'inactive' ? 'Currently inactive' : 
               'Not available'}
            </p>
          </div>
        {/if}
        
      {:else}
        <!-- Rent Actions -->
        {#if canRent}
          <button
            on:click={handleRent}
            class="w-full bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 {config.button}"
          >
            Rent This Item
          </button>
        {:else}
          <div class="text-center py-4">
            <p class="text-neutral-600 mb-2">This item is not available for rent</p>
            <p class="text-sm text-neutral-500">
              {listing.status === 'rented' ? 'Currently rented' : 
               listing.status === 'inactive' ? 'Currently inactive' : 
               'Not available'}
            </p>
          </div>
        {/if}
      {/if}
      
      <!-- Secondary Actions -->
      <div class="flex space-x-3">
        <button
          on:click={handleAddToWishlist}
          class="flex-1 bg-white text-neutral-700 font-medium border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 flex items-center justify-center {config.button}"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Save
        </button>
        
        <button
          class="flex-1 bg-white text-neutral-700 font-medium border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 flex items-center justify-center {config.button}"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Share
        </button>
      </div>
    </div>
    
  {:else if isOwner}
    <!-- Owner View -->
    <div class="text-center py-4 bg-primary-50 rounded-lg">
      <p class="text-primary-700 font-medium mb-2">This is your listing</p>
      <p class="text-sm text-primary-600">
        {listing.views || 0} views • Listed {new Date(listing.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
      </p>
    </div>
    
  {:else if listing.status !== 'active'}
    <!-- Inactive Listing -->
    <div class="text-center py-4 bg-neutral-50 rounded-lg">
      <p class="text-neutral-600 font-medium">
        This item is {listing.status}
      </p>
    </div>
  {/if}
  
  <!-- Trust Indicators -->
  <div class="mt-6 pt-6 border-t border-neutral-200">
    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center space-x-4">
        <span class="flex items-center text-green-600">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Secure payment
        </span>
        
        <span class="flex items-center text-blue-600">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Free returns
        </span>
      </div>
    </div>
  </div>
</div>
