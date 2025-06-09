<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';

  // BACKGROUND CHECKS TEMPORARILY DISABLED
  // Redirect admins back to admin dashboard
  onMount(() => {
    goto('/admin?message=background-checks-disabled');
  });
</script>

<svelte:head>
  <title>Background Check Administration - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<VideoBackground
  videoSrc="/857134-hd_1280_720_24fps.mp4"
  overlayOpacity={0.3}
/>

<div class="min-h-screen relative z-10 flex items-center justify-center">
  <div class="max-w-md mx-auto px-4">
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
      <div class="text-6xl mb-4">🚧</div>
      <h1 class="text-2xl font-bold text-white mb-4">Feature Temporarily Unavailable</h1>
      <p class="text-gray-300 mb-6">
        Background check administration is currently being updated and will be available soon.
        You'll be redirected to the admin dashboard.
      </p>
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
    </div>
  </div>
</div>