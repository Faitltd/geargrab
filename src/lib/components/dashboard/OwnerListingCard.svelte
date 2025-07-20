<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import type { ListingData, ListingStatus } from '$lib/types';

  export let listing: ListingData;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    edit: { listingId: string };
    delete: { listingId: string; listingTitle: string };
    view: { listingId: string };
    duplicate: { listingId: string };
    statusChange: { status: ListingStatus };
  }>();

  let showActions = false;

  const handleEdit = () => {
    if (disabled) return;
    dispatch('edit', { listingId: listing.id! });
  };

  const handleDelete = () => {
    if (disabled) return;
    dispatch('delete', { 
      listingId: listing.id!, 
      listingTitle: listing.title 
    });
  };

  const handleView = () => {
    dispatch('view', { listingId: listing.id! });
  };

  const handleDuplicate = () => {
    if (disabled) return;
    dispatch('duplicate', { listingId: listing.id! });
  };

  const handleStatusToggle = () => {
    if (disabled) return;
    const newStatus: ListingStatus = listing.status === 'active' ? 'inactive' : 'active';
    dispatch('statusChange', { status: newStatus });
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (listing: ListingData) => {
    if (listing.listingType === 'sale') {
      return listing.price ? `$${listing.price}` : 'Price not set';
    } else {
      const price = listing.rentalPrice || '0';
      const period = listing.rentalPeriod || 'day';
      return `$${price}/${period}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'rented':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'sold':
        return 'Sold';
      case 'rented':
        return 'Rented';
      default:
        return status;
    }
  };

  // Computed values
  $: primaryImage = listing.imageUrls?.[0] || '';
  $: hasImages = listing.imageUrls && listing.imageUrls.length > 0;
  $: statusColorClass = getStatusColor(listing.status);
  $: statusLabel = getStatusLabel(listing.status);
  $: formattedPrice = formatPrice(listing);
  $: createdDate = formatDate(listing.createdAt);
  $: viewCount = listing.views || 0;
  $: averageRating = listing.reviewStats?.averageRating || 0;
  $: totalReviews = listing.reviewStats?.totalReviews || 0;
</script>

<div 
  class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-200 {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
  on:mouseenter={() => showActions = true}
  on:mouseleave={() => showActions = false}
>
  <!-- Image Section -->
  <div class="relative aspect-video bg-neutral-100">
    {#if hasImages}
      <img
        src={primaryImage}
        alt={listing.title}
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

    <!-- Type Badge -->
    <div class="absolute top-3 right-3">
      <span class="px-2 py-1 text-xs font-semibold rounded-full bg-white text-neutral-800 shadow-sm">
        {listing.listingType === 'sale' ? 'For Sale' : 'For Rent'}
      </span>
    </div>

    <!-- Action Buttons Overlay -->
    {#if showActions && !disabled}
      <div 
        class="absolute inset-0 bg-black/20 flex items-center justify-center space-x-2"
        transition:fade={{ duration: 150 }}
      >
        <!-- View Button -->
        <button
          on:click={handleView}
          class="p-2 bg-white/90 hover:bg-white text-neutral-700 rounded-full shadow-sm transition-colors"
          title="View listing"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

        <!-- Edit Button -->
        <button
          on:click={handleEdit}
          class="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm transition-colors"
          title="Edit listing"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <!-- Duplicate Button -->
        <button
          on:click={handleDuplicate}
          class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm transition-colors"
          title="Duplicate listing"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <!-- Status Toggle Button -->
        <button
          on:click={handleStatusToggle}
          class="p-2 {listing.status === 'active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-full shadow-sm transition-colors"
          title="{listing.status === 'active' ? 'Deactivate listing' : 'Activate listing'}"
        >
          {#if listing.status === 'active'}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {/if}
        </button>

        <!-- Delete Button -->
        <button
          on:click={handleDelete}
          class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors"
          title="Delete listing"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
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
      {listing.title}
    </h3>

    <!-- Category and Brand -->
    <div class="flex items-center text-sm text-neutral-600 mb-2">
      {#if listing.brand}
        <span class="font-medium">{listing.brand}</span>
        <span class="mx-2">•</span>
      {/if}
      <span>{listing.category}</span>
    </div>

    <!-- Price -->
    <div class="text-lg font-bold text-neutral-900 mb-3">
      {formattedPrice}
    </div>

    <!-- Stats Row -->
    <div class="flex items-center justify-between text-sm text-neutral-500 mb-3">
      <!-- Views -->
      <div class="flex items-center space-x-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>{viewCount} views</span>
      </div>

      <!-- Rating (if available) -->
      {#if totalReviews > 0}
        <div class="flex items-center space-x-1">
          <svg class="w-4 h-4 text-yellow-400 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span>{averageRating.toFixed(1)} ({totalReviews})</span>
        </div>
      {/if}
    </div>

    <!-- Created Date -->
    <div class="text-xs text-neutral-500">
      Created {createdDate}
    </div>
  </div>

  <!-- Action Buttons (Mobile) -->
  <div class="p-4 pt-0 sm:hidden">
    <div class="flex space-x-2">
      <button
        on:click={handleView}
        disabled={disabled}
        class="flex-1 px-3 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-50 disabled:cursor-not-allowed text-neutral-700 rounded-lg transition-colors"
      >
        View
      </button>
      <button
        on:click={handleEdit}
        disabled={disabled}
        class="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        Edit
      </button>
      <button
        on:click={handleDelete}
        disabled={disabled}
        class="px-3 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        Delete
      </button>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
