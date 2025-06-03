<script lang="ts">
  export let videoSrc: string = '/Stars.mp4';
  export let imageSrc: string = '/pexels-bianca-gasparoto-834990-1752951.jpg';
  export let imageAlt: string = 'Mountain landscape with stars';
  export let overlayOpacity: number = 0.3;
  
  let videoElement: HTMLVideoElement;
  
  // Video event handlers
  function handleVideoLoaded() {
    if (videoElement) {
      videoElement.style.opacity = '1';
    }
  }
  
  function handleVideoError() {
    if (videoElement) {
      videoElement.style.display = 'none';
    }
  }
</script>

<!-- Full Page Video Background -->
<div class="fixed inset-0 z-0">
  <!-- Background Image (always visible as fallback) -->
  <div class="absolute inset-0">
    <img
      src={imageSrc}
      alt={imageAlt}
      class="w-full h-full object-cover"
    >
  </div>

  <!-- Video Background (overlays image when loaded) -->
  <video
    bind:this={videoElement}
    class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
    style="opacity: 0;"
    autoplay
    muted
    loop
    playsinline
    on:loadeddata={handleVideoLoaded}
    on:error={handleVideoError}
  >
    <source src={videoSrc} type="video/mp4" />
  </video>

  <!-- Light Overlay for Text Readability -->
  <div class="absolute inset-0 bg-black" style="opacity: {overlayOpacity}"></div>
</div>
