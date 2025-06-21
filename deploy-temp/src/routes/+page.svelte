<script lang="ts">
  import { onMount } from 'svelte';
  import HeroSearch from '$lib/components/forms/hero-search.svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/scroll-linked-sequential.svelte';
  import UniverseCard from '$lib/components/cards/universe-card.svelte';
  import { categories } from '$lib/data/products';

  // Stats data
  const stats = [
    { number: '500+', label: 'Gear Items' },
    { number: '150+', label: 'Happy Renters' },
    { number: '25+', label: 'Cities' },
    { number: '4.8★', label: 'Average Rating' }
  ];

  // Why choose us features
  const features = [
    {
      title: 'Quality Guarantee',
      description: 'Every piece of gear is verified and quality-checked before rental.',
      icon: '🛡️'
    },
    {
      title: '$5 to Try',
      description: 'Start your adventure with our affordable trial pricing.',
      icon: '💰'
    },
    {
      title: 'Local Community',
      description: 'Connect with fellow outdoor enthusiasts in your area.',
      icon: '👥'
    }
  ];

  // Featured listings for homepage - simplified and consolidated
  let featuredListings = [];

  // Handle image loading errors
  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }

  // Handle card clicks
  function handleCardClick(listing: any) {
    window.location.href = `/listing/${listing.id}`;
  }

  onMount(async () => {
    try {
      // Import products and take first 6 as featured
      const { products } = await import('$lib/data/products');
      console.log('Loaded products:', products.length);
      featuredListings = products.slice(0, 6).map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        dailyPrice: product.dailyPrice,
        images: product.images || [],
        primaryImage: product.images?.[0] || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        location: product.location,
        averageRating: product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 4.5,
        reviewCount: product.reviews.length || 12,
        price: `$${product.dailyPrice}/day`
      }));
      console.log('Featured listings created:', featuredListings.length);
    } catch (error) {
      console.error('Error loading featured listings:', error);
      // Fallback to empty array if loading fails
      featuredListings = [];
    }
  });
</script>

<!-- Full Page Video Background with Performance Optimization -->
<VideoBackground
  videoSrc="/1877846-hd_1920_1080_30fps.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity="{0.4}"
