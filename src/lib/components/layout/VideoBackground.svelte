<script lang="ts">
  export let videoSrc: string = '/Stars.mp4';
  export let imageSrc: string = '/pexels-bianca-gasparoto-834990-1752951.jpg';
  export let imageAlt: string = 'Mountain landscape with stars';
  export let overlayOpacity: number = 0.3;

  let videoElement: HTMLVideoElement;
  let videoLoaded = false;

  // Video event handlers
  function handleVideoLoaded() {
    videoLoaded = true;
    if (videoElement) {
      videoElement.style.opacity = '1';
    }
  }

  function handleVideoError() {
    console.warn('Video failed to load:', videoSrc);
    if (videoElement) {
      videoElement.style.display = 'none';
    }
  }
</script>

<!-- Full Page Video Background -->
<div class="fixed inset-0 z-0">
  <!-- Fallback Background Color -->
  <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800"></div>

  <!-- Background Image (always visible) -->
  <div class="absolute inset-0">
    <img
      src={imageSrc}
      alt={imageAlt}
      class="w-full h-full object-cover"
      loading="eager"
    >
  </div>

  <!-- Video Background (overlays image when loaded) -->
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

  <!-- Light Overlay for Text Readability -->
  <div class="absolute inset-0 bg-black" style="opacity: {overlayOpacity}"></div>
</div>
