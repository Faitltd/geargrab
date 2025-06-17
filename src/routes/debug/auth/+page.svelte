<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { auth } from '$lib/firebase/client';
  import { onAuthStateChanged } from 'firebase/auth';
  import { handleGoogleRedirectResult } from '$lib/firebase/auth';

  let debugInfo = '';
  let rawAuthState = null;
  let firebaseUser = null;

  // Get auth state from simple auth service
  $: authState = simpleAuth.authState;

  onMount(() => {
    debugInfo += `🔍 Debug Auth page loaded at ${new Date().toISOString()}\n`;
    
    // Check for redirect result
    handleGoogleRedirectResult().then((result) => {
      if (result) {
        debugInfo += `✅ Found redirect result: ${result.user.email}\n`;
      } else {
        debugInfo += `ℹ️ No redirect result found\n`;
      }
    }).catch((err) => {
      debugInfo += `❌ Redirect result error: ${err.message}\n`;
    });

    // Listen to Firebase Auth directly
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        firebaseUser = user;
        debugInfo += `🔥 Firebase Auth state changed: ${user ? user.email : 'null'}\n`;
      });

      return unsubscribe;
    }

    return () => {};
  });

  // Reactive statement to track auth state changes
  $: {
    if ($authState) {
      rawAuthState = $authState;
      debugInfo += `📊 V2 Auth state updated: ${$authState.user ? $authState.user.email : 'null'} (loading: ${$authState.loading})\n`;
    }
  }

  function clearDebug() {
    debugInfo = '';
  }

  function refreshAuthState() {
    debugInfo += `🔄 Manually refreshing auth state...\n`;
    // Force a re-check of auth state
    if (auth && auth.currentUser) {
      debugInfo += `🔥 Firebase currentUser: ${auth.currentUser.email}\n`;
    } else {
      debugInfo += `🔥 Firebase currentUser: null\n`;
    }
  }
</script>

<svelte:head>
  <title>Auth Debug - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-white mb-8">Authentication Debug</h1>
    
    <!-- V2 Auth State -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-white mb-4">V2 Auth Service State</h2>
      {#if $authState}
        <div class="text-gray-300">
          <p><strong>User:</strong> {$authState.user ? $authState.user.email : 'null'}</p>
          <p><strong>Loading:</strong> {$authState.loading}</p>
          <p><strong>Is Authenticated:</strong> {$authState.isAuthenticated}</p>
        </div>
      {:else}
        <p class="text-gray-300">Auth state not available</p>
      {/if}
    </div>

    <!-- Firebase Auth State -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-white mb-4">Firebase Auth State</h2>
      {#if firebaseUser}
        <div class="text-green-300">
          <p><strong>Email:</strong> {firebaseUser.email}</p>
          <p><strong>Display Name:</strong> {firebaseUser.displayName || 'Not set'}</p>
          <p><strong>UID:</strong> {firebaseUser.uid}</p>
          <p><strong>Email Verified:</strong> {firebaseUser.emailVerified}</p>
        </div>
      {:else}
        <p class="text-gray-300">No Firebase user</p>
      {/if}
    </div>

    <!-- Raw Auth State -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-white mb-4">Raw Auth State Object</h2>
      <pre class="text-green-300 text-sm whitespace-pre-wrap font-mono overflow-x-auto">{JSON.stringify(rawAuthState, null, 2)}</pre>
    </div>

    <!-- Controls -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-white mb-4">Debug Controls</h2>
      <div class="flex flex-wrap gap-4">
        <button
          on:click={refreshAuthState}
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Refresh Auth State
        </button>
        
        <button
          on:click={clearDebug}
          class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Clear Debug
        </button>
        
        <a
          href="/auth/login"
          class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors inline-block"
        >
          Go to Login
        </a>
      </div>
    </div>

    <!-- Debug Log -->
    <div class="bg-black/30 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Debug Log</h2>
      <pre class="text-green-300 text-sm whitespace-pre-wrap font-mono overflow-x-auto">{debugInfo || 'No debug information yet...'}</pre>
    </div>
  </div>
</div>
