<script lang="ts">
  import { onMount } from 'svelte';

  let logs: string[] = [];

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    logs = [...logs, `[${timestamp}] ${message}`];
    console.log(message);
  }

  onMount(async () => {
    addLog('🔍 Page mounted, testing Firebase...');
    
    try {
      addLog('🔄 Attempting to import Firebase client...');
      const { auth } = await import('$lib/firebase/client');
      
      if (auth) {
        addLog('✅ Firebase Auth imported successfully');
        addLog(`🔍 Auth object: ${typeof auth}`);
        addLog(`🔍 Current user: ${auth.currentUser ? auth.currentUser.email : 'null'}`);
        
        // Test auth state listener
        const unsubscribe = auth.onAuthStateChanged((user) => {
          addLog(`🔥 Auth state changed: ${user ? user.email : 'null'}`);
        });

        return unsubscribe;
      } else {
        addLog('❌ Firebase Auth is null or undefined');
      }
    } catch (error: any) {
      addLog(`❌ Error importing Firebase: ${error.message}`);
    }

    try {
      addLog('🔄 Testing simple auth service...');
      const { simpleAuth } = await import('$lib/auth/simple-auth');
      addLog('✅ Simple auth service imported');

      const authState = simpleAuth.authState;
      authState.subscribe((state) => {
        addLog(`📊 Simple Auth state: ${state.isAuthenticated ? 'authenticated' : 'not authenticated'} (loading: ${state.loading})`);
      });
    } catch (error: any) {
      addLog(`❌ Error importing simple auth service: ${error.message}`);
    }
  });
</script>

<svelte:head>
  <title>Simple Firebase Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
  <div class="max-w-4xl mx-auto pt-24">
    
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
      <h1 class="text-3xl font-bold text-white mb-4">Simple Firebase Test</h1>
      <p class="text-gray-300">Basic test to see if Firebase is working</p>
    </div>

    <!-- Test Results -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Test Results</h2>
      <div class="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
        {#if logs.length === 0}
          <p class="text-gray-400 text-center">No test results yet...</p>
        {:else}
          {#each logs as log}
            <div class="text-green-300 text-sm font-mono mb-1">{log}</div>
          {/each}
        {/if}
      </div>
    </div>

  </div>
</div>
