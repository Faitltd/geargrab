<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import FilterBar from '$lib/components/forms/FilterBar.svelte';
  import GearGrid from '$lib/components/display/GearGrid.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/ScrollLinkedAnimator.svelte';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';
  import { searchService, type SearchFilters } from '$lib/services/search';
  import { products } from '$lib/data/products';

  let heroVisible = false;
  let loading = true;
  let listings: any[] = [];
  let category = $page.url.searchParams.get('category') || 'all';
  let location = $page.url.searchParams.get('location') || '';
  let sort = 'recommended';
  let showFilters = false;
  let query = $page.url.searchParams.get('q') || '';
  let totalCount = 0;
  let hasMore = false;

  onMount(() => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);

    // Load initial search results
    performSearch();
  });

  async function performSearch() {
    try {
      loading = true;

      const filters: SearchFilters = {
        query: query || undefined,
        category: category !== 'all' ? category : undefined,
        sortBy: sort as SearchFilters['sortBy'],
        location: location ? { city: location, state: '' } : undefined,
        limit: 20
      };

      const results = await searchService.search(filters);
      listings = results.results;
      totalCount = results.totalCount;
      hasMore = results.hasMore;

      // Save search for analytics
      if (query || category !== 'all') {
        await searchService.saveSearch(query, filters);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fall back to mock data
      listings = filterListings(products);
      totalCount = listings.length;
      hasMore = false;
    } finally {
      loading = false;
    }
  }

  function handleSearch(event: any) {
    const { category: newCategory, location: newLocation, query: newQuery } = event.detail;

    // Update URL parameters
    const url = new URL(window.location.href);
    if (newCategory) url.searchParams.set('category', newCategory);
    if (newLocation) url.searchParams.set('location', newLocation);
    if (newQuery) url.searchParams.set('q', newQuery);

    // Navigate to the new URL
    goto(url.toString(), { replaceState: true });

    // Update local state
    category = newCategory || category;
    location = newLocation || location;
    query = newQuery || query;

    // Perform new search
    performSearch();
  }

  function handleFilter(event: any) {
    const { category: newCategory, sort: newSort } = event.detail;

    // Update local state
    category = newCategory || category;
    sort = newSort || sort;

    // Perform new search with updated filters
    performSearch();
  }

  function filterListings(allListings) {
    // Filter by category
    let filtered = allListings;
    if (category && category !== 'all') {
      filtered = filtered.filter(listing => listing.category === category);
    }

    // Filter by location
    if (location) {
      filtered = filtered.filter(listing =>
        listing.location.city.toLowerCase().includes(location.toLowerCase()) ||
        listing.location.state.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Sort listings
    if (sort === 'price_low') {
      filtered = filtered.sort((a, b) => a.dailyPrice - b.dailyPrice);
    } else if (sort === 'price_high') {
      filtered = filtered.sort((a, b) => b.dailyPrice - a.dailyPrice);
    } else if (sort === 'rating') {
      filtered = filtered.sort((a, b) => b.owner.rating - a.owner.rating);
    }

    return filtered;
  }
</script>

<svelte:head>
  <title>Browse Gear | GearGrab</title>
  <meta name="description" content="Browse outdoor gear for rent from local owners. Find camping, hiking, skiing, and other outdoor equipment." />
</svelte:head>

<!-- Full Page Video Background -->
<VideoBackground
  videoSrc="/857134-hd_1280_720_24fps.mp4"
  overlayOpacity={0.3}
/>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen">
  <!-- Content Section -->
  <div class="relative pt-20 pb-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Search and Filter Section -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0} endOffset={0.4}>
        <div class="mb-8">
          <HeroSearch
            {query}
            {category}
            {location}
            on:search={handleSearch}
          />
        </div>
      </ScrollLinkedAnimator>

      <ScrollLinkedAnimator animation="scale-in" startOffset={0.1} endOffset={0.5}>
        <div class="mb-12">
          <FilterBar
            {showFilters}
            selectedCategory={category}
            selectedSort={sort}
            on:filter={handleFilter}
          />
        </div>
      </ScrollLinkedAnimator>

      <!-- Page Title and Count -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.2} endOffset={0.6}>
        <div class="mb-8">
          <h1 class="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
            {category === 'all' ? 'All Outdoor Gear' :
              category.charAt(0).toUpperCase() + category.slice(1) + ' Gear'}
            {location ? ` in ${location}` : ''}
          </h1>
          <p class="text-gray-200 text-lg drop-shadow-lg">
            {listings.length} items available
          </p>
        </div>
      </ScrollLinkedAnimator>

      <!-- Gear Listings -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.3} endOffset={0.7}>
        <div class="mb-16">
          <GearGrid {listings} {loading} />
        </div>
      </ScrollLinkedAnimator>

      <!-- Adventure Call-to-Action -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.4} endOffset={0.8}>
        <div class="text-center text-white">
          <h2 class="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">Adventure Awaits</h2>
          <p class="text-xl max-w-3xl mx-auto drop-shadow-lg">
            Discover amazing outdoor gear from local owners and start your next adventure today.
          </p>
        </div>
      </ScrollLinkedAnimator>

    </div>
  </div>
</div>

<style>
  /* Smooth scrolling for better parallax effect */
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
