<script lang="ts">
  export let title: string;
  export let subtitle: string = '';
  export let height: string = 'h-screen';
  export let showContent: boolean = true;

  let videoElement: HTMLVideoElement;

  // Mountain with stars video URL (using local video as primary)
  const videoUrl = '/857136-hd_1280_720_24fps.mp4';

  // Fallback image if video fails to load
  const fallbackImage = '/pexels-shubhendu-singh-1278012-2439742.jpg';
</script>

<!-- Video Hero Section -->
<div class="relative {height} overflow-hidden">
  <!-- Background Image (always visible as fallback) -->
  <div class="absolute inset-0">
    <img
      src={fallbackImage}
      alt="Mountain landscape with stars"
      class="w-full h-full object-cover"
    >
  </div>

  <!-- Video Background (overlays image when loaded) -->
  <video
    bind:this={videoElement}
    class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
    style="opacity: 1;"
    autoplay
    muted
    loop
    playsinline
    on:loadeddata={() => {
      console.log('VideoHero video loaded');
      if (videoElement) {
        videoElement.style.opacity = '1';
      }
    }}
    on:error={() => {
      console.log('VideoHero video error');
      if (videoElement) {
        videoElement.style.display = 'none';
      }
    }}
    on:loadstart={() => console.log('VideoHero video load started')}
  >
    <source src={videoUrl} type="video/mp4" />
    <!-- Fallback video -->
    <source src="https://player.vimeo.com/external/291648067.hd.mp4?s=94998971682c6a3267e4cbd19d16a7b6c720f345&profile_id=175" type="video/mp4" />
  </video>

  <!-- Light Overlay for Text Readability -->
  <div class="absolute inset-0 bg-black opacity-20"></div>

  {#if showContent}
    <!-- Content -->
    <div class="relative h-full flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          {title}
        </h1>
        {#if subtitle}
          <p class="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto text-gray-100 leading-relaxed">
            {subtitle}
          </p>
        {/if}

        <!-- Slot for additional content like buttons -->
        <div class="mt-8">
          <slot />
        </div>
      </div>
    </div>
  {/if}

  <!-- Blur Transition to Next Section -->
  <div class="absolute bottom-0 left-0 right-0 h-8 backdrop-blur-sm bg-gradient-to-t from-black/20 to-transparent"></div>
</div>

<style>
  /* Ensure video covers the entire container */
  video {
    min-width: 100%;
    min-height: 100%;
  }

  /* Smooth fade animation */
  .fade-transition {
    transition: opacity 0.3s ease-in-out;
  }
</style>
