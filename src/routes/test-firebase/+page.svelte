<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/firebase/client';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { signInWithGoogle } from '$lib/firebase/auth';

  let firebaseAuthState = 'checking...';
  let v2AuthState = 'checking...';
  let testResults: string[] = [];

  $: authState = simpleAuth.authState;

  onMount(() => {
    addResult('🔍 Test page mounted');
    
    // Check Firebase Auth directly
    if (auth) {
      addResult('✅ Firebase Auth object available');
      addResult(`🔍 Current user: ${auth.currentUser ? auth.currentUser.email : 'null'}`);
      
      // Listen to Firebase Auth state changes directly
      const unsubscribe = auth.onAuthStateChanged((user) => {
        firebaseAuthState = user ? `Signed in as ${user.email}` : 'Not signed in';
        addResult(`🔥 Firebase Auth state changed: ${firebaseAuthState}`);
      });

      return unsubscribe;
    } else {
      addResult('❌ Firebase Auth object not available');
    }
  });

  // Watch V2 auth state
  $: {
    if ($authState) {
      v2AuthState = $authState.isAuthenticated 
        ? `Authenticated as ${$authState.user?.email}` 
        : 'Not authenticated';
      addResult(`📊 V2 Auth state: ${v2AuthState} (loading: ${$authState.loading})`);
    }
  }

  function addResult(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    testResults = [...testResults, `[${timestamp}] ${message}`];
  }

  async function testGoogleSignIn() {
    addResult('🔐 Testing Google Sign-In...');
    try {
      const result = await signInWithGoogle(true); // Use popup
      addResult(`✅ Google Sign-In successful: ${result.user.email}`);
    } catch (error: any) {
      addResult(`❌ Google Sign-In failed: ${error.message}`);
    }
  }

  function testRefreshAuth() {
    addResult('🔄 Testing auth state refresh...');
    simpleAuth.refreshAuth();
  }

  function clearResults() {
    testResults = [];
  }
</script>

<svelte:head>
  <title>Firebase Auth Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
  <div class="max-w-4xl mx-auto pt-24">
    
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
      <h1 class="text-3xl font-bold text-white mb-4">Firebase Authentication Test</h1>
      <p class="text-gray-300">Debug page to test Firebase Auth integration</p>
    </div>

    <!-- Auth Status -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      
      <!-- Firebase Auth Direct -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Firebase Auth (Direct)</h2>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-300">Status:</span>
            <span class="text-white">{firebaseAuthState}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Auth Object:</span>
            <span class="text-white">{auth ? 'Available' : 'Not Available'}</span>
          </div>
        </div>
      </div>

      <!-- V2 Auth Service -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">V2 Auth Service</h2>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-300">Status:</span>
            <span class="text-white">{v2AuthState}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Loading:</span>
            <span class="text-white">{$authState.loading ? 'Yes' : 'No'}</span>
          </div>

        </div>
      </div>

    </div>

    <!-- Test Actions -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
      <h2 class="text-xl font-semibold text-white mb-4">Test Actions</h2>
      <div class="flex flex-wrap gap-4">
        <button
          on:click="{testGoogleSignIn}"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Test Google Sign-In
        </button>
        
        <button
          on:click="{testRefreshAuth}"
          class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          Refresh Auth State
        </button>
        

        
        <button
          on:click="{clearResults}"
          class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Clear Results
        </button>
      </div>
    </div>

    <!-- Test Results -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Test Results</h2>
      <div class="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
        {#if testResults.length === 0}
          <p class="text-gray-400 text-center">No test results yet...</p>
        {:else}
          {#each testResults as result}
            <div class="text-green-300 text-sm font-mono mb-1">{result}</div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Raw Auth State -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mt-6">
      <h2 class="text-xl font-semibold text-white mb-4">Raw Auth State</h2>
      <pre class="text-green-300 text-sm whitespace-pre-wrap font-mono overflow-x-auto bg-black/30 rounded p-4">
{JSON.stringify($authState, null, 2)}
      </pre>
    </div>

  </div>
</div>
