<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let logs = [];
  let authStatus = 'Initializing...';
  let testCount = 0;
  
  function addLog(message) {
    console.log('AUTH TEST:', message);
    logs = [...logs, `${testCount++}: ${message}`];
  }
  
  onMount(async () => {
    addLog('🚀 Auth test page mounted');
    
    if (!browser) {
      addLog('❌ Not in browser environment');
      return;
    }
    
    addLog('✅ In browser environment');
    
    // Test 1: Check environment variables
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    
    addLog(`🔧 API Key: ${apiKey ? 'Present' : 'Missing'}`);
    addLog(`🔧 Project ID: ${projectId || 'Missing'}`);
    addLog(`🔧 Auth Domain: ${authDomain || 'Missing'}`);
    
    // Test 2: Try to import Firebase directly
    try {
      addLog('📦 Importing Firebase app...');
      const { initializeApp, getApps } = await import('firebase/app');
      addLog('✅ Firebase app imported successfully');
      
      // Test 3: Try to initialize Firebase directly
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
      
      addLog('🔥 Initializing Firebase app...');
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      addLog(`✅ Firebase app initialized: ${app.name}`);
      
      // Test 4: Try to get Auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth(app);
      addLog('✅ Firebase Auth initialized');
      
      authStatus = 'Firebase initialized successfully';
      
      // Test 5: Check current user
      addLog(`👤 Current user: ${auth.currentUser ? auth.currentUser.email : 'null'}`);
      
    } catch (error) {
      addLog(`❌ Firebase initialization failed: ${error.message}`);
      authStatus = `Error: ${error.message}`;
      console.error('Firebase error:', error);
    }
  });
  
  async function testGoogleSignIn() {
    addLog('🔐 Testing Google Sign-in...');
    
    try {
      // Import Firebase modules
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      
      // Initialize Firebase
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
      
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const auth = getAuth(app);
      
      // Create Google provider
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      addLog('🔄 Opening Google sign-in popup...');
      
      // Attempt sign-in
      const result = await signInWithPopup(auth, provider);
      addLog(`✅ Google sign-in successful: ${result.user.email}`);
      authStatus = `Signed in: ${result.user.email}`;
      
    } catch (error) {
      addLog(`❌ Google sign-in failed: ${error.message}`);
      authStatus = `Sign-in error: ${error.message}`;
      console.error('Google sign-in error:', error);
    }
  }
  
  function clearLogs() {
    logs = [];
    testCount = 0;
    addLog('🧹 Logs cleared');
  }
</script>

<svelte:head>
  <title>Auth Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-black py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-4">🔐 Authentication Test</h1>
      <p class="text-gray-300">Direct Firebase authentication testing</p>
    </div>

    <!-- Status -->
    <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-2xl font-bold mb-4 text-green-400">Auth Status</h2>
      <p class="text-white text-lg">{authStatus}</p>
    </div>

    <!-- Test Controls -->
    <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-2xl font-bold mb-4 text-blue-400">Test Controls</h2>
      
      <div class="flex flex-wrap gap-3">
        <button
          on:click={testGoogleSignIn}
          class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded text-white font-medium transition-colors"
        >
          🔐 Test Google Sign-in
        </button>
        
        <button
          on:click={clearLogs}
          class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded text-white font-medium transition-colors"
        >
          🧹 Clear Logs
        </button>
      </div>
    </div>

    <!-- Logs -->
    <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-6">
      <h2 class="text-2xl font-bold mb-4 text-yellow-400">Test Logs ({logs.length})</h2>
      
      <div class="bg-black/50 p-4 rounded max-h-96 overflow-y-auto">
        {#if logs.length === 0}
          <p class="text-gray-400 text-sm">No logs yet...</p>
        {:else}
          {#each logs as log}
            <p class="text-green-300 text-sm mb-1 font-mono">{log}</p>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Navigation -->
    <div class="text-center mt-8">
      <a 
        href="/test-console" 
        class="inline-block bg-purple-700 hover:bg-purple-600 px-6 py-3 rounded text-white font-medium transition-colors mr-4"
      >
        Console Test
      </a>
      <a 
        href="/test-firebase" 
        class="inline-block bg-orange-700 hover:bg-orange-600 px-6 py-3 rounded text-white font-medium transition-colors mr-4"
      >
        Firebase Test
      </a>
      <a 
        href="/" 
        class="inline-block bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded text-white font-medium transition-colors"
      >
        Home
      </a>
    </div>
  </div>
</div>
