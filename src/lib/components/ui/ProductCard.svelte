<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import GlassCard from './GlassCard.svelte';
  import ModernButton from './ModernButton.svelte';
  
  export let product: {
    id: string;
    title: string;
    description: string;
    price: number;
    priceUnit: string;
    images: string[];
    location: string;
    rating: number;
    reviewCount: number;
    owner: {
      name: string;
      avatar: string;
      verified: boolean;
    };
    category: string;
    condition: string;
    availability: string;
    featured?: boolean;
  };
  
  export let variant: 'default' | 'featured' | 'compact' = 'default';
  export let showQuickActions: boolean = true;
  
  const dispatch = createEventDispatcher<{
    click: { product: typeof product };
    favorite: { product: typeof product };
    quickRent: { product: typeof product };
  }>();
  
  let imageLoaded = false;
  let currentImageIndex = 0;
  
  const handleImageLoad = () => {
    imageLoaded = true;
  };
  
  const nextImage = (e: Event) => {
    e.stopPropagation();
    currentImageIndex = (currentImageIndex + 1) % product.images.length;
  };
  
  const prevImage = (e: Event) => {
    e.stopPropagation();
    currentImageIndex = currentImageIndex === 0 ? product.images.length - 1 : currentImageIndex - 1;
  };
  
  const handleClick = () => {
    dispatch('click', { product });
  };
  
  const handleFavorite = (e: Event) => {
    e.stopPropagation();
    dispatch('favorite', { product });
  };
  
  const handleQuickRent = (e: Event) => {
    e.stopPropagation();
    dispatch('quickRent', { product });
  };
  
  $: currentImage = product.images[currentImageIndex] || product.images[0];
  $: cardClass = variant === 'featured' ? 'card-product ring-2 ring-primary-500/20' : 'card-product';
</script>

<div 
  class="{cardClass} cursor-pointer"
  class:scale-105={variant === 'featured'}
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
>
  <!-- Image Container -->
  <div class="relative aspect-[4/3] overflow-hidden">
    <!-- Main Image -->
    <img
      src={currentImage}
      alt={product.title}
      class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 {imageLoaded ? 'opacity-100' : 'opacity-0'}"
      on:load={handleImageLoad}
    />
    
    <!-- Loading Skeleton -->
    {#if !imageLoaded}
      <div class="absolute inset-0 bg-neutral-200 animate-pulse"></div>
    {/if}
    
    <!-- Image Navigation -->
    {#if product.images.length > 1}
      <button 
        class="absolute left-2 top-1/2 transform -translate-y-1/2 glass text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
        on:click={prevImage}
        aria-label="Previous image"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        class="absolute right-2 top-1/2 transform -translate-y-1/2 glass text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
        on:click={nextImage}
        aria-label="Next image"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <!-- Image Dots -->
      <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {#each product.images as _, index}
          <div
            class="w-2 h-2 rounded-full transition-all duration-300 {index === currentImageIndex ? 'bg-white' : 'bg-white/50'}"
          ></div>
        {/each}
      </div>
    {/if}
    
    <!-- Badges -->
    <div class="absolute top-3 left-3 flex flex-col gap-2">
      {#if product.featured}
        <span class="glass-card px-2 py-1 text-xs font-semibold text-primary-600 rounded-full">
          Featured
        </span>
      {/if}
      
      {#if product.availability === 'available'}
        <span class="glass-card px-2 py-1 text-xs font-semibold text-green-600 rounded-full">
          Available
        </span>
      {:else if product.availability === 'limited'}
        <span class="glass-card px-2 py-1 text-xs font-semibold text-orange-600 rounded-full">
          Limited
        </span>
      {/if}
    </div>
    
    <!-- Quick Actions -->
    {#if showQuickActions}
      <div class="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button 
          class="glass text-white p-2 rounded-full hover:bg-white/20 transition-all duration-300"
          on:click={handleFavorite}
          aria-label="Add to favorites"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        
        <button 
          class="glass text-white p-2 rounded-full hover:bg-white/20 transition-all duration-300"
          on:click={handleQuickRent}
          aria-label="Quick rent"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
  
  <!-- Content -->
  <div class="p-6">
    <!-- Category & Condition -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
        {product.category}
      </span>
      <span class="text-sm text-neutral-500">
        {product.condition}
      </span>
    </div>
    
    <!-- Title -->
    <h3 class="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300">
      {product.title}
    </h3>
    
    <!-- Description -->
    <p class="text-neutral-600 text-sm mb-4 line-clamp-2">
      {product.description}
    </p>
    
    <!-- Rating & Reviews -->
    <div class="flex items-center gap-2 mb-4">
      <div class="flex items-center">
        {#each Array(5) as _, i}
          <svg 
            class="h-4 w-4"
            class:text-yellow-400={i < Math.floor(product.rating)}
            class:text-neutral-300={i >= Math.floor(product.rating)}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        {/each}
      </div>
      <span class="text-sm text-neutral-500">
        {product.rating} ({product.reviewCount} reviews)
      </span>
    </div>
    
    <!-- Owner Info -->
    <div class="flex items-center gap-3 mb-4">
      <img 
        src={product.owner.avatar} 
        alt={product.owner.name}
        class="w-8 h-8 rounded-full object-cover"
      />
      <div class="flex-1">
        <div class="flex items-center gap-1">
          <span class="text-sm font-medium text-neutral-900">
            {product.owner.name}
          </span>
          {#if product.owner.verified}
            <svg class="h-4 w-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {/if}
        </div>
        <span class="text-xs text-neutral-500">
          {product.location}
        </span>
      </div>
    </div>
    
    <!-- Price & CTA -->
    <div class="flex items-center justify-between">
      <div>
        <span class="text-2xl font-bold text-neutral-900">
          ${product.price}
        </span>
        <span class="text-sm text-neutral-500">
          /{product.priceUnit}
        </span>
      </div>
      
      <ModernButton 
        variant="primary" 
        size="sm"
        on:click={handleQuickRent}
      >
        Rent Now
      </ModernButton>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
