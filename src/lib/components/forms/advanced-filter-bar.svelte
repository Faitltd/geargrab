<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { GEAR_CATEGORIES, type SearchFilters } from '$lib/services/search';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';

  const dispatch = createEventDispatcher();

  const categories = [
    { id: 'all', name: 'All Categories', icon: '📂' },
    ...Object.entries(GEAR_CATEGORIES).map(([id, category]) => ({
      id,
      name: category.name,
      icon: category.icon
    }))
  ];

  const sortOptions = [
    { id: 'relevance', name: 'Most Relevant' },
    { id: 'price_low', name: 'Price: Low to High' },
    { id: 'price_high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'distance', name: 'Nearest First' },
    { id: 'newest', name: 'Newest First' }
  ];

  const conditionOptions = [
    { id: 'new', name: 'New', color: 'text-green-400' },
    { id: 'excellent', name: 'Excellent', color: 'text-blue-400' },
    { id: 'good', name: 'Good', color: 'text-yellow-400' },
    { id: 'fair', name: 'Fair', color: 'text-orange-400' }
  ];

  const deliveryOptions = [
    { id: 'pickup', name: 'Pickup', icon: '🚗' },
    { id: 'delivery', name: 'Delivery', icon: '🚚' },
    { id: 'shipping', name: 'Shipping', icon: '📦' }
  ];

  // Filter state
  export let selectedCategory = 'all';
  export let selectedSort = 'relevance';
  export let priceRange = [0, 500];
  export let showFilters = false;
  export let selectedConditions: string[] = [];
  export let verifiedOwners = false;
  export let instantBook = false;
  export let minRating = 0;
  export let selectedDeliveryOptions: string[] = [];
  export let maxDistance = 50; // miles

  function applyFilters() {
    const filters: Partial<SearchFilters> = {
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      sortBy: selectedSort as SearchFilters['sortBy'],
      priceRange: {
        min: priceRange[0],
        max: priceRange[1],
        period: 'day'
      },
      condition: selectedConditions.length > 0 ? selectedConditions as any : undefined,
      verifiedOwners: verifiedOwners || undefined,
      instantBook: instantBook || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      deliveryOptions: selectedDeliveryOptions.length > 0 ? selectedDeliveryOptions as any : undefined
    };

    dispatch('filter', filters);

    if (window.innerWidth < 768) {
      showFilters = false;
    }
  }

  function resetFilters() {
    selectedCategory = 'all';
    selectedSort = 'relevance';
    priceRange = [0, 500];
    selectedConditions = [];
    verifiedOwners = false;
    instantBook = false;
    minRating = 0;
    selectedDeliveryOptions = [];
    maxDistance = 50;
    
    dispatch('reset');
  }

  function handleCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedCategory = target.value;
    applyFilters();
  }

  function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedSort = target.value;
    applyFilters();
  }

  function toggleCondition(condition: string) {
    if (selectedConditions.includes(condition)) {
      selectedConditions = selectedConditions.filter(c => c !== condition);
    } else {
      selectedConditions = [...selectedConditions, condition];
    }
    applyFilters();
  }

  function toggleDeliveryOption(option: string) {
    if (selectedDeliveryOptions.includes(option)) {
      selectedDeliveryOptions = selectedDeliveryOptions.filter(o => o !== option);
    } else {
      selectedDeliveryOptions = [...selectedDeliveryOptions, option];
    }
    applyFilters();
  }

  // Get active filter count for display
  $: activeFilterCount = [
    selectedCategory !== 'all' ? 1 : 0,
    selectedConditions.length,
    verifiedOwners ? 1 : 0,
    instantBook ? 1 : 0,
    minRating > 0 ? 1 : 0,
    selectedDeliveryOptions.length,
    priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);
</script>

