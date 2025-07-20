<script lang="ts">
  import { onMount } from 'svelte';
  import GlassCard from './ui/GlassCard.svelte';
  import ModernButton from './ui/ModernButton.svelte';
  
  let currentSlide = 0;
  let autoplayInterval: number;
  let heroSection: HTMLElement;
  let scrollY = 0;
  
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "Rent Premium Outdoor Gear",
      subtitle: "From trusted locals in your area",
      description: "Discover thousands of verified outdoor gear rentals. From camping and hiking to climbing and cycling - find the perfect equipment for your next adventure.",
      primaryCta: "Browse Gear",
      primaryCtaLink: "/gear",
      secondaryCta: "List Your Gear",
      secondaryCtaLink: "/listings/new",
      stats: [
        { number: "10K+", label: "Gear Items" },
        { number: "5K+", label: "Happy Renters" },
        { number: "2K+", label: "Trusted Owners" }
      ]
    },
    {
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "Adventure Awaits",
      subtitle: "Get equipped for your next journey",
      description: "Access premium outdoor equipment without the premium price tag. Rent from fellow adventurers who know gear inside and out.",
      primaryCta: "Start Exploring",
      primaryCtaLink: "/gear",
      secondaryCta: "Learn More",
      secondaryCtaLink: "/about",
      stats: [
        { number: "95%", label: "Satisfaction Rate" },
        { number: "24/7", label: "Support" },
        { number: "100%", label: "Verified Gear" }
      ]
    },
    {
      image: "https://images.unsplash.com/photo-1464822759844-d150baec0494?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "Earn with Your Gear",
      subtitle: "Turn your equipment into income",
      description: "List your outdoor gear and earn money when you're not using it. Join thousands of gear owners making extra income.",
      primaryCta: "List Your Gear",
      primaryCtaLink: "/listings/new",
      secondaryCta: "See Earnings",
      secondaryCtaLink: "/dashboard",
      stats: [
        { number: "$500+", label: "Avg Monthly Earnings" },
        { number: "80%", label: "Repeat Customers" },
        { number: "48hrs", label: "Avg Response Time" }
      ]
    }
  ];
  
  const nextSlide = () => {
    currentSlide = (currentSlide + 1) % slides.length;
  };
  
  const prevSlide = () => {
    currentSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
  };
  
  const goToSlide = (index: number) => {
    currentSlide = index;
  };
  
  const startAutoplay = () => {
    autoplayInterval = setInterval(nextSlide, 8000);
  };
  
  const stopAutoplay = () => {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  };
  
  onMount(() => {
    startAutoplay();
    
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      stopAutoplay();
      window.removeEventListener('scroll', handleScroll);
    };
  });
  
  $: parallaxOffset = scrollY * 0.5;
  $: currentSlideData = slides[currentSlide];
</script>

<svelte:window bind:scrollY />

<!-- Hero Section with Parallax -->
<section 
  bind:this={heroSection}
  class="relative min-h-screen flex items-center justify-center overflow-hidden"
  on:mouseenter={stopAutoplay}
  on:mouseleave={startAutoplay}
>
  <!-- Background Images with Parallax -->
  {#each slides as slide, index}
    <div 
      class="absolute inset-0 transition-opacity duration-1000"
      class:opacity-100={index === currentSlide}
      class:opacity-0={index !== currentSlide}
      style="transform: translateY({parallaxOffset}px)"
    >
      <img 
        src={slide.image} 
        alt="Hero background"
        class="w-full h-full object-cover scale-110"
      />
      <div class="absolute inset-0 hero-gradient-overlay"></div>
    </div>
  {/each}
  
  <!-- Floating Elements -->
  <div class="absolute top-20 left-10 animate-float">
    <div class="w-4 h-4 bg-white/30 rounded-full"></div>
  </div>
  <div class="absolute top-40 right-20 animate-float" style="animation-delay: 2s;">
    <div class="w-6 h-6 bg-primary-400/40 rounded-full"></div>
  </div>
  <div class="absolute bottom-40 left-20 animate-float" style="animation-delay: 4s;">
    <div class="w-3 h-3 bg-accent-400/50 rounded-full"></div>
  </div>
  
  <!-- Main Content -->
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div class="animate-fade-in-up">
      <!-- Main Heading -->
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 text-shadow-lg">
        <span class="block">{currentSlideData.title}</span>
      </h1>
      
      <!-- Subtitle -->
      <p class="text-xl md:text-2xl lg:text-3xl text-primary-100 mb-8 text-shadow max-w-4xl mx-auto">
        {currentSlideData.subtitle}
      </p>
      
      <!-- Description -->
      <p class="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto text-shadow">
        {currentSlideData.description}
      </p>
      
      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-6 justify-center mb-16">
        <ModernButton 
          variant="glass" 
          size="lg"
          href={currentSlideData.primaryCtaLink}
        >
          {currentSlideData.primaryCta}
        </ModernButton>
        
        <ModernButton 
          variant="outline" 
          size="lg"
          href={currentSlideData.secondaryCtaLink}
        >
          {currentSlideData.secondaryCta}
        </ModernButton>
      </div>
      
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {#each currentSlideData.stats as stat}
          <GlassCard variant="dark" size="md" class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-white mb-2">
              {stat.number}
            </div>
            <div class="text-primary-200 font-medium">
              {stat.label}
            </div>
          </GlassCard>
        {/each}
      </div>
    </div>
  </div>
  
  <!-- Navigation Dots -->
  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
    {#each slides as _, index}
      <button
        class="w-3 h-3 rounded-full transition-all duration-300"
        class:bg-white={index === currentSlide}
        class:bg-white/40={index !== currentSlide}
        class:scale-125={index === currentSlide}
        on:click={() => goToSlide(index)}
        aria-label="Go to slide {index + 1}"
      ></button>
    {/each}
  </div>
  
  <!-- Navigation Arrows -->
  <button 
    on:click={prevSlide}
    class="absolute left-8 top-1/2 transform -translate-y-1/2 glass text-white p-4 rounded-full hover:bg-white/20 transition-all duration-300 z-20"
    aria-label="Previous slide"
  >
    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  
  <button 
    on:click={nextSlide}
    class="absolute right-8 top-1/2 transform -translate-y-1/2 glass text-white p-4 rounded-full hover:bg-white/20 transition-all duration-300 z-20"
    aria-label="Next slide"
  >
    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>
  
  <!-- Scroll Indicator -->
  <div class="absolute bottom-8 right-8 animate-bounce">
    <div class="glass text-white p-3 rounded-full">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </div>
</section>
