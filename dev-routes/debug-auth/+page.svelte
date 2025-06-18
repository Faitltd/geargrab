<script>
  import { onMount } from 'svelte';
  
  let authStatus = 'Checking...';
  let debugInfo = {};
  let testResult = '';
  
  onMount(async () => {
    try {
      // Check Firebase auth status
      const { auth } = await import('$lib/firebase/client');
      const user = auth?.currentUser;
      
      if (user) {
        authStatus = `Logged in as: ${user.email}`;
        
        // Get the ID token
        const token = await user.getIdToken();
        
        debugInfo = {
          uid: user.uid,
          email: user.email,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 50) + '...'
        };
        
        // Test the debug endpoint
        const response = await fetch('/api/debug/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ test: true })
        });
        
        const result = await response.json();
        testResult = JSON.stringify(result, null, 2);
        
      } else {
        authStatus = 'Not logged in';
        debugInfo = { error: 'No user found' };
      }
    } catch (error) {
      authStatus = `Error: ${error.message}`;
      debugInfo = { error: error.message };
    }
  });
</script>

<div class="min-h-screen bg-gray-100 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Authentication Debug</h1>
    
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Auth Status</h2>
      <p class="text-lg">{authStatus}</p>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Debug Info</h2>
      <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
    
    {#if testResult}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Server Test Result</h2>
        <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{testResult}</pre>
      </div>
    {/if}
    
    <div class="mt-8">
      <a href="/" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Back to Home
      </a>
    </div>
  </div>
</div>
