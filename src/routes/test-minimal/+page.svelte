<script>
  import { onMount } from 'svelte';
  
  let count = 0;
  let status = 'Loading...';
  let logs = [];
  
  function addLog(message) {
    console.log('MINIMAL TEST:', message);
    logs = [...logs, message];
  }
  
  function incrementCount() {
    count++;
    addLog(`Count incremented to ${count}`);
    status = `Button clicked ${count} times`;
  }
  
  onMount(() => {
    addLog('✅ onMount executed successfully');
    status = 'JavaScript is working!';
    
    // Test setTimeout
    setTimeout(() => {
      addLog('✅ setTimeout executed successfully');
      status = 'All basic JavaScript working!';
    }, 500);
  });
</script>

<svelte:head>
  <title>Minimal Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4">
  <div class="max-w-xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-4">🔬 Minimal Test</h1>
      <p class="text-gray-300">Testing basic Svelte functionality without Firebase</p>
    </div>

    <!-- Status -->
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
      <h2 class="text-xl font-bold text-green-400 mb-2">Status</h2>
      <p class="text-white">{status}</p>
    </div>

    <!-- Counter Test -->
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-blue-400 mb-4">Counter Test</h2>
      
      <div class="text-center">
        <p class="text-white text-2xl mb-4">Count: {count}</p>
        <button
          on:click={incrementCount}
          class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white font-bold text-lg transition-colors"
        >
          Click Me! ({count})
        </button>
      </div>
    </div>

    <!-- Logs -->
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-yellow-400 mb-4">Logs ({logs.length})</h2>
      
      <div class="bg-black p-4 rounded max-h-48 overflow-y-auto">
        {#if logs.length === 0}
          <p class="text-gray-400 text-sm">No logs yet...</p>
        {:else}
          {#each logs as log}
            <p class="text-green-300 text-sm mb-1 font-mono">{log}</p>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Instructions -->
    <div class="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-6">
      <h3 class="text-blue-400 font-semibold mb-2">Expected Results</h3>
      <ul class="text-gray-300 text-sm space-y-1">
        <li>✅ Status should change from "Loading..." to "All basic JavaScript working!"</li>
        <li>✅ Logs should show onMount and setTimeout messages</li>
        <li>✅ Button should increment count when clicked</li>
        <li>✅ If this works, the issue is Firebase-related</li>
        <li>❌ If this fails, the issue is with Svelte/JavaScript execution</li>
      </ul>
    </div>

    <!-- Navigation -->
    <div class="text-center">
      <a 
        href="/test-simple" 
        class="inline-block bg-purple-700 hover:bg-purple-600 px-6 py-3 rounded text-white font-medium transition-colors mr-4"
      >
        Simple Test
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
