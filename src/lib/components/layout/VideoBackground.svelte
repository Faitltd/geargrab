<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let videoSrc: string = '/Stars.mp4';
  export let imageSrc: string = '/pexels-bianca-gasparoto-834990-1752951.jpg';
  export let imageAlt: string = 'Mountain landscape with stars';
  export let overlayOpacity: number = 0.3;

  let videoElement: HTMLVideoElement;
  let imageElement: HTMLImageElement;
  let videoLoaded = false;
  let imageLoaded = true; // Start visible to ensure background shows
  let shouldLoadVideo = true; // Start loading video immediately
  let imageError = false;

  // Preload image first, then video
  onMount(() => {
    if (!browser) return;

    // Start loading video after a short delay to prioritize image
    const timer = setTimeout(() => {
      shouldLoadVideo = true;
    }, 500);

    // Fallback timer to ensure background is visible even if image fails
    const fallbackTimer = setTimeout(() => {
      if (!imageLoaded && !imageError) {
        imageLoaded = true; // Force show background
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  });

  // Video event handlers
  function handleVideoLoaded() {
    videoLoaded = true;
    if (videoElement) {
      videoElement.style.opacity = '1';
    }
  }

  function handleVideoError() {
    if (videoElement) {
      videoElement.style.display = 'none';
    }
  }

  function handleImageLoaded() {
    imageLoaded = true;
  }

  function handleImageError() {
    imageError = true;
    imageLoaded = true; // Show fallback background
  }
</script>

<!-- Full Page Video Background -->
<div class="fixed inset-0 z-0">
  <!-- Fallback Background Color -->
  <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800"></div>

  <!-- Background Image (loads immediately) -->
  <div class="absolute inset-0">
    <img
      bind:this={imageElement}
      src={imageSrc}
      alt={imageAlt}
      class="w-full h-full object-cover transition-opacity duration-500"
      style="opacity: {imageLoaded ? 1 : 0};"
      on:load={handleImageLoaded}
      on:error={handleImageError}
      loading="eager"
    >
  </div>

  <!-- Video Background (loads after delay) -->
  {#if shouldLoadVideo}
    <video
      bind:this={videoElement}
      class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
      style="opacity: {videoLoaded ? 1 : 0};"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      on:loadeddata={handleVideoLoaded}
      on:error={handleVideoError}
    >
      <source src={videoSrc} type="video/mp4" />
    </video>
  {/if}

  <!-- Light Overlay for Text Readability -->
  <div class="absolute inset-0 bg-black" style="opacity: {overlayOpacity}"></div>
</div>
