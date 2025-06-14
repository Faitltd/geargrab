<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { auth } from '$lib/firebase/client';
  import { onAuthStateChanged } from 'firebase/auth';
  
  let authState = 'Loading...';
  let storeState = 'Loading...';
  let firebaseUser = null;
  
  onMount(() => {
    // Monitor the auth store
    const unsubscribeStore = authStore.subscribe((state) => {
      storeState = JSON.stringify({
        user: state.user ? { email: state.user.email, uid: state.user.uid } : null,
        loading: state.loading,
        error: state.error
      }, null, 2);
    });
    
    // Monitor Firebase auth directly
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      firebaseUser = user;
      authState = user ? `Signed in: ${user.email}` : 'Signed out';
      console.log('Direct Firebase auth state:', user ? user.email : 'null');
    });
    
    return () => {
      unsubscribeStore();
      unsubscribeAuth();
    };
  });
</script>

<div class="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
  <h3 class="font-bold text-sm mb-2">Auth Debug</h3>
  
  <div class="text-xs space-y-2">
    <div>
      <strong>Firebase Auth:</strong>
      <div class="bg-gray-100 p-2 rounded text-xs">{authState}</div>
    </div>
    
    <div>
      <strong>Auth Store:</strong>
      <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">{storeState}</pre>
    </div>
    
    <div>
      <strong>Current User UID:</strong>
      <div class="bg-gray-100 p-2 rounded text-xs">{firebaseUser?.uid || 'None'}</div>
    </div>
  </div>
  
  <button 
    on:click={() => console.log('Current auth state:', { firebaseUser, store: $authStore })}
    class="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
  >
    Log to Console
  </button>
</div>
