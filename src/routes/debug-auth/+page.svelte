<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { createListing } from '$lib/firebase/db/listings';
  import type { Listing } from '$types/firestore';

  let authState: any = null;
  let debugInfo: any = {};
  let testResult: string = '';
  let loading = false;

  // Subscribe to auth state
  const unsubscribe = simpleAuth.authState.subscribe(state => {
    authState = state;
    debugInfo = {
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      userExists: !!state.user,
      userEmail: state.user?.email || 'No email',
      userUid: state.user?.uid || 'No UID',
      userDisplayName: state.user?.displayName || 'No display name'
    };
  });

  onMount(() => {
    return () => {
      unsubscribe();
    };
  });

  async function testListingCreation() {
    if (!authState.isAuthenticated || !authState.user) {
      testResult = '❌ User not authenticated';
      return;
    }

    loading = true;
    testResult = '🔄 Testing listing creation...';

    try {
      const testListing = {
        ownerUid: authState.user.uid,
        ownerId: authState.user.uid,
        title: 'Debug Test Listing',
        description: 'This is a test listing created from the debug page to verify Firebase permissions.',
        category: 'camping',
        condition: 'Good' as const,
        dailyPrice: 25,
        securityDeposit: 50,
        location: {
          city: 'Test City',
          state: 'CO',
          zipCode: '80202'
        },
        images: [],
        features: [],
        unavailableDates: [],
        isActive: true
      };

      console.log('🧪 Attempting to create test listing:', testListing);
      
      const listingId = await createListing(testListing);
      
      testResult = `✅ Success! Created listing with ID: ${listingId}`;
      console.log('✅ Test listing created successfully:', listingId);
      
    } catch (error: any) {
      console.error('❌ Test listing creation failed:', error);
      testResult = `❌ Error: ${error.message || error.code || 'Unknown error'}`;
      
      if (error.code === 'permission-denied') {
        testResult += '\n\n🔍 This suggests a Firestore rules issue or authentication problem.';
      }
    } finally {
      loading = false;
    }
  }

  async function getIdToken() {
    if (!authState.user) {
      testResult = '❌ No user to get token from';
      return;
    }

    try {
      const token = await authState.user.getIdToken();
      console.log('🔑 ID Token:', token.substring(0, 50) + '...');
      testResult = `✅ ID Token retrieved (${token.length} characters)`;
    } catch (error: any) {
      console.error('❌ Token error:', error);
      testResult = `❌ Token Error: ${error.message}`;
    }
  }
</script>

<svelte:head>
  <title>Debug Authentication - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 py-8">
  <div class="max-w-4xl mx-auto px-4">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">🔍 Authentication Debug Page</h1>
      
      <!-- Auth State Display -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Authentication State</h2>
        <div class="bg-gray-50 rounded-lg p-4">
          <pre class="text-sm overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>

      <!-- Test Buttons -->
      <div class="mb-8 space-y-4">
        <h2 class="text-xl font-semibold mb-4">Tests</h2>
        
        <div class="flex flex-wrap gap-4">
          <button
            on:click={getIdToken}
            disabled={!authState?.isAuthenticated}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Get ID Token
          </button>
          
          <button
            on:click={testListingCreation}
            disabled={!authState?.isAuthenticated || loading}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Testing...' : 'Test Listing Creation'}
          </button>
        </div>
      </div>

      <!-- Test Results -->
      {#if testResult}
        <div class="mb-8">
          <h2 class="text-xl font-semibold mb-4">Test Results</h2>
          <div class="bg-gray-50 rounded-lg p-4">
            <pre class="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        </div>
      {/if}

      <!-- Instructions -->
      <div class="bg-blue-50 rounded-lg p-4">
        <h3 class="font-semibold text-blue-900 mb-2">Instructions:</h3>
        <ol class="list-decimal list-inside text-blue-800 space-y-1">
          <li>Make sure you're signed in to the platform</li>
          <li>Check the authentication state above</li>
          <li>Click "Get ID Token" to verify Firebase authentication</li>
          <li>Click "Test Listing Creation" to test Firestore permissions</li>
          <li>Check the browser console for detailed error messages</li>
        </ol>
      </div>

      <!-- Navigation -->
      <div class="mt-8 pt-4 border-t">
        <a 
          href="/list-gear" 
          class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Back to List Gear
        </a>
      </div>
    </div>
  </div>
</div>
