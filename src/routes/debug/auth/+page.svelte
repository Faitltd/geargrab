<script>
  // Ultra-simple debug page - testing basic interactivity first
  import { authStore } from '$lib/stores/auth';

  let pageLoaded = true;
  let clickCount = 0;
  let testResults = [];
  let lastError = '';
  let authState = 'Checking...';
  let storeState = 'Checking...';

  // Test basic JavaScript execution
  function testBasicJS() {
    console.log('🧪 Testing basic JavaScript execution...');
    clickCount += 1;
    testResults = [...testResults, `✅ Click ${clickCount}: JavaScript is working!`];
    console.log('✅ Button click successful, count:', clickCount);
  }

  // Test auth store access
  function testAuthStore() {
    console.log('🧪 Testing auth store access...');

    try {
      testResults = [...testResults, `✅ Auth store exists: ${authStore ? 'yes' : 'no'}`];

      // Try to read current state
      authStore.subscribe((state) => {
        console.log('📊 Current auth state:', state);
        testResults = [...testResults, `📊 Store state: Loading=${state.loading}, User=${state.user?.email || 'null'}`];
      })();

    } catch (error) {
      console.error('❌ Auth store test error:', error);
      lastError = error.message;
      testResults = [...testResults, `❌ Auth store error: ${error.message}`];
    }
  }

  // Test Firebase config and initialization
  function testFirebaseConfig() {
    console.log('🧪 Testing Firebase configuration...');

    try {
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;

      testResults = [...testResults, `🔧 API Key: ${apiKey ? 'present' : 'missing'}`];
      testResults = [...testResults, `🔧 Project ID: ${projectId || 'missing'}`];
      testResults = [...testResults, `🔧 Auth Domain: ${authDomain || 'missing'}`];

      // Test Firebase imports
      import('$lib/firebase/client').then((firebase) => {
        testResults = [...testResults, `✅ Firebase client imported successfully`];
        testResults = [...testResults, `✅ Auth object: ${firebase.auth ? 'exists' : 'missing'}`];
        testResults = [...testResults, `✅ Firestore object: ${firebase.firestore ? 'exists' : 'missing'}`];

        // Test auth current user
        if (firebase.auth) {
          const currentUser = firebase.auth.currentUser;
          testResults = [...testResults, `📊 Current user: ${currentUser ? currentUser.email : 'null'}`];
        }
      }).catch((error) => {
        console.error('❌ Firebase import error:', error);
        testResults = [...testResults, `❌ Firebase import failed: ${error.message}`];
      });

      console.log('🔧 Firebase config check complete');

    } catch (error) {
      console.error('❌ Firebase config test error:', error);
      lastError = error.message;
      testResults = [...testResults, `❌ Config error: ${error.message}`];
    }
  }

  // Test Google Sign-in function
  function testGoogleSignIn() {
    console.log('🧪 Testing Google Sign-in...');

    try {
      testResults = [...testResults, `🔄 Attempting Google sign-in...`];

      import('$lib/firebase/auth').then(async (authModule) => {
        try {
          testResults = [...testResults, `✅ Auth module imported successfully`];

          const result = await authModule.signInWithGoogle();
          testResults = [...testResults, `✅ Google sign-in successful: ${result.user.email}`];

        } catch (error) {
          console.error('❌ Google sign-in error:', error);
          testResults = [...testResults, `❌ Google sign-in failed: ${error.message}`];
          lastError = error.message;
        }
      }).catch((error) => {
        console.error('❌ Auth module import error:', error);
        testResults = [...testResults, `❌ Auth module import failed: ${error.message}`];
        lastError = error.message;
      });

    } catch (error) {
      console.error('❌ Google sign-in test error:', error);
      lastError = error.message;
      testResults = [...testResults, `❌ Sign-in test error: ${error.message}`];
    }
  }

  // Clear test results
  function clearResults() {
    console.log('🧹 Clearing test results...');
    testResults = [];
    lastError = '';
    clickCount = 0;
  }

  // Simple auth store subscription
  if (authStore) {
    authStore.subscribe((state) => {
      if (state) {
        storeState = `User: ${state.user?.email || 'null'}, Loading: ${state.loading}`;
        authState = state.user ? `Signed in: ${state.user.email}` : (state.loading ? 'Loading...' : 'Signed out');
      }
    });
  }
</script>

<svelte:head>
  <title>Simple Auth Debug - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Simple Authentication Debug</h1>
      <p class="text-gray-400">Basic auth state testing</p>
      {#if pageLoaded}
        <p class="text-green-400 text-sm">✅ Page is interactive</p>
      {:else}
        <p class="text-red-400 text-sm">❌ Page not loaded</p>
      {/if}
    </div>

    <!-- Current Auth State -->
    <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-bold mb-4 text-green-400">🔍 Authentication Status</h2>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 class="text-lg font-semibold mb-2 text-blue-400">Auth State</h3>
          <div class="bg-gray-800 p-3 rounded text-sm">
            {authState}
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-2 text-blue-400">Store State</h3>
          <div class="bg-gray-800 p-3 rounded text-sm">
            {storeState}
          </div>
        </div>
      </div>

      <!-- Test Buttons -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-blue-400">Debug Tools</h3>
        <div class="flex flex-wrap gap-3">
          <button
            on:click={testBasicJS}
            class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm font-medium transition-colors"
          >
            Test JavaScript ({clickCount})
          </button>

          <button
            on:click={testAuthStore}
            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm font-medium transition-colors"
          >
            Test Auth Store
          </button>

          <button
            on:click={testFirebaseConfig}
            class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white text-sm font-medium transition-colors"
          >
            Test Firebase Config
          </button>

          <button
            on:click={testGoogleSignIn}
            class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white text-sm font-medium transition-colors"
          >
            Test Google Sign-in
          </button>

          <button
            on:click={clearResults}
            class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-sm font-medium transition-colors"
          >
            Clear Results
          </button>
        </div>
      </div>

      <!-- Test Results -->
      {#if testResults.length > 0}
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2 text-blue-400">Test Results</h3>
          <div class="bg-gray-800 p-4 rounded">
            {#each testResults as result}
              <p class="text-sm mb-1 text-gray-300">{result}</p>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Last Error -->
      {#if lastError}
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2 text-red-400">Last Error</h3>
          <div class="bg-red-900/20 border border-red-600 p-3 rounded text-sm">
            {lastError}
          </div>
        </div>
      {/if}

      <!-- Current User Info -->
      {#if $authStore.user}
        <div class="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-6">
          <h3 class="text-green-400 font-semibold mb-2">Currently Signed In</h3>
          <p class="text-white">{$authStore.user.email}</p>
          <p class="text-gray-300 text-sm">UID: {$authStore.user.uid}</p>
        </div>
      {:else if $authStore.loading}
        <div class="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
          <p class="text-yellow-400">⏳ Loading authentication state...</p>
        </div>
      {:else}
        <div class="bg-gray-700/50 border border-gray-500 rounded-lg p-4 mb-6">
          <p class="text-gray-300">Not signed in</p>
        </div>
      {/if}
    </div>

    <!-- Navigation -->
    <div class="text-center">
      <a
        href="/"
        class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
      >
        ← Back to Home
      </a>
    </div>
  </div>
</div>
