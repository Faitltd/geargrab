<script>
  import { onMount } from 'svelte';

  onMount(() => {
    // Prevent any caching
    if (performance.navigation.type === 2) {
      location.reload(true);
    }
  });
</script>

<main>
  <slot />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
