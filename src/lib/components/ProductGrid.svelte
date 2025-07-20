<script lang="ts">
  export let title = "Featured Gear";
  export let subtitle = "";
  export let showFilters = false;
  export let columns = 4; // 1-6 columns
  
  // Sample gear data - in production this would come from props or API
  const gearItems = [
    {
      id: 1,
      name: "Osprey Atmos AG 65 Backpack",
      brand: "Osprey",
      category: "Backpacks",
      price: 45,
      originalPrice: 280,
      rating: 4.8,
      reviewCount: 124,
      location: "Seattle, WA",
      distance: "2.3 miles",
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      features: ["Anti-Gravity Suspension", "65L Capacity", "Integrated Rain Cover"],
      available: true,
      verified: true,
      instantBook: true
    },
    {
      id: 2,
      name: "REI Co-op Half Dome SL 2+ Tent",
      brand: "REI Co-op",
      category: "Tents",
      price: 35,
      originalPrice: 199,
      rating: 4.6,
      reviewCount: 89,
      location: "Portland, OR",
      distance: "5.1 miles",
      images: [
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      features: ["2+ Person", "Freestanding", "Easy Setup"],
      available: true,
      verified: true,
      instantBook: false
    },
    {
      id: 3,
      name: "Patagonia Down Sweater Jacket",
      brand: "Patagonia",
      category: "Jackets",
      price: 25,
      originalPrice: 229,
      rating: 4.9,
      reviewCount: 156,
      location: "Denver, CO",
      distance: "1.8 miles",
      images: [
        "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      features: ["800-Fill Down", "Packable", "DWR Finish"],
      available: true,
      verified: true,
      instantBook: true
    },
    {
      id: 4,
      name: "Black Diamond Spot 400 Headlamp",
      brand: "Black Diamond",
      category: "Lighting",
      price: 8,
      originalPrice: 45,
      rating: 4.7,
      reviewCount: 203,
      location: "Boulder, CO",
      distance: "3.2 miles",
      images: [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      features: ["400 Lumens", "Waterproof", "Red Night Vision"],
      available: true,
      verified: true,
      instantBook: true
    },
    {
      id: 5,
      name: "MSR PocketRocket 2 Stove",
      brand: "MSR",
      category: "Cooking",
      price: 12,
      originalPrice: 55,
      rating: 4.8,
      reviewCount: 167,
      location: "Salt Lake City, UT",
      distance: "4.7 miles",
      images: [
        "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      features: ["Ultralight", "Fast Boil", "Compact"],
      available: false,
      verified: true,
      instantBook: false
    },
    {
      id: 6,
      name: "Therm-a-Rest NeoAir XLite Pad",
      brand: "Therm-a-Rest",
      category: "Sleep Systems",
      price: 18,
      originalPrice: 200,
      rating: 4.5,
      reviewCount: 91,
      location: "Bend, OR",
      distance: "6.3 miles",
      images: [
        "https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ],
      features: ["R-Value 4.2", "Ultralight", "Packable"],
      available: true,
      verified: true,
      instantBook: true
    }
  ];

  const getGridCols = (cols: number) => {
    const colMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    };
    return colMap[cols] || colMap[4];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return { fullStars, hasHalfStar, emptyStars };
  };
</script>

<section class="py-12 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">{title}</h2>
      {#if subtitle}
        <p class="text-lg text-neutral-600 max-w-2xl mx-auto">{subtitle}</p>
      {/if}
    </div>

    <!-- Filters (if enabled) -->
    {#if showFilters}
      <div class="mb-8 flex flex-wrap gap-4 justify-center">
        <button class="px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium">
          All Categories
        </button>
        <button class="px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-full text-sm font-medium transition-colors">
          Backpacks
        </button>
        <button class="px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-full text-sm font-medium transition-colors">
          Tents
        </button>
        <button class="px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-full text-sm font-medium transition-colors">
          Jackets
        </button>
        <button class="px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-full text-sm font-medium transition-colors">
          Sleep Systems
        </button>
      </div>
    {/if}

    <!-- Product Grid -->
    <div class="grid {getGridCols(columns)} gap-6">
      {#each gearItems as item}
        <div class="group bg-white rounded-xl shadow-rei hover:shadow-medium transition-all duration-300 overflow-hidden border border-neutral-100">
          <!-- Image Container -->
          <div class="relative aspect-square overflow-hidden">
            <img 
              src={item.images[0]} 
              alt={item.name}
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-col gap-2">
              {#if item.verified}
                <span class="bg-forest-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Verified
                </span>
              {/if}
              {#if item.instantBook}
                <span class="bg-accent-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                  Instant Book
                </span>
              {/if}
            </div>

            <!-- Availability Status -->
            {#if !item.available}
              <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span class="bg-neutral-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Currently Unavailable
                </span>
              </div>
            {/if}

            <!-- Heart Icon -->
            <button class="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
              <svg class="w-5 h-5 text-neutral-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-4">
            <!-- Brand & Category -->
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-primary-600">{item.brand}</span>
              <span class="text-xs text-neutral-500">{item.category}</span>
            </div>

            <!-- Title -->
            <h3 class="font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {item.name}
            </h3>

            <!-- Rating -->
            <div class="flex items-center mb-3">
              <div class="flex items-center">
                {#each Array(renderStars(item.rating).fullStars) as _}
                  <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                {/each}
                {#if renderStars(item.rating).hasHalfStar}
                  <svg class="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
                    <defs>
                      <linearGradient id="half-star">
                        <stop offset="50%" stop-color="currentColor" />
                        <stop offset="50%" stop-color="transparent" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                {/if}
                {#each Array(renderStars(item.rating).emptyStars) as _}
                  <svg class="w-4 h-4 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                {/each}
              </div>
              <span class="ml-2 text-sm text-neutral-600">
                {item.rating} ({item.reviewCount})
              </span>
            </div>

            <!-- Location -->
            <div class="flex items-center text-sm text-neutral-600 mb-3">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {item.location} • {item.distance}
            </div>

            <!-- Price -->
            <div class="flex items-center justify-between">
              <div class="flex items-baseline">
                <span class="text-2xl font-bold text-neutral-900">{formatPrice(item.price)}</span>
                <span class="text-sm text-neutral-600 ml-1">/day</span>
              </div>
              <div class="text-right">
                <div class="text-xs text-neutral-500 line-through">
                  Retail: {formatPrice(item.originalPrice)}
                </div>
                <div class="text-xs text-forest-600 font-medium">
                  Save {Math.round((1 - item.price / item.originalPrice * 7) * 100)}%
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <button 
              class="w-full mt-4 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors duration-200 {!item.available ? 'opacity-50 cursor-not-allowed' : ''}"
              disabled={!item.available}
            >
              {item.available ? (item.instantBook ? 'Book Now' : 'Request Booking') : 'Unavailable'}
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Load More Button -->
    <div class="text-center mt-12">
      <button class="inline-flex items-center px-8 py-3 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-colors duration-200">
        Load More Gear
        <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
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
