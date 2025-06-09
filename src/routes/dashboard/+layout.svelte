<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/ScrollLinkedAnimator.svelte';
  import SequentialAnimator from '$lib/components/layout/SequentialAnimator.svelte';

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

<!-- Full Page Video Background -->
<VideoBackground
  videoSrc="/857134-hd_1280_720_24fps.mp4"
  overlayOpacity={0.3}
/>

<div class="min-h-screen relative z-10">

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
      <ScrollLinkedAnimator animation="fade-up" startOffset={0} endOffset={0.4}>
        <div class="mb-8">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg">
            <h1 class="text-3xl font-bold text-white drop-shadow-lg">Dashboard</h1>
            <p class="text-gray-200 drop-shadow-lg">Welcome back, {$authStore.user?.displayName || 'User'}!</p>
          </div>
        </div>
      </ScrollLinkedAnimator>

      <!-- Dashboard Tabs -->
      <ScrollLinkedAnimator animation="fade-up" startOffset={0.1} endOffset={0.5}>
        <div class="mb-8">
          <nav class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-1 flex space-x-1">
            {#each tabs as tab}
              <a
                href={tab.href}
                class="{currentTab === tab.id
                  ? 'bg-green-600 text-white shadow-lg transform scale-105'
                  : 'text-white/90 hover:text-white hover:bg-white/10 hover:transform hover:scale-102'}
                  whitespace-nowrap py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 drop-shadow-lg"
              >
                {tab.label}
              </a>
            {/each}
          </nav>
        </div>
      </ScrollLinkedAnimator>

      <!-- Dashboard Content -->
      <ScrollLinkedAnimator animation="fade-up" startOffset={0.2} endOffset={0.6}>
        <div>
          <slot />
        </div>
      </ScrollLinkedAnimator>
    {:else}
      <!-- Fallback for when store is not initialized or user is not logged in -->
      <ScrollLinkedAnimator animation="fade-up" startOffset={0} endOffset={0.5}>
        <div class="flex justify-center items-center h-64">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center shadow-lg">
            <h2 class="text-xl font-semibold text-white mb-2 drop-shadow-lg">Access Restricted</h2>
            <p class="text-gray-200 mb-4 drop-shadow-lg">Please log in to access the dashboard.</p>
            <a href="/auth/login" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg">
              Log In
            </a>
          </div>
        </div>
      </ScrollLinkedAnimator>
    {/if}
  </div>
</div>
