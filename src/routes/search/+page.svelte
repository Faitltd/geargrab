<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import ProductGrid from '$lib/components/ProductGrid.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let searchQuery = '';
  let selectedCategory = 'all';
  let priceRange = [0, 500];
  let location = '';
  let radius = 25;
  let sortBy = 'relevance';
  let showFilters = false;

  // Get search query from URL params
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    searchQuery = urlParams.get('q') || '';
    selectedCategory = urlParams.get('category') || 'all';
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'camping-hiking', label: 'Camping & Hiking' },
    { value: 'climbing', label: 'Climbing' },
    { value: 'cycling', label: 'Cycling' },
    { value: 'water-sports', label: 'Water Sports' },
    { value: 'winter-sports', label: 'Winter Sports' },
    { value: 'travel', label: 'Travel' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'distance', label: 'Distance' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' }
  ];

  const handleSearch = () => {
    // Update URL and trigger search
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (location) params.set('location', location);
    params.set('radius', radius.toString());
    params.set('sort', sortBy);
    
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    // Trigger search API call here
  };

  const clearFilters = () => {
    selectedCategory = 'all';
    priceRange = [0, 500];
    location = '';
    radius = 25;
    sortBy = 'relevance';
    handleSearch();
  };
</script>

<svelte:head>
  <title>Search Gear - GearGrab</title>
  <meta name="description" content="Find the perfect outdoor gear for your next adventure. Search thousands of verified rentals by category, location, and price." />
</svelte:head>

<Header />

<main class="min-h-screen bg-neutral-50">
  <!-- Search Header -->
  <div class="bg-white border-b border-neutral-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col lg:flex-row lg:items-center gap-4">
        <!-- Search Input -->
        <div class="flex-1">
          <div class="relative">
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search for gear..."
              class="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              on:keydown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-6 w-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Quick Filters -->
        <div class="flex items-center gap-4">
          <select 
            bind:value={selectedCategory}
            on:change={handleSearch}
            class="px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {#each categories as category}
              <option value={category.value}>{category.label}</option>
            {/each}
          </select>

          <button
            on:click={() => showFilters = !showFilters}
            class="flex items-center px-4 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>

          <button
            on:click={handleSearch}
            class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar Filters -->
      <aside class="lg:w-80 {showFilters ? 'block' : 'hidden lg:block'}">
        <div class="bg-white rounded-xl shadow-rei p-6 sticky top-24">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-neutral-900">Filters</h3>
            <button
              on:click={clearFilters}
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <!-- Location Filter -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-neutral-700 mb-2">Location</label>
            <input
              type="text"
              bind:value={location}
              placeholder="Enter city or zip code"
              class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div class="mt-3">
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                Radius: {radius} miles
              </label>
              <input
                type="range"
                bind:value={radius}
                min="5"
                max="100"
                step="5"
                class="w-full"
              />
            </div>
          </div>

          <!-- Price Range -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              Price Range: ${priceRange[0]} - ${priceRange[1]} per day
            </label>
            <div class="flex items-center gap-4">
              <input
                type="number"
                bind:value={priceRange[0]}
                min="0"
                max="1000"
                class="w-20 px-2 py-1 border border-neutral-300 rounded text-sm"
              />
              <span class="text-neutral-500">to</span>
              <input
                type="number"
                bind:value={priceRange[1]}
                min="0"
                max="1000"
                class="w-20 px-2 py-1 border border-neutral-300 rounded text-sm"
              />
            </div>
          </div>

          <!-- Gear Features -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-neutral-700 mb-3">Features</label>
            <div class="space-y-2">
              {#each ['Instant Book', 'Verified Owner', 'Free Delivery', 'Insurance Included', 'Recently Added'] as feature}
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                  <span class="ml-2 text-sm text-neutral-700">{feature}</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Condition -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-neutral-700 mb-3">Condition</label>
            <div class="space-y-2">
              {#each ['Like New', 'Excellent', 'Very Good', 'Good'] as condition}
                <label class="flex items-center">
                  <input type="checkbox" class="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                  <span class="ml-2 text-sm text-neutral-700">{condition}</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Apply Filters Button -->
          <button
            on:click={handleSearch}
            class="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1">
        <!-- Results Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-neutral-900">
              {#if searchQuery}
                Search results for "{searchQuery}"
              {:else}
                All Gear
              {/if}
            </h1>
            <p class="text-neutral-600 mt-1">1,247 items found</p>
          </div>

          <!-- Sort Options -->
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-neutral-700">Sort by:</label>
            <select 
              bind:value={sortBy}
              on:change={handleSearch}
              class="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {#each sortOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Results Grid -->
        <ProductGrid 
          title=""
          subtitle=""
          columns={3}
          showFilters={false}
        />
      </div>
    </div>
  </div>
</main>

<Footer />