<!-- Enhanced Filter Bar -->
<div class="relative">
  <!-- Main Filter Bar -->
  <div class="flex justify-center">
    <div class="flex items-center gap-4 px-6 py-3 bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-600">
      <!-- Mobile filter button with active count -->
      <button
        class="md:hidden flex items-center px-3 py-2 border border-gray-600 rounded-md bg-gray-800/70 backdrop-blur-sm text-white hover:bg-gray-700/80 relative"
        on:click={() => showFilters = !showFilters}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
        </svg>
        Filters
        {#if activeFilterCount > 0}
          <span class="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        {/if}
      </button>

      <!-- Desktop category selector -->
      <div class="hidden md:block">
        <select
          bind:value="{selectedCategory}"
          on:change="{handleCategoryChange}"
          class="form-select rounded-md border-gray-600 bg-gray-800/70 backdrop-blur-sm py-2 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {#each categories as category}
            <option value="{category.id}" class="bg-gray-800 text-white">
              {category.icon ? `${category.icon} ` : ''}{category.name}
            </option>
          {/each}
        </select>
      </div>

      <!-- Sort selector -->
      <div>
        <select
          bind:value="{selectedSort}"
          on:change="{handleSortChange}"
          class="form-select rounded-md border-gray-600 bg-gray-800/70 backdrop-blur-sm py-2 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {#each sortOptions as option}
            <option value="{option.id}" class="bg-gray-800 text-white">{option.name}</option>
          {/each}
        </select>
      </div>

      <!-- Desktop quick filters -->
      <div class="hidden lg:flex items-center space-x-2">
        <button
          class="px-3 py-1 text-xs rounded-full border transition-colors {verifiedOwners ? 'bg-green-600 border-green-500 text-white' : 'border-gray-600 text-gray-300 hover:border-gray-500'}"
          on:click={() => { verifiedOwners = !verifiedOwners; applyFilters(); }}
        >
          ✓ Verified
        </button>
        <button
          class="px-3 py-1 text-xs rounded-full border transition-colors {instantBook ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-600 text-gray-300 hover:border-gray-500'}"
          on:click={() => { instantBook = !instantBook; applyFilters(); }}
        >
          ⚡ Instant
        </button>
      </div>

      <!-- Active filter indicator -->
      {#if activeFilterCount > 0}
        <div class="hidden md:flex items-center text-sm text-green-400">
          <span>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
          <button
            class="ml-2 text-gray-400 hover:text-white"
            on:click="{resetFilters}"
            title="Clear all filters"
          >
            ✕
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Mobile Advanced Filters Panel -->
  {#if showFilters}
    <div class="md:hidden mt-4 mx-auto max-w-md">
      <div class="bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600 p-4 space-y-6">

        <!-- Category Selection -->
        <div>
          <div class="block text-sm font-medium text-white mb-3">Category</div>
          <div class="grid grid-cols-2 gap-2" role="group" aria-label="Category selection">
            {#each categories as category}
              <button
                class="py-2 px-3 text-sm rounded-md border transition-colors {selectedCategory === category.id ? 'bg-green-600/80 border-green-500 text-white' : 'border-gray-600 bg-gray-700/50 text-gray-200 hover:border-gray-500'}"
                on:click={() => { selectedCategory = category.id; applyFilters(); }}
                aria-pressed="{selectedCategory === category.id}"
              >
                {category.icon} {category.name}
              </button>
            {/each}
          </div>
        </div>

        <!-- Price Range -->
        <div>
          <div class="block text-sm font-medium text-white mb-3">
            Price Range: ${priceRange[0]} - ${priceRange[1]} per day
          </div>
          <div class="space-y-3">
            <div>
              <label for="price-min" class="text-xs text-gray-400">Min: ${priceRange[0]}</label>
              <input
                id="price-min"
                type="range"
                min="0"
                max="500"
                step="5"
                bind:value="{priceRange[0]}"
                on:change="{applyFilters}"
                class="w-full accent-green-500"
                aria-label="Minimum price"
              />
            </div>
            <div>
              <label for="price-max" class="text-xs text-gray-400">Max: ${priceRange[1]}</label>
              <input
                id="price-max"
                type="range"
                min="0"
                max="500"
                step="5"
                bind:value="{priceRange[1]}"
                on:change="{applyFilters}"
                class="w-full accent-green-500"
                aria-label="Maximum price"
              />
            </div>
          </div>
        </div>

        <!-- Condition -->
        <div>
          <div class="block text-sm font-medium text-white mb-3">Condition</div>
          <div class="grid grid-cols-2 gap-2" role="group" aria-label="Condition selection">
            {#each conditionOptions as condition}
              <button
                class="py-2 px-3 text-sm rounded-md border transition-colors {selectedConditions.includes(condition.id) ? 'bg-green-600/80 border-green-500 text-white' : 'border-gray-600 bg-gray-700/50 text-gray-200 hover:border-gray-500'}"
                on:click={() => toggleCondition(condition.id)}
                aria-pressed="{selectedConditions.includes(condition.id)}"
              >
                <span class="{condition.color}">●</span> {condition.name}
              </button>
            {/each}
          </div>
        </div>

        <!-- Delivery Options -->
        <div>
          <div class="block text-sm font-medium text-white mb-3">Delivery Options</div>
          <div class="space-y-2">
            {#each deliveryOptions as option}
              <Checkbox
                checked="{selectedDeliveryOptions.includes(option.id)}"
                label="{option.icon} {option.name}"
                on:change="{() => toggleDeliveryOption(option.id)}"
              />
            {/each}
          </div>
        </div>

        <!-- Quick Options -->
        <div>
          <div class="block text-sm font-medium text-white mb-3">Quick Options</div>
          <div class="space-y-3">
            <Checkbox
              bind:checked="{verifiedOwners}"
              label="✓ Verified Owners Only"
              on:change="{applyFilters}"
            />
            <Checkbox
              bind:checked="{instantBook}"
              label="⚡ Instant Book Available"
              on:change="{applyFilters}"
            />
          </div>
        </div>

        <!-- Minimum Rating -->
        <div>
          <label for="min-rating" class="block text-sm font-medium text-white mb-3">
            Minimum Rating: {minRating > 0 ? `${minRating}+ stars` : 'Any rating'}
          </label>
          <input
            id="min-rating"
            type="range"
            min="0"
            max="5"
            step="0.5"
            bind:value="{minRating}"
            on:change="{applyFilters}"
            class="w-full accent-green-500"
            aria-label="Minimum rating filter"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>Any</span>
            <span>5★</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3 pt-4 border-t border-gray-700">
          <button
            class="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
            on:click="{applyFilters}"
          >
            Apply Filters
          </button>
          <button
            class="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium"
            on:click="{resetFilters}"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
