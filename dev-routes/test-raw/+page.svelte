<script>
  // Absolutely minimal test - no imports at all
  let count = 0;
  
  function increment() {
    count = count + 1;
    console.log('Button clicked! Count is now:', count);
  }
</script>

<svelte:head>
  <title>Raw Test</title>
</svelte:head>

<div style="padding: 20px; background: black; color: white; min-height: 100vh;">
  <h1>🔬 Raw JavaScript Test</h1>
  <p>This is the most basic possible test with no imports or dependencies.</p>
  
  <div style="margin: 20px 0; padding: 20px; background: #333; border-radius: 8px;">
    <h2>Counter: {count}</h2>
    <button 
      on:click={increment}
      style="background: red; color: white; padding: 10px 20px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;"
    >
      Click Me! ({count})
    </button>
  </div>
  
  <div style="margin: 20px 0; padding: 20px; background: #333; border-radius: 8px;">
    <h3>Instructions:</h3>
    <ol>
      <li>Click the red button above</li>
      <li>The counter should increase</li>
      <li>If it doesn't work, open browser console (F12)</li>
      <li>Look for any red error messages</li>
    </ol>
  </div>
  
  <div style="margin: 20px 0; padding: 20px; background: #333; border-radius: 8px;">
    <h3>What this tests:</h3>
    <ul>
      <li>Basic Svelte reactivity</li>
      <li>Event handlers (on:click)</li>
      <li>JavaScript execution</li>
      <li>No external dependencies</li>
    </ul>
  </div>
</div>
