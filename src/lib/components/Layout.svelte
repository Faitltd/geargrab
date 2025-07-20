<script lang="ts">
  import { authStore } from '$lib/stores/auth.store';
  import ToastContainer from '$lib/components/ToastContainer.svelte';
  import AuthModal from '$lib/components/modals/AuthModal.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { initializeAuthSession } from '$lib/utils/auth-session';

  export let title = 'GearGrab';
  export let showHero = true;
  export let heroTitle = '';
  export let heroSubtitle = '';

  $: user = $authStore.data;
  $: pageData = $page.data;
  $: showAuthModal = pageData?.showAuthModal || false;
  $: currentPath = pageData?.currentPath || $page.url.pathname;

  let authModalOpen = false;

  // Show auth modal when needed
  $: if (showAuthModal && !user) {
    authModalOpen = true;
  } else {
    authModalOpen = false;
  }

  const handleSignOut = async () => {
    await authStore.logout();
  };

  const handleAuthModalClose = () => {
    authModalOpen = false;
    // Optionally redirect to home or previous page
    // goto('/');
  };

  // Initialize auth session and handle redirects
  onMount(() => {
    // Initialize auth session management
    initializeAuthSession();

    // Handle redirect after authentication
    if (user && typeof window !== 'undefined') {
      const redirectPath = sessionStorage.getItem('redirectAfterAuth');
      if (redirectPath && redirectPath !== window.location.pathname) {
        sessionStorage.removeItem('redirectAfterAuth');
        window.location.href = redirectPath;
      }
    }
  });
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
  <!-- Header -->
  <header class="w-full bg-primary-500 shadow-lg">
    <div class="max-width-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo Section -->
        <div class="flex items-center">
          <slot name="logo">
            <a href="/" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span class="text-primary-500 font-bold text-lg">G</span>
              </div>
              <span class="text-white font-bold text-xl">GearGrab</span>
            </a>
          </slot>
        </div>

        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center space-x-8">
          <slot name="nav">
            {#if user}
              <a href="/dashboard" class="text-white hover:text-neutral-200 font-medium transition-colors">
                Dashboard
              </a>
              <a href="/listings/new" class="text-white hover:text-neutral-200 font-medium transition-colors">
                Sell Gear
              </a>
              <div class="flex items-center space-x-4">
                <span class="text-neutral-200 text-sm">
                  {user.email}
                </span>
                <button
                  on:click={handleSignOut}
                  class="btn-outline border-white text-white hover:bg-white hover:text-primary-500"
                >
                  Sign Out
                </button>
              </div>
            {:else}
              <a href="/auth" class="btn-secondary">
                Sign In
              </a>
            {/if}
          </slot>
        </nav>

        <!-- Mobile menu button -->
        <div class="md:hidden">
          <button
            type="button"
            class="text-white hover:text-neutral-200 focus:outline-none focus:text-neutral-200"
            aria-label="Toggle menu"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  {#if showHero}
    <section class="relative hero-gradient">
      <!-- Dark gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20"></div>
      
      <div class="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <slot name="hero">
            {#if heroTitle}
              <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 text-shadow-lg">
                {heroTitle}
              </h1>
            {/if}
            {#if heroSubtitle}
              <p class="text-xl md:text-2xl text-neutral-100 mb-8 text-shadow">
                {heroSubtitle}
              </p>
            {/if}
          </slot>
        </div>
      </div>
    </section>
  {/if}

  <!-- Main Content -->
  <main class="flex-1">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="bg-neutral-800 text-white">
    <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="col-span-1 md:col-span-2">
          <a href="/" class="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity w-fit">
            <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-lg">G</span>
            </div>
            <span class="text-white font-bold text-xl">GearGrab</span>
          </a>
          <p class="text-neutral-300 mb-4">
            The trusted marketplace for outdoor gear. Buy and sell quality equipment with confidence.
          </p>
        </div>
        
        <div>
          <h3 class="text-white font-semibold mb-4">Quick Links</h3>
          <ul class="space-y-2">
            <li><a href="/dashboard" class="text-neutral-300 hover:text-white transition-colors">Dashboard</a></li>
            <li><a href="/listings/new" class="text-neutral-300 hover:text-white transition-colors">Sell Gear</a></li>
            <li><a href="/auth" class="text-neutral-300 hover:text-white transition-colors">Sign In</a></li>
          </ul>
        </div>
        
        <div>
          <h3 class="text-white font-semibold mb-4">Support</h3>
          <ul class="space-y-2">
            <li><a href="/help" class="text-neutral-300 hover:text-white transition-colors">Help Center</a></li>
            <li><a href="/contact" class="text-neutral-300 hover:text-white transition-colors">Contact Us</a></li>
            <li><a href="/terms" class="text-neutral-300 hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-neutral-700 mt-8 pt-8 text-center">
        <p class="text-neutral-400">
          © 2024 GearGrab. All rights reserved.
        </p>
      </div>
    </div>
  </footer>

  <!-- Toast Notifications -->
  <ToastContainer />

  <!-- Auth Modal -->
  <AuthModal
    isOpen={authModalOpen}
    {currentPath}
    on:close={handleAuthModalClose}
  />
</div>