/>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen">
  <!-- Hero Content -->
  <div class="relative min-h-[60vh] flex flex-col text-center text-white px-4 pt-20">
    <!-- Brand Name at Top - Positioned between navbar and main content -->
    <div class="flex justify-center pt-24 pb-0">
      <h1 class="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white drop-shadow-lg mb-0">
        GearGrab
      </h1>
    </div>

    <!-- Main Hero Content - Centered in remaining space -->
    <div class="flex-1 flex items-center justify-center pt-4">
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 max-w-4xl mx-auto shadow-lg">
        <h2 class="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
          Meet Up. Gear Up. Get Out.
        </h2>
        <p class="text-xl md:text-2xl mb-6 max-w-2xl mx-auto drop-shadow-lg">
          Rent Local Outdoor Gear, Save Space, Make Money, and Explore More.
        </p>

        <!-- Search Form -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-auto border border-white/20 shadow-lg">
          <HeroSearch />
        </div>
      </div>
    </div>

    <!-- Stats -->
    <ScrollLinkedSequential animation="scale-in" startOffset="{0.1}" endOffset="{0.5}" incrementDelay="{0.1}">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-8">
        {#each stats as stat}
          <div class="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 shadow-lg">
            <div class="text-3xl md:text-4xl font-bold text-green-400 mb-2 drop-shadow-lg">{stat.number}</div>
            <div class="text-gray-200 drop-shadow-lg">{stat.label}</div>
          </div>
        {/each}
      </div>
    </ScrollLinkedSequential>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">


      <!-- Featured Listings with Clean Cards -->
      <div class="text-center mb-20">
        <ScrollLinkedAnimator animation="fade-up" startOffset="{0.2}" endOffset="{0.6}">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Featured Listings</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Discover premium outdoor gear from trusted local owners.
            </p>
          </div>
        </ScrollLinkedAnimator>

        <ScrollLinkedSequential animation="scale-in" startOffset="{0.3}" endOffset="{0.8}" incrementDelay="{0.1}">
          <div class="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto mb-12">
            {#if featuredListings.length > 0}
              {#each featuredListings as listing}
                <UniverseCard {listing} onClick={() => handleCardClick(listing)} width="220px" height="280px" />
              {/each}
            {:else}
            <div class="text-white text-center p-8">
              <p class="text-lg mb-4">Loading featured listings...</p>
              <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/20">
                <p class="text-sm text-gray-300">Debug Info:</p>
                <p class="text-sm text-gray-300">Featured listings count: {featuredListings.length}</p>
                <p class="text-sm text-gray-300">Page loaded: {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
              </div>
              <!-- Test card to verify UniverseCard works -->
              <div class="mt-6">
                <p class="text-sm text-gray-300 mb-4">Test UniverseCard:</p>
                <UniverseCard
                  listing={{
                    id: 'test-1',
                    title: 'Mountain Bike',
                    category: 'biking',
                    dailyPrice: 35,
                    images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
                    location: { city: 'Denver', state: 'CO' },
                    averageRating: 4.8,
                    reviewCount: 15
                  }}
                  onClick={() => console.log('Test card clicked')}
                  width="220px"
                  height="280px"
                />
              </div>
            </div>
          {/if}
          </div>
        </ScrollLinkedSequential>

        <a href="/browse" class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
          View All Listings
        </a>
      </div>

      <!-- Explore Categories -->
      <div class="text-center mb-20">
        <ScrollLinkedAnimator animation="fade-up" startOffset="{0.4}" endOffset="{0.8}">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Explore Categories</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Find the perfect gear for your outdoor adventure.
            </p>
          </div>
        </ScrollLinkedAnimator>

        <ScrollLinkedSequential animation="scale-in" startOffset="{0.5}" endOffset="{0.9}" incrementDelay="{0.05}">
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-w-6xl mx-auto">
            {#each categories as category}
              <a href="/browse?category={category.id}" class="group">
                <div class="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 hover:border-green-500 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <div class="relative h-24 overflow-hidden">
                    <img
                      src="{category.image}"
                      alt="{category.name}"
                      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      on:error="{handleImageError}" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div class="p-3">
                    <h3 class="text-white font-semibold text-sm group-hover:text-green-400 transition-colors drop-shadow-lg text-center">{category.name}</h3>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </ScrollLinkedSequential>
      </div>

      <!-- Why Choose GearGrab -->
      <div class="text-center mb-20">
        <ScrollLinkedAnimator animation="fade-up" startOffset="{0.2}" endOffset="{0.8}">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Why Choose GearGrab?</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Experience the future of outdoor gear access with our trusted platform.
            </p>
          </div>
        </ScrollLinkedAnimator>

        <ScrollLinkedSequential animation="fade-up" startOffset="{0.3}" endOffset="{0.9}" incrementDelay="{0.15}">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {#each features as feature}
              <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:border-green-500 transition-all duration-300 shadow-lg">
                <div class="text-4xl mb-4">{feature.icon}</div>
                <h3 class="text-xl font-bold text-white mb-4 drop-shadow-lg">{feature.title}</h3>
                <p class="text-gray-200 drop-shadow-lg">{feature.description}</p>
              </div>
            {/each}
          </div>
        </ScrollLinkedSequential>
      </div>

      <!-- Call to Action -->
      <div class="text-center">
        <ScrollLinkedAnimator animation="scale-in" startOffset="{0.8}" endOffset="{1.0}">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-3xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-6 drop-shadow-lg">Ready to Start Your Adventure?</h2>
            <p class="text-xl text-gray-200 mb-8 drop-shadow-lg">
              Join thousands of outdoor enthusiasts who are saving money and exploring more with GearGrab.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
                Start Browsing
              </a>
              <a href="/list-gear" class="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-3 px-8 rounded-lg transition-all shadow-lg">
                List Your Gear
              </a>
            </div>
          </div>
        </ScrollLinkedAnimator>
      </div>

    </div>
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

  /* Line clamp utility */
  :global(.line-clamp-1) {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  /* Force blue hue styling for homepage search inputs */
  :global(.bg-white\/10 input[type="text"]) {
    background-color: rgba(31, 41, 55, 0.7) !important;
    border-color: rgb(75, 85, 99) !important;
    color: white !important;
  }

  :global(.bg-white\/10 input[type="text"]::placeholder) {
    color: rgb(209, 213, 219) !important;
  }
</style>