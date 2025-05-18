<script lang="ts">
  import '../app.css';
  import Navbar from '$lib/components/layout/Navbar.svelte';
</script>

<Navbar />

<main class="min-h-screen">
  <slot />
</main>

<footer class="bg-gray-800 text-white py-8">
  <div class="container mx-auto px-4">
    <p class="text-center">&copy; {new Date().getFullYear()} GearGrab. All rights reserved.</p>
  </div>
</footer>
