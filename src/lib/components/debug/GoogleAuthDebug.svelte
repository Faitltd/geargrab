<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { auth } from '$lib/firebase/client';
  import { signInWithGoogle } from '$lib/firebase/auth';
  import { authStore } from '$lib/stores/auth';
  import { onAuthStateChanged } from 'firebase/auth';

  let debugInfo = {
    firebaseConfig: {},
    authState: 'Unknown',
    lastError: '',
    testResults: []
  };

  let testing = false;

  onMount(() => {
    if (browser) {
      // Get Firebase config for debugging
      debugInfo.firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID?.substring(0, 20) + '...'
      };

      // Monitor auth state
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        debugInfo.authState = user ? `Signed in: ${user.email}` : 'Signed out';
        debugInfo = { ...debugInfo };
      });

      return () => unsubscribe();
    }
  });

  async function testGoogleAuth() {
    testing = true;
    debugInfo.lastError = '';
    debugInfo.testResults = [];

    try {
      // Test 1: Check if auth is initialized
      debugInfo.testResults.push({
        test: 'Firebase Auth Initialization',
        status: auth ? 'PASS' : 'FAIL',
        details: auth ? 'Auth object exists' : 'Auth object is null'
      });

      // Test 2: Check browser environment
      debugInfo.testResults.push({
        test: 'Browser Environment',
        status: browser ? 'PASS' : 'FAIL',
        details: browser ? 'Running in browser' : 'Not in browser environment'
      });

      // Test 3: Attempt Google sign-in
      debugInfo.testResults.push({
        test: 'Google Sign-in Attempt',
        status: 'RUNNING',
        details: 'Attempting to sign in with Google...'
      });

      const result = await signInWithGoogle();

      debugInfo.testResults[2] = {
        test: 'Google Sign-in Attempt',
        status: 'PASS',
        details: `Successfully signed in: ${result.user.email}`
      };

    } catch (error: any) {
      console.error('Google auth test failed:', error);
      debugInfo.lastError = error.message;
      
      if (debugInfo.testResults.length >= 3) {
        debugInfo.testResults[2] = {
          test: 'Google Sign-in Attempt',
          status: 'FAIL',
          details: error.message
        };
      }
    } finally {
      testing = false;
      debugInfo = { ...debugInfo };
    }
  }

  function clearResults() {
    debugInfo.testResults = [];
    debugInfo.lastError = '';
    debugInfo = { ...debugInfo };
  }
</script>

<div class="bg-gray-900 text-white p-6 rounded-lg border border-gray-700 max-w-4xl mx-auto">
  <h2 class="text-xl font-bold mb-4 text-green-400">🔍 Google Auth Debug Panel</h2>
  
  <!-- Firebase Config -->
  <div class="mb-6">
    <h3 class="text-lg font-semibold mb-2 text-blue-400">Firebase Configuration</h3>
    <div class="bg-gray-800 p-3 rounded text-sm font-mono">
      {#each Object.entries(debugInfo.firebaseConfig) as [key, value]}
        <div><span class="text-yellow-400">{key}:</span> {value}</div>
      {/each}
    </div>
  </div>

  <!-- Auth State -->
  <div class="mb-6">
    <h3 class="text-lg font-semibold mb-2 text-blue-400">Current Auth State</h3>
    <div class="bg-gray-800 p-3 rounded text-sm">
      <span class="text-green-400">{debugInfo.authState}</span>
    </div>
  </div>

  <!-- Test Controls -->
  <div class="mb-6">
    <h3 class="text-lg font-semibold mb-2 text-blue-400">Test Controls</h3>
    <div class="flex gap-3">
      <button
        on:click={testGoogleAuth}
        disabled={testing}
        class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
      >
        {testing ? 'Testing...' : 'Test Google Auth'}
      </button>
      <button
        on:click={clearResults}
        class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors"
      >
        Clear Results
      </button>
    </div>
  </div>

  <!-- Test Results -->
  {#if debugInfo.testResults.length > 0}
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2 text-blue-400">Test Results</h3>
      <div class="space-y-2">
        {#each debugInfo.testResults as result}
          <div class="bg-gray-800 p-3 rounded">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium">{result.test}</span>
              <span class="text-xs px-2 py-1 rounded {
                result.status === 'PASS' ? 'bg-green-600' :
                result.status === 'FAIL' ? 'bg-red-600' :
                'bg-yellow-600'
              }">
                {result.status}
              </span>
            </div>
            <div class="text-sm text-gray-300">{result.details}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Last Error -->
  {#if debugInfo.lastError}
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2 text-red-400">Last Error</h3>
      <div class="bg-red-900/20 border border-red-600 p-3 rounded text-sm">
        {debugInfo.lastError}
      </div>
    </div>
  {/if}

  <!-- Troubleshooting Tips -->
  <div>
    <h3 class="text-lg font-semibold mb-2 text-blue-400">Troubleshooting Tips</h3>
    <div class="bg-gray-800 p-3 rounded text-sm space-y-2">
      <div>• Check Firebase Console → Authentication → Sign-in method → Google (enabled)</div>
      <div>• Verify authorized domains include localhost:5173 and your production domain</div>
      <div>• Ensure Google Cloud Console OAuth consent screen is configured</div>
      <div>• Check browser console for additional error details</div>
      <div>• Disable popup blockers for this site</div>
      <div>• Try incognito/private browsing mode</div>
    </div>
  </div>
</div>
