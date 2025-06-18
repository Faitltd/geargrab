<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let status = 'Starting...';
  let logs = [];
  let testCount = 0;
  
  function addLog(message) {
    console.log('TEST LOG:', message);
    logs = [...logs, `${testCount++}: ${message}`];
    status = message;
  }
  
  function testBasicFunction() {
    addLog('✅ Button click works!');
  }
  
  function testEnvironment() {
    addLog('🧪 Testing environment...');
    addLog(`Browser: ${browser}`);
    addLog(`Window exists: ${typeof window !== 'undefined'}`);
    addLog(`Document exists: ${typeof document !== 'undefined'}`);
    
    // Test environment variables
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    addLog(`Firebase API Key: ${apiKey ? 'Present' : 'Missing'}`);
  }
  
  async function testFirebaseImport() {
    addLog('📦 Testing Firebase import...');
    
    try {
      // Test basic import
      const firebaseModule = await import('$lib/firebase/client');
      addLog('✅ Firebase client imported');
      
      // Check if auth exists
      if (firebaseModule.auth) {
        addLog('✅ Auth object exists');
      } else {
        addLog('❌ Auth object missing');
      }
      
    } catch (error) {
      addLog(`❌ Firebase import failed: ${error.message}`);
      console.error('Firebase import error:', error);
    }
  }
  
  onMount(() => {
    addLog('🚀 onMount started');
    addLog(`Browser environment: ${browser}`);
    
    if (browser) {
      addLog('✅ In browser environment');
      testEnvironment();
    } else {
      addLog('❌ Not in browser environment');
    }
  });
</script>

<svelte:head>
  <title>Simple Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4">
  <div class="max-w-2xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-4">🧪 Simple Test Page</h1>
      <p class="text-gray-300">Testing basic functionality step by step</p>
    </div>

    <!-- Status -->
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
      <h2 class="text-xl font-bold text-green-400 mb-2">Current Status</h2>
      <p class="text-white">{status}</p>
    </div>

    <!-- Test Buttons -->
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-blue-400 mb-4">Test Controls</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          on:click={testBasicFunction}
          class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-medium transition-colors"
        >
          Test Button Click
        </button>
        
        <button
          on:click={testEnvironment}
          class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium transition-colors"
        >
          Test Environment
        </button>
        
        <button
          on:click={testFirebaseImport}
          class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-medium transition-colors"
        >
          Test Firebase Import
        </button>
        
        <button
          on:click={() => { logs = []; testCount = 0; status = 'Cleared'; }}
          class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-medium transition-colors"
        >
          Clear Logs
        </button>
      </div>
    </div>

    <!-- Logs -->
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-yellow-400 mb-4">Test Logs ({logs.length})</h2>
      
      <div class="bg-black p-4 rounded max-h-64 overflow-y-auto">
        {#if logs.length === 0}
          <p class="text-gray-400 text-sm">No logs yet - click a test button above</p>
        {:else}
          {#each logs as log}
            <p class="text-green-300 text-sm mb-1 font-mono">{log}</p>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Instructions -->
    <div class="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-6">
      <h3 class="text-blue-400 font-semibold mb-2">Test Instructions</h3>
      <ol class="text-gray-300 text-sm space-y-1">
        <li>1. Check if logs appear when page loads (onMount should run)</li>
        <li>2. Click "Test Button Click" to verify basic interactivity</li>
        <li>3. Click "Test Environment" to check browser environment</li>
        <li>4. Click "Test Firebase Import" to test Firebase module loading</li>
        <li>5. Check browser console (F12) for any error messages</li>
      </ol>
    </div>

    <!-- Navigation -->
    <div class="text-center">
      <a 
        href="/test-firebase" 
        class="inline-block bg-orange-700 hover:bg-orange-600 px-6 py-3 rounded text-white font-medium transition-colors mr-4"
      >
        Firebase Test
      </a>
      <a 
        href="/test-basic" 
        class="inline-block bg-green-700 hover:bg-green-600 px-6 py-3 rounded text-white font-medium transition-colors mr-4"
      >
        Basic Test
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
