<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ProximityToggle from './ProximityToggle.svelte';
  import type { Coordinates } from '$lib/utils/geolocation';

  export let filters: {
    category: string;
    listingType: string;
    condition: string;
    priceMin: string;
    priceMax: string;
    location: string;
    sortBy: string;
    nearby: boolean;
    nearbyRadius: number;
    userLocation: Coordinates | null;
  };
  
  export let resultCount = 0;
  export let loading = false;
  
  const dispatch = createEventDispatcher<{
    filtersChange: typeof filters;
    clear: void;
  }>();
  
  // Filter options
  const categories = [
    'All Categories',
    'Backpacks & Bags',
    'Tents & Shelters', 
    'Sleeping Bags & Pads',
    'Hiking & Camping',
    'Climbing Gear',
    'Water Sports',
    'Winter Sports',
    'Cycling',
    'Footwear',
    'Clothing',
    'Electronics',
    'Cooking & Hydration',
    'Safety & Navigation',
    'Other'
  ];
  
  const conditions = [
    'All Conditions',
    'New',
    'Excellent',
    'Very Good', 
    'Good',
    'Fair',
    'Poor'
  ];
  
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'title', label: 'Title A-Z' }
  ];
  
  // Reactive updates
  $: dispatch('filtersChange', filters);
  
  const clearFilters = () => {
    filters = {
      category: '',
      listingType: '',
      condition: '',
      priceMin: '',
      priceMax: '',
      location: '',
      sortBy: 'newest',
      nearby: false,
      nearbyRadius: 25,
      userLocation: null
    };
    dispatch('clear');
  };

  const handleProximityChange = (event: CustomEvent) => {
    const { enabled, location, radius } = event.detail;
    filters.nearby = enabled;
    filters.nearbyRadius = radius;
    filters.userLocation = location;
  };
  
  // Check if any filters are active
  $: hasActiveFilters = !!(
    filters.category ||
    filters.listingType ||
    filters.condition ||
    filters.priceMin ||
    filters.priceMax ||
    filters.location ||
    filters.nearby ||
    filters.sortBy !== 'newest'
  );
</script>

<!-- Sticky Filter Bar -->
<div class="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
  <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <!-- Main Filter Row -->
    <div class="flex flex-wrap items-center gap-3 lg:gap-4">
      <!-- Category Filter -->
      <div class="min-w-0 flex-1 sm:flex-none sm:w-48">
        <label class="sr-only" for="category-filter">Category</label>
        <select
          id="category-filter"
          bind:value={filters.category}
          class="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none cursor-pointer"
          style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 4 5\'%3E%3Cpath fill=\'%23666\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 8px center; background-size: 12px;"
        >
          {#each categories as category}
            <option value={category === 'All Categories' ? '' : category}>
              {category}
            </option>
          {/each}
        </select>
      </div>
      
      <!-- Type Filter -->
      <div class="min-w-0 flex-1 sm:flex-none sm:w-32">
        <label class="sr-only" for="type-filter">Listing Type</label>
        <select
          id="type-filter"
          bind:value={filters.listingType}
          class="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none cursor-pointer"
          style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 4 5\'%3E%3Cpath fill=\'%23666\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 8px center; background-size: 12px;"
        >
          <option value="">All Types</option>
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
        </select>
      </div>
      
      <!-- Condition Filter -->
      <div class="min-w-0 flex-1 sm:flex-none sm:w-36">
        <label class="sr-only" for="condition-filter">Condition</label>
        <select
          id="condition-filter"
          bind:value={filters.condition}
          class="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none cursor-pointer"
          style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 4 5\'%3E%3Cpath fill=\'%23666\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 8px center; background-size: 12px;"
        >
          {#each conditions as condition}
            <option value={condition === 'All Conditions' ? '' : condition}>
              {condition}
            </option>
          {/each}
        </select>
      </div>
      
      <!-- Price Range -->
      <div class="flex items-center space-x-2">
        <label class="sr-only" for="price-min">Minimum Price</label>
        <input
          id="price-min"
          type="number"
          bind:value={filters.priceMin}
          placeholder="Min $"
          min="0"
          step="1"
          class="w-20 px-2 py-2.5 text-sm border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <span class="text-neutral-400 text-sm">to</span>
        <label class="sr-only" for="price-max">Maximum Price</label>
        <input
          id="price-max"
          type="number"
          bind:value={filters.priceMax}
          placeholder="Max $"
          min="0"
          step="1"
          class="w-20 px-2 py-2.5 text-sm border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>
      
      <!-- Location Search -->
      <div class="min-w-0 flex-1 sm:flex-none sm:w-40">
        <label class="sr-only" for="location-filter">Location</label>
        <input
          id="location-filter"
          type="text"
          bind:value={filters.location}
          placeholder="Location"
          class="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>
      
      <!-- Proximity Toggle -->
      <div class="min-w-0 flex-1 sm:flex-none">
        <ProximityToggle
          enabled={filters.nearby}
          radiusMiles={filters.nearbyRadius}
          userLocation={filters.userLocation}
          size="md"
          on:change={handleProximityChange}
        />
      </div>

      <!-- Sort -->
      <div class="min-w-0 flex-1 sm:flex-none sm:w-40">
        <label class="sr-only" for="sort-filter">Sort By</label>
        <select
          id="sort-filter"
          bind:value={filters.sortBy}
          class="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none cursor-pointer"
          style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 4 5\'%3E%3Cpath fill=\'%23666\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 8px center; background-size: 12px;"
        >
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      
      <!-- Clear Filters Button -->
      {#if hasActiveFilters}
        <button
          on:click={clearFilters}
          class="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-800 border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-colors flex items-center space-x-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Clear</span>
        </button>
      {/if}
    </div>
    
    <!-- Results Count and Active Filters -->
    <div class="mt-3 flex items-center justify-between">
      <!-- Results Count -->
      <div class="text-sm text-neutral-600">
        {#if loading}
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        {:else}
          <span class="font-medium">{resultCount}</span>
          {resultCount === 1 ? 'item' : 'items'} found
        {/if}
      </div>
      
      <!-- Active Filters Summary -->
      {#if hasActiveFilters && !loading}
        <div class="flex items-center space-x-2 text-sm">
          <span class="text-neutral-500">Filters:</span>
          <div class="flex flex-wrap gap-1">
            {#if filters.category}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {filters.category}
              </span>
            {/if}
            {#if filters.listingType}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {filters.listingType === 'sale' ? 'For Sale' : 'For Rent'}
              </span>
            {/if}
            {#if filters.condition}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {filters.condition}
              </span>
            {/if}
            {#if filters.priceMin || filters.priceMax}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                ${filters.priceMin || '0'} - ${filters.priceMax || '∞'}
              </span>
            {/if}
            {#if filters.location}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                📍 {filters.location}
              </span>
            {/if}
            {#if filters.nearby}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                📍 Nearby ({filters.nearbyRadius} mi)
              </span>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
