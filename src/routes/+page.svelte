<script lang="ts">
  import { onMount } from 'svelte';
  import HeroSearch from '$lib/components/forms/HeroSearch.svelte';
  import { featuredGear, categories } from '$lib/data/products';

  let videoElement: HTMLVideoElement;
  let videoLoaded = false;
  let videoError = false;
  let showVideo = false;

  // Simplified video handlers
  function handleVideoCanPlay() {
    console.log('🎬 Video can play - showing video');
    videoLoaded = true;
    videoError = false;
    showVideo = true;

    // Try to play the video
    if (videoElement) {
      videoElement.play().catch(error => {
        console.log('⚠️ Video autoplay failed:', error);
        // Still show the video even if autoplay fails
        showVideo = true;
        videoLoaded = true;
        // Add click listener to play on user interaction
        document.addEventListener('click', () => {
          if (videoElement) {
            videoElement.play().catch(e => console.log('Click play failed:', e));
          }
        }, { once: true });
      });
    }
  }

  function handleVideoError(event: Event) {
    console.error('❌ Video failed to load:', event);
    videoError = true;
    videoLoaded = false;
    showVideo = false;
  }

  function handleVideoPlay() {
    console.log('▶️ Video is playing');
    showVideo = true;
    videoLoaded = true;
  }



  // Stats data
  const stats = [
    { number: '500+', label: 'Gear Items' },
    { number: '150+', label: 'Happy Renters' },
    { number: '25+', label: 'Cities' },
    { number: '4.8★', label: 'Average Rating' }
  ];

  // Featured gear items are now imported from products.ts

  // Categories are now imported from products.ts

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

  // Progressive loading states for smooth top-to-bottom animation
  let heroVisible = false;
  let statsVisible = false;
  let featuredGearVisible = false;
  let categoriesVisible = false;
  let featuresVisible = false;
  let ctaVisible = false;

  // Loading sequence with staggered delays
  onMount(() => {
    // Progressive loading sequence - top to bottom
    const loadingSequence = [
      { element: 'hero', delay: 200, setter: () => heroVisible = true },
      { element: 'stats', delay: 600, setter: () => statsVisible = true },
      { element: 'featured', delay: 1000, setter: () => featuredGearVisible = true },
      { element: 'categories', delay: 1200, setter: () => categoriesVisible = true },
      { element: 'features', delay: 1400, setter: () => featuresVisible = true },
      { element: 'cta', delay: 1600, setter: () => ctaVisible = true }
    ];

    // Execute loading sequence
    loadingSequence.forEach(({ delay, setter }) => {
      setTimeout(setter, delay);
    });

    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.add('animate-in');
          observer.unobserve(target);
        }
      });
    }, observerOptions);

    // Observe sections for scroll animations
    setTimeout(() => {
      const sections = document.querySelectorAll('.scroll-animate');
      sections.forEach(section => observer.observe(section));
    }, 100);

    // Initialize video after a short delay to ensure DOM is ready
    setTimeout(() => {
      if (videoElement) {
        console.log('🎬 Initializing video element');

        // Reset video state
        videoLoaded = false;
        videoError = false;
        showVideo = false;

        // Load the video
        videoElement.load();

        // Try to play after a short delay
        setTimeout(() => {
          if (videoElement && !videoError) {
            videoElement.play().catch(error => {
              console.log('⚠️ Initial video autoplay failed:', error);
              // Show video anyway if it's loaded
              if (videoElement.readyState >= 3) {
                showVideo = true;
                videoLoaded = true;
              }
              // Try again with user interaction
              document.addEventListener('click', () => {
                if (videoElement) {
                  videoElement.play().catch(e => console.log('Click play failed:', e));
                }
              }, { once: true });
            });
          }
        }, 500);
      }
    }, 100);

    // Fallback: if video doesn't load within 5 seconds, show fallback
    setTimeout(() => {
      if (!videoLoaded && !videoError) {
        console.log('⏰ Video loading timeout, showing fallback background');
        videoError = true;
      }
    }, 5000);

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
<section class="min-h-screen relative overflow-hidden" style="background: linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%);">

  <!-- Fallback Background Image (shows while video loads or if video fails) -->
  <div class="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
       style="background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'); opacity: {videoLoaded && !videoError ? 0 : 1}; transition: opacity 1s ease-in-out;"></div>

  <!-- Video Background -->
  <video
    bind:this={videoElement}
    class="absolute inset-0 w-full h-full object-cover z-10"
    style="opacity: {showVideo && videoLoaded && !videoError ? 1 : 0}; transition: opacity 1s ease-in-out;"
    autoplay
    muted
    loop
    playsinline
    preload="auto"
    on:canplay={handleVideoCanPlay}
    on:error={handleVideoError}
    on:loadedmetadata={() => console.log('📹 Homepage video metadata loaded')}
    on:play={handleVideoPlay}
    on:pause={() => console.log('⏸️ Video paused')}
    on:ended={() => console.log('🔚 Video ended')}
  >
    <source src="/Stars.mp4" type="video/mp4">
    <source src="/1877846-hd_1920_1080_30fps.mp4" type="video/mp4">
    <source src="/857134-hd_1280_720_24fps.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>

  <!-- Dark overlay for text readability -->
  <div class="absolute inset-0 bg-black bg-opacity-40 z-20"></div>

  <!-- Debug overlay (remove in production) -->
  <div class="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
    <div>Video Status:</div>
    <div>Loaded: {videoLoaded ? '✅' : '❌'}</div>
    <div>Error: {videoError ? '❌' : '✅'}</div>
    <div>Visible: {showVideo ? '✅' : '❌'}</div>
  </div>

  <!-- Top Section Content -->
  <div class="relative flex flex-col justify-center min-h-screen pt-16 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Hero Content -->
      <div class="text-center text-white mb-12">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 transform transition-all duration-1000 ease-out {heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}">
          Grab Some Gear And Get<br>Out There!
        </h1>
        <p class="text-xl md:text-2xl mb-8 max-w-2xl mx-auto transform transition-all duration-1000 ease-out {heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 200ms;">
          Premier gear rental from local owners. Adventure awaits, gear doesn't have to wait.
        </p>

        <!-- Search Form -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-2xl mx-auto w-full transform transition-all duration-1000 ease-out {heroVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}" style="transition-delay: 400ms;">
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
            <div class="transform transition-all duration-800 ease-out {statsVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-90'}" style="transition-delay: {i * 150 + 200}ms">
              <div class="text-3xl md:text-4xl font-bold text-green-400 mb-2 transition-all duration-500" style="transition-delay: {i * 150 + 400}ms">{stat.number}</div>
              <div class="text-gray-200 transition-all duration-500" style="transition-delay: {i * 150 + 500}ms">{stat.label}</div>
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
    <div class="text-center mb-20 scroll-animate">
        <h2 class="text-4xl font-bold text-white mb-4 transform transition-all duration-800 ease-out {featuredGearVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">Featured Gear</h2>
        <p class="text-xl text-gray-200 mb-12 max-w-2xl mx-auto transform transition-all duration-800 ease-out {featuredGearVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}" style="transition-delay: 200ms;">
          Discover top-rated outdoor equipment from the best local owners.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
          {#each featuredGear as gear, i}
            <a href="/listing/{gear.id}" class="block group cursor-pointer transform transition-all duration-800 ease-out {featuredGearVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}" style="transition-delay: {i * 200 + 400}ms;">
              <div class="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/30 group-hover:transform group-hover:scale-105 group-hover:shadow-xl">
                <img src={gear.image} alt={gear.title} class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110">
                <div class="p-6 text-white">
                  <h3 class="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors duration-300">{gear.title}</h3>
                  <div class="flex justify-between items-center">
                    <span class="text-green-400 font-bold">{gear.price}</span>
                    <span class="text-gray-300">{gear.location}</span>
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </div>

        <a href="/browse" class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform {featuredGearVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}" style="transition-delay: 800ms;">
          Browse All Gear
        </a>
      </div>

      <!-- Explore Categories -->
      <div class="text-center mb-20 scroll-animate">
        <h2 class="text-4xl font-bold text-white mb-4 transform transition-all duration-800 ease-out {categoriesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">Explore Categories</h2>
        <p class="text-xl text-gray-200 mb-12 max-w-2xl mx-auto transform transition-all duration-800 ease-out {categoriesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}" style="transition-delay: 200ms;">
          Find the perfect gear for your outdoor adventure.
        </p>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {#each categories as category, i}
            <a href="/browse?category={category.id}" class="group transform transition-all duration-800 ease-out {categoriesVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}" style="transition-delay: {i * 100 + 400}ms;">
              <div class="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <img src={category.image} alt={category.name} class="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110">
                <div class="p-4">
                  <h3 class="text-white font-semibold text-sm group-hover:text-green-400 transition-colors duration-300">{category.name}</h3>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>

      <!-- Why Choose GearGrab -->
      <div class="text-center mb-20 scroll-animate">
        <h2 class="text-4xl font-bold text-white mb-4 transform transition-all duration-800 ease-out {featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">Why Choose GearGrab?</h2>
        <p class="text-xl text-gray-200 mb-12 max-w-2xl mx-auto transform transition-all duration-800 ease-out {featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}" style="transition-delay: 200ms;">
          Experience the future of outdoor gear access with our trusted platform.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {#each features as feature, i}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 transform transition-all duration-800 ease-out hover:bg-white/20 hover:scale-105 {featuresVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}" style="transition-delay: {i * 200 + 400}ms;">
              <div class="text-4xl mb-4 transition-transform duration-300 hover:scale-110">{feature.icon}</div>
              <h3 class="text-xl font-bold text-white mb-4 transition-colors duration-300 hover:text-green-400">{feature.title}</h3>
              <p class="text-gray-200 transition-colors duration-300">{feature.description}</p>
            </div>
          {/each}
        </div>
      </div>

    <!-- Call to Action -->
    <div class="text-center scroll-animate">
      <h2 class="text-4xl font-bold text-white mb-6 transform transition-all duration-800 ease-out {ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">Ready to Start Your Adventure?</h2>
      <p class="text-xl text-gray-200 mb-8 max-w-3xl mx-auto transform transition-all duration-800 ease-out {ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}" style="transition-delay: 200ms;">
        Join thousands of outdoor enthusiasts who are saving money and exploring more with GearGrab.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform {ctaVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}" style="transition-delay: 400ms;">
          Start Browsing
        </a>
        <a href="/list-gear" class="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold py-3 px-8 rounded-lg transition-all duration-300 transform {ctaVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}" style="transition-delay: 600ms;">
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

  /* Progressive loading animations */
  .scroll-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s ease-out;
  }

  .scroll-animate.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  /* Smooth transitions for all elements */
  :global(*) {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Prevent layout shift during loading */
  :global(img) {
    transition: transform 0.3s ease;
  }

  /* Ensure smooth video transitions */
  video {
    will-change: opacity;
  }
</style>
