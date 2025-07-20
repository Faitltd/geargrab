<script lang="ts">
  export let loading = false;
  export let hasMore = true;
  export let error: string | null = null;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showText = true;
  
  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: 'w-6 h-6',
      container: 'py-4',
      text: 'text-sm'
    },
    md: {
      spinner: 'w-8 h-8',
      container: 'py-6',
      text: 'text-base'
    },
    lg: {
      spinner: 'w-12 h-12',
      container: 'py-8',
      text: 'text-lg'
    }
  };
  
  $: config = sizeConfig[size];
</script>

<!-- Infinite Scroll Loading Container -->
<div class="w-full flex flex-col items-center justify-center {config.container}">
  {#if loading}
    <!-- GearGrab-Style Loading Spinner -->
    <div class="flex flex-col items-center space-y-3">
      <!-- Spinner -->
      <div class="relative {config.spinner}">
        <!-- Outer ring -->
        <div class="absolute inset-0 border-4 border-neutral-200 rounded-full"></div>
        
        <!-- Animated ring -->
        <div class="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
        
        <!-- Inner dot -->
        <div class="absolute inset-2 bg-primary-500 rounded-full opacity-20 animate-pulse"></div>
      </div>
      
      <!-- Loading Text -->
      {#if showText}
        <div class="text-center">
          <p class="font-medium text-neutral-700 {config.text}">
            Loading more gear...
          </p>
          <p class="text-xs text-neutral-500 mt-1">
            Discovering quality outdoor equipment
          </p>
        </div>
      {/if}
    </div>
    
  {:else if error}
    <!-- Error State -->
    <div class="flex flex-col items-center space-y-3 text-center max-w-md">
      <!-- Error Icon -->
      <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <!-- Error Message -->
      <div>
        <p class="font-medium text-neutral-900 {config.text}">
          Unable to load more items
        </p>
        <p class="text-sm text-neutral-600 mt-1">
          {error}
        </p>
      </div>
      
      <!-- Retry Button -->
      <button
        on:click={() => window.location.reload()}
        class="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Try Again
      </button>
    </div>
    
  {:else if !hasMore}
    <!-- End of Results -->
    <div class="flex flex-col items-center space-y-3 text-center">
      <!-- End Icon -->
      <div class="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <!-- End Message -->
      <div>
        <p class="font-medium text-neutral-700 {config.text}">
          You've seen it all!
        </p>
        <p class="text-sm text-neutral-500 mt-1">
          No more gear to show right now
        </p>
      </div>
      
      <!-- Back to Top -->
      <button
        on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
        Back to Top
      </button>
    </div>
  {/if}
</div>

<!-- Intersection Observer Target (invisible) -->
{#if hasMore && !loading && !error}
  <div class="w-full h-px" data-infinite-scroll-trigger></div>
{/if}

<style>
  /* Custom spinner animation for smoother rotation */
  @keyframes spin-smooth {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin-smooth 1s linear infinite;
  }
  
  /* Pulse animation for inner dot */
  @keyframes pulse-soft {
    0%, 100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.4;
    }
  }
  
  .animate-pulse {
    animation: pulse-soft 2s ease-in-out infinite;
  }
</style>
