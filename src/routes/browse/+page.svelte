<script lang="ts">
  import { onMount } from 'svelte';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/ScrollLinkedAnimator.svelte';
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import FilterBar from '$lib/components/forms/FilterBar.svelte';
  import GearGrid from '$lib/components/display/GearGrid.svelte';
  import { products } from '$lib/data/products';

  let listings: any[] = [];
  let loading = false;
  let category = 'all';
  let location = '';
  let sort = 'recommended';
  let query = '';

  onMount(async () => {
    // Read URL parameters and set initial state
    const urlParams = new URLSearchParams(window.location.search);
    query = urlParams.get('q') || '';
    category = urlParams.get('category') || 'all';
    location = urlParams.get('location') || '';
    sort = urlParams.get('sort') || 'recommended';

    await performSearch();
  });

  async function performSearch() {
    loading = true;
    try {
      listings = filterListings(products);
    } catch (error) {
      console.error('Search error:', error);
      listings = [];
    } finally {
      loading = false;
    }
  }

  function filterListings(allProducts: any[]): any[] {
    let filtered = [...allProducts];

    if (category && category !== 'all') {
      filtered = filtered.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    if (location && location.trim()) {
      filtered = filtered.filter(product =>
        product.location?.city?.toLowerCase().includes(location.toLowerCase()) ||
        product.location?.state?.toLowerCase().includes(location.toLowerCase())
      );
    }

    switch (sort) {
      case 'price-low':
        filtered.sort((a, b) => a.dailyPrice - b.dailyPrice);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.dailyPrice - a.dailyPrice);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        break;
      default:
        break;
    }

    return filtered;
  }

  function handleSearch(event: CustomEvent) {
    const { query: newQuery, location: newLocation, category: newCategory } = event.detail;

    query = newQuery || '';
    location = newLocation || '';
    category = newCategory || 'all';

    performSearch();

    // Scroll to results section after search
    setTimeout(() => {
      const resultsSection = document.querySelector('.results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  function handleFilterChange(event: CustomEvent) {
    const { category: newCategory, sort: newSort } = event.detail;

    if (newCategory !== undefined) category = newCategory;
    if (newSort !== undefined) sort = newSort;

    performSearch();
  }
</script>

<svelte:head>
  <title>Browse Gear - GearGrab</title>
  <meta name="description" content="Browse and rent outdoor gear from trusted local owners. Find camping, hiking, skiing, and adventure equipment near you." />
</svelte:head>

<!-- Test: VideoBackground Component -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity={0.5}
/>

<!-- Page Content -->
<div class="relative z-10 min-h-screen">
  <!-- Hero Section -->
  <div class="relative min-h-[50vh] flex flex-col text-center text-white px-2 pt-20">
    <div class="flex-1 flex items-center justify-center relative z-30">
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 max-w-4xl mx-auto shadow-lg">
        <ScrollLinkedAnimator animation="scale-in" startOffset={0} endOffset={0.4}>
          <h1 class="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            Find Your Perfect Gear
          </h1>
          <p class="text-xl mb-6 max-w-2xl mx-auto drop-shadow-lg">
            Discover amazing outdoor equipment from trusted local owners.
          </p>
        </ScrollLinkedAnimator>

        <!-- Search Form -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-auto border border-white/20 shadow-lg relative z-40">
          <HeroSearch on:search={handleSearch} />
        </div>
      </div>
    </div>
  </div>

  <!-- Content Section -->
  <div class="results-section relative z-20 bg-gradient-to-b from-transparent to-gray-900/80 px-2 py-8">
    <!-- Filter Bar -->
    <div class="mb-8 relative z-10">
      <FilterBar
        selectedCategory={category}
        selectedSort={sort}
        on:filter={handleFilterChange}
      />
    </div>

    <!-- Results Header -->
    <ScrollLinkedAnimator animation="scale-in" startOffset={0.25} endOffset={0.65}>
      <div class="text-center mb-4">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
          {#if query}
            Search Results for "{query}"
          {:else}
            {category === 'all' ? 'All Outdoor Gear' :
              category.charAt(0).toUpperCase() + category.slice(1) + ' Gear'}
          {/if}
          {location ? ` in ${location}` : ''}
        </h1>
        <p class="text-gray-200 text-lg drop-shadow-lg">
          {listings.length} items available
          {#if query && listings.length === 0}
            - Try adjusting your search terms
          {/if}
        </p>
      </div>
    </ScrollLinkedAnimator>



    <!-- Gear Listings -->
    <div class="mb-16 relative z-50">
      <GearGrid {listings} {loading} />
    </div>

    <!-- Adventure Call-to-Action -->
    <ScrollLinkedAnimator animation="scale-in" startOffset={0.4} endOffset={0.8}>
      <div class="text-center py-16">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-3xl mx-auto border border-white/20 shadow-lg">
          <h2 class="text-4xl font-bold text-white mb-6 drop-shadow-lg">Ready for Your Next Adventure?</h2>
          <p class="text-xl text-gray-200 mb-8 drop-shadow-lg">
            Join thousands of outdoor enthusiasts who trust GearGrab for their gear needs.
          </p>
          <a href="/list-gear" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
            List Your Gear
          </a>
        </div>
      </div>
    </ScrollLinkedAnimator>
  </div>
</div>