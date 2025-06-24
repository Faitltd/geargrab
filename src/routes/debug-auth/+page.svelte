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
    testResult = '🔄 Testing listing creation...\n';

    try {
      // Get ID token first to verify authentication
      testResult += '1. Getting ID token...\n';
      const idToken = await authState.user.getIdToken();
      testResult += `✅ ID Token: ${idToken.substring(0, 50)}...\n\n`;

      // Test the exact data structure
      const testListing = {
        ownerUid: authState.user.uid,
        ownerId: authState.user.uid,
        title: 'Debug Test Listing',
        description: 'This is a test listing created from the debug page to verify Firebase permissions.',
        category: 'camping',
        condition: 'Good',
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

      testResult += '2. Test listing data:\n';
      testResult += JSON.stringify(testListing, null, 2) + '\n\n';

      testResult += '3. Attempting to create listing...\n';
      console.log('🧪 Attempting to create test listing:', testListing);
      console.log('🔑 User UID:', authState.user.uid);
      console.log('🔑 User Email:', authState.user.email);

      const listingId = await createListing(testListing);

      testResult += `✅ Success! Created listing with ID: ${listingId}`;
      console.log('✅ Test listing created successfully:', listingId);

    } catch (error: any) {
      console.error('❌ Test listing creation failed:', error);
      console.error('❌ Full error object:', error);

      testResult += `❌ Error Details:\n`;
      testResult += `Code: ${error.code || 'No code'}\n`;
      testResult += `Message: ${error.message || 'No message'}\n`;

      if (error.code === 'permission-denied') {
        testResult += '\n🔍 Permission denied suggests:\n';
        testResult += '- Firestore rules are blocking the write\n';
        testResult += '- Authentication token not properly passed\n';
        testResult += '- Field validation failing in rules\n';
        testResult += '- User UID mismatch with ownerUid\n';
      }

      // Additional debugging info
      testResult += `\n📊 Debug Info:\n`;
      testResult += `User authenticated: ${authState.isAuthenticated}\n`;
      testResult += `User UID: ${authState.user?.uid || 'None'}\n`;
      testResult += `User email: ${authState.user?.email || 'None'}\n`;
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

  async function testFirebaseConnection() {
    loading = true;
    testResult = '🔄 Testing Firebase connection...\n';

    try {
      // Import Firebase modules
      const { firestore } = await import('$lib/firebase/client');
      const { collection, doc, setDoc } = await import('firebase/firestore');

      if (!firestore) {
        testResult += '❌ Firestore not initialized\n';
        return;
      }

      testResult += '✅ Firestore client available\n';

      if (!authState.user) {
        testResult += '❌ No authenticated user\n';
        return;
      }

      testResult += `✅ User authenticated: ${authState.user.email}\n`;
      testResult += `✅ User UID: ${authState.user.uid}\n`;

      // Test a simple write operation to a test collection
      const testDocRef = doc(collection(firestore, 'debug-test'), 'test-doc');
      const testData = {
        message: 'Test from debug page',
        timestamp: new Date(),
        userUid: authState.user.uid
      };

      testResult += '\n🧪 Testing simple write operation...\n';
      await setDoc(testDocRef, testData);
      testResult += '✅ Simple write successful!\n';

      testResult += '\n🎯 Firebase connection is working. The issue is specific to listings collection rules.';

    } catch (error: any) {
      console.error('❌ Firebase connection test failed:', error);
      testResult += `❌ Connection Error: ${error.message}\n`;
      testResult += `Code: ${error.code || 'No code'}\n`;
    } finally {
      loading = false;
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
            on:click={testFirebaseConnection}
            disabled={!authState?.isAuthenticated || loading}
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Testing...' : 'Test Firebase Connection'}
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
