<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import NatureBackground from '$lib/components/layout/NatureBackground.svelte';

  // BACKGROUND CHECKS TEMPORARILY DISABLED
  // Redirect users back to verification page with a message
  onMount(() => {
    goto('/dashboard/verification?message=background-checks-disabled');
  });
</script>

<svelte:head>
  <title>Background Check - Verification - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<NatureBackground variant="mountains" overlayOpacity={0.3} />

<div class="min-h-screen relative z-10 flex items-center justify-center">
  <div class="max-w-md mx-auto px-4">
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
      <div class="text-6xl mb-4">🚧</div>
      <h1 class="text-2xl font-bold text-white mb-4">Feature Temporarily Unavailable</h1>
      <p class="text-gray-300 mb-6">
        Background checks are currently being updated and will be available soon.
        You'll be redirected to the verification dashboard.
      </p>
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
    </div>
  </div>
</div>