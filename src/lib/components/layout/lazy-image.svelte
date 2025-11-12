<script lang="ts">
  import { onMount } from 'svelte';
  
  export let src;
  export let alt = '';
  export let width | string = 'auto';
  export let height | string = 'auto';
  export let aspectRatio = '';
  export let placeholder = '';
  export let className = '';
  export let loading: 'lazy' | 'eager' = 'lazy';
  export let fadeIn = true;
  
  let imageElement: HTMLImageElement;
  let loaded = false;
  let error = false;
  let intersecting = false;
  
  // Create intersection observer for lazy loading
  onMount(() => {
    if (loading === 'lazy') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              intersecting = true;
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );
      
      if (imageElement) {
        observer.observe(imageElement);
      }
      
      return () => observer.disconnect();
    } else {
      intersecting = true;
    }
  });
  
  function handleLoad() {
    loaded = true;
    error = false;
  }
  
  function handleError() {
    error = true;
    loaded = false;
  }
  
  $: containerStyle = `
    ${aspectRatio ? `aspect-ratio: ${aspectRatio};` : ''}
    ${typeof width === 'number' ? `width: ${width}px;` : `width: ${width};`}
    ${typeof height === 'number' ? `height: ${height}px;` : `height: ${height};`}
  `;
</script>

<div 
  class="lazy-image-container {className}"
  style="{containerStyle}"
  bind:this="{imageElement}"
>
  {#if intersecting || loading === 'eager'}
    <img
      {src}
      {alt}
      class="lazy-image"
      class:loaded
      class:fade-in="{fadeIn}"
      class:error
      on:load="{handleLoad}"
      on:error="{handleError}"
    />
  {/if}
  
  {#if !loaded && !error}
    <div class="image-placeholder">
      {#if placeholder}
        <img src="{placeholder}" {alt} class="placeholder-img" />
      {:else}
        <div class="skeleton-placeholder"></div>
      {/if}
    </div>
  {/if}
  
  {#if error}
    <div class="error-placeholder">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span class="error-text">Failed to load image</span>
    </div>
  {/if}
</div>

<style>
  .lazy-image-container {
    position: relative;
    overflow: hidden;
    background-color: #374151;
    border-radius: inherit;
  }
  
  .lazy-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease-in-out;
    opacity: 0;
  }
  
  .lazy-image.loaded {
    opacity: 1;
  }
  
  .lazy-image.fade-in.loaded {
    animation: fadeInImage 0.6s ease-out forwards;
  }
  
  .image-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(5px);
    opacity: 0.7;
  }
  
  .skeleton-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }
  
  .error-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #1f2937;
    color: #9ca3af;
  }
  
  .error-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
  }
  
  .error-text {
    font-size: 14px;
    text-align: center;
  }
  
  @keyframes fadeInImage {
    from { opacity: 0; transform: scale(1.05); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
