<script>
  import { createEventDispatcher } from 'svelte';
  
  export let filters = {
    query: '',
    category: '',
    subcategory: '',
    city: '',
    state: '',
    min_price: '',
    max_price: '',
    condition: '',
    brand: '',
    delivery_options: [],
    instant_book: false,
    sort_by: 'created_at',
    latitude: null,
    longitude: null,
    radius: 50
  };
  
  const dispatch = createEventDispatcher();
  
  let showAdvancedFilters = false;
  let locationPermission = null;
  
  // Categories and subcategories
  const categories = {
    'camping': ['Tents', 'Sleeping Bags', 'Backpacks', 'Cooking Gear', 'Lighting'],
    'climbing': ['Ropes', 'Harnesses', 'Helmets', 'Shoes', 'Protection'],
    'water-sports': ['Kayaks', 'Paddleboards', 'Wetsuits', 'Life Jackets', 'Paddles'],
    'winter-sports': ['Skis', 'Snowboards', 'Boots', 'Poles', 'Helmets'],
    'cycling': ['Mountain Bikes', 'Road Bikes', 'Helmets', 'Accessories', 'Tools'],
    'hiking': ['Backpacks', 'Boots', 'Trekking Poles', 'Navigation', 'Clothing']
  };
  
  const conditions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];
  
  const deliveryOptions = [
    { value: 'pickup', label: 'Pickup' },
    { value: 'delivery', label: 'Local Delivery' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'meetup', label: 'Meet Halfway' }
  ];
  
  const sortOptions = [
    { value: 'created_at', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'distance', label: 'Distance (requires location)' },
    { value: 'rating', label: 'Highest Rated' }
  ];
  
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  function handleSearch() {
    dispatch('search', filters);
  }
  
  function clearFilters() {
    filters = {
      query: '',
      category: '',
      subcategory: '',
      city: '',
      state: '',
      min_price: '',
      max_price: '',
      condition: '',
      brand: '',
      delivery_options: [],
      instant_book: false,
      sort_by: 'created_at',
      latitude: null,
      longitude: null,
      radius: 50
    };
    dispatch('search', filters);
  }
  
  function handleDeliveryOptionChange(option, checked) {
    if (checked) {
      filters.delivery_options = [...filters.delivery_options, option];
    } else {
      filters.delivery_options = filters.delivery_options.filter(opt => opt !== option);
    }
  }
  
  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      filters.latitude = position.coords.latitude;
      filters.longitude = position.coords.longitude;
      locationPermission = 'granted';
      
      // Auto-search with location
      handleSearch();
      
    } catch (error) {
      console.error('Error getting location:', error);
      locationPermission = 'denied';
      alert('Unable to get your location. Please enter a city or state to search nearby.');
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <!-- Main Search Bar -->
  <div class="flex flex-col lg:flex-row gap-4 mb-6">
    <div class="flex-1">
      <input
        type="text"
        bind:value={filters.query}
        placeholder="Search for gear (e.g., tent, kayak, camera)..."
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        on:keydown={(e) => e.key === 'Enter' && handleSearch()}
      />
    </div>
    
    <div class="flex gap-2">
      <button
        type="button"
        on:click={getCurrentLocation}
        class="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        title="Use my location"
        aria-label="Use my current location"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </button>
      
      <button
        type="button"
        on:click={handleSearch}
        class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Search
      </button>
    </div>
  </div>
  
  <!-- Quick Filters -->
  <div class="flex flex-wrap gap-2 mb-4">
    <select
      bind:value={filters.category}
      on:change={handleSearch}
      class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      <option value="">All Categories</option>
      {#each Object.keys(categories) as category}
        <option value={category}>{category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
      {/each}
    </select>
    
    <select
      bind:value={filters.sort_by}
      on:change={handleSearch}
      class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      {#each sortOptions as option}
        <option value={option.value} disabled={option.value === 'distance' && !filters.latitude}>
          {option.label}
        </option>
      {/each}
    </select>
    
    <button
      type="button"
      on:click={() => showAdvancedFilters = !showAdvancedFilters}
      class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      {showAdvancedFilters ? 'Hide' : 'More'} Filters
    </button>
    
    <button
      type="button"
      on:click={clearFilters}
      class="px-3 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
    >
      Clear All
    </button>
  </div>
  
  <!-- Advanced Filters -->
  {#if showAdvancedFilters}
    <div class="border-t pt-4 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Subcategory -->
        <div>
          <label for="subcategory" class="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
          <select
            id="subcategory"
            bind:value={filters.subcategory}
            disabled={!filters.category}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Subcategories</option>
            {#if filters.category && categories[filters.category]}
              {#each categories[filters.category] as subcategory}
                <option value={subcategory}>{subcategory}</option>
              {/each}
            {/if}
          </select>
        </div>
        
        <!-- Location -->
        <div>
          <label for="filter-city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            id="filter-city"
            type="text"
            bind:value={filters.city}
            placeholder="Enter city"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label for="filter-state" class="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            id="filter-state"
            bind:value={filters.state}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All States</option>
            {#each states as state}
              <option value={state}>{state}</option>
            {/each}
          </select>
        </div>
        
        <!-- Price Range -->
        <div>
          <label for="min-price" class="block text-sm font-medium text-gray-700 mb-1">Min Price/Day</label>
          <input
            id="min-price"
            type="number"
            bind:value={filters.min_price}
            placeholder="$0"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label for="max-price" class="block text-sm font-medium text-gray-700 mb-1">Max Price/Day</label>
          <input
            id="max-price"
            type="number"
            bind:value={filters.max_price}
            placeholder="$1000"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <!-- Condition -->
        <div>
          <label for="condition" class="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <select
            id="condition"
            bind:value={filters.condition}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Any Condition</option>
            {#each conditions as condition}
              <option value={condition.value}>{condition.label}</option>
            {/each}
          </select>
        </div>
        
        <!-- Brand -->
        <div>
          <label for="filter-brand" class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input
            id="filter-brand"
            type="text"
            bind:value={filters.brand}
            placeholder="Enter brand name"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      
      <!-- Delivery Options -->
      <div>
        <div class="block text-sm font-medium text-gray-700 mb-2">Delivery Options</div>
        <div class="flex flex-wrap gap-3">
          {#each deliveryOptions as option}
            <label class="flex items-center">
              <input
                type="checkbox"
                checked={filters.delivery_options.includes(option.value)}
                on:change={(e) => handleDeliveryOptionChange(option.value, e.target.checked)}
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">{option.label}</span>
            </label>
          {/each}
        </div>
      </div>
      
      <!-- Instant Book -->
      <div>
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={filters.instant_book}
            class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <span class="ml-2 text-sm text-gray-700">Instant Book Only</span>
        </label>
      </div>
      
      <!-- Search Button -->
      <div class="pt-4">
        <button
          type="button"
          on:click={handleSearch}
          class="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  {/if}
</div>
