<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import FilterBar from '$lib/components/forms/FilterBar.svelte';
  import GearGrid from '$lib/components/display/GearGrid.svelte';
  import ScrollAnimated from '$lib/components/layout/ScrollAnimated.svelte';

  let videoElement: HTMLVideoElement;
  let heroVisible = false;
  let loading = true;
  let listings = [];
  let category = $page.url.searchParams.get('category') || 'all';
  let location = $page.url.searchParams.get('location') || '';
  let sort = 'recommended';
  let showFilters = false;

  // Video event handlers
  function handleVideoLoaded() {
    if (videoElement) {
      videoElement.style.opacity = '1';
    }
  }

  function handleVideoError() {
    if (videoElement) {
      videoElement.style.display = 'none';
    }
  }

  // Dummy listings data
  const dummyListings = [
    {
      id: '1',
      title: 'Premium Camping Tent (4-Person)',
      description: 'Spacious 4-person tent, perfect for family camping trips.',
      category: 'camping',
      dailyPrice: 35,
      images: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
      ],
      location: {
        city: 'Denver',
        state: 'CO'
      },
      condition: 'Like New',
      averageRating: 4.8,
      reviewCount: 12
    },
    {
      id: '2',
      title: 'Mountain Bike - Trek X-Caliber 8',
      description: 'High-quality mountain bike for trail riding.',
      category: 'biking',
      dailyPrice: 45,
      images: [
        'https://images.unsplash.com/photo-1511994298241-608e28f14fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
      ],
      location: {
        city: 'Boulder',
        state: 'CO'
      },
      condition: 'Good',
      averageRating: 4.6,
      reviewCount: 8
    },
    {
      id: '3',
      title: 'Kayak - Wilderness Systems Pungo 120',
      description: 'Stable and comfortable kayak for lake adventures.',
      category: 'water',
      dailyPrice: 50,
      images: [
        'https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80'
      ],
      location: {
        city: 'Fort Collins',
        state: 'CO'
      },
      condition: 'Good',
      averageRating: 4.9,
      reviewCount: 15
    },
    {
      id: '4',
      title: 'Backpacking Set - Complete Kit',
      description: 'Complete backpacking kit including tent, sleeping bag, pad, and cooking equipment.',
      category: 'hiking',
      dailyPrice: 65,
      images: [
        'https://images.unsplash.com/photo-1501554728187-ce583db33af7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
      ],
      location: {
        city: 'Denver',
        state: 'CO'
      },
      condition: 'Excellent',
      averageRating: 4.7,
      reviewCount: 6
    }
  ];

  onMount(() => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);

    // Simulate API call
    setTimeout(() => {
      listings = filterListings(dummyListings);
      loading = false;
    }, 1000);

    // Parallax effect
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxVideo = document.querySelector('.parallax-video') as HTMLElement;

      if (parallaxVideo) {
        const speed = -0.5; // Negative value for proper parallax effect
        parallaxVideo.style.transform = `translateY(${scrolled * speed}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  function handleSearch(event) {
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
      listings = filterListings(dummyListings);
      loading = false;
    }, 500);
  }

  function handleFilter(event) {
    const { category: newCategory, sort: newSort } = event.detail;

    // Update local state
    category = newCategory || category;
    sort = newSort || sort;

    // Filter and sort listings
    loading = true;
    setTimeout(() => {
      listings = filterListings(dummyListings);
      loading = false;
    }, 300);
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
<div class="fixed inset-0 z-0">
  <!-- Background Image (always visible as fallback) -->
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape with stars"
      class="w-full h-full object-cover"
    >
  </div>

  <!-- Video Background (overlays image when loaded) -->
  <video
    bind:this={videoElement}
    class="parallax-video absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
    style="opacity: 1;"
    autoplay
    muted
    loop
    playsinline
    on:loadeddata={handleVideoLoaded}
    on:error={handleVideoError}
    on:loadstart={() => console.log('Browse video load started')}
  >
    <!-- Outdoor gear/equipment video for browse page -->
    <source src="/857134-hd_1280_720_24fps.mp4" type="video/mp4" />
    <!-- Fallback videos -->
    <source src="https://player.vimeo.com/external/291648067.hd.mp4?s=94998971682c6a3267e4cbd19d16a7b6c720f345&profile_id=175" type="video/mp4" />
  </video>

  <!-- Light Overlay for Text Readability -->
  <div class="absolute inset-0 bg-black opacity-30"></div>
</div>

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
  .parallax-video {
    will-change: transform;
    transform-origin: center center;
    min-height: 120vh;
    min-width: 100%;
  }

  /* Smooth scrolling for better parallax effect */
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
