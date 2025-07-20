<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let images: string[] = [];
  export let title = '';
  export let subtitle = '';
  export let autoplay = false;
  export let autoplayInterval = 5000;
  export let showDots = true;
  export let showArrows = true;
  export let height = 'h-96 md:h-[500px] lg:h-[600px]';
  
  let currentIndex = 0;
  let autoplayTimer: number | null = null;
  let carouselElement: HTMLElement;
  let touchStartX = 0;
  let touchEndX = 0;
  
  $: hasImages = images && images.length > 0;
  $: showNavigation = hasImages && images.length > 1;
  
  const nextSlide = () => {
    if (!hasImages) return;
    currentIndex = (currentIndex + 1) % images.length;
  };
  
  const prevSlide = () => {
    if (!hasImages) return;
    currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
  };
  
  const goToSlide = (index: number) => {
    if (!hasImages) return;
    currentIndex = index;
  };
  
  const startAutoplay = () => {
    if (!autoplay || !hasImages || images.length <= 1) return;
    
    autoplayTimer = window.setInterval(() => {
      nextSlide();
    }, autoplayInterval);
  };
  
  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };
  
  const handleKeydown = (event: KeyboardEvent) => {
    if (!showNavigation) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        prevSlide();
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextSlide();
        break;
    }
  };
  
  const handleTouchStart = (event: TouchEvent) => {
    touchStartX = event.touches[0].clientX;
  };
  
  const handleTouchEnd = (event: TouchEvent) => {
    touchEndX = event.changedTouches[0].clientX;
    handleSwipe();
  };
  
  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };
  
  onMount(() => {
    startAutoplay();
  });
  
  onDestroy(() => {
    stopAutoplay();
  });
  
  // Restart autoplay when currentIndex changes (user interaction)
  $: if (currentIndex !== undefined) {
    stopAutoplay();
    startAutoplay();
  }
</script>

<!-- Hero Carousel Container -->
<div 
  class="relative w-full {height} overflow-hidden bg-neutral-900"
  bind:this={carouselElement}
  on:keydown={handleKeydown}
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  on:mouseenter={stopAutoplay}
  on:mouseleave={startAutoplay}
  tabindex="0"
  role="region"
  aria-label="Image carousel"
>
  {#if hasImages}
    <!-- Image Slides -->
    <div class="relative w-full h-full">
      {#each images as image, index}
        <div 
          class="absolute inset-0 transition-opacity duration-500 ease-in-out {index === currentIndex ? 'opacity-100' : 'opacity-0'}"
          aria-hidden={index !== currentIndex}
        >
          <img
            src={image}
            alt={`${title} - Image ${index + 1}`}
            class="w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      {/each}
    </div>
    
    <!-- Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
    
  {:else}
    <!-- Placeholder when no images -->
    <div class="w-full h-full bg-neutral-200 flex items-center justify-center">
      <div class="text-center text-neutral-500">
        <svg class="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-lg font-medium">No images available</p>
      </div>
    </div>
  {/if}
  
  <!-- Title Overlay -->
  {#if title}
    <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
      <div class="max-w-4xl">
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
          {title}
        </h1>
        {#if subtitle}
          <p class="text-lg md:text-xl text-white/90 drop-shadow-md">
            {subtitle}
          </p>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Navigation Arrows -->
  {#if showArrows && showNavigation}
    <button
      on:click={prevSlide}
      class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
      aria-label="Previous image"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    
    <button
      on:click={nextSlide}
      class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
      aria-label="Next image"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  {/if}
  
  <!-- Dot Indicators -->
  {#if showDots && showNavigation}
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
      {#each images as _, index}
        <button
          on:click={() => goToSlide(index)}
          class="w-3 h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 {index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}"
          aria-label="Go to image {index + 1}"
        ></button>
      {/each}
    </div>
  {/if}
  
  <!-- Image Counter -->
  {#if showNavigation}
    <div class="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
      {currentIndex + 1} / {images.length}
    </div>
  {/if}
</div>
