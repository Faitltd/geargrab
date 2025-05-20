<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';

  export let query = '';
  export let category = '';
  export let location = '';
  export let minPrice = '';
  export let maxPrice = '';
  export let showAdvanced = false;

  // Create a local variable to track the selected category in the hero section
  let selectedCategory = category || 'all';
  let selectedLocation = location || '';

  const dispatch = createEventDispatcher();

  // Categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'camping', name: 'Camping' },
    { id: 'hiking', name: 'Hiking' },
    { id: 'skiing', name: 'Skiing' },
    { id: 'water', name: 'Water Sports' },
    { id: 'climbing', name: 'Climbing' },
    { id: 'biking', name: 'Biking' }
  ];

  function handleSubmit() {
    dispatch('search', {
      query,
      category,
      location,
      minPrice,
      maxPrice
    });
  }

  function handleSearch() {
    // Update the category from the selectedCategory
    category = selectedCategory;
    location = selectedLocation;
    
    // Dispatch the search event
    dispatch('search', {
      query,
      category,
      location,
      minPrice,
      maxPrice
    });
  }

  function toggleAdvanced() {
    showAdvanced = !showAdvanced;
  }
</script>

<div class="bg-white rounded-lg shadow-sm p-4 mb-6">
  <form on:submit|preventDefault={handleSubmit}>
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Search query -->
      <div class="flex-1">
        <label for="search-query" class="block text-sm font-medium text-gray-700 mb-1">What are you looking for?</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            id="search-query"
            bind:value={query}
            placeholder="Tents, kayaks, bikes..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
      
      <!-- Category -->
      <div class="w-full md:w-48">
        <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          id="category"
          bind:value={category}
          class="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
        >
          {#each categories as cat}
            <option value={cat.id}>{cat.name}</option>
          {/each}
        </select>
      </div>
      
      <!-- Location -->
      <div class="w-full md:w-48">
        <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          id="location"
          bind:value={location}
          placeholder="City or zip"
          class="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
        />
      </div>
    </div>

    {#if showAdvanced}
      <div class="mt-4">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Min Price -->
          <div class="w-full md:w-48">
            <label for="min-price" class="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
            <input
              type="number"
              id="min-price"
              bind:value={minPrice}
              placeholder="$0"
              class="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <!-- Max Price -->
          <div class="w-full md:w-48">
            <label for="max-price" class="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
            <input
              type="number"
              id="max-price"
              bind:value={maxPrice}
              placeholder="$1000"
              class="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>
    {/if}

    <div class="mt-4 flex justify-between">
      <button
        type="button"
        on:click={toggleAdvanced}
        class="text-sm text-green-600 hover:text-green-700"
      >
        {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
      </button>
      <button
        type="submit"
        class="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
      >
        Search
      </button>
    </div>
  </form>
</div>

<div class="bg-gradient-to-r from-green-700 to-green-900 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-5xl mx-auto">
    <h2 class="text-2xl font-bold text-white mb-6">Find the perfect outdoor gear for your next adventure</h2>
    
    <div class="bg-white p-4 rounded-lg shadow-lg">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select 
            id="category"
            bind:value={selectedCategory}
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            {#each categories as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input 
            type="text" 
            id="location"
            placeholder="City, state, or zip code"
            bind:value={selectedLocation}
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        
        <div class="flex items-end">
          <button 
            type="button"
            on:click={handleSearch}
            class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  </div>
</div>