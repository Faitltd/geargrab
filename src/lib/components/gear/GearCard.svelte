<script lang="ts">
  import type { ListingData } from '$lib/services/listings';
  import { authStore } from '$lib/stores/auth';
  import { getListingPermissions } from '$lib/utils/ownership';
  
  export let listing: ListingData;
  export let showOwnerBadge = false;
  
  $: ({ user } = $authStore);
  $: permissions = getListingPermissions(listing, user);
  
  const formatPrice = (listing: ListingData): string => {
    if (listing.listingType === 'sale') {
      const price = parseFloat(listing.price || '0');
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    } else {
      const price = parseFloat(listing.rentalPrice || '0');
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
      return `${formatted}/${listing.rentalPeriod}`;
    }
  };
  
  const getConditionColor = (condition: string): string => {
    switch (condition.toLowerCase()) {
      case 'new':
        return 'text-green-600';
      case 'excellent':
        return 'text-green-500';
      case 'very good':
        return 'text-blue-500';
      case 'good':
        return 'text-yellow-600';
      case 'fair':
        return 'text-orange-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-neutral-600';
    }
  };
  
  const truncateTitle = (title: string, maxLength = 60): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + '...';
  };
</script>

<!-- GearGrab-Style Gear Card -->
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 group">
  <a href="/gear/{listing.id}" class="block">
    <!-- Image Container (16:9 Aspect Ratio) -->
    <div class="relative aspect-video bg-neutral-100 overflow-hidden">
      {#if listing.imageUrls && listing.imageUrls.length > 0}
        <img
          src={listing.imageUrls[0]}
          alt={listing.title}
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
        />
      {:else}
        <!-- Placeholder Image -->
        <div class="w-full h-full flex items-center justify-center bg-neutral-200">
          <svg class="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      {/if}
      
      <!-- Overlay Badges -->
      <div class="absolute top-3 left-3 flex flex-col space-y-2">
        <!-- Listing Type Badge -->
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-neutral-800 shadow-sm">
          {listing.listingType === 'sale' ? 'For Sale' : 'For Rent'}
        </span>
        
        <!-- Owner Badge -->
        {#if showOwnerBadge && permissions.isOwner}
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500 text-white shadow-sm">
            Your Listing
          </span>
        {/if}
        
        <!-- Status Badge (if not active) -->
        {#if listing.status !== 'active'}
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold 
            {listing.status === 'sold' ? 'bg-blue-500 text-white' :
             listing.status === 'rented' ? 'bg-purple-500 text-white' :
             'bg-neutral-500 text-white'} shadow-sm">
            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          </span>
        {/if}
      </div>
      
      <!-- Image Count Badge -->
      {#if listing.imageUrls && listing.imageUrls.length > 1}
        <div class="absolute bottom-3 right-3">
          <span class="inline-flex items-center px-2 py-1 rounded bg-black bg-opacity-60 text-white text-xs font-medium">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            {listing.imageUrls.length}
          </span>
        </div>
      {/if}
    </div>
    
    <!-- Card Content -->
    <div class="p-4">
      <!-- Title -->
      <h3 class="font-semibold text-neutral-900 mb-2 leading-tight group-hover:text-primary-600 transition-colors">
        {truncateTitle(listing.title)}
      </h3>
      
      <!-- Brand and Category -->
      <div class="flex items-center text-sm text-neutral-600 mb-2">
        {#if listing.brand}
          <span class="font-medium">{listing.brand}</span>
          <span class="mx-2">•</span>
        {/if}
        <span>{listing.category}</span>
      </div>

      <!-- Rating (if available) -->
      {#if listing.reviewStats && listing.reviewStats.totalReviews > 0}
        <div class="flex items-center space-x-1 mb-2">
          <div class="flex items-center">
            {#each [1, 2, 3, 4, 5] as star}
              <svg
                class="w-3 h-3 {star <= Math.round(listing.reviewStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-neutral-300'}"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            {/each}
          </div>
          <span class="text-xs text-neutral-500">
            {listing.reviewStats.averageRating.toFixed(1)} ({listing.reviewStats.totalReviews})
          </span>
        </div>
      {/if}
      
      <!-- Condition and Location -->
      <div class="flex items-center justify-between text-sm mb-3">
        <span class="font-medium {getConditionColor(listing.condition)}">
          {listing.condition}
        </span>
        <span class="text-neutral-500 flex items-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
          {listing.location}
        </span>
      </div>
      
      <!-- Price and Action -->
      <div class="flex items-center justify-between">
        <!-- Price -->
        <div class="flex flex-col">
          <span class="text-xl font-bold text-primary-500">
            {formatPrice(listing)}
          </span>
          {#if listing.listingType === 'sale' && listing.price}
            <!-- Show price per unit if available -->
            <span class="text-xs text-neutral-500">
              {#if listing.size}
                {listing.size}
              {:else if listing.weight}
                {listing.weight}
              {/if}
            </span>
          {/if}
        </div>
        
        <!-- View Details Link -->
        <div class="text-right">
          <span class="inline-flex items-center text-sm font-medium text-primary-500 group-hover:text-primary-600 transition-colors">
            View Details
            <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
      
      <!-- Additional Details (if available) -->
      {#if listing.size || listing.weight}
        <div class="mt-2 pt-2 border-t border-neutral-100">
          <div class="flex items-center space-x-4 text-xs text-neutral-500">
            {#if listing.size}
              <span class="flex items-center">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Size: {listing.size}
              </span>
            {/if}
            {#if listing.weight}
              <span class="flex items-center">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3" />
                </svg>
                {listing.weight}
              </span>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </a>
</div>
