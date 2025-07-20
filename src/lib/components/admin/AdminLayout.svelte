<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';

  $: user = $authStore.data;

  async function handleSignOut() {
    try {
      await authStore.signOut();
      showToast('success', 'Signed out successfully');
      goto('/');
    } catch (error) {
      console.error('Sign out error:', error);
      showToast('error', 'Failed to sign out');
    }
  }

  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Admin Header -->
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-4">
          <a href="/admin" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 class="text-lg font-semibold text-gray-900">GearGrab Admin</h1>
              <p class="text-xs text-gray-500">Administration Panel</p>
            </div>
          </a>
        </div>

        <!-- Navigation and User Menu -->
        <div class="flex items-center space-x-4">
          <!-- Quick Actions -->
          <div class="hidden md:flex items-center space-x-2">
            <button
              on:click={goToDashboard}
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              Dashboard
            </button>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-3">
            <!-- User Avatar -->
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gray-100 rounded-full overflow-hidden">
                {#if user?.photoURL}
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Admin'}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <div class="w-full h-full flex items-center justify-center bg-blue-100">
                    <span class="text-sm font-medium text-blue-600">
                      {(user?.displayName || user?.email || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                {/if}
              </div>
              
              <div class="hidden sm:block">
                <p class="text-sm font-medium text-gray-900">
                  {user?.displayName || 'Admin'}
                </p>
                <p class="text-xs text-gray-500">Administrator</p>
              </div>
            </div>

            <!-- Sign Out Button -->
            <button
              on:click={handleSignOut}
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <slot />
  </main>

  <!-- Admin Warning Banner -->
  <div class="fixed bottom-4 right-4 z-50">
    <div class="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span class="text-sm font-medium">Admin Mode</span>
    </div>
  </div>
</div>
