<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  
  // Import components when they're created
  // import Navbar from '$lib/components/layout/Navbar.svelte';
  // import Footer from '$lib/components/layout/Footer.svelte';
</script>

<!-- Add Navbar component here -->

<main class="min-h-screen">
  <slot />
</main>

<!-- Add Footer component here -->