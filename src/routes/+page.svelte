<script lang="ts">
  import { onMount } from 'svelte';
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';

  let videoElement: HTMLVideoElement;

  // Video event handlers
  function handleVideoLoaded() {
    console.log('Video loaded successfully');
    if (videoElement) {
      videoElement.style.opacity = '1';
    }
  }

  function handleVideoError(event: Event) {
    console.error('Video failed to load:', event);
    if (videoElement) {
      videoElement.style.display = 'none';
    }
  }



  // Stats data
  const stats = [
    { number: '500+', label: 'Gear Items' },
    { number: '150+', label: 'Happy Renters' },
    { number: '25+', label: 'Cities' },
    { number: '4.8★', label: 'Average Rating' }
  ];

  // Featured gear items
  const featuredGear = [
    {
      id: 1,
      title: 'Premium 4-Person Tent',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      price: '$25/day',
      location: 'Denver, CO'
    },
    {
      id: 2,
      title: 'Professional Hiking Backpack',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      price: '$15/day',
      location: 'Boulder, CO'
    }
  ];

  // Categories
  const categories = [
    {
      id: 'camping',
      name: 'Camping',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'hiking',
      name: 'Hiking',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'skiing',
      name: 'Skiing',
      image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'climbing',
      name: 'Climbing',
      image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'water-sports',
      name: 'Water Sports',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'winter-sports',
      name: 'Winter Sports',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
    }
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

  // Stats animation
  let statsVisible = false;
  let heroVisible = false;

  onMount(() => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);

    setTimeout(() => {
      statsVisible = true;
    }, 800);

    // Parallax effect
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxImage = document.querySelector('.parallax-image') as HTMLElement;

      if (parallaxImage) {
        const speed = 0.5;
        parallaxImage.style.transform = `translateY(${scrolled * speed}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<!-- Top Section with Video Background -->
<section class="min-h-screen relative overflow-hidden" style="background: #000;">
  <!-- Video Background - Matching Working Pattern -->
  <video
    bind:this={videoElement}
    class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
    style="opacity: 1;"
    autoplay
    muted
    loop
    playsinline
    on:loadeddata={handleVideoLoaded}
    on:error={handleVideoError}
    on:loadstart={() => console.log('🎬 Homepage video load started')}
    on:loadedmetadata={() => console.log('📹 Homepage video metadata loaded')}
    on:play={() => console.log('▶️ Homepage video started playing')}
  >
    <source src="/1877846-hd_1920_1080_30fps.mp4" type="video/mp4">
    <source src="/857134-hd_1280_720_24fps.mp4" type="video/mp4">
  </video>

  <!-- Dark overlay for text readability -->
  <div class="absolute inset-0 bg-black bg-opacity-40" style="z-index: 2;"></div>

  <!-- Top Section Content -->
  <div class="relative z-10 flex flex-col justify-center min-h-screen pt-16" style="z-index: 10;">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Hero Content -->
      <div class="text-center text-white mb-12">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 {heroVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'} transition-all duration-800">
          Grab Some Gear And Get<br>Out There!
        </h1>
        <p class="text-xl md:text-2xl mb-8 max-w-2xl mx-auto {heroVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0 translate-y-8'} transition-all duration-800">
          Premier gear rental from local owners. Adventure awaits, gear doesn't have to wait.
        </p>

        <!-- Search Form -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-auto w-full {heroVisible ? 'animate-fade-in-up animate-delay-400' : 'opacity-0 translate-y-8'} transition-all duration-800">
          <div class="w-full flex justify-center">
            <div class="w-full max-w-xl">
              <HeroSearch />
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="text-center">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          {#each stats as stat, i}
            <div class="transform transition-all duration-700 {statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}" style="transition-delay: {i * 100}ms">
              <div class="text-3xl md:text-4xl font-bold text-green-400 mb-2">{stat.number}</div>
              <div class="text-gray-200">{stat.label}</div>
            </div>
          {/each}
        </div>
      </div>

    </div>
  </div>
</section>

<!-- Bottom Section with Black Background -->
<section class="bg-black">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

    <!-- Featured Gear -->
    <div class="text-center mb-20">
        <h2 class="text-4xl font-bold text-white mb-4">Featured Gear</h2>
        <p class="text-xl text-gray-200 mb-12 max-w-2xl mx-auto">
          Discover top-rated outdoor equipment from the best local owners.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {#each featuredGear as gear}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20">
              <img src={gear.image} alt={gear.title} class="w-full h-48 object-cover">
              <div class="p-6 text-white">
                <h3 class="text-xl font-bold mb-2">{gear.title}</h3>
                <div class="flex justify-between items-center">
                  <span class="text-green-400 font-bold">{gear.price}</span>
                  <span class="text-gray-300">{gear.location}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <a href="/browse" class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Browse All Gear
        </a>
      </div>

      <!-- Explore Categories -->
      <div class="text-center mb-20">
        <h2 class="text-4xl font-bold text-white mb-4">Explore Categories</h2>
        <p class="text-xl text-gray-200 mb-12 max-w-2xl mx-auto">
          Find the perfect gear for your outdoor adventure.
        </p>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {#each categories as category}
            <a href="/browse?category={category.id}" class="group">
              <div class="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 hover:bg-white/20 transition-all">
                <img src={category.image} alt={category.name} class="w-full h-24 object-cover">
                <div class="p-4">
                  <h3 class="text-white font-semibold text-sm">{category.name}</h3>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>

      <!-- Why Choose GearGrab -->
      <div class="text-center mb-20">
        <h2 class="text-4xl font-bold text-white mb-4">Why Choose GearGrab?</h2>
        <p class="text-xl text-gray-200 mb-12 max-w-2xl mx-auto">
          Experience the future of outdoor gear access with our trusted platform.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {#each features as feature}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <div class="text-4xl mb-4">{feature.icon}</div>
              <h3 class="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p class="text-gray-200">{feature.description}</p>
            </div>
          {/each}
        </div>
      </div>

    <!-- Call to Action -->
    <div class="text-center">
      <h2 class="text-4xl font-bold text-white mb-6">Ready to Start Your Adventure?</h2>
      <p class="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
        Join thousands of outdoor enthusiasts who are saving money and exploring more with GearGrab.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Start Browsing
        </a>
        <a href="/list-gear" class="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-3 px-8 rounded-lg transition-colors">
          List Your Gear
        </a>
      </div>
    </div>

  </div>
</section>

<style>

  /* Smooth scrolling for better parallax effect */
  :global(html) {
    scroll-behavior: smooth;
  }

  /* Ensure no overflow issues */
  section {
    overflow-x: hidden;
  }
</style>
