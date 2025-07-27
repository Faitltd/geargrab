<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Redirect to browse page for now
    goto('/browse');
  });
</script>

<svelte:head>
  <title>My Rentals - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-2xl font-bold text-gray-900 mb-4">Redirecting...</h1>
    <p class="text-gray-600">Taking you to the browse page...</p>
  </div>
</div>