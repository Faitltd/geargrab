<script lang="ts">
  import { onMount } from 'svelte';
  import { validateFirebaseConfig, getFirebaseConfigHelp } from '$lib/utils/firebaseValidator';
  
  let configStatus = {
    isValid: false,
    errors: [],
    warnings: [],
    config: {}
  };
  
  let showDetails = false;
  
  onMount(() => {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
    };
    
    const validation = validateFirebaseConfig(config);
    
    configStatus = {
      ...validation,
      config: {
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'Not set',
        authDomain: config.authDomain || 'Not set',
        projectId: config.projectId || 'Not set',
        storageBucket: config.storageBucket || 'Not set',
        messagingSenderId: config.messagingSenderId || 'Not set',
        appId: config.appId ? `${config.appId.substring(0, 15)}...` : 'Not set',
        measurementId: config.measurementId || 'Not set'
      }
    };
  });
</script>

<!-- Firebase Debug Panel -->
<div class="fixed bottom-4 right-4 z-50 max-w-md">
  <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full mr-2 {configStatus.isValid ? 'bg-green-500' : 'bg-red-500'}"></div>
          <h3 class="text-sm font-medium text-gray-900">Firebase Status</h3>
        </div>
        <button
          on:click={() => showDetails = !showDetails}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5 transform transition-transform {showDetails ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Status Summary -->
    <div class="px-4 py-3">
      {#if configStatus.isValid}
        <div class="flex items-center text-green-700">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-sm font-medium">Configuration looks good!</span>
        </div>
      {:else}
        <div class="flex items-center text-red-700">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span class="text-sm font-medium">Configuration issues detected</span>
        </div>
        
        <div class="mt-2 text-xs text-gray-600">
          {configStatus.errors.length} error{configStatus.errors.length !== 1 ? 's' : ''}
          {#if configStatus.warnings.length > 0}
            , {configStatus.warnings.length} warning{configStatus.warnings.length !== 1 ? 's' : ''}
          {/if}
        </div>
      {/if}
    </div>

    <!-- Detailed Information -->
    {#if showDetails}
      <div class="border-t border-gray-200">
        <!-- Errors -->
        {#if configStatus.errors.length > 0}
          <div class="px-4 py-3 bg-red-50">
            <h4 class="text-sm font-medium text-red-800 mb-2">Errors:</h4>
            <ul class="text-xs text-red-700 space-y-1">
              {#each configStatus.errors as error}
                <li>• {error}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Warnings -->
        {#if configStatus.warnings.length > 0}
          <div class="px-4 py-3 bg-yellow-50">
            <h4 class="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
            <ul class="text-xs text-yellow-700 space-y-1">
              {#each configStatus.warnings as warning}
                <li>• {warning}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Configuration Values -->
        <div class="px-4 py-3">
          <h4 class="text-sm font-medium text-gray-800 mb-2">Configuration:</h4>
          <div class="text-xs text-gray-600 space-y-1">
            <div>API Key: <span class="font-mono">{configStatus.config.apiKey}</span></div>
            <div>Auth Domain: <span class="font-mono">{configStatus.config.authDomain}</span></div>
            <div>Project ID: <span class="font-mono">{configStatus.config.projectId}</span></div>
            <div>Storage Bucket: <span class="font-mono">{configStatus.config.storageBucket}</span></div>
            <div>Messaging Sender ID: <span class="font-mono">{configStatus.config.messagingSenderId}</span></div>
            <div>App ID: <span class="font-mono">{configStatus.config.appId}</span></div>
            {#if configStatus.config.measurementId !== 'Not set'}
              <div>Measurement ID: <span class="font-mono">{configStatus.config.measurementId}</span></div>
            {/if}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div class="flex flex-col space-y-2">
            <button
              on:click={() => console.log(getFirebaseConfigHelp())}
              class="text-xs text-blue-600 hover:text-blue-800 text-left"
            >
              📖 Log setup help to console
            </button>
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-blue-600 hover:text-blue-800"
            >
              🔗 Open Firebase Console
            </a>
            <button
              on:click={() => window.location.reload()}
              class="text-xs text-gray-600 hover:text-gray-800 text-left"
            >
              🔄 Reload page
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Ensure the debug panel is always visible */
  :global(body) {
    padding-bottom: 100px;
  }
</style>
