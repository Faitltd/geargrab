<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import ModernButton from '$lib/components/ui/ModernButton.svelte';
  import GlassInput from '$lib/components/ui/GlassInput.svelte';
  import ProductCard from '$lib/components/ui/ProductCard.svelte';
  
  let searchQuery = '';
  let selectedCategory = 'all';
  let sortBy = 'relevance';
  let viewMode = 'grid';
  let scrollY = 0;
  
  const categories = [
    { id: 'all', name: 'All Categories', count: 1247 },
    { id: 'camping', name: 'Camping', count: 324 },
    { id: 'hiking', name: 'Hiking', count: 289 },
    { id: 'climbing', name: 'Climbing', count: 156 },
    { id: 'cycling', name: 'Cycling', count: 198 },
    { id: 'water-sports', name: 'Water Sports', count: 134 }
  ];
  
  const sortOptions = [
    { id: 'relevance', name: 'Most Relevant' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'price-high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'newest', name: 'Newest First' }
  ];
  
  // Sample products data - one for each category
  const allProducts = [
    // Camping & Hiking
    {
      id: '1',
      title: 'REI Co-op Half Dome 2 Plus Tent',
      description: 'Perfect 2-person tent for backpacking and car camping. Easy to set up, spacious interior, and excellent weather protection.',
      price: 25,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'San Francisco, CA',
      rating: 4.8,
      reviewCount: 23,
      owner: {
        name: 'Alex Johnson',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'camping',
      condition: 'Excellent',
      availability: 'available',
      featured: true
    },

    // Climbing
    {
      id: '2',
      title: 'Black Diamond Solution Climbing Harness',
      description: 'Professional climbing harness with 4 gear loops and belay loop. Comfortable for all-day climbing sessions.',
      price: 15,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Boulder, CO',
      rating: 4.9,
      reviewCount: 31,
      owner: {
        name: 'Mike Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'climbing',
      condition: 'Excellent',
      availability: 'available',
      featured: true
    },

    // Cycling
    {
      id: '3',
      title: 'Trek Fuel EX 8 Mountain Bike',
      description: 'Full suspension mountain bike perfect for trail riding. 29" wheels, 130mm travel, and reliable Shimano components.',
      price: 65,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Moab, UT',
      rating: 4.7,
      reviewCount: 18,
      owner: {
        name: 'Emma Wilson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'cycling',
      condition: 'Very Good',
      availability: 'available',
      featured: true
    },

    // Water Sports
    {
      id: '4',
      title: 'BOTE Flood Aero Inflatable SUP',
      description: 'Premium inflatable stand-up paddleboard. 11\'6" length, ultra-stable design perfect for beginners and experienced paddlers.',
      price: 35,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'San Diego, CA',
      rating: 4.8,
      reviewCount: 27,
      owner: {
        name: 'Jake Martinez',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'water-sports',
      condition: 'Excellent',
      availability: 'available',
      featured: true
    },

    // Winter Sports
    {
      id: '5',
      title: 'Rossignol Experience 88 Ti Skis',
      description: 'All-mountain skis perfect for groomed runs and off-piste adventures. 172cm length, titanium construction for stability.',
      price: 45,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1551524164-6cf2ac2d8c9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Park City, UT',
      rating: 4.6,
      reviewCount: 14,
      owner: {
        name: 'Sophie Anderson',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'winter-sports',
      condition: 'Good',
      availability: 'available',
      featured: true
    },

    // Travel
    {
      id: '6',
      title: 'Patagonia Black Hole Duffel 70L',
      description: 'Durable travel duffel bag perfect for adventure travel. Weather-resistant fabric, multiple carry options.',
      price: 12,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Seattle, WA',
      rating: 4.9,
      reviewCount: 22,
      owner: {
        name: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'travel',
      condition: 'Very Good',
      availability: 'available',
      featured: true
    },
    {
      id: '2',
      title: 'Professional Climbing Harness',
      description: 'High-quality climbing harness with adjustable leg loops and gear loops.',
      price: 25,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Boulder, CO',
      rating: 4.9,
      reviewCount: 18,
      owner: {
        name: 'Mike R.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'climbing',
      condition: 'Like New',
      availability: 'available'
    },
    {
      id: '3',
      title: 'Mountain Bike - Full Suspension',
      description: 'High-performance mountain bike perfect for trail riding and downhill adventures.',
      price: 75,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Moab, UT',
      rating: 4.7,
      reviewCount: 31,
      owner: {
        name: 'Alex K.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'cycling',
      condition: 'Good',
      availability: 'limited'
    }
  ];
  
  let filteredProducts = allProducts;
  
  // Filter products based on current filters
  $: {
    filteredProducts = allProducts.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    // Sort products
    if (sortBy === 'price-low') {
      filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filteredProducts = [...filteredProducts].sort((a, b) => b.rating - a.rating);
    }
  }
  
  const clearFilters = () => {
    searchQuery = '';
    selectedCategory = 'all';
    sortBy = 'relevance';
  };
</script>

<svelte:window bind:scrollY />

<!-- Header with Glass Effect -->
<div class="glass-nav fixed top-0 w-full z-50" class:shadow-lg={scrollY > 10}>
  <Header />
</div>

<!-- Main Content -->
<main class="pt-20 min-h-screen bg-neutral-50">
  <!-- Hero Section -->
  <section class="relative py-20 hero-gradient overflow-hidden">
    <div class="absolute inset-0 opacity-20">
      <div class="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-float"></div>
      <div class="absolute top-40 right-20 w-24 h-24 bg-primary-200 rounded-full animate-float" style="animation-delay: 2s;"></div>
    </div>
    
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 text-shadow-lg">
        Find Your Perfect Gear
      </h1>
      <p class="text-xl text-primary-100 mb-12 max-w-3xl mx-auto">
        Discover thousands of verified outdoor gear rentals from trusted locals
      </p>
      
      <!-- Search Bar -->
      <div class="max-w-2xl mx-auto">
        <GlassInput
          bind:value={searchQuery}
          placeholder="Search for tents, bikes, cameras..."
          variant="glass"
          size="lg"
          icon="fas fa-search"
        />
      </div>
    </div>
  </section>
  
  <!-- Filters & Results -->
  <section class="py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Filter Bar -->
      <div class="flex flex-col lg:flex-row gap-6 mb-8">
        <!-- Categories -->
        <div class="flex-1">
          <div class="flex flex-wrap gap-2">
            {#each categories as category}
              <button
                class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                class:bg-primary-500={selectedCategory === category.id}
                class:text-white={selectedCategory === category.id}
                class:bg-white={selectedCategory !== category.id}
                class:text-neutral-700={selectedCategory !== category.id}
                class:shadow-md={selectedCategory !== category.id}
                class:hover:shadow-lg={selectedCategory !== category.id}
                on:click={() => selectedCategory = category.id}
              >
                {category.name} ({category.count})
              </button>
            {/each}
          </div>
        </div>
        
        <!-- View Toggle & Sort -->
        <div class="flex items-center gap-4">
          <div class="flex bg-white rounded-lg p-1 shadow-md">
            <button
              class="p-2 rounded-md transition-all duration-200"
              class:bg-primary-500={viewMode === 'grid'}
              class:text-white={viewMode === 'grid'}
              class:text-neutral-600={viewMode !== 'grid'}
              on:click={() => viewMode = 'grid'}
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              class="p-2 rounded-md transition-all duration-200"
              class:bg-primary-500={viewMode === 'list'}
              class:text-white={viewMode === 'list'}
              class:text-neutral-600={viewMode !== 'list'}
              on:click={() => viewMode = 'list'}
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          
          <select
            bind:value={sortBy}
            class="bg-white border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {#each sortOptions as option}
              <option value={option.id}>{option.name}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <!-- Results Count -->
      <div class="flex items-center justify-between mb-8">
        <p class="text-neutral-600">
          Showing {filteredProducts.length} results
          {#if searchQuery}for "{searchQuery}"{/if}
        </p>
        
        {#if searchQuery || selectedCategory !== 'all'}
          <ModernButton variant="ghost" size="sm" on:click={clearFilters}>
            Clear Filters
          </ModernButton>
        {/if}
      </div>
      
      <!-- Products Grid -->
      <div 
        class="grid gap-8 animate-fade-in-up"
        class:grid-cols-1={viewMode === 'list'}
        class:md:grid-cols-2={viewMode === 'grid'}
        class:lg:grid-cols-3={viewMode === 'grid'}
        class:xl:grid-cols-4={viewMode === 'grid'}
      >
        {#each filteredProducts as product}
          <ProductCard 
            {product}
            variant={product.featured ? 'featured' : 'default'}
            on:click={() => window.location.href = `/gear/${product.id}`}
            on:favorite={() => console.log('Favorited:', product.id)}
            on:quickRent={() => console.log('Quick rent:', product.id)}
          />
        {/each}
      </div>
      
      <!-- No Results -->
      {#if filteredProducts.length === 0}
        <div class="text-center py-16">
          <div class="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-neutral-900 mb-2">No gear found</h3>
          <p class="text-neutral-600 mb-6">Try adjusting your search or filters</p>
          <ModernButton variant="primary" on:click={clearFilters}>
            Clear All Filters
          </ModernButton>
        </div>
      {/if}
    </div>
  </section>
</main>

<!-- Footer -->
<Footer />
