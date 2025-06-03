<script lang="ts">
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';
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
      icon: '✓'
    },
    {
      title: '$5 to Try',
      description: 'Start your adventure with our affordable trial pricing.',
      icon: '$'
    },
    {
      title: 'Local Community',
      description: 'Connect with fellow outdoor enthusiasts in your area.',
      icon: '👥'
    }
  ];
</script>

<!-- Top Section with Video Background -->
<VideoBackground
  videoSrc="/1877846-hd_1920_1080_30fps.mp4"
  overlayOpacity={0.4}
/>
<section class="hero-section min-h-screen relative overflow-hidden z-10">

  <!-- Hero Content -->
  <div class="relative z-20 flex flex-col justify-center min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      
      <!-- Hero Text -->
      <div class="text-center text-white mb-12">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
          Grab Some Gear And Get<br>Out There!
        </h1>
        <p class="text-xl md:text-2xl mb-8 max-w-2xl mx-auto animate-fade-in animation-delay-200">
          Premier gear rental from local owners. Adventure awaits, gear doesn't have to wait.
        </p>

        <!-- Search Form -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-auto animate-fade-in animation-delay-400">
          <HeroSearch />
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {#each stats as stat, i}
          <div class="animate-fade-in animation-delay-{600 + i * 100}">
            <div class="text-3xl md:text-4xl font-bold text-green-400 mb-2">{stat.number}</div>
            <div class="text-gray-200">{stat.label}</div>
          </div>
        {/each}
      </div>

    </div>
  </div>
</section>

<!-- Bottom Section with Black Background -->
<section class="bg-black py-20 relative z-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Featured Gear -->
    <div class="text-center mb-20">
      <h2 class="text-4xl font-bold text-white mb-4">Featured Gear</h2>
      <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
        Discover top-rated outdoor equipment from the best local owners.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {#each featuredGear as gear}
          <a href="/listing/{gear.id}" class="block group">
            <div class="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 transition-all duration-300 hover:border-green-500 hover:transform hover:scale-105">
              <img src={gear.image} alt={gear.title} class="w-full h-48 object-cover">
              <div class="p-6">
                <h3 class="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{gear.title}</h3>
                <div class="flex justify-between items-center">
                  <span class="text-green-400 font-bold">{gear.price}</span>
                  <span class="text-gray-400">{gear.location}</span>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>

      <a href="/browse" class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
        Browse All Gear
      </a>
    </div>

    <!-- Explore Categories -->
    <div class="text-center mb-20">
      <h2 class="text-4xl font-bold text-white mb-4">Explore Categories</h2>
      <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
        Find the perfect gear for your outdoor adventure.
      </p>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-w-6xl mx-auto">
        {#each categories as category}
          <a href="/browse?category={category.id}" class="group">
            <div class="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-green-500 transition-all duration-300 hover:transform hover:scale-105">
              <img src={category.image} alt={category.name} class="w-full h-24 object-cover">
              <div class="p-3">
                <h3 class="text-white font-semibold text-sm group-hover:text-green-400 transition-colors">{category.name}</h3>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>

    <!-- Why Choose GearGrab -->
    <div class="text-center mb-20">
      <h2 class="text-4xl font-bold text-white mb-4">Why Choose GearGrab?</h2>
      <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
        Experience the future of outdoor gear access with our trusted platform.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {#each features as feature}
          <div class="bg-gray-900 rounded-lg p-8 border border-gray-800 hover:border-green-500 transition-all duration-300">
            <div class="text-4xl mb-4">{feature.icon}</div>
            <h3 class="text-xl font-bold text-white mb-4">{feature.title}</h3>
            <p class="text-gray-300">{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center">
      <h2 class="text-4xl font-bold text-white mb-6">Ready to Start Your Adventure?</h2>
      <p class="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
        Join thousands of outdoor enthusiasts who are saving money and exploring more with GearGrab.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Start Browsing
        </a>
        <a href="/list-gear" class="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-3 px-8 rounded-lg transition-all">
          List Your Gear
        </a>
      </div>
    </div>

  </div>
</section>

<style>
  /* Hero section specific styles */
  .hero-section {
    margin-top: -64px; /* Offset for fixed navbar */
    padding-top: 64px;
    position: relative;
    z-index: 10;
  }

  /* Simple fade-in animation */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.8s ease-out forwards;
  }

  /* Animation delays */
  .animation-delay-200 {
    animation-delay: 0.2s;
    opacity: 0;
  }

  .animation-delay-400 {
    animation-delay: 0.4s;
    opacity: 0;
  }

  .animation-delay-600 {
    animation-delay: 0.6s;
    opacity: 0;
  }

  .animation-delay-700 {
    animation-delay: 0.7s;
    opacity: 0;
  }

  .animation-delay-800 {
    animation-delay: 0.8s;
    opacity: 0;
  }

  .animation-delay-900 {
    animation-delay: 0.9s;
    opacity: 0;
  }


</style>