<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import { showToast } from '$lib/stores/toast.store';
  import ReviewsList from '$lib/components/reviews/ReviewsList.svelte';
  import StarRating from '$lib/components/reviews/StarRating.svelte';
  import type { ListingData } from '$lib/types';
  
  // State
  let listing: ListingData | null = null;
  let loading = true;
  let error = '';
  let currentImageIndex = 0;
  
  $: listingId = $page.params.id;
  $: user = $authStore.data;
  
  onMount(async () => {
    if (listingId) {
      await loadListing();
    }
  });
  
  async function loadListing() {
    try {
      loading = true;
      error = '';
      
      const response = await fetch(`/api/listings/${listingId}`);
      const data = await response.json();
      
      if (data.success) {
        listing = data.listing;
        
        // Increment view count
        await fetch(`/api/listings/${listingId}/view`, { method: 'POST' });
      } else {
        error = data.error?.message || 'Listing not found';
      }
    } catch (err) {
      error = 'Failed to load listing';
      console.error('Error loading listing:', err);
    } finally {
      loading = false;
    }
  }
  
  function nextImage() {
    if (listing?.images && listing.images.length > 1) {
      currentImageIndex = (currentImageIndex + 1) % listing.images.length;
    }
  }
  
  function prevImage() {
    if (listing?.images && listing.images.length > 1) {
      currentImageIndex = currentImageIndex === 0 
        ? listing.images.length - 1 
        : currentImageIndex - 1;
    }
  }
  
  function handleRentNow() {
    if (!user) {
      showToast('info', 'Please sign in to rent this item');
      goto('/auth/signin');
      return;
    }
    
    if (listing) {
      goto(`/book/${listing.id}`);
    }
  }
  
  function handleContactOwner() {
    if (!user) {
      showToast('info', 'Please sign in to contact the owner');
      goto('/auth/signin');
      return;
    }
    
    if (listing) {
      goto(`/messages/new?listing=${listing.id}&owner=${listing.owner.id}`);
    }
  }
  
  function formatPrice(listing: ListingData): string {
    if (listing.pricing?.rentalPrice?.daily) {
      return `$${listing.pricing.rentalPrice.daily}`;
    }
    if (listing.pricing?.salePrice) {
      return `$${listing.pricing.salePrice}`;
    }
    return 'Price on request';
  }
  
  function formatCondition(condition: string): string {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  }
</script>

<svelte:head>
  <title>{listing?.title || 'Loading...'} - GearGrab</title>
  <meta name="description" content={listing?.description || 'Rent outdoor gear from trusted locals'} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <div class="max-w-4xl mx-auto px-4 py-8">
      <ErrorBanner message={error} />
      <div class="text-center mt-6">
        <button
          on:click={() => goto('/listings/browse')}
          class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Browse Other Listings
        </button>
      </div>
    </div>
  {:else if listing}
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back Button -->
      <button
        on:click={() => window.history.back()}
        class="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to listings
      </button>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Images -->
        <div class="space-y-4">
          <!-- Main Image -->
          <div class="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
            {#if listing.images && listing.images.length > 0}
              <img
                src={listing.images[currentImageIndex]}
                alt={listing.title}
                class="w-full h-full object-cover"
              />
              
              {#if listing.images.length > 1}
                <!-- Navigation Arrows -->
                <button
                  on:click={prevImage}
                  class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  on:click={nextImage}
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <!-- Image Indicators -->
                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {#each listing.images as _, index}
                    <button
                      on:click={() => currentImageIndex = index}
                      class="w-2 h-2 rounded-full {index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}"
                    />
                  {/each}
                </div>
              {/if}
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-gray-200">
                <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            {/if}
          </div>
          
          <!-- Thumbnail Images -->
          {#if listing.images && listing.images.length > 1}
            <div class="grid grid-cols-4 gap-2">
              {#each listing.images.slice(0, 4) as image, index}
                <button
                  on:click={() => currentImageIndex = index}
                  class="aspect-square bg-gray-200 rounded-lg overflow-hidden {index === currentImageIndex ? 'ring-2 ring-primary-500' : ''}"
                >
                  <img
                    src={image}
                    alt={`${listing.title} ${index + 1}`}
                    class="w-full h-full object-cover"
                  />
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Details -->
        <div class="space-y-6">
          <!-- Title and Price -->
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            <div class="flex items-center justify-between">
              <div class="text-3xl font-bold text-primary-600">
                {formatPrice(listing)}
                {#if listing.pricing?.rentalPrice?.daily}
                  <span class="text-lg font-normal text-gray-600">/day</span>
                {/if}
              </div>
              
              {#if listing.location?.address?.city}
                <div class="flex items-center text-gray-600">
                  <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location.address.city}
                </div>
              {/if}
            </div>
          </div>

          <!-- Description -->
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">Description</h2>
            <p class="text-gray-700 leading-relaxed">{listing.description}</p>
          </div>

          <!-- Details Grid -->
          <div class="grid grid-cols-2 gap-4">
            {#if listing.brand}
              <div>
                <span class="text-sm font-medium text-gray-500">Brand</span>
                <p class="text-gray-900">{listing.brand}</p>
              </div>
            {/if}
            
            {#if listing.model}
              <div>
                <span class="text-sm font-medium text-gray-500">Model</span>
                <p class="text-gray-900">{listing.model}</p>
              </div>
            {/if}
            
            <div>
              <span class="text-sm font-medium text-gray-500">Condition</span>
              <p class="text-gray-900">{formatCondition(listing.condition)}</p>
            </div>
            
            <div>
              <span class="text-sm font-medium text-gray-500">Category</span>
              <p class="text-gray-900 capitalize">{listing.category}</p>
            </div>
          </div>

          <!-- Tags -->
          {#if listing.tags && listing.tags.length > 0}
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
              <div class="flex flex-wrap gap-2">
                {#each listing.tags as tag}
                  <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {tag}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="space-y-3">
            {#if listing.availability?.forRent}
              <button
                on:click={handleRentNow}
                class="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Rent Now
              </button>
            {/if}
            
            <button
              on:click={handleContactOwner}
              class="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Contact Owner
            </button>
          </div>

          <!-- Owner Info -->
          {#if listing.owner}
            <div class="border-t pt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Owner</h3>
              <div class="flex items-center space-x-3">
                {#if listing.owner.avatar}
                  <img
                    src={listing.owner.avatar}
                    alt={listing.owner.name}
                    class="w-12 h-12 rounded-full object-cover"
                  />
                {:else}
                  <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                {/if}
                
                <div>
                  <p class="font-medium text-gray-900">{listing.owner.name}</p>
                  {#if listing.owner.rating}
                    <div class="flex items-center">
                      <div class="flex text-yellow-400">
                        {#each Array(5) as _, i}
                          <svg class="w-4 h-4 {i < Math.floor(listing.owner.rating) ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        {/each}
                      </div>
                      <span class="ml-1 text-sm text-gray-600">({listing.owner.rating.toFixed(1)})</span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}

          <!-- Reviews Section -->
          {#if listing}
            <div class="mt-8 pt-8 border-t border-gray-200">
              <div class="mb-6">
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Reviews</h3>
                <p class="text-gray-600 text-sm">See what others are saying about this gear</p>
              </div>

              <ReviewsList
                listingId={listing.id}
                showTitle={false}
                maxReviews={5}
                showViewAllButton={true}
                compact={false}
              />
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
