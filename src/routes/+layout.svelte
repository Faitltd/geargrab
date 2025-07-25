<script lang="ts">
  import '../app.css';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import { onMount } from 'svelte';

  let scrollY = 0;
  let innerHeight = 0;

  // Parallax effect
  onMount(() => {
    const updateParallax = () => {
      scrollY = window.scrollY;
      requestAnimationFrame(updateParallax);
    };
    updateParallax();
  });
</script>

<svelte:window bind:scrollY bind:innerHeight />

<!-- Parallax Mountain Background -->
<div class="fixed inset-0 z-0 overflow-hidden">
  <div
    class="absolute bg-cover bg-center bg-no-repeat"
    style="
      background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
      transform: translateY({scrollY * -0.2}px);
      top: -20%;
      left: 0;
      right: 0;
      height: 140%;
    "
  ></div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<div class="relative z-10">
  <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
  <Navbar />

  <main id="main-content" class="min-h-screen">
    <slot />
  </main>

  <footer class="bg-gray-800/90 backdrop-blur-sm text-white py-8 relative">
    <div class="container mx-auto px-4">
      <p class="text-center">&copy; {new Date().getFullYear()} GearGrab. All rights reserved.</p>
    </div>
  </footer>
</div>
