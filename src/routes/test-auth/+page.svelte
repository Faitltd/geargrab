<script lang="ts">
  import { onMount } from 'svelte';
  import { signInWithGoogle, handleGoogleRedirectResult } from '$lib/firebase/auth';
  import { auth } from '$lib/firebase/client';
  import { onAuthStateChanged } from 'firebase/auth';

  let user: any = null;
  let loading = false;
  let error = '';
  let debugInfo = '';

  onMount(() => {
    // Handle redirect result on page load
    handleGoogleRedirectResult().then((result) => {
      if (result) {
        debugInfo += `✅ Redirect result: ${result.user.email}\n`;
      }
    }).catch((err: any) => {
      debugInfo += `❌ Redirect error: ${err.message}\n`;
    });

    // Listen for auth state changes
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (authUser) => {
        user = authUser;
        if (authUser) {
          debugInfo += `✅ Auth state changed: ${authUser.email}\n`;
        } else {
          debugInfo += `ℹ️ User signed out\n`;
        }
      });

      return unsubscribe;
    }

    return () => {}; // Return empty cleanup function if auth is not available
  });

  async function testGoogleSignIn() {
    loading = true;
    error = '';
    debugInfo += `🔐 Starting Google sign-in test...\n`;

    try {
      const result = await signInWithGoogle();
      debugInfo += `✅ Sign-in successful: ${result.user.email}\n`;
      debugInfo += `✅ Display name: ${result.user.displayName}\n`;
      debugInfo += `✅ UID: ${result.user.uid}\n`;
    } catch (err: any) {
      error = err.message;
      debugInfo += `❌ Sign-in error: ${err.message}\n`;
      debugInfo += `❌ Error code: ${err.code}\n`;
      
      if (err.message.includes('Redirecting')) {
        debugInfo += `🔄 Redirecting to Google...\n`;
      }
    } finally {
      loading = false;
    }
  }

  function testPopup() {
    debugInfo += `🧪 Testing popup functionality...\n`;
    try {
      const popup = window.open('https://accounts.google.com', '_blank', 'width=500,height=600');
      if (popup) {
        debugInfo += `✅ Popup opened successfully\n`;

        // Test window.closed access
        try {
          const isClosed = popup.closed;
          debugInfo += `✅ Can access popup.closed: ${isClosed}\n`;
        } catch (err: any) {
          debugInfo += `❌ Cannot access popup.closed: ${err.message}\n`;
        }

        setTimeout(() => {
          try {
            popup.close();
            debugInfo += `✅ Popup closed successfully\n`;
          } catch (err: any) {
            debugInfo += `❌ Cannot close popup: ${err.message}\n`;
          }
        }, 3000);
      } else {
        debugInfo += `❌ Popup blocked\n`;
      }
    } catch (err: any) {
      debugInfo += `❌ Popup error: ${err.message}\n`;
    }
  }

  async function checkHeaders() {
    debugInfo += `🔍 Checking response headers...\n`;
    try {
      const response = await fetch('/api/debug/headers?path=/test-auth');
      const data = await response.json();
      debugInfo += `✅ Debug endpoint response: ${JSON.stringify(data, null, 2)}\n`;

      // Try to get response headers (limited by CORS)
      debugInfo += `📋 Response headers:\n`;
      response.headers.forEach((value, key) => {
        debugInfo += `  ${key}: ${value}\n`;
      });
    } catch (err: any) {
      debugInfo += `❌ Headers check error: ${err.message}\n`;
    }
  }

  async function clearCache() {
    debugInfo += `🧹 Clearing browser cache...\n`;
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        debugInfo += `✅ Cleared ${cacheNames.length} caches\n`;
      }

      // Force reload without cache
      window.location.reload();
    } catch (err: any) {
      debugInfo += `❌ Cache clear error: ${err.message}\n`;
    }
  }

  function clearDebug() {
    debugInfo = '';
    error = '';
  }
</script>

<svelte:head>
  <title>Google Auth Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-white mb-8">Google Authentication Test</h1>
    
    <!-- User Status -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-white mb-4">Current User Status</h2>
      {#if user}
        <div class="text-green-300">
          <p>✅ Signed in as: {user.email}</p>
          <p>✅ Display name: {user.displayName || 'Not set'}</p>
          <p>✅ UID: {user.uid}</p>
          <p>✅ Email verified: {user.emailVerified}</p>
        </div>
      {:else}
        <p class="text-gray-300">❌ Not signed in</p>
      {/if}
    </div>

    <!-- Test Controls -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-white mb-4">Test Controls</h2>
      <div class="flex flex-wrap gap-4">
        <button
          on:click="{testGoogleSignIn}"
          disabled="{loading}"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Testing...' : 'Test Google Sign-In'}
        </button>
        
        <button
          on:click="{testPopup}"
          class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          Test Popup
        </button>

        <button
          on:click="{checkHeaders}"
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Check Headers
        </button>

        <button
          on:click="{clearCache}"
          class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Clear Cache & Reload
        </button>

        <button
          on:click="{clearDebug}"
          class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Clear Debug
        </button>
      </div>
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
        <h3 class="text-red-300 font-semibold mb-2">Error:</h3>
        <p class="text-red-200">{error}</p>
      </div>
    {/if}

    <!-- Debug Info -->
    <div class="bg-black/30 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Debug Information</h2>
      <pre class="text-green-300 text-sm whitespace-pre-wrap font-mono overflow-x-auto">{debugInfo || 'No debug information yet...'}</pre>
    </div>

    <!-- Browser Info -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-6">
      <h2 class="text-xl font-semibold text-white mb-4">Browser Information</h2>
      <div class="text-gray-300 text-sm">
        {#if typeof window !== 'undefined'}
          <p>User Agent: {navigator.userAgent}</p>
          <p>Cookies Enabled: {navigator.cookieEnabled}</p>
          <p>Current URL: {window.location.href}</p>
          <p>Popup Support: {typeof window.open === 'function' ? 'Yes' : 'No'}</p>
        {:else}
          <p>Browser information available after page loads...</p>
        {/if}
      </div>
    </div>
  </div>
</div>
