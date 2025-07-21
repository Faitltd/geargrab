<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ListingData } from '$lib/services/listings';
  import { authStore } from '$lib/stores/auth.store';
  import { getListingPermissions } from '$lib/utils/ownership';
  
  export let listing: ListingData;
  export let showContactButton = true;
  export let showRating = true;
  
  const dispatch = createEventDispatcher<{
    contact: { listing: ListingData };
    viewProfile: { ownerId: string };
  }>();
  
  $: ({ user } = $authStore);
  $: permissions = getListingPermissions(listing, user);
  $: isOwner = permissions.isOwner;
  $: canContact = permissions.canContact && showContactButton;
  
  // Mock owner data - in production, this would come from a user profile service
  $: ownerData = {
    name: listing.ownerEmail?.split('@')[0] || 'Anonymous',
    email: listing.ownerEmail,
    joinDate: 'Member since 2023',
    rating: 4.8,
    reviewCount: 24,
    responseTime: 'Usually responds within 2 hours',
    verifiedEmail: true,
    verifiedPhone: false,
    location: listing.location
  };
  
  const handleContact = () => {
    dispatch('contact', { listing });
  };
  
  const handleViewProfile = () => {
    dispatch('viewProfile', { ownerId: listing.ownerId });
  };
  
  const formatJoinDate = (dateString: string) => {
    // In production, this would format an actual date
    return dateString;
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };
</script>

<!-- Owner Info Card -->
<div class="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200">
  <!-- Card Header -->
  <div class="flex items-start justify-between mb-6">
    <h3 class="text-lg font-semibold text-neutral-900">
      {isOwner ? 'Your Listing' : 'Listed by'}
    </h3>
    
    {#if isOwner}
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        Owner
      </span>
    {/if}
  </div>
  
  <!-- Owner Profile -->
  <div class="flex items-start space-x-4 mb-6">
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div class="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
        {getInitials(ownerData.name)}
      </div>
    </div>
    
    <!-- Owner Details -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center space-x-2 mb-1">
        <h4 class="text-lg font-semibold text-neutral-900 truncate">
          {ownerData.name}
        </h4>
        
        <!-- Verification Badges -->
        <div class="flex items-center space-x-1">
          {#if ownerData.verifiedEmail}
            <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center" title="Email verified">
              <svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          {/if}
          
          {#if ownerData.verifiedPhone}
            <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center" title="Phone verified">
              <svg class="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Rating and Reviews -->
      {#if showRating && ownerData.rating}
        <div class="flex items-center space-x-2 mb-2">
          <div class="flex items-center">
            {#each Array(5) as _, i}
              <svg 
                class="w-4 h-4 {i < Math.floor(ownerData.rating) ? 'text-yellow-400' : 'text-neutral-300'}" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            {/each}
          </div>
          <span class="text-sm font-medium text-neutral-700">{ownerData.rating}</span>
          <span class="text-sm text-neutral-500">({ownerData.reviewCount} reviews)</span>
        </div>
      {/if}
      
      <!-- Member Info -->
      <div class="space-y-1 text-sm text-neutral-600">
        <p>{formatJoinDate(ownerData.joinDate)}</p>
        <p class="flex items-center">
          <svg class="w-4 h-4 mr-1 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {ownerData.location}
        </p>
        {#if ownerData.responseTime}
          <p class="flex items-center text-green-600">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {ownerData.responseTime}
          </p>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Action Buttons -->
  <div class="flex flex-col sm:flex-row gap-3">
    {#if canContact}
      <button
        on:click={handleContact}
        class="flex-1 bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Contact Seller
      </button>
    {/if}
    
    <button
      on:click={handleViewProfile}
      class="flex-1 bg-white text-neutral-700 px-6 py-3 rounded-lg font-medium border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 flex items-center justify-center"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      View Profile
    </button>
  </div>
  
  <!-- Trust & Safety -->
  <div class="mt-6 pt-6 border-t border-neutral-200">
    <div class="flex items-center justify-between text-sm">
      <span class="text-neutral-600">Trust & Safety</span>
      <div class="flex items-center space-x-4">
        <span class="flex items-center text-green-600">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Identity verified
        </span>
        
        <button class="text-primary-500 hover:text-primary-600 font-medium">
          Report listing
        </button>
      </div>
    </div>
  </div>
</div>
