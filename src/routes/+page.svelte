<script lang="ts">
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';
  import ScrollAnimated from '$lib/components/layout/ScrollAnimated.svelte';
  import SequentialAnimator from '$lib/components/layout/SequentialAnimator.svelte';
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
  <div class="relative min-h-screen flex flex-col items-center justify-center text-center text-white px-4 pt-20">
    <!-- Brand Name at Top - Much Larger -->
    <ScrollAnimated animation="fade-up" delay={50}>
      <div class="mb-8">
        <h1 class="text-7xl md:text-8xl lg:text-9xl font-bold text-white drop-shadow-2xl tracking-wider">
          Gear Grab
        </h1>
      </div>
    </ScrollAnimated>

    <!-- Main Hero Content -->
    <ScrollAnimated animation="fade-up" delay={200}>
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 max-w-4xl mx-auto shadow-lg">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
          Meet Up. Gear Up. Get Out.
        </h2>
        <p class="text-xl md:text-2xl mb-8 max-w-2xl mx-auto drop-shadow-lg">
          Rent Local Outdoor Gear, Save Space, Make Money, and Explore More.
        </p>

        <!-- Search Form -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-auto border border-white/20 shadow-lg">
          <HeroSearch />
        </div>
      </div>
    </ScrollAnimated>

    <!-- Stats -->
    <ScrollAnimated animation="fade-up" delay={700}>
      <SequentialAnimator baseDelay={800} incrementDelay={100} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-16">
        {#each stats as stat}
          <div class="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 shadow-lg">
            <div class="text-3xl md:text-4xl font-bold text-green-400 mb-2 drop-shadow-lg">{stat.number}</div>
            <div class="text-gray-200 drop-shadow-lg">{stat.label}</div>
          </div>
        {/each}
      </SequentialAnimator>
    </ScrollAnimated>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

      <!-- Featured Gear -->
      <ScrollAnimated animation="fade-up" delay={200}>
        <div class="text-center mb-20">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Featured Gear</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Discover top-rated outdoor equipment from the best local owners.
            </p>
          </div>

          <SequentialAnimator baseDelay={300} incrementDelay={100} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
          </SequentialAnimator>

          <ScrollAnimated animation="fade-up" delay={800}>
            <a href="/browse" class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
              Browse All Gear
            </a>
          </ScrollAnimated>
        </div>
      </ScrollAnimated>

      <!-- Explore Categories -->
      <ScrollAnimated animation="fade-up" delay={200}>
        <div class="text-center mb-20">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Explore Categories</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Find the perfect gear for your outdoor adventure.
            </p>
          </div>

          <SequentialAnimator baseDelay={300} incrementDelay={80} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-w-6xl mx-auto">
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
          </SequentialAnimator>
        </div>
      </ScrollAnimated>

      <!-- Why Choose GearGrab -->
      <ScrollAnimated animation="fade-up" delay={200}>
        <div class="text-center mb-20">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Why Choose GearGrab?</h2>
            <p class="text-xl text-gray-200 drop-shadow-lg">
              Experience the future of outdoor gear access with our trusted platform.
            </p>
          </div>

          <SequentialAnimator baseDelay={100} incrementDelay={100} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {#each features as feature}
              <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:border-green-500 transition-all duration-300 shadow-lg">
                <div class="text-4xl mb-4">{feature.icon}</div>
                <h3 class="text-xl font-bold text-white mb-4 drop-shadow-lg">{feature.title}</h3>
                <p class="text-gray-200 drop-shadow-lg">{feature.description}</p>
              </div>
            {/each}
          </SequentialAnimator>
        </div>
      </ScrollAnimated>

      <!-- Call to Action -->
      <ScrollAnimated animation="fade-up" delay={200}>
        <div class="text-center">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-3xl mx-auto border border-white/20 shadow-lg">
            <h2 class="text-4xl font-bold text-white mb-6 drop-shadow-lg">Ready to Start Your Adventure?</h2>
            <p class="text-xl text-gray-200 mb-8 drop-shadow-lg">
              Join thousands of outdoor enthusiasts who are saving money and exploring more with GearGrab.
            </p>

            <SequentialAnimator baseDelay={300} incrementDelay={100} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
                Start Browsing
              </a>
              <a href="/list-gear" class="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-3 px-8 rounded-lg transition-all shadow-lg">
                List Your Gear
              </a>
            </SequentialAnimator>
          </div>
        </div>
      </ScrollAnimated>

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