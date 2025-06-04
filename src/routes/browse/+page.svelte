<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import FilterBar from '$lib/components/forms/FilterBar.svelte';
  import GearGrid from '$lib/components/display/GearGrid.svelte';
  import ScrollAnimated from '$lib/components/layout/ScrollAnimated.svelte';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';
  import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';

  let heroVisible = false;
  let loading = true;
  let listings = [];
  let allListings = [];
  let category = $page.url.searchParams.get('category') || 'all';
  let location = $page.url.searchParams.get('location') || '';
  let sort = 'recommended';
  let showFilters = false;

  onMount(async () => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);

    // Load real listings from Firestore
    await loadListings();
  });

  async function loadListings() {
    try {
      loading = true;

      // Get all published listings from Firestore
      const listingsRef = collection(firestore, 'listings');
      const q = query(listingsRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      allListings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          dailyPrice: data.dailyPrice,
          images: data.images || [],
          location: {
            city: data.location || 'Unknown',
            state: 'UT' // Default state
          },
          owner: {
            name: data.ownerEmail?.split('@')[0] || 'Owner',
            rating: 4.5, // Default rating
            verified: true
          },
          isPublished: data.isPublished,
          ownerUid: data.ownerUid,
          ownerEmail: data.ownerEmail,
          createdAt: data.createdAt
        };
      });

      // Apply filters
      listings = filterListings(allListings);

    } catch (error) {
      console.error('Error loading listings:', error);
      listings = [];
    } finally {
      loading = false;
    }
  }

  function handleSearch(event: any) {
    const { category: newCategory, location: newLocation } = event.detail;

    // Update URL parameters
    const url = new URL(window.location.href);
    if (newCategory) url.searchParams.set('category', newCategory);
    if (newLocation) url.searchParams.set('location', newLocation);

    // Navigate to the new URL
    goto(url.toString(), { replaceState: true });

    // Update local state
    category = newCategory || category;
    location = newLocation || location;

    // Filter listings
    loading = true;
    setTimeout(() => {
      listings = filterListings(allListings);
      loading = false;
    }, 500);
  }

  function handleFilter(event: any) {
    const { category: newCategory, sort: newSort } = event.detail;

    // Update local state
    category = newCategory || category;
    sort = newSort || sort;

    // Filter and sort listings
    loading = true;
    setTimeout(() => {
      listings = filterListings(allListings);
      loading = false;
    }, 300);
  }

  function filterListings(allListings: any[]) {
    // Filter by category
    let filtered = allListings;
    if (category && category !== 'all') {
      filtered = filtered.filter((listing: any) => listing.category === category);
    }

    // Filter by location
    if (location) {
      filtered = filtered.filter((listing: any) =>
        listing.location.city.toLowerCase().includes(location.toLowerCase()) ||
        listing.location.state.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Sort listings
    if (sort === 'price_low') {
      filtered = filtered.sort((a: any, b: any) => a.dailyPrice - b.dailyPrice);
    } else if (sort === 'price_high') {
      filtered = filtered.sort((a: any, b: any) => b.dailyPrice - a.dailyPrice);
    } else if (sort === 'rating') {
      filtered = filtered.sort((a: any, b: any) => b.owner.rating - a.owner.rating);
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
      <ScrollAnimated animation="fade-up" delay={200}>
        <div class="mb-8">
          <HeroSearch
            query=""
            {category}
            {location}
            on:search={handleSearch}
          />
        </div>
      </ScrollAnimated>

      <ScrollAnimated animation="fade-up" delay={400}>
        <div class="mb-12">
          <FilterBar
            {showFilters}
            selectedCategory={category}
            selectedSort={sort}
            on:filter={handleFilter}
          />
        </div>
      </ScrollAnimated>

      <!-- Page Title and Count -->
      <ScrollAnimated animation="fade-up" delay={600}>
        <div class="mb-8">
          <h1 class="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2 {heroVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'} transition-all duration-800">
            {category === 'all' ? 'All Outdoor Gear' :
              category.charAt(0).toUpperCase() + category.slice(1) + ' Gear'}
            {location ? ` in ${location}` : ''}
          </h1>
          <p class="text-gray-200 text-lg drop-shadow-lg {heroVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0 translate-y-8'} transition-all duration-800">
            {listings.length} items available
          </p>
        </div>
      </ScrollAnimated>

      <!-- Gear Listings -->
      <ScrollAnimated animation="fade-up" delay={800}>
        <div class="mb-16">
          <GearGrid {listings} {loading} />
        </div>
      </ScrollAnimated>

      <!-- Adventure Call-to-Action -->
      <ScrollAnimated animation="scale-in" delay={1000}>
        <div class="text-center text-white">
          <h2 class="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">Adventure Awaits</h2>
          <p class="text-xl max-w-3xl mx-auto drop-shadow-lg">
            Discover amazing outdoor gear from local owners and start your next adventure today.
          </p>
        </div>
      </ScrollAnimated>

    </div>
  </div>
</div>

<style>
  /* Smooth scrolling for better parallax effect */
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
