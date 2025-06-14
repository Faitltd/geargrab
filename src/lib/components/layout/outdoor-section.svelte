<script lang="ts">
  export let backgroundImage: string;
  export let overlayOpacity: number = 0.7;
  export let blurIntensity: string = 'backdrop-blur-sm';
  export let padding: string = 'py-16';
  export let fadeTop: boolean = true;
  export let fadeBottom: boolean = true;
  export let contentBg: string = 'bg-white bg-opacity-90';

  // Curated outdoor background images
  const outdoorImages = {
    forest: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80',
    mountains: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    lake: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    river: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
    desert: 'https://images.unsplash.com/photo-1464822759844-d150baec0494?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    snow: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80'
  };

  // Use provided image or default to forest
  $: bgImage = backgroundImage || outdoorImages.forest;
</script>

<!-- Outdoor Section with Background -->
<section class="relative {padding}">
  <!-- Background Image -->
  <div
    class="absolute inset-0 bg-cover bg-center bg-fixed"
    style="background-image: url('{bgImage}');"
  ></div>

  <!-- Dark Overlay -->
  <div class="absolute inset-0 bg-black opacity-{overlayOpacity * 10}"></div>

  <!-- Top Blur Transition -->
  {#if fadeTop}
    <div class="absolute top-0 left-0 right-0 h-8 backdrop-blur-sm bg-gradient-to-b from-black/20 to-transparent"></div>
  {/if}

  <!-- Content Container with Blur Background -->
  <div class="relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="{contentBg} {blurIntensity} rounded-lg shadow-lg p-8 md:p-12">
        <slot />
      </div>
    </div>
  </div>

  <!-- Bottom Blur Transition -->
  {#if fadeBottom}
    <div class="absolute bottom-0 left-0 right-0 h-8 backdrop-blur-sm bg-gradient-to-t from-black/20 to-transparent"></div>
  {/if}
</section>

<style>
  /* Ensure smooth transitions */
  section {
    transition: all 0.3s ease-in-out;
  }

  /* Parallax effect for background */
  .bg-fixed {
    background-attachment: fixed;
  }

  @media (max-width: 768px) {
    /* Disable parallax on mobile for better performance */
    .bg-fixed {
      background-attachment: scroll;
    }
  }
</style>
