<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  // Redirect if not logged in
  onMount(() => {
    if (!$authStore.loading && !$authStore.isLoggedIn) {
      goto('/auth/login?redirectTo=/dashboard');
    }
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

<div class="bg-gray-50 min-h-screen">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if $authStore.loading}
      <div class="flex justify-center items-center h-64">
        <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    {:else if $authStore.isLoggedIn}
      <div class="mb-8">
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-gray-500">Welcome back, {$authStore.authUser?.displayName || 'User'}!</p>
      </div>
      
      <!-- Dashboard Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          {#each tabs as tab}
            <a 
              href={tab.href} 
              class="{currentTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
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
    {/if}
  </div>
</div>
