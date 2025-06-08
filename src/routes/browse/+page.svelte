<script lang="ts">
  import ListingCard3D from '$lib/components/ListingCard3D.svelte';

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

      console.log('Products imported:', products?.length || 0);
      console.log('First product:', products?.[0]);
      console.log('Current filters:', { category, location, query, sort });

      // Use the local products data as the primary source
      listings = filterListings(products);
      totalCount = listings.length;
      hasMore = false;

      console.log('Filtered listings count:', listings.length);
      console.log('First listing:', listings?.[0]);

      // Save search for analytics if there are filters applied
      if (query || category !== 'all') {
        try {
          const filters: SearchFilters = {
            query: query || undefined,
            category: category !== 'all' ? category : undefined,
            sortBy: sort as SearchFilters['sortBy'],
            location: location ? { city: location, state: '' } : undefined,
            limit: 20
          };
          await searchService.saveSearch(query, filters);
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
      location: product.location,
      images: product.images,
      features: product.features,
      specifications: product.specifications,
      // Transform owner data to match expected structure
      averageRating: product.owner.rating,
      reviewCount: product.owner.reviewCount,
      // Add other expected fields
      availabilityCalendar: {
        unavailableDates: product.availability.unavailableDates
      },
      owner: {
        uid: product.owner.id,
        name: product.owner.name,
        image: product.owner.avatar,
        averageRating: product.owner.rating,
        reviews: product.owner.reviewCount
      },
      reviews: product.reviews,
      status: product.status,
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

    // Filter by query (search in title and description)
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm) ||
        listing.description.toLowerCase().includes(searchTerm)
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
