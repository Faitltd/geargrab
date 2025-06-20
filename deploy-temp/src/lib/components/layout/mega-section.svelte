<script lang="ts">
  export let backgroundImage: string;
  export let height: string = 'min-h-screen';
  export let overlayOpacity: number = 0.4;
  export let parallax: boolean = true;
  
  // Large, high-quality outdoor images for mega sections
  const megaImages = {
    mountains: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib="rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',"
    forest: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib="rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',"
    lake: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib="rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',"
    desert: 'https://images.unsplash.com/photo-1464822759844-d150baec0494?ixlib="rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',"
    hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib="rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',"
    camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib="rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'"
  };
  
  $: bgImage = backgroundImage || megaImages.mountains;
</script>

<!-- Mega Section with Large Background -->
<section class="relative {height} overflow-hidden">
  <!-- Large Background Image with Parallax -->
  <div
    class="absolute inset-0 bg-cover bg-center {parallax ? 'bg-fixed' : ''}"
    style="background-image: url('{bgImage}'); background-size: cover; background-position: center;"
  ></div>
  
  <!-- Gradient Overlay for Depth -->
  <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/{overlayOpacity * 10} to-black/60"></div>
  
  <!-- Content Areas -->
  <div class="relative h-full">
    <slot />
  </div>
  
  <!-- Seamless Blur Blend at Bottom -->
  <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 via-black/10 to-transparent backdrop-blur-md"></div>
</section>

<style>
  /* Enhanced parallax effect */
  .bg-fixed {
    background-attachment: fixed;
    will-change: transform;
  }
  
  /* Smooth transitions */
  section {
    transition: all 0.3s ease-in-out;
  }
  
  @media (max-width: 768px) {
    /* Disable parallax on mobile for performance */
    .bg-fixed {
      background-attachment: scroll;
    }
  }
</style>
