<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let logs = [];
  let firebaseStatus = 'Checking...';
  let authStatus = 'Checking...';
  let configStatus = 'Checking...';
  
  function addLog(message) {
    console.log(message);
    logs = [...logs, `${new Date().toLocaleTimeString()}: ${message}`];
  }
  
  onMount(async () => {
    addLog('🚀 Starting Firebase test...');
    addLog(`📱 Browser environment: ${browser}`);
    
    if (!browser) {
      addLog('❌ Not in browser environment');
      return;
    }
    
    // Test 1: Check environment variables
    addLog('🔧 Testing environment variables...');
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    
    configStatus = `API Key: ${apiKey ? '✅' : '❌'}, Project: ${projectId || 'missing'}, Domain: ${authDomain || 'missing'}`;
    addLog(`🔧 ${configStatus}`);
    
    // Test 2: Try to import Firebase client
    try {
      addLog('📦 Importing Firebase client...');
      const firebaseModule = await import('$lib/firebase/client');
      addLog('✅ Firebase client imported successfully');
      
      // Test 3: Check Firebase objects
      if (firebaseModule.auth) {
        addLog('✅ Firebase Auth object exists');
        authStatus = 'Auth object exists';
        
        // Test current user
        const currentUser = firebaseModule.auth.currentUser;
        addLog(`👤 Current user: ${currentUser ? currentUser.email : 'null'}`);
        
        // Test auth state listener
        addLog('🔄 Setting up auth state listener...');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        const unsubscribe = onAuthStateChanged(firebaseModule.auth, (user) => {
          addLog(`🔐 Auth state changed: ${user ? user.email : 'signed out'}`);
          authStatus = user ? `Signed in: ${user.email}` : 'Signed out';
        }, (error) => {
          addLog(`❌ Auth state error: ${error.message}`);
          authStatus = `Error: ${error.message}`;
        });
        
        // Clean up listener after 5 seconds
        setTimeout(() => {
          unsubscribe();
          addLog('🧹 Auth listener cleaned up');
        }, 5000);
        
      } else {
        addLog('❌ Firebase Auth object is missing');
        authStatus = 'Auth object missing';
      }
      
      if (firebaseModule.firestore) {
        addLog('✅ Firebase Firestore object exists');
      } else {
        addLog('❌ Firebase Firestore object is missing');
      }
      
      firebaseStatus = 'Firebase initialized successfully';
      
    } catch (error) {
      addLog(`❌ Firebase import error: ${error.message}`);
      firebaseStatus = `Error: ${error.message}`;
    }
    
    // Test 4: Try to import auth functions
    try {
      addLog('📦 Importing auth functions...');
      const authModule = await import('$lib/firebase/auth');
      addLog('✅ Auth functions imported successfully');
      
      // List available functions
      const functions = Object.keys(authModule);
      addLog(`📋 Available auth functions: ${functions.join(', ')}`);
      
    } catch (error) {
      addLog(`❌ Auth functions import error: ${error.message}`);
    }
  });
  
  async function testGoogleSignIn() {
    addLog('🧪 Testing Google Sign-in...');
    
    try {
      const authModule = await import('$lib/firebase/auth');
      addLog('📦 Auth module imported for sign-in test');
      
      const result = await authModule.signInWithGoogle();
      addLog(`✅ Google sign-in successful: ${result.user.email}`);
      
    } catch (error) {
      addLog(`❌ Google sign-in failed: ${error.message}`);
    }
  }
  
  function clearLogs() {
    logs = [];
    addLog('🧹 Logs cleared');
  }
</script>

<svelte:head>
  <title>Firebase Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-black py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-4">🔥 Firebase Initialization Test</h1>
      <p class="text-gray-300">Testing Firebase setup and authentication</p>
    </div>

    <!-- Status Cards -->
    <div class="grid md:grid-cols-3 gap-4 mb-8">
      <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2 text-blue-400">Firebase Status</h3>
        <p class="text-white text-sm">{firebaseStatus}</p>
      </div>
      <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2 text-green-400">Auth Status</h3>
        <p class="text-white text-sm">{authStatus}</p>
      </div>
      <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-2 text-purple-400">Config Status</h3>
        <p class="text-white text-sm">{configStatus}</p>
      </div>
    </div>

    <!-- Test Controls -->
    <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-2xl font-bold mb-4 text-green-400">Test Controls</h2>
      
      <div class="flex flex-wrap gap-3 mb-6">
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
      <h2 class="text-2xl font-bold mb-4 text-yellow-400">Test Logs</h2>
      
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
        href="/debug/auth" 
        class="inline-block bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded text-white font-medium transition-colors mr-4"
      >
        Go to Auth Debug
      </a>
      <a 
        href="/test-basic" 
        class="inline-block bg-green-700 hover:bg-green-600 px-6 py-3 rounded text-white font-medium transition-colors mr-4"
      >
        Go to Basic Test
      </a>
      <a 
        href="/" 
        class="inline-block bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded text-white font-medium transition-colors"
      >
        Back to Home
      </a>
    </div>
  </div>
</div>
