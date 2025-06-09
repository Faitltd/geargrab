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
  let query = $page.url.searchParams.get('q') || '';
  let totalCount = 0;
  let hasMore = false;

  onMount(async () => {
    heroVisible = true;
    await performSearch();
  });

  async function performSearch() {
    loading = true;

    try {
      // Use the local products data as the primary source
      listings = filterListings(products);
      totalCount = listings.length;
      hasMore = false;

      // Save search for analytics if there are filters applied
      if (query || category !== 'all') {
        try {
          const filters: SearchFilters = {
            query,
            category: category !== 'all' ? category : undefined,
            location: location || undefined,
            sort
          };
          await searchService.saveSearch(filters);
        } catch (analyticsError) {
          console.log('Analytics not available:', analyticsError);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fall back to empty listings if products data fails
      listings = [];
      totalCount = 0;
      hasMore = false;
    } finally {
      loading = false;
    }
  }

  function handleSearch(event: CustomEvent) {
    const { query: newQuery, location: newLocation, category: newCategory } = event.detail;
    
    // Update URL parameters
    const url = new URL(window.location.href);
    if (newQuery) url.searchParams.set('q', newQuery);
    else url.searchParams.delete('q');
    
    if (newLocation) url.searchParams.set('location', newLocation);
    else url.searchParams.delete('location');
    
    if (newCategory && newCategory !== 'all') url.searchParams.set('category', newCategory);
    else url.searchParams.delete('category');
    
    goto(url.pathname + url.search, { replaceState: true });
    
    // Update local state
    query = newQuery || '';
    location = newLocation || '';
    category = newCategory || 'all';
    
    // Perform new search with updated filters
    performSearch();
  }

  // Transform products data to match expected listing structure
  function transformProductsToListings(products: any[]) {
    return products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      model: product.model,
      condition: product.condition,
      ageInYears: product.ageInYears,
      dailyPrice: product.dailyPrice,
      weeklyPrice: product.weeklyPrice,
      monthlyPrice: product.monthlyPrice,
      securityDeposit: product.securityDeposit,
      images: product.images,
      location: product.location,
      deliveryOptions: product.deliveryOptions,
      availabilityCalendar: product.availabilityCalendar,
      features: product.features,
      specifications: product.specifications,
      includesInsurance: product.includesInsurance,
      insuranceDetails: product.insuranceDetails,
      averageRating: product.averageRating || 4.5,
      reviewCount: product.reviewCount || Math.floor(Math.random() * 20) + 5,
      totalBookings: product.totalBookings || Math.floor(Math.random() * 50) + 10,
      ownerInfo: product.ownerInfo,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));
  }

  function filterListings(allListings: any[]) {
    // First transform the products to the expected structure
    const transformedListings = transformProductsToListings(allListings);
    let filtered = [...transformedListings];

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(listing => listing.category === category);
    }

    // Filter by search query
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm) ||
        listing.description.toLowerCase().includes(searchTerm) ||
        listing.category.toLowerCase().includes(searchTerm)
      );
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
      filtered = filtered.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sort === 'newest') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }

  function handleFilterChange(event: CustomEvent) {
    const { category: newCategory, location: newLocation, sort: newSort } = event.detail;
    
    category = newCategory;
    location = newLocation;
    sort = newSort;
    
    performSearch();
  }
</script>

<!-- Full Page Video Background -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity={0.5}
/>

<!-- Page Content -->
<div class="relative z-10 min-h-screen">
  <!-- Hero Section -->
  <div class="relative min-h-screen flex flex-col text-center text-white px-4 pt-20">
    <!-- Hero Search -->
    <div class="flex-1 flex items-center justify-center pt-24 relative z-30">
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 max-w-4xl mx-auto shadow-lg">
        <ScrollLinkedAnimator animation="scale-in" startOffset={0} endOffset={0.4}>
          <h1 class="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            Find Your Perfect Gear
          </h1>
          <p class="text-xl mb-6 max-w-2xl mx-auto drop-shadow-lg">
            Discover amazing outdoor equipment from trusted local owners.
          </p>
        </ScrollLinkedAnimator>

        <!-- Search Form - Outside of ScrollLinkedAnimator to avoid stacking context issues -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-auto border border-white/20 shadow-lg relative z-40">
          <HeroSearch on:search={handleSearch} />
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="mb-8 relative z-10">
      <FilterBar
        {category}
        {location}
        {sort}
        on:filterChange={handleFilterChange}
      />
    </div>

    <!-- Results Header -->
    <ScrollLinkedAnimator animation="scale-in" startOffset={0.25} endOffset={0.65}>
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
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

<style>
  /* Ensure scrolling works properly */
  :global(html) {
    scroll-behavior: smooth;
    overflow-y: auto;
  }

  :global(body) {
    overflow-y: auto;
    height: auto;
  }

  /* Ensure the page content can scroll */
  .relative.z-10 {
    position: relative;
    z-index: 10;
  }
</style>