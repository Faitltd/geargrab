<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'camping', name: 'Camping' },
    { id: 'hiking', name: 'Hiking' },
    { id: 'skiing', name: 'Skiing' },
    { id: 'water', name: 'Water Sports' },
    { id: 'climbing', name: 'Climbing' },
    { id: 'biking', name: 'Biking' }
  ];
  
  export let sortOptions = [
    { id: 'recommended', name: 'Recommended' },
    { id: 'price_low', name: 'Price: Low to High' },
    { id: 'price_high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'newest', name: 'Newest First' }
  ];
  
  export let selectedCategory = 'all';
  export let selectedSort = 'recommended';
  export let priceRange = [0, 500];
  export let showFilters = false;
  
  const dispatch = createEventDispatcher();
  
  function applyFilters() {
    dispatch('filter', {
      category: selectedCategory,
      sort: selectedSort,
      priceRange
    });
    
    if (window.innerWidth < 768) {
      showFilters = false;
    }
  }
  
  function resetFilters() {
    selectedCategory = 'all';
    selectedSort = 'recommended';
    priceRange = [0, 500];
    dispatch('reset');
  }

  function handleCategoryChange(newCategory: string) {
    selectedCategory = newCategory;
    dispatch('filter', { category: selectedCategory, sort: selectedSort });
  }
  
  function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedSort = target.value;
    dispatch('filter', { category: selectedCategory, sort: selectedSort });
  }
</script>

<div class="bg-white shadow-sm border-b sticky top-0 z-10">
  <div class="container mx-auto px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <!-- Mobile filter button -->
        <button 
          class="md:hidden flex items-center text-gray-700 hover:text-gray-900"
          on:click={() => showFilters = !showFilters}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
          </svg>
          Filters
        </button>
        
        <!-- Desktop category selector -->
        <div class="hidden md:block">
          <select 
            bind:value={selectedCategory}
            on:change={handleCategoryChange}
            class="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <!-- Sort selector -->
      <div>
        <select 
          bind:value={selectedSort}
          on:change={handleSortChange}
          class="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-green-500 focus:border-green-500"
        >
          {#each sortOptions as option}
            <option value={option.id}>{option.name}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <!-- Mobile filters panel -->
    {#if showFilters}
      <div class="md:hidden mt-4 border-t pt-4 pb-2">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <div class="grid grid-cols-2 gap-2">
            {#each categories as category}
              <button 
                class="py-2 px-3 text-sm rounded-md border {selectedCategory === category.id ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 text-gray-700'}"
                on:click={() => {
                  selectedCategory = category.id;
                }}
              >
                {category.name}
              </button>
            {/each}
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
          <div class="px-2">
            <input 
              type="range" 
              min="0" 
              max="500" 
              step="10" 
              bind:value={priceRange[1]} 
              class="w-full"
            />
            <div class="flex justify-between text-sm text-gray-500">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            class="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            on:click={applyFilters}
          >
            Apply Filters
          </button>
          <button 
            class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
            on:click={resetFilters}
          >
            Reset
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>