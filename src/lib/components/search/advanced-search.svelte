<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { locationSearchService, userLocation } from '$lib/services/location-search';
  import type { SearchFilters } from '$lib/services/location-search';
  
  const dispatch = createEventDispatcher<{
    search: SearchFilters;
    locationChange: { lat: number; lng: number; name: string };
  }>();
  
  // Search filters
  let filters: SearchFilters = {
    location: null,
    radius: 25,
    category: '',
    priceMin: 0,
    priceMax: 500,
    availableFrom: '',
    availableTo: '',
    sortBy: 'distance'
  };
  
  // UI state
  let locationInput = '';
  let showAdvanced = false;
  let searching = false;
  let savedLocations: Array<{ lat: number; lng: number; name: string }> = [];
  
  // Categories
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'camping', label: 'Camping' },
    { value: 'hiking', label: 'Hiking' },
    { value: 'climbing', label: 'Climbing' },
    { value: 'skiing', label: 'Skiing' },
    { value: 'biking', label: 'Biking' },
    { value: 'water-sports', label: 'Water Sports' },
    { value: 'photography', label: 'Photography' },
    { value: 'other', label: 'Other' }
  ];
  
  // Sort options
  const sortOptions = [
    { value: 'distance', label: 'Distance' },
    { value: 'price', label: 'Price: Low to High' },
    { value: 'rating', label: 'Rating' },
    { value: 'newest', label: 'Newest First' }
  ];
  
  $: if ($userLocation && !filters.location) {
    filters.location = $userLocation;
    locationInput = 'Current Location';
  }
  
  onMount(async () => {
    // Load saved locations
    savedLocations = await locationSearchService.getSavedLocations();
    
    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    filters.availableFrom = today.toISOString().split('T')[0];
    filters.availableTo = tomorrow.toISOString().split('T')[0];
  });
  
  async function handleLocationSearch() {
    if (!locationInput.trim()) return;
    
    if (locationInput === 'Current Location') {
      const location = await locationSearchService.requestUserLocation();
      if (location) {
        filters.location = location;
        dispatch('locationChange', { ...location, name: 'Current Location' });
      }
      return;
    }
    
    // Geocode the address
    const location = await locationSearchService.geocodeAddress(locationInput);
    if (location) {
      filters.location = location;
      dispatch('locationChange', { ...location, name: locationInput });
    } else {
      alert('Location not found. Please try a different address.');
    }
  }
  
  async function useCurrentLocation() {
    const location = await locationSearchService.requestUserLocation();
    if (location) {
      filters.location = location;
      locationInput = 'Current Location';
      dispatch('locationChange', { ...location, name: 'Current Location' });
    }
  }
  
  function useSavedLocation(savedLocation: { lat: number; lng: number; name: string }) {
    filters.location = { lat: savedLocation.lat, lng: savedLocation.lng };
    locationInput = savedLocation.name;
    dispatch('locationChange', savedLocation);
  }
  
  async function saveCurrentLocation() {
    if (!filters.location || !locationInput) return;
    
    const success = await locationSearchService.saveSearchLocation({
      ...filters.location,
      name: locationInput
    });
    
    if (success) {
      savedLocations = await locationSearchService.getSavedLocations();
      alert('Location saved!');
    }
  }
  
  function performSearch() {
    if (!filters.location) {
      alert('Please select a location first');
      return;
    }
    
    searching = true;
    dispatch('search', { ...filters });
    
    // Reset searching state after a delay
    setTimeout(() => {
      searching = false;
    }, 1000);
  }
  
  function resetFilters() {
    filters = {
      location: $userLocation,
      radius: 25,
      category: '',
      priceMin: 0,
      priceMax: 500,
      availableFrom: '',
      availableTo: '',
      sortBy: 'distance'
    };
    locationInput = $userLocation ? 'Current Location' : '';
    showAdvanced = false;
  }
  
  function formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
  <!-- Main Search Bar -->
  <div class="space-y-4">
    <!-- Location Input -->
    <div class="flex space-x-2">
      <div class="flex-1">
        <label class="block text-sm font-medium text-white mb-2">
          📍 Location
        </label>
        <div class="flex space-x-2">
          <input
            bind:value={locationInput}
            on:keypress={(e) => e.key === 'Enter' && handleLocationSearch()}
            placeholder="Enter city, address, or zip code"
            class="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            on:click={handleLocationSearch}
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            📍
          </button>
          <button
            on:click={useCurrentLocation}
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            title="Use current location"
          >
            🎯
          </button>
        </div>
      </div>
      
      <!-- Radius Slider -->
      <div class="w-32">
        <label class="block text-sm font-medium text-white mb-2">
          📏 Radius: {filters.radius}km
        </label>
        <input
          type="range"
          bind:value={filters.radius}
          min="1"
          max="100"
          step="1"
          class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </div>
    
    <!-- Saved Locations -->
    {#if savedLocations.length > 0}
      <div class="flex flex-wrap gap-2">
        <span class="text-sm text-gray-300">Quick locations:</span>
        {#each savedLocations as location}
          <button
            on:click={() => useSavedLocation(location)}
            class="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
          >
            {location.name}
          </button>
        {/each}
      </div>
    {/if}
    
    <!-- Quick Filters Row -->
    <div class="flex flex-wrap gap-4">
      <!-- Category -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-white mb-1">Category</label>
        <select
          bind:value={filters.category}
          class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {#each categories as category}
            <option value={category.value} class="bg-gray-800">{category.label}</option>
          {/each}
        </select>
      </div>
      
      <!-- Sort By -->
      <div class="flex-1 min-w-[150px]">
        <label class="block text-sm font-medium text-white mb-1">Sort By</label>
        <select
          bind:value={filters.sortBy}
          class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {#each sortOptions as option}
            <option value={option.value} class="bg-gray-800">{option.label}</option>
          {/each}
        </select>
      </div>
      
      <!-- Search Button -->
      <div class="flex items-end">
        <button
          on:click={performSearch}
          disabled={searching || !filters.location}
          class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
        >
          {#if searching}
            <div class="flex items-center space-x-2">
              <div class="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
              <span>Searching...</span>
            </div>
          {:else}
            🔍 Search
          {/if}
        </button>
      </div>
    </div>
    
    <!-- Advanced Filters Toggle -->
    <div class="flex items-center justify-between">
      <button
        on:click={() => showAdvanced = !showAdvanced}
        class="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
      >
        <span>{showAdvanced ? '▼' : '▶'}</span>
        <span>Advanced Filters</span>
      </button>
      
      <div class="flex space-x-2">
        {#if locationInput && filters.location}
          <button
            on:click={saveCurrentLocation}
            class="text-sm text-yellow-400 hover:text-yellow-300"
          >
            💾 Save Location
          </button>
        {/if}
        <button
          on:click={resetFilters}
          class="text-sm text-gray-400 hover:text-gray-300"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  </div>
  
  <!-- Advanced Filters -->
  {#if showAdvanced}
    <div class="mt-6 pt-6 border-t border-white/20 space-y-4">
      <!-- Price Range -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-white mb-1">
            💰 Min Price: ${filters.priceMin}/day
          </label>
          <input
            type="range"
            bind:value={filters.priceMin}
            min="0"
            max="500"
            step="5"
            class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-white mb-1">
            💰 Max Price: ${filters.priceMax}/day
          </label>
          <input
            type="range"
            bind:value={filters.priceMax}
            min="0"
            max="500"
            step="5"
            class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
      
      <!-- Availability Dates -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-white mb-1">
            📅 Available From {formatDate(filters.availableFrom)}
          </label>
          <input
            type="date"
            bind:value={filters.availableFrom}
            class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-white mb-1">
            📅 Available To {formatDate(filters.availableTo)}
          </label>
          <input
            type="date"
            bind:value={filters.availableTo}
            class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
    border: 2px solid #ffffff;
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
    border: 2px solid #ffffff;
  }
</style>
