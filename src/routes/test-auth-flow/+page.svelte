<script lang="ts">
  import { simpleAuth } from '$lib/auth/simple-auth';
  import AuthGuard from '$lib/components/auth/auth-guard.svelte';
  import { onMount } from 'svelte';

  // Get auth state
  $: authState = simpleAuth.authState;

  let authDetails = '';

  onMount(() => {
    // Update auth details every second for debugging
    const interval = setInterval(() => {
      authDetails = JSON.stringify({
        loading: $authState.loading,
        isAuthenticated: $authState.isAuthenticated,
        hasUser: !!$authState.user,
        userEmail: $authState.user?.email,
        userDisplayName: $authState.user?.displayName,
        timestamp: new Date().toISOString()
      }, null, 2);
    }, 1000);

    return () => clearInterval(interval);
  });

  async function handleSignOut() {
    const result = await simpleAuth.signOut();
    if (result.success) {
      console.log('✅ Signed out successfully');
    } else {
      console.error('❌ Sign out failed:', result.error);
    }
  }

  async function handleRefreshAuth() {
    await simpleAuth.refreshAuth();
    console.log('🔄 Auth refreshed');
  }
</script>

<svelte:head>
  <title>Test Auth Flow - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover" />
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8 pt-24">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
      <h1 class="text-2xl font-bold text-white mb-4">Authentication Flow Test</h1>
      <p class="text-gray-300">This page tests the authentication flow and state management.</p>
    </div>

    <!-- Auth Guard Test -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
      <h2 class="text-lg font-semibold text-white mb-4">Protected Content (Auth Guard)</h2>
      
      <AuthGuard message="You need to be signed in to see this protected content.">
        <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
          <h3 class="text-green-200 font-semibold mb-2">🎉 Success! You are authenticated!</h3>
          <p class="text-green-100">This content is only visible to authenticated users.</p>
          
          <div class="mt-4 space-y-2">
            <button
              on:click="{handleSignOut}"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
            
            <button
              on:click="{handleRefreshAuth}"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors ml-2"
            >
              Refresh Auth
            </button>
          </div>
        </div>
      </AuthGuard>
    </div>

    <!-- Auth State Debug -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-lg font-semibold text-white mb-4">Auth State Debug</h2>
      <pre class="text-sm text-gray-300 bg-black/20 p-4 rounded-lg overflow-auto">{authDetails}</pre>
    </div>

  </div>
</div>
