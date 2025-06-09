<script lang="ts">
  import GoogleAuthDebug from '$lib/components/debug/GoogleAuthDebug.svelte';
  import { authStore } from '$lib/stores/auth';
  import { signOut } from '$lib/firebase/auth';

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
</script>

<svelte:head>
  <title>Auth Debug - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Authentication Debug Panel</h1>
      <p class="text-gray-400">Test and troubleshoot Google authentication</p>
    </div>

    <!-- Current User Info -->
    {#if $authStore.user}
      <div class="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-green-400 font-semibold">Currently Signed In</h3>
            <p class="text-white">{$authStore.user.email}</p>
            <p class="text-gray-300 text-sm">UID: {$authStore.user.uid}</p>
          </div>
          <button
            on:click={handleSignOut}
            class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    {:else if $authStore.loading}
      <div class="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
        <p class="text-yellow-400">Loading authentication state...</p>
      </div>
    {:else}
      <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
        <p class="text-gray-400">Not signed in</p>
      </div>
    {/if}

    <!-- Debug Component -->
    <GoogleAuthDebug />

    <!-- Navigation -->
    <div class="text-center mt-8">
      <a 
        href="/" 
        class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
      >
        ← Back to Home
      </a>
    </div>
  </div>
</div>
