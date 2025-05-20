<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
</script>

<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
<Navbar />

<main id="main-content" class="min-h-screen">
  <slot />
</main>

<Footer />