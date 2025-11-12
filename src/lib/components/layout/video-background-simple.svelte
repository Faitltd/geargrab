<script>
  import { onMount } from 'svelte';

  export let videoSrc = '/Stars.mp4';
  export let imageSrc = '/pexels-bianca-gasparoto-834990-1752951.jpg';
  export let imageAlt = 'Mountain landscape with stars';
  export let overlayOpacity = 0.3;

  let videoElement;
  let videoLoaded = false;
  let imageLoaded = false;

  onMount(() => {
    if (videoElement) {
      videoElement.addEventListener('loadeddata', () => {
        videoLoaded = true;
      });
    }
  });

  function handleImageLoad() {
    imageLoaded = true;
  }

  function handleImageError() {
    console.warn('Background image failed to load');
    imageLoaded = true; // Still show the overlay
  }
</script>

<!-- Fixed Video Background -->
<div class="fixed inset-0 z-0 overflow-hidden">
  <!-- Fallback Image -->
  <img
    src={imageSrc}
    alt={imageAlt}
    class="absolute inset-0 w-full h-full object-cover"
    class:opacity-0={videoLoaded}
    class:opacity-100={!videoLoaded}
    on:load={handleImageLoad}
    on:error={handleImageError}
  />

  <!-- Video Background -->
  <video
    bind:this={videoElement}
    class="absolute inset-0 w-full h-full object-cover"
    class:opacity-0={!videoLoaded}
    class:opacity-100={videoLoaded}
    autoplay
    muted
    loop
    playsinline
    preload="metadata"
  >
    <source src={videoSrc} type="video/mp4" />
    Your browser does not support the video tag.
  </video>

  <!-- Dark Overlay -->
  <div 
    class="absolute inset-0 bg-black transition-opacity duration-1000"
    style="opacity: {overlayOpacity}"
  ></div>
</div>

<style>
  video {
    transition: opacity 1s ease-in-out;
  }
  
  img {
    transition: opacity 1s ease-in-out;
  }
</style>
