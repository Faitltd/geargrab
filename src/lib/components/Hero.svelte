<script lang="ts">
  import { onMount } from 'svelte';
  
  let currentSlide = 0;
  let autoplayInterval: number;
  
  const slides = [
    {
      id: 1,
      title: "Adventure Awaits",
      subtitle: "Rent premium outdoor gear from trusted locals",
      description: "Discover thousands of verified gear listings from outdoor enthusiasts in your area. From weekend camping trips to epic mountain adventures.",
      cta: "Browse Gear",
      ctaLink: "/browse",
      secondaryCta: "List Your Gear",
      secondaryCtaLink: "/list-gear",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      imageAlt: "Hiker with backpack on mountain trail"
    },
    {
      id: 2,
      title: "Gear Up Responsibly",
      subtitle: "Sustainable outdoor adventures start here",
      description: "Reduce waste and save money by renting instead of buying. Access premium gear when you need it, where you need it.",
      cta: "How It Works",
      ctaLink: "/how-it-works",
      secondaryCta: "Join Community",
      secondaryCtaLink: "/community",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      imageAlt: "Mountain landscape with camping gear"
    },
    {
      id: 3,
      title: "Trusted Community",
      subtitle: "Verified gear owners and renters",
      description: "Every member is verified. Every piece of gear is inspected. Every rental is protected by our comprehensive guarantee.",
      cta: "Safety & Trust",
      ctaLink: "/safety-trust",
      secondaryCta: "Get Started",
      secondaryCtaLink: "/auth/signin",
      image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      imageAlt: "Group of friends hiking together"
    }
  ];

  onMount(() => {
    startAutoplay();
    return () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    };
  });

  const startAutoplay = () => {
    autoplayInterval = setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
    }, 6000);
  };

  const goToSlide = (index: number) => {
    currentSlide = index;
    clearInterval(autoplayInterval);
    startAutoplay();
  };

  const nextSlide = () => {
    currentSlide = (currentSlide + 1) % slides.length;
    clearInterval(autoplayInterval);
    startAutoplay();
  };

  const prevSlide = () => {
    currentSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
    clearInterval(autoplayInterval);
    startAutoplay();
  };
</script>

<section class="relative h-[600px] lg:h-[700px] overflow-hidden">
  <!-- Slides -->
  {#each slides as slide, index}
    <div 
      class="absolute inset-0 transition-opacity duration-1000 ease-in-out {index === currentSlide ? 'opacity-100' : 'opacity-0'}"
    >
      <!-- Background Image -->
      <div class="absolute inset-0">
        <img 
          src={slide.image} 
          alt={slide.imageAlt}
          class="w-full h-full object-cover"
        />
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      <!-- Content -->
      <div class="relative h-full flex items-center">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div class="max-w-2xl">
            <h1 class="text-4xl lg:text-6xl font-bold text-white mb-4 animate-slide-up">
              {slide.title}
            </h1>
            <p class="text-xl lg:text-2xl text-white mb-6 animate-slide-up" style="animation-delay: 0.2s;">
              {slide.subtitle}
            </p>
            <p class="text-lg text-white/90 mb-8 leading-relaxed animate-slide-up" style="animation-delay: 0.4s;">
              {slide.description}
            </p>
            
            <!-- CTAs -->
            <div class="flex flex-col sm:flex-row gap-4 animate-slide-up" style="animation-delay: 0.6s;">
              <a 
                href={slide.ctaLink}
                class="inline-flex items-center justify-center px-8 py-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {slide.cta}
                <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a 
                href={slide.secondaryCtaLink}
                class="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-200"
              >
                {slide.secondaryCta}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/each}

  <!-- Navigation Arrows -->
  <button 
    on:click={prevSlide}
    class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-200 z-10"
    aria-label="Previous slide"
  >
    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  
  <button 
    on:click={nextSlide}
    class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-200 z-10"
    aria-label="Next slide"
  >
    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>

  <!-- Slide Indicators -->
  <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
    {#each slides as _, index}
      <button
        on:click={() => goToSlide(index)}
        class="w-3 h-3 rounded-full transition-all duration-200 {index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}"
        aria-label="Go to slide {index + 1}"
      ></button>
    {/each}
  </div>
</section>

<!-- Quick Stats Section -->
<section class="bg-primary-500 text-white py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
      <div class="animate-fade-in">
        <div class="text-3xl lg:text-4xl font-bold mb-2">10K+</div>
        <div class="text-primary-100">Gear Items</div>
      </div>
      <div class="animate-fade-in" style="animation-delay: 0.1s;">
        <div class="text-3xl lg:text-4xl font-bold mb-2">5K+</div>
        <div class="text-primary-100">Happy Renters</div>
      </div>
      <div class="animate-fade-in" style="animation-delay: 0.2s;">
        <div class="text-3xl lg:text-4xl font-bold mb-2">50+</div>
        <div class="text-primary-100">Cities</div>
      </div>
      <div class="animate-fade-in" style="animation-delay: 0.3s;">
        <div class="text-3xl lg:text-4xl font-bold mb-2">99%</div>
        <div class="text-primary-100">Satisfaction</div>
      </div>
    </div>
  </div>
</section>

<style>
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.8s ease-out forwards;
    opacity: 0;
  }

  @keyframes fade-in {
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
    animation: fade-in 0.6s ease-out forwards;
    opacity: 0;
  }
</style>
