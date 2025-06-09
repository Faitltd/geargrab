<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import ListingCard3D from '$lib/components/ListingCard3D.svelte';
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/ScrollLinkedAnimator.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/ScrollLinkedSequential.svelte';
  import { featuredGear, categories } from '$lib/data/products';

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

  // Featured listings for homepage
  let featuredListings = [];
  
  onMount(async () => {
    try {
      // Import products and take first 6 as featured
      const { products } = await import('$lib/data/products');
      featuredListings = products.slice(0, 6).map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        dailyPrice: product.dailyPrice,
        images: product.images,
        location: product.location,
        averageRating: (product as any).averageRating || 4.5,
        reviewCount: (product as any).reviewCount || 12
      }));
    } catch (error) {
      console.error('Error loading featured listings:', error);
    }
  });
</script>

<!-- Full Page Video Background with Performance Optimization -->
<VideoBackground
  videoSrc="/1877846-hd_1920_1080_30fps.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity={0.4}
/>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen">
  <!-- Hero Content -->
  <div class="relative min-h-screen flex flex-col text-center text-white px-4 pt-20">
    <!-- Brand Name at Top - Positioned between navbar and main content -->
    <ScrollLinkedAnimator animation="scale-in" startOffset={0} endOffset={0.3}>
      <div class="flex justify-center pt-24 pb-0">
        <h1 class="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white drop-shadow-lg mb-0">
          GearGrab
        </h1>
      </div>
    </ScrollLinkedAnimator>

    <!-- Main Hero Content - Centered in remaining space -->
    <div class="flex-1 flex items-center justify-center pt-4">
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.1} endOffset={0.5}>
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
      </ScrollLinkedAnimator>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-8">
      {#each stats as stat}
        <ScrollLinkedAnimator animation="scale-in" startOffset={0.05} endOffset={0.3}>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 shadow-lg">
            <div class="text-3xl md:text-4xl font-bold text-green-400 mb-2 drop-shadow-lg">{stat.number}</div>
            <div class="text-gray-200 drop-shadow-lg">{stat.label}</div>
          </div>
        </ScrollLinkedAnimator>
      {/each}
    </div>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <!-- Featured Gear -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.1} endOffset={0.4}>
        <div class="text-center mb-20">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Featured Gear</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Discover top-rated outdoor equipment from the best local owners.
            </p>
          </div>

          <ScrollLinkedSequential animation="scale-in" baseDelay={0} incrementDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" startOffset={0.15} endOffset={0.45}>
            {#each featuredGear as gear}
              <a href="/listing/{gear.id}" class="block group">
                <div class="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 transition-all duration-300 hover:border-green-500 hover:transform hover:scale-105 shadow-lg">
                  <img src={gear.image} alt={gear.title} class="w-full h-48 object-cover">
                  <div class="p-6">
                    <h3 class="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors drop-shadow-lg">{gear.title}</h3>
                    <div class="flex justify-between items-center">
                      <span class="text-green-400 font-bold drop-shadow-lg">{gear.price}</span>
                      <span class="text-gray-200 drop-shadow-lg">{gear.location}</span>
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </ScrollLinkedSequential>

          <ScrollLinkedAnimator animation="scale-in" startOffset={0.2} endOffset={0.5}>
            <a href="/browse" class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
              Browse All Gear
            </a>
          </ScrollLinkedAnimator>
        </div>
      </ScrollLinkedAnimator>

      
      <!-- Featured Listings with 3D Cards -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.2} endOffset={0.5}>
        <div class="text-center mb-20">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Featured Listings</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Experience our stunning 3D listing cards with the latest gear.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center mb-12">
            {#each featuredListings as listing}
              <ListingCard3D 
                {listing} 
                onClick={() => goto(`/listing/${listing.id}`)} 
              />
            {/each}
          </div>
        </div>
      </ScrollLinkedAnimator>

      <!-- Explore Categories -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.25} endOffset={0.55}>
        <div class="text-center mb-20">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Explore Categories</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Find the perfect gear for your outdoor adventure.
            </p>
          </div>

          <ScrollLinkedSequential animation="scale-in" baseDelay={0} incrementDelay={0.02} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-w-6xl mx-auto" startOffset={0.3} endOffset={0.6}>
            {#each categories as category}
              <a href="/browse?category={category.id}" class="group">
                <div class="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 hover:border-green-500 transition-all duration-300 hover:transform hover:scale-105 shadow-lg">
                  <img src={category.image} alt={category.name} class="w-full h-24 object-cover">
                  <div class="p-3">
                    <h3 class="text-white font-semibold text-sm group-hover:text-green-400 transition-colors drop-shadow-lg">{category.name}</h3>
                  </div>
                </div>
              </a>
            {/each}
          </ScrollLinkedSequential>
        </div>
      </ScrollLinkedAnimator>

      <!-- Why Choose GearGrab -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.35} endOffset={0.65}>
        <div class="text-center mb-20">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Why Choose GearGrab?</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Experience the future of outdoor gear access with our trusted platform.
            </p>
          </div>

          <ScrollLinkedSequential animation="scale-in" baseDelay={0} incrementDelay={0.05} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto" startOffset={0.4} endOffset={0.7}>
            {#each features as feature}
              <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:border-green-500 transition-all duration-300 shadow-lg">
                <div class="text-4xl mb-4">{feature.icon}</div>
                <h3 class="text-xl font-bold text-white mb-4 drop-shadow-lg">{feature.title}</h3>
                <p class="text-gray-200 drop-shadow-lg">{feature.description}</p>
              </div>
            {/each}
          </ScrollLinkedSequential>
        </div>
      </ScrollLinkedAnimator>

      <!-- Call to Action -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.45} endOffset={0.75}>
        <div class="text-center">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-3xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-6 drop-shadow-lg">Ready to Start Your Adventure?</h2>
            <p class="text-xl text-gray-200 mb-8 drop-shadow-lg">
              Join thousands of outdoor enthusiasts who are saving money and exploring more with GearGrab.
            </p>

            <ScrollLinkedSequential animation="scale-in" baseDelay={0} incrementDelay={0.05} className="flex flex-col sm:flex-row gap-4 justify-center" startOffset={0.5} endOffset={0.8}>
              <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
                Start Browsing
              </a>
              <a href="/list-gear" class="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-3 px-8 rounded-lg transition-all shadow-lg">
                List Your Gear
              </a>
            </ScrollLinkedSequential>
          </div>
        </div>
      </ScrollLinkedAnimator>

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
</style>