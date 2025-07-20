<script lang="ts">
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import ProductGrid from '$lib/components/ProductGrid.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import { onMount } from 'svelte';

  let scrollY = 0;

  onMount(() => {
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  // Category data mapping
  const categoryMap = {
    'camping-hiking': {
      name: "Camping & Hiking",
      icon: "🏕️",
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      description: "Discover premium camping and hiking gear from trusted local owners. From ultralight backpacking equipment to family camping essentials.",
      itemCount: 2847,
      subcategories: [
        { name: "Tents", count: 456 },
        { name: "Backpacks", count: 389 },
        { name: "Sleeping Bags", count: 234 },
        { name: "Cooking Gear", count: 178 },
        { name: "Navigation", count: 89 },
        { name: "Safety & First Aid", count: 67 }
      ]
    },
    'climbing': {
      name: "Climbing",
      icon: "🧗",
      image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      description: "Professional climbing gear for indoor and outdoor adventures. Ropes, harnesses, shoes, and protection equipment.",
      itemCount: 1256,
      subcategories: [
        { name: "Ropes", count: 234 },
        { name: "Harnesses", count: 189 },
        { name: "Climbing Shoes", count: 156 },
        { name: "Protection", count: 298 },
        { name: "Helmets", count: 89 },
        { name: "Belay Devices", count: 67 }
      ]
    },
    'cycling': {
      name: "Cycling",
      icon: "🚴",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      description: "Bikes, helmets, accessories and tools for road cycling, mountain biking, and urban commuting.",
      itemCount: 1834,
      subcategories: [
        { name: "Road Bikes", count: 345 },
        { name: "Mountain Bikes", count: 289 },
        { name: "Helmets", count: 234 },
        { name: "Accessories", count: 456 },
        { name: "Tools & Repair", count: 178 },
        { name: "Clothing", count: 123 }
      ]
    },
    'water-sports': {
      name: "Water Sports",
      icon: "🏄",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      description: "Kayaks, SUPs, wetsuits and safety gear for all your water adventures.",
      itemCount: 892,
      subcategories: [
        { name: "Kayaks", count: 156 },
        { name: "SUP Boards", count: 134 },
        { name: "Wetsuits", count: 189 },
        { name: "Safety Gear", count: 98 },
        { name: "Paddles", count: 67 },
        { name: "Accessories", count: 89 }
      ]
    },
    'winter-sports': {
      name: "Winter Sports",
      icon: "⛷️",
      image: "https://images.unsplash.com/photo-1551524164-6cf2ac2d8c9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      description: "Skis, snowboards, boots and winter gear for mountain adventures.",
      itemCount: 1467,
      subcategories: [
        { name: "Skis", count: 234 },
        { name: "Snowboards", count: 189 },
        { name: "Boots", count: 298 },
        { name: "Bindings", count: 156 },
        { name: "Helmets", count: 89 },
        { name: "Clothing", count: 234 }
      ]
    },
    'travel': {
      name: "Travel",
      icon: "🎒",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      description: "Luggage, travel accessories and electronics for your journeys around the world.",
      itemCount: 743,
      subcategories: [
        { name: "Luggage", count: 189 },
        { name: "Backpacks", count: 156 },
        { name: "Electronics", count: 134 },
        { name: "Accessories", count: 98 },
        { name: "Organizers", count: 67 },
        { name: "Security", count: 45 }
      ]
    }
  };

  $: slug = $page.params.slug;
  $: categoryData = categoryMap[slug as keyof typeof categoryMap];

  // Sample products (would normally come from API based on category)
  const sampleProducts = [
    {
      id: '1',
      title: 'Premium Outdoor Gear',
      description: 'Professional-grade equipment for your adventures',
      price: 45,
      originalPrice: 89,
      rating: 4.8,
      reviewCount: 127,
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      category: categoryData?.name || 'Outdoor Gear',
      location: 'Seattle, WA',
      owner: 'Adventure Pro',
      verified: true,
      featured: true
    },
    {
      id: '2',
      title: 'Quality Equipment',
      description: 'Reliable gear for outdoor enthusiasts',
      price: 35,
      originalPrice: 65,
      rating: 4.9,
      reviewCount: 89,
      image: 'https://images.unsplash.com/photo-1622260614153-03223fb72052?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      category: categoryData?.name || 'Outdoor Gear',
      location: 'Portland, OR',
      owner: 'Gear Expert',
      verified: true,
      featured: false
    }
  ];
</script>

<svelte:window bind:scrollY />

<Header />

{#if categoryData}
  <main class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
    <!-- Category Hero Section -->
    <section class="relative py-20 overflow-hidden">
      <!-- Background Image with Parallax -->
      <div 
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style="background-image: url('{categoryData.image}'); transform: translateY({scrollY * 0.3}px)"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <!-- Breadcrumb -->
          <nav class="mb-8">
            <ol class="flex items-center justify-center space-x-2 text-sm">
              <li><a href="/" class="text-primary-200 hover:text-white transition-colors">Home</a></li>
              <li class="text-primary-300">/</li>
              <li><a href="/categories" class="text-primary-200 hover:text-white transition-colors">Categories</a></li>
              <li class="text-primary-300">/</li>
              <li class="text-white font-medium">{categoryData.name}</li>
            </ol>
          </nav>

          <!-- Category Icon & Title -->
          <div class="mb-6">
            <div class="text-6xl mb-4">{categoryData.icon}</div>
            <h1 class="text-4xl md:text-6xl font-bold mb-4 text-shadow-lg">
              {categoryData.name}
            </h1>
            <p class="text-xl text-primary-100 max-w-3xl mx-auto text-shadow">
              {categoryData.description}
            </p>
          </div>

          <!-- Stats -->
          <div class="flex justify-center items-center space-x-8 text-sm">
            <div class="glass px-4 py-2 rounded-full">
              <span class="font-bold text-lg">{categoryData.itemCount.toLocaleString()}</span>
              <span class="text-primary-200 ml-1">items available</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Subcategories -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-neutral-900 mb-8 text-center">Browse by Subcategory</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {#each categoryData.subcategories as subcategory}
            <a href="/gear?category={slug}&subcategory={subcategory.name.toLowerCase().replace(/\s+/g, '-')}" class="group">
              <GlassCard class="text-center p-6 hover:scale-105 transition-all duration-300">
                <h3 class="font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {subcategory.name}
                </h3>
                <p class="text-sm text-neutral-600">
                  {subcategory.count} items
                </p>
              </GlassCard>
            </a>
          {/each}
        </div>
      </div>
    </section>

    <!-- Products Grid -->
    <section class="pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-neutral-900">Featured {categoryData.name} Gear</h2>
          <a href="/gear?category={slug}" class="text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </a>
        </div>
        
        <ProductGrid products={sampleProducts} />
      </div>
    </section>
  </main>
{:else}
  <main class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-neutral-900 mb-4">Category Not Found</h1>
      <p class="text-neutral-600 mb-8">The category you're looking for doesn't exist.</p>
      <a href="/categories" class="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
        Browse All Categories
      </a>
    </div>
  </main>
{/if}

<Footer />
