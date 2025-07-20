<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let images: string[] = [];
  export let title: string = '';
  export let allowZoom: boolean = true;
  export let showThumbnails: boolean = true;
  
  const dispatch = createEventDispatcher<{
    imageChange: { index: number; image: string };
  }>();
  
  let currentIndex = 0;
  let isZoomed = false;
  let zoomLevel = 1;
  let zoomX = 0;
  let zoomY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  
  $: currentImage = images[currentIndex] || '';
  
  const nextImage = () => {
    currentIndex = (currentIndex + 1) % images.length;
    dispatch('imageChange', { index: currentIndex, image: currentImage });
  };
  
  const prevImage = () => {
    currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    dispatch('imageChange', { index: currentIndex, image: currentImage });
  };
  
  const goToImage = (index: number) => {
    currentIndex = index;
    dispatch('imageChange', { index: currentIndex, image: currentImage });
  };
  
  const toggleZoom = () => {
    if (!allowZoom) return;
    
    if (isZoomed) {
      isZoomed = false;
      zoomLevel = 1;
      zoomX = 0;
      zoomY = 0;
    } else {
      isZoomed = true;
      zoomLevel = 2;
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isZoomed || !allowZoom) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    zoomX = (x - 0.5) * -100;
    zoomY = (y - 0.5) * -100;
  };
  
  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevImage();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextImage();
        break;
      case 'Escape':
        if (isZoomed) {
          toggleZoom();
        }
        break;
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="relative bg-neutral-100 rounded-2xl overflow-hidden group">
  <!-- Main Image Container -->
  <div class="relative aspect-[4/3] overflow-hidden">
    <!-- Main Image -->
    <div 
      class="w-full h-full cursor-pointer transition-transform duration-300"
      class:cursor-zoom-in={!isZoomed && allowZoom}
      class:cursor-zoom-out={isZoomed && allowZoom}
      style="transform: scale({zoomLevel}) translate({zoomX}px, {zoomY}px)"
      on:click={toggleZoom}
      on:mousemove={handleMouseMove}
      role="button"
      tabindex="0"
      aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
    >
      <img 
        src={currentImage}
        alt="{title} - Image {currentIndex + 1}"
        class="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />
    </div>
    
    <!-- Loading Skeleton -->
    {#if !currentImage}
      <div class="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
        <svg class="h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    {/if}
    
    <!-- Navigation Arrows -->
    {#if images.length > 1}
      <button 
        class="absolute left-4 top-1/2 transform -translate-y-1/2 glass text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
        on:click|stopPropagation={prevImage}
        aria-label="Previous image"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        class="absolute right-4 top-1/2 transform -translate-y-1/2 glass text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
        on:click|stopPropagation={nextImage}
        aria-label="Next image"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    {/if}
    
    <!-- Image Counter -->
    {#if images.length > 1}
      <div class="absolute bottom-4 right-4 glass text-white px-3 py-1 rounded-full text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>
    {/if}
    
    <!-- Zoom Indicator -->
    {#if allowZoom}
      <div class="absolute top-4 right-4 glass text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </div>
    {/if}
  </div>
  
  <!-- Thumbnail Navigation -->
  {#if showThumbnails && images.length > 1}
    <div class="p-4">
      <div class="flex gap-2 overflow-x-auto scrollbar-hide">
        {#each images as image, index}
          <button
            class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200"
            class:border-primary-500={index === currentIndex}
            class:border-transparent={index !== currentIndex}
            class:opacity-100={index === currentIndex}
            class:opacity-60={index !== currentIndex}
            on:click={() => goToImage(index)}
            aria-label="View image {index + 1}"
          >
            <img 
              src={image}
              alt="{title} thumbnail {index + 1}"
              class="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
              loading="lazy"
            />
          </button>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Dots Indicator (alternative to thumbnails) -->
  {#if !showThumbnails && images.length > 1}
    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
      {#each images as _, index}
        <button
          class="w-3 h-3 rounded-full transition-all duration-300"
          class:bg-white={index === currentIndex}
          class:bg-white/50={index !== currentIndex}
          class:scale-125={index === currentIndex}
          on:click={() => goToImage(index)}
          aria-label="Go to image {index + 1}"
        ></button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .cursor-zoom-in {
    cursor: zoom-in;
  }
  
  .cursor-zoom-out {
    cursor: zoom-out;
  }
</style>
