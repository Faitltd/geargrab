<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  
  export let duration: number = 300;
  export let easing: string = 'ease-out';
  
  let mounted = false;
  let transitioning = false;
  let currentPath = '';
  
  onMount(() => {
    mounted = true;
    currentPath = $page.url.pathname;
  });
  
  // Watch for route changes
  $: if (browser && mounted && $page.url.pathname !== currentPath) {
    handleRouteChange();
  }
  
  async function handleRouteChange() {
    transitioning = true;
    currentPath = $page.url.pathname;
    
    // Small delay to allow transition to start
    await new Promise(resolve => setTimeout(resolve, 50));
    transitioning = false;
  }
</script>

<div 
  class="page-transition"
  class:transitioning
  style="--duration: {duration}ms; --easing: {easing}"
>
  <slot />
</div>

{#if transitioning}
  <div class="transition-overlay">
    <div class="transition-spinner">
      <div class="spinner"></div>
    </div>
  </div>
{/if}

<style>
  .page-transition {
    transition: opacity var(--duration) var(--easing);
    min-height: 100vh;
  }
  
  .page-transition.transitioning {
    opacity: 0.7;
  }
  
  .transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(2px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }
  
  .transition-spinner {
    background: rgba(0, 0, 0, 0.8);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #374151;
    border-top: 2px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
