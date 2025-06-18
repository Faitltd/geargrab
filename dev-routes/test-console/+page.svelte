<script>
  import { onMount } from 'svelte';
  
  let message = 'Page loading...';
  let clickCount = 0;
  
  // This should run immediately when the script loads
  console.log('🚀 SCRIPT LOADED - This should appear in browser console');
  message = 'Script loaded';
  
  function testClick() {
    clickCount++;
    message = `Button clicked ${clickCount} times`;
    console.log('🔘 BUTTON CLICKED:', clickCount);
  }
  
  onMount(() => {
    console.log('🎯 ONMOUNT STARTED - This should appear in browser console');
    message = 'onMount executed';
    
    // Test setTimeout to see if async works
    setTimeout(() => {
      console.log('⏰ TIMEOUT EXECUTED - This should appear in browser console');
      message = 'Timeout completed';
    }, 1000);
  });
</script>

<svelte:head>
  <title>Console Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-black text-white p-8">
  <div class="max-w-2xl mx-auto">
    <h1 class="text-4xl font-bold mb-8 text-center">🔍 Console Test</h1>
    
    <div class="bg-gray-800 p-6 rounded-lg mb-6">
      <h2 class="text-2xl font-bold mb-4 text-green-400">Status</h2>
      <p class="text-xl">{message}</p>
      <p class="text-lg mt-2">Click count: {clickCount}</p>
    </div>
    
    <div class="bg-gray-800 p-6 rounded-lg mb-6">
      <h2 class="text-2xl font-bold mb-4 text-blue-400">Test Button</h2>
      <button
        on:click={testClick}
        class="bg-red-600 hover:bg-red-700 px-8 py-4 rounded text-white text-xl font-bold transition-colors"
      >
        Click Me! ({clickCount})
      </button>
    </div>
    
    <div class="bg-gray-800 p-6 rounded-lg">
      <h2 class="text-2xl font-bold mb-4 text-yellow-400">Instructions</h2>
      <ol class="space-y-2">
        <li>1. Open browser console (F12 → Console)</li>
        <li>2. Look for messages starting with 🚀, 🎯, ⏰, 🔘</li>
        <li>3. Click the button and check if click count increases</li>
        <li>4. Check if status message changes</li>
      </ol>
    </div>
    
    <div class="text-center mt-8">
      <a href="/" class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded text-white">
        Back to Home
      </a>
    </div>
  </div>
</div>
