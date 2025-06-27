<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { Sale } from '$lib/types/firestore';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';

  // Import constants dynamically to avoid SSR issues
  let GEAR_CATEGORIES: any[] = [];

  onMount(async () => {
    if (browser) {
      const constants = await import('$lib/constants');
      GEAR_CATEGORIES = [...constants.GEAR_CATEGORIES];
    }
  });

  let sales: Sale[] = [];
  let loading = true;
  let error: string | null = null;

  // Filter state
  let selectedCategory = '';
  let selectedCondition = '';
  let minPrice = '';
  let maxPrice = '';

  // Load sales on mount
  onMount(async () => {
    await loadSales();
  });

  async function loadSales() {
    try {
      loading = true;
      error = null;

      if (!browser) {
        return;
      }

      // Dynamic import to avoid SSR issues
      const { getSales } = await import('$lib/firebase/db/sales');

      const filters: any = {};

      if (selectedCategory) {
        filters.category = selectedCategory;
      }

      if (selectedCondition) {
        filters.condition = [selectedCondition];
      }

      if (minPrice || maxPrice) {
        filters.priceRange = {};
        if (minPrice) filters.priceRange.min = parseFloat(minPrice);
        if (maxPrice) filters.priceRange.max = parseFloat(maxPrice);
      }

      const result = await getSales(filters, 'createdAt', 'desc', 50);
      sales = result.sales;
    } catch (err) {
      console.error('Error loading sales:', err);
      error = 'Failed to load sales. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Reactive filter updates
  $: {
    if (selectedCategory !== undefined || selectedCondition !== undefined || minPrice !== undefined || maxPrice !== undefined) {
      loadSales();
    }
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  function getConditionColor(condition: string): string {
    switch (condition.toLowerCase()) {
      case 'new': return 'text-green-400';
      case 'like new': return 'text-blue-400';
      case 'good': return 'text-yellow-400';
      case 'fair': return 'text-orange-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  function getCategoryIcon(categoryId: string): string {
    const category = GEAR_CATEGORIES.find(cat => cat.id === categoryId);
    return category?.icon || '🎒';
  }
</script>

<svelte:head>
  <title>Browse Gear for Sale - GearGrab</title>
  <meta name="description" content="Browse outdoor gear for sale on GearGrab. Find great deals on camping, hiking, skiing, and other outdoor equipment." />
</svelte:head>

<!-- Video Background -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
/>

<!-- Hero Section -->
<ScrollLinkedAnimator>
  <section class="relative min-h-[50vh] flex items-center justify-center text-center text-white">
    <div class="relative z-10 max-w-4xl mx-auto px-4">
      <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
        Browse Gear <span class="text-green-400">for Sale</span>
      </h1>
      <p class="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
        Find great deals on outdoor gear from fellow adventurers. Buy quality equipment at affordable prices.
      </p>
    </div>
  </section>
</ScrollLinkedAnimator>

<!-- Filters Section -->
<section class="relative py-8">
  <div class="max-w-7xl mx-auto px-4">
    <div class="bg-black/20 backdrop-blur-md rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4">Filter Results</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Category Filter -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Category</label>
          <select
            bind:value={selectedCategory}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {#each GEAR_CATEGORIES as category}
              <option value={category.id}>{category.icon} {category.name}</option>
            {/each}
          </select>
        </div>

        <!-- Condition Filter -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Condition</label>
          <select
            bind:value={selectedCondition}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        <!-- Price Range -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Min Price</label>
          <input
            type="number"
            bind:value={minPrice}
            placeholder="$0"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-white mb-2">Max Price</label>
          <input
            type="number"
            bind:value={maxPrice}
            placeholder="$1000"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Sales Grid -->
<section class="relative py-8 min-h-screen">
  <div class="max-w-7xl mx-auto px-4">
    {#if loading}
      <div class="flex justify-center items-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    {:else if error}
      <div class="text-center py-16">
        <p class="text-red-400 text-lg">{error}</p>
        <button
          on:click={loadSales}
          class="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    {:else if sales.length === 0}
      <div class="text-center py-16">
        <p class="text-white/70 text-lg">No items found matching your criteria.</p>
        <p class="text-white/50 mt-2">Try adjusting your filters or check back later.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each sales as sale}
          <div class="bg-black/20 backdrop-blur-md rounded-lg overflow-hidden hover:bg-black/30 transition-all duration-300 group">
            <!-- Image placeholder -->
            <div class="aspect-video bg-gradient-to-br from-green-400/20 to-blue-400/20 flex items-center justify-center">
              <span class="text-4xl">{getCategoryIcon(sale.category)}</span>
            </div>
            
            <!-- Content -->
            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="text-lg font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2">
                  {sale.title}
                </h3>
                <span class="text-xl font-bold text-green-400 ml-2">
                  {formatPrice(sale.price)}
                </span>
              </div>
              
              <div class="flex items-center justify-between text-sm text-white/70 mb-2">
                <span class={getConditionColor(sale.condition)}>
                  {sale.condition}
                </span>
                <span>{sale.location.city}, {sale.location.state}</span>
              </div>
              
              {#if sale.originalPrice && sale.originalPrice > sale.price}
                <div class="text-sm text-white/50 mb-2">
                  Originally {formatPrice(sale.originalPrice)}
                  <span class="text-green-400 ml-1">
                    ({Math.round((1 - sale.price / sale.originalPrice) * 100)}% off)
                  </span>
                </div>
              {/if}
              
              <p class="text-white/60 text-sm line-clamp-2 mb-3">
                {sale.description}
              </p>
              
              <!-- Delivery options -->
              <div class="flex flex-wrap gap-1 mb-3">
                {#if sale.deliveryOptions?.pickup}
                  <span class="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">Pickup</span>
                {/if}
                {#if sale.deliveryOptions?.shipping}
                  <span class="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">Shipping</span>
                {/if}
                {#if sale.deliveryOptions?.localDelivery}
                  <span class="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Local Delivery</span>
                {/if}
              </div>
              
              <button class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                View Details
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
