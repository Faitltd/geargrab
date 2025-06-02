<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

{#if mounted}
  <div class="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs">
    <h3 class="font-bold mb-2">Auth Status</h3>
    <p>Loading: {$authStore.loading}</p>
    <p>User: {$authStore.user ? $authStore.user.email : 'Not logged in'}</p>
    <p>Error: {$authStore.error || 'None'}</p>
  </div>
{/if}