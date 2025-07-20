<script lang="ts">
  const categories = [
    {
      name: "Camping & Hiking",
      href: "/categories/camping-hiking",
      icon: "🏕️",
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Tents, backpacks, sleeping bags & more",
      itemCount: 2847
    },
    {
      name: "Climbing",
      href: "/categories/climbing",
      icon: "🧗",
      image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Ropes, harnesses, shoes & protection",
      itemCount: 1256
    },
    {
      name: "Cycling",
      href: "/categories/cycling",
      icon: "🚴",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Bikes, helmets, accessories & tools",
      itemCount: 1834
    },
    {
      name: "Water Sports",
      href: "/categories/water-sports",
      icon: "🏄",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Kayaks, SUPs, wetsuits & safety gear",
      itemCount: 892
    },
    {
      name: "Winter Sports",
      href: "/categories/winter-sports",
      icon: "⛷️",
      image: "https://images.unsplash.com/photo-1551524164-6cf2ac2d8c9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Skis, snowboards, boots & winter gear",
      itemCount: 1467
    },
    {
      name: "Travel",
      href: "/categories/travel",
      icon: "🎒",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Luggage, travel accessories & electronics",
      itemCount: 743
    }
  ];

  const formatItemCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };
</script>

<section class="py-16 bg-neutral-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
        Shop by Category
      </h2>
      <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
        Find the perfect gear for your next adventure. From weekend camping trips to epic mountain expeditions.
      </p>
    </div>

    <!-- Category Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each categories as category}
        <a 
          href={category.href}
          class="group relative bg-white rounded-xl overflow-hidden shadow-rei hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1"
        >
          <!-- Image Container -->
          <div class="relative h-48 overflow-hidden">
            <img 
              src={category.image} 
              alt={category.name}
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <!-- Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            <!-- Icon -->
            <div class="absolute top-4 left-4">
              <div class="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
                {category.icon}
              </div>
            </div>

            <!-- Item Count Badge -->
            <div class="absolute top-4 right-4">
              <span class="bg-primary-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                {formatItemCount(category.itemCount)} items
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <h3 class="text-xl font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
              {category.name}
            </h3>
            <p class="text-neutral-600 mb-4">
              {category.description}
            </p>
            
            <!-- CTA -->
            <div class="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
              <span>Explore Category</span>
              <svg class="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </a>
      {/each}
    </div>

    <!-- Popular Subcategories -->
    <div class="mt-16">
      <h3 class="text-2xl font-bold text-neutral-900 mb-8 text-center">
        Popular Subcategories
      </h3>
      
      <div class="flex flex-wrap justify-center gap-3">
        {#each [
          'Backpacking Tents',
          'Hiking Boots',
          'Sleeping Bags',
          'Climbing Shoes',
          'Mountain Bikes',
          'Kayaks',
          'Ski Equipment',
          'Travel Backpacks',
          'Camping Stoves',
          'Headlamps',
          'Climbing Harnesses',
          'Wetsuits'
        ] as subcategory}
          <a 
            href="/search?category={encodeURIComponent(subcategory.toLowerCase())}"
            class="inline-flex items-center px-4 py-2 bg-white text-neutral-700 rounded-full border border-neutral-200 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 text-sm font-medium"
          >
            {subcategory}
          </a>
        {/each}
      </div>
    </div>

    <!-- Featured Brands -->
    <div class="mt-16 bg-white rounded-2xl p-8 shadow-rei">
      <h3 class="text-2xl font-bold text-neutral-900 mb-8 text-center">
        Trusted Brands
      </h3>
      
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
        {#each [
          { name: 'Patagonia', logo: '/Patagonia-Logo.svg' },
          { name: 'GearGrab', logo: '/favicon.svg' },
          { name: 'The North Face', logo: '/The-North-Face-Logo.svg' },
          { name: 'Osprey', logo: '/Osprey-Logo.svg' },
          { name: 'Black Diamond', logo: '/Black-Diamond-Logo.svg' },
          { name: 'MSR', logo: '/MSR-Logo.svg' }
        ] as brand}
          <div class="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
            <img 
              src={brand.logo} 
              alt={brand.name}
              class="h-8 w-auto object-contain"
              loading="lazy"
            />
          </div>
        {/each}
      </div>
    </div>

    <!-- Call to Action -->
    <div class="mt-16 text-center">
      <div class="bg-gradient-to-r from-primary-500 to-forest-500 rounded-2xl p-8 text-white">
        <h3 class="text-2xl font-bold mb-4">
          Can't find what you're looking for?
        </h3>
        <p class="text-primary-100 mb-6 max-w-2xl mx-auto">
          Join our community of outdoor enthusiasts and list your own gear. Help others discover amazing adventures while earning extra income.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/list-gear"
            class="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-neutral-100 transition-colors duration-200"
          >
            List Your Gear
            <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </a>
          <a 
            href="/how-it-works"
            class="inline-flex items-center justify-center px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/30 hover:bg-white/20 transition-colors duration-200"
          >
            Learn How It Works
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
