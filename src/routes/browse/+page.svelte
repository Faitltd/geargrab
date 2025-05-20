<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import FilterBar from '$lib/components/forms/FilterBar.svelte';
  import GearGrid from '$lib/components/display/GearGrid.svelte';
  
  let loading = true;
  let listings = [];
  let category = $page.url.searchParams.get('category') || 'all';
  let location = $page.url.searchParams.get('location') || '';
  let sort = 'recommended';
  let showFilters = false;
  
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
    // Simulate API call
    setTimeout(() => {
      listings = filterListings(dummyListings);
      loading = false;
    }, 1000);
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

<HeroSearch 
  query=""
  {category}
  {location}
  on:search={handleSearch}
/>

<FilterBar
  {showFilters}
  selectedCategory={category}
  {sort}
  on:filter={handleFilter}
/>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">
      {category === 'all' ? 'All Outdoor Gear' : 
        category.charAt(0).toUpperCase() + category.slice(1) + ' Gear'}
      {location ? ` in ${location}` : ''}
    </h1>
    <p class="text-gray-600 mt-1">
      {listings.length} items available
    </p>
  </div>
  
  <GearGrid {listings} {loading} />
</div>
