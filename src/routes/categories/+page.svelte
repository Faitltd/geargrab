<script lang="ts">
  import Header from '$lib/components/Header.svelte';
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

  const categories = [
    {
      name: "Camping & Hiking",
      slug: "camping-hiking",
      icon: "🏕️",
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Tents, backpacks, sleeping bags & more",
      itemCount: 2847,
      featured: true
    },
    {
      name: "Climbing",
      slug: "climbing",
      icon: "🧗",
      image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Ropes, harnesses, shoes & protection",
      itemCount: 1256,
      featured: true
    },
    {
      name: "Cycling",
      slug: "cycling",
      icon: "🚴",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Bikes, helmets, accessories & tools",
      itemCount: 1834,
      featured: true
    },
    {
      name: "Water Sports",
      slug: "water-sports",
      icon: "🏄",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Kayaks, SUPs, wetsuits & safety gear",
      itemCount: 892,
      featured: false
    },
    {
      name: "Winter Sports",
      slug: "winter-sports",
      icon: "⛷️",
      image: "https://images.unsplash.com/photo-1551524164-6cf2ac2d8c9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Skis, snowboards, boots & winter gear",
      itemCount: 1467,
      featured: false
    },
    {
      name: "Travel",
      slug: "travel",
      icon: "🎒",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Luggage, travel accessories & electronics",
      itemCount: 743,
      featured: false
    }
  ];

  $: featuredCategories = categories.filter(cat => cat.featured);
  $: otherCategories = categories.filter(cat => !cat.featured);
</script>

<svelte:window bind:scrollY />

<Header />

<main class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
  <!-- Hero Section -->
  <section class="relative py-20 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600"></div>
    
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
      <h1 class="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
        Browse Categories
      </h1>
      <p class="text-xl text-primary-100 max-w-3xl mx-auto text-shadow">
        Find the perfect outdoor gear for your next adventure. From camping essentials to extreme sports equipment.
      </p>
    </div>
  </section>

  <!-- Featured Categories -->
  <section class="py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-neutral-900 mb-12 text-center">Popular Categories</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {#each featuredCategories as category}
          <a href="/categories/{category.slug}" class="group">
            <GlassCard class="overflow-hidden hover:scale-105 transition-all duration-300">
              <div class="relative h-48 overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name}
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div class="absolute bottom-4 left-4 text-white">
                  <div class="text-3xl mb-2">{category.icon}</div>
                  <h3 class="text-xl font-bold mb-1">{category.name}</h3>
                  <p class="text-sm text-primary-200">{category.itemCount.toLocaleString()} items</p>
                </div>
              </div>
              <div class="p-6">
                <p class="text-neutral-600">{category.description}</p>
              </div>
            </GlassCard>
          </a>
        {/each}
      </div>

      <!-- All Categories Grid -->
      <h2 class="text-3xl font-bold text-neutral-900 mb-12 text-center">All Categories</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each categories as category}
          <a href="/categories/{category.slug}" class="group">
            <GlassCard class="p-6 hover:scale-105 transition-all duration-300">
              <div class="flex items-center space-x-4">
                <div class="text-4xl">{category.icon}</div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p class="text-sm text-neutral-600 mb-2">{category.description}</p>
                  <p class="text-xs text-neutral-500">{category.itemCount.toLocaleString()} items available</p>
                </div>
                <div class="text-primary-400 group-hover:text-primary-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </GlassCard>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 bg-gradient-to-r from-primary-600 to-accent-600">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
      <h2 class="text-3xl font-bold mb-6">Can't Find What You're Looking For?</h2>
      <p class="text-xl text-primary-100 mb-8">
        Browse all available gear or use our advanced search to find exactly what you need.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href="/gear" 
          class="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
        >
          Browse All Gear
        </a>
        <a 
          href="/search" 
          class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
        >
          Advanced Search
        </a>
      </div>
    </div>
  </section>
</main>

<Footer />
