<script lang="ts">
  import { goto } from '$app/navigation';
  import { notifications } from '$lib/stores/notifications';

  let loading = false;
  let email = 'admin@itsfait.com';
  let password = 'admin123';
  let authStatus = null;

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/debug/auth-status');
      authStatus = await response.json();
    } catch (error) {
      console.error('Failed to check auth status:', error);
    }
  }

  async function forceLogin() {
    loading = true;
    try {
      const response = await fetch('/api/admin/force-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        notifications.add({
          type: 'success',
          message: 'Admin session created successfully!',
          timeout: 3000
        });

        // Wait a moment then redirect
        setTimeout(() => {
          goto('/admin/listings');
        }, 1000);
      } else {
        notifications.add({
          type: 'error',
          message: result.error || 'Failed to create admin session',
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Force login error:', error);
      notifications.add({
        type: 'error',
        message: 'Network error during login',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  async function testListingDeletion() {
    try {
      const response = await fetch('/api/listings/W6RX8l0Z8HA0ExTwiOJ6', {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        notifications.add({
          type: 'success',
          message: 'Listing deleted successfully!',
          timeout: 3000
        });
      } else {
        notifications.add({
          type: 'error',
          message: `Deletion failed: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Deletion test error:', error);
      notifications.add({
        type: 'error',
        message: 'Network error during deletion test',
        timeout: 5000
      });
    }
  }

  // Check auth status on load
  checkAuthStatus();
</script>

<svelte:head>
  <title>Admin Test Login - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 p-8">
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold text-white mb-8">🧪 Admin Test Login</h1>
    
    <!-- Current Auth Status -->
    <div class="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">Current Authentication Status</h2>
      <button 
        on:click={checkAuthStatus}
        class="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh Status
      </button>
      
      {#if authStatus}
        <div class="space-y-2 text-sm">
          <div class="text-gray-300">
            <strong>Session Cookie:</strong> 
            <span class={authStatus.authStatus?.hasSessionCookie ? 'text-green-400' : 'text-red-400'}>
              {authStatus.authStatus?.hasSessionCookie ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
          <div class="text-gray-300">
            <strong>User ID:</strong> 
            <span class={authStatus.authStatus?.localsUserId ? 'text-green-400' : 'text-red-400'}>
              {authStatus.authStatus?.localsUserId || '❌ None'}
            </span>
          </div>
          <div class="text-gray-300">
            <strong>Firebase Admin:</strong> 
            <span class={authStatus.authStatus?.firebaseAdminAvailable ? 'text-green-400' : 'text-red-400'}>
              {authStatus.authStatus?.firebaseAdminAvailable ? '✅ Available' : '❌ Unavailable'}
            </span>
          </div>
          <div class="text-gray-300">
            <strong>Admin Status:</strong> 
            <span class={authStatus.adminStatus?.exists ? 'text-green-400' : 'text-red-400'}>
              {authStatus.adminStatus?.exists ? '✅ Admin User' : '❌ Not Admin'}
            </span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Force Login Form -->
    <div class="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">🔐 Force Admin Login (Testing)</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-gray-300 mb-2">Admin Email:</label>
          <input 
            bind:value={email}
            type="email"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-green-500"
          />
        </div>
        <div>
          <label class="block text-gray-300 mb-2">Test Password:</label>
          <input 
            bind:value={password}
            type="password"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-green-500"
          />
        </div>
        <button 
          on:click={forceLogin}
          disabled={loading}
          class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating Session...' : 'Force Admin Login'}
        </button>
      </div>
      <div class="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded">
        <p class="text-yellow-300 text-sm">
          ⚠️ This is a testing endpoint. Default password is "admin123"
        </p>
      </div>
    </div>

    <!-- Test Actions -->
    <div class="bg-gray-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">🧪 Test Admin Actions</h2>
      <div class="space-y-4">
        <button 
          on:click={() => goto('/admin/listings')}
          class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Admin Listings
        </button>
        
        <button 
          on:click={testListingDeletion}
          class="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Test Listing Deletion (W6RX8l0Z8HA0ExTwiOJ6)
        </button>
        
        <button 
          on:click={() => goto('/admin/messages')}
          class="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Go to Admin Messages
        </button>
        
        <button 
          on:click={() => goto('/admin/bookings')}
          class="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Go to Admin Bookings
        </button>
      </div>
    </div>
  </div>
</div>
