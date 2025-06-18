<script>
  // Ultra-minimal test page to verify basic Svelte functionality
  let count = 0;
  let message = 'Click the button to test JavaScript execution';
  let testResults = [];
  
  function increment() {
    console.log('Button clicked! Count was:', count);
    count += 1;
    message = `Button clicked ${count} time${count === 1 ? '' : 's'}!`;
    testResults = [...testResults, `✅ Click ${count}: JavaScript is working`];
    console.log('Updated count to:', count);
    console.log('Test results:', testResults);
  }
  
  function reset() {
    console.log('Reset button clicked');
    count = 0;
    message = 'Reset successful!';
    testResults = ['🔄 Reset completed'];
  }
  
  // Test reactive statements
  $: doubleCount = count * 2;
  $: console.log('Reactive statement fired. Count:', count, 'Double:', doubleCount);
</script>

<svelte:head>
  <title>Basic Svelte Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black py-12 px-4">
  <div class="max-w-2xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-4">🧪 Basic Svelte Test</h1>
      <p class="text-gray-300">Testing fundamental JavaScript and Svelte functionality</p>
    </div>

    <!-- Test Results -->
    <div class="bg-gray-900/50 border border-gray-600 rounded-lg p-6 mb-6">
      <h2 class="text-2xl font-bold mb-4 text-green-400">Test Status</h2>
      
      <!-- Current State -->
      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 class="text-lg font-semibold mb-2 text-blue-400">Current Count</h3>
          <div class="bg-gray-800 p-4 rounded text-2xl font-bold text-white text-center">
            {count}
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-2 text-blue-400">Double Count (Reactive)</h3>
          <div class="bg-gray-800 p-4 rounded text-2xl font-bold text-purple-400 text-center">
            {doubleCount}
          </div>
        </div>
      </div>

      <!-- Message -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-blue-400">Status Message</h3>
        <div class="bg-gray-800 p-3 rounded text-white">
          {message}
        </div>
      </div>

      <!-- Test Buttons -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-blue-400">Interactive Tests</h3>
        <div class="flex flex-wrap gap-3">
          <button
            on:click={increment}
            class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white font-medium transition-colors"
          >
            Click Me! ({count})
          </button>

          <button
            on:click={reset}
            class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded text-white font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Test Results -->
      {#if testResults.length > 0}
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2 text-blue-400">Test Results</h3>
          <div class="bg-gray-800 p-4 rounded max-h-40 overflow-y-auto">
            {#each testResults as result}
              <p class="text-sm mb-1 text-gray-300">{result}</p>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Environment Info -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2 text-blue-400">Environment Check</h3>
        <div class="bg-gray-800 p-4 rounded text-sm space-y-2">
          <p class="text-gray-300">✅ Page loaded successfully</p>
          <p class="text-gray-300">✅ Svelte component rendered</p>
          <p class="text-gray-300">✅ CSS styles applied</p>
          <p class="text-gray-300">✅ Reactive statements working: {doubleCount}</p>
        </div>
      </div>

      <!-- Instructions -->
      <div class="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <h3 class="text-blue-400 font-semibold mb-2">Test Instructions</h3>
        <ol class="text-gray-300 text-sm space-y-1">
          <li>1. Click the "Click Me!" button to test JavaScript execution</li>
          <li>2. Watch the count increase and reactive double count update</li>
          <li>3. Check browser console for log messages</li>
          <li>4. Use "Reset" button to test multiple functions</li>
          <li>5. If buttons don't work, there's a fundamental JS execution issue</li>
        </ol>
      </div>
    </div>

    <!-- Navigation -->
    <div class="text-center">
      <a 
        href="/debug/auth" 
        class="inline-block bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded text-white font-medium transition-colors mr-4"
      >
        Go to Auth Debug
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
