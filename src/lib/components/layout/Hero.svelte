<script lang="ts">
  export let backgroundImage = '';
  export let height: 'sm' | 'md' | 'lg' | 'xl' | 'screen' = 'screen';
  export let overlay = true;
  export let overlayOpacity = 0.4;
  export let textAlign: 'left' | 'center' | 'right' = 'left';
  export let className = '';

  // Height classes
  const heightClasses = {
    sm: 'h-64',
    md: 'h-96',
    lg: 'h-[500px]',
    xl: 'h-[600px]',
    screen: 'h-screen'
  };

  // Text alignment classes
  const alignClasses = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right'
  };

  // Combined classes
  $: heroClasses = `relative ${heightClasses[height]} bg-cover bg-center bg-no-repeat ${className}`;
  $: contentClasses = `relative z-10 flex items-center ${alignClasses[textAlign]} h-full px-8 lg:px-16`;
</script>

<section 
  class={heroClasses}
  style={backgroundImage ? `background-image: url('${backgroundImage}');` : ''}
>
  {#if overlay}
    <div 
      class="absolute inset-0 bg-black z-0"
      style="opacity: {overlayOpacity};"
    ></div>
  {/if}
  
  <div class={contentClasses}>
    <div class="text-white max-w-4xl">
      <slot />
    </div>
  </div>
  
  <!-- Scroll indicator for full screen heroes -->
  {#if height === 'screen'}
    <div class="absolute bottom-8 right-8 z-10">
      <div class="w-8 h-8 border border-white rounded-full flex items-center justify-center animate-bounce">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </div>
    </div>
  {/if}
</section>

<style>
  /* Smooth scroll indicator animation */
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0,0,0);
    }
    40%, 43% {
      transform: translate3d(0,-8px,0);
    }
    70% {
      transform: translate3d(0,-4px,0);
    }
    90% {
      transform: translate3d(0,-2px,0);
    }
  }
  
  .animate-bounce {
    animation: bounce 2s infinite;
  }
</style>
