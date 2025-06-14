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

  function handleCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedCategory = target.value;
    dispatch('filter', { category: selectedCategory, sort: selectedSort });
  }

  function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedSort = target.value;
    dispatch('filter', { category: selectedCategory, sort: selectedSort });
  }
</script>

<!-- Filter Bar with transparent styling -->
<div class="relative">
  <!-- Centered and smaller filter bar -->
  <div class="flex justify-center">
    <div class="flex items-center gap-4 px-6 py-3 bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-600">
      <!-- Mobile filter button -->
      <button
        class="md:hidden flex items-center px-3 py-2 border border-gray-600 rounded-md bg-gray-800/70 backdrop-blur-sm text-white hover:bg-gray-700/80"
        on:click={() => showFilters = !showFilters}
        data-cy="filter-button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
        </svg>
        Filters
      </button>

      <!-- Desktop category selector -->
      <div class="hidden md:block">
        <select
          bind:value={selectedCategory}
          on:change={handleCategoryChange}
          class="form-select rounded-lg border-gray-600 bg-gray-800/70 backdrop-blur-sm py-3 pl-4 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
        >
          {#each categories as category}
            <option value={category.id} class="bg-gray-800 text-white">{category.name}</option>
          {/each}
        </select>
      </div>

      <!-- Sort selector -->
      <div>
        <select
          bind:value={selectedSort}
          on:change={handleSortChange}
          class="form-select rounded-lg border-gray-600 bg-gray-800/70 backdrop-blur-sm py-3 pl-4 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
          data-cy="sort-select"
        >
          {#each sortOptions as option}
            <option value={option.id} class="bg-gray-800 text-white">{option.name}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

    <!-- Mobile filters panel -->
    {#if showFilters}
      <div class="md:hidden mt-4 mx-auto max-w-md" data-cy="filter-sidebar">
        <div class="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-600 p-4">
          <div class="mb-4">
            <div class="block text-sm font-medium text-white mb-2">Category</div>
            <div class="grid grid-cols-2 gap-2">
              {#each categories as category}
                <button
                  class="py-2 px-3 text-sm rounded-md border {selectedCategory === category.id ? 'bg-green-600/80 border-green-500 text-white' : 'border-gray-600 bg-gray-700/50 text-gray-200'}"
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
            <label for="price-range" class="block text-sm font-medium text-white mb-2">Price Range</label>
            <div class="px-2">
              <input
                id="price-range"
                type="range"
                min="0"
                max="500"
                step="10"
                bind:value={priceRange[1]}
                class="w-full accent-green-500"
              />
              <div class="flex justify-between text-sm text-gray-300">
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
              class="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              on:click={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    {/if}
</div>