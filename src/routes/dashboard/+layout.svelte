<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/layout/Navbar.svelte';

  // Redirect if not logged in
  onMount(() => {
    // Add a small delay to ensure store is initialized
    setTimeout(() => {
      if (!$authStore.loading && !$authStore.user) {
        goto('/auth/login?redirectTo=/dashboard');
      }
    }, 100);
  });

  // Dashboard tabs
  const tabs = [
    { id: 'overview', label: 'Overview', href: '/dashboard' },
    { id: 'owner', label: 'My Listings', href: '/dashboard/owner' },
    { id: 'renter', label: 'My Bookings', href: '/dashboard/renter' },
    { id: 'messages', label: 'Messages', href: '/dashboard/messages' },
    { id: 'profile', label: 'Profile', href: '/dashboard/profile' }
  ];

  // Get current tab
  $: currentTab = $page.url.pathname.split('/')[2] || 'overview';
</script>

<svelte:head>
  <title>Dashboard - GearGrab</title>
</svelte:head>

<div class="min-h-screen relative">
  <!-- Background Image -->
  <div class="absolute inset-0">
    <img
      src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
      alt="Forest background"
      class="w-full h-full object-cover"
    >
    <div class="absolute inset-0 bg-black bg-opacity-30"></div>
  </div>

  <!-- Navbar -->
  <div class="relative z-20">
    <Navbar />
  </div>

  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if $authStore && $authStore.loading}
      <div class="flex justify-center items-center h-64">
        <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    {:else if $authStore && $authStore.user}
      <!-- Dashboard Header -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-6">
        <h1 class="text-3xl font-bold text-white">Dashboard</h1>
        <p class="text-gray-300 mt-1">Welcome back, {$authStore.user?.displayName || $authStore.user?.email || 'User'}!</p>
      </div>

      <!-- Dashboard Tabs -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 mb-6">
        <nav class="flex space-x-1 p-1">
          {#each tabs as tab}
            <a
              href={tab.href}
              class="{currentTab === tab.id
                ? 'bg-white/20 text-white border-white/30'
                : 'text-white/70 hover:text-white hover:bg-white/10 border-transparent'
              } flex-1 text-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 border"
            >
              {tab.label}
            </a>
          {/each}
        </nav>
      </div>

      <!-- Dashboard Content -->
      <div>
        <slot />
      </div>
    {:else}
      <!-- Fallback for when store is not initialized or user is not logged in -->
      <div class="flex justify-center items-center h-64">
        <div class="text-center">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p class="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <a href="/auth/login" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Log In
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>
