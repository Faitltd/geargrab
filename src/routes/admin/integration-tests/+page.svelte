<script lang="ts">
  import { onMount } from 'svelte';
  import { isCurrentUserAdmin, initializeAdminUser } from '$lib/auth/admin';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let loading = true;
  let isAdmin = false;
  let testing = false;
  let testResults: any[] = [];
  let selectedTests: string[] = [];

  const availableTests = [
    {
      id: 'firebase_connection',
      name: 'Firebase Connection',
      description: 'Test connection to Firebase services',
      category: 'Infrastructure'
    },
    {
      id: 'auth_flow',
      name: 'Authentication Flow',
      description: 'Test user authentication and authorization',
      category: 'Authentication'
    },
    {
      id: 'database_operations',
      name: 'Database Operations',
      description: 'Test CRUD operations on Firestore',
      category: 'Database'
    },
    {
      id: 'payment_processing',
      name: 'Payment Processing',
      description: 'Test Stripe payment integration',
      category: 'Payments'
    },
    {
      id: 'email_service',
      name: 'Email Service',
      description: 'Test email delivery system',
      category: 'Communication'
    },
    {
      id: 'file_upload',
      name: 'File Upload',
      description: 'Test file upload to Firebase Storage',
      category: 'Storage'
    },
    {
      id: 'search_functionality',
      name: 'Search Functionality',
      description: 'Test listing search and filtering',
      category: 'Features'
    },
    {
      id: 'booking_flow',
      name: 'Booking Flow',
      description: 'Test end-to-end booking process',
      category: 'Features'
    }
  ];

  onMount(async () => {
    try {
      // Wait for auth to be ready
      await simpleAuth.waitForAuthReady();

      if (!simpleAuth.user) {
        goto('/auth/login?redirectTo=/admin/integration-tests');
        return;
      }

      // Initialize admin user if needed
      await initializeAdminUser();

      // Check admin status
      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        console.warn('🚫 User is not admin:', simpleAuth.user.email);
        goto('/?error=admin_required');
        return;
      }

      console.log('✅ Admin access granted for integration tests:', simpleAuth.user.email);

      // Select all tests by default
      selectedTests = availableTests.map(test => test.id);

    } catch (error) {
      console.error('Error checking admin access:', error);
      goto('/?error=admin_check_failed');
    } finally {
      loading = false;
    }
  });

  async function runIntegrationTests() {
    if (testing || selectedTests.length === 0) return;

    testing = true;
    testResults = [];

    try {
      const response = await fetch('/api/admin/integration-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tests: selectedTests })
      });

      const result = await response.json();

      if (response.ok) {
        testResults = result.results || [];
        
        const passedTests = testResults.filter(r => r.status === 'passed').length;
        const totalTests = testResults.length;

        notifications.add({
          type: passedTests === totalTests ? 'success' : 'warning',
          message: `Integration tests completed: ${passedTests}/${totalTests} passed`,
          timeout: 5000
        });
      } else {
        notifications.add({
          type: 'error',
          message: `Failed to run integration tests: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Error running integration tests:', error);
      notifications.add({
        type: 'error',
        message: 'Error running integration tests',
        timeout: 5000
      });
    } finally {
      testing = false;
    }
  }

  function toggleTest(testId: string) {
    if (selectedTests.includes(testId)) {
      selectedTests = selectedTests.filter(id => id !== testId);
    } else {
      selectedTests = [...selectedTests, testId];
    }
  }

  function selectAllTests() {
    selectedTests = availableTests.map(test => test.id);
  }

  function deselectAllTests() {
    selectedTests = [];
  }

  function clearResults() {
    testResults = [];
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      case 'running': return '🔄';
      default: return '❓';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'passed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'skipped': return 'text-yellow-400';
      case 'running': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }

  $: groupedTests = availableTests.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, typeof availableTests>);
</script>

<svelte:head>
  <title>Integration Tests - Admin Panel</title>
</svelte:head>

{#if loading}
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
    <p class="text-gray-400">Loading integration tests...</p>
  </div>
{:else if !isAdmin}
  <div class="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30 text-center">
    <h2 class="text-xl font-bold text-white mb-2">Access Denied</h2>
    <p class="text-gray-300">Admin privileges required to access integration tests.</p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-white">Integration Tests</h1>
        <p class="text-gray-400 mt-1">Test system integrations and functionality</p>
      </div>
      <a href="/admin" class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
        ← Back to Admin
      </a>
    </div>

    <!-- Test Selection -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-white">Select Tests to Run</h2>
        <div class="space-x-2">
          <button
            on:click="{selectAllTests}"
            class="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded transition-colors"
          >
            Select All
          </button>
          <button
            on:click="{deselectAllTests}"
            class="bg-gray-600 hover:bg-gray-700 text-white text-sm py-1 px-3 rounded transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {#each Object.entries(groupedTests) as [category, tests]}
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-white mb-3">{category}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each tests as test}
              <label class="flex items-center space-x-3 bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedTests.includes(test.id)}
                  on:change={() => toggleTest(test.id)}
                  class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
                />
                <div class="flex-1">
                  <div class="text-white font-medium">{test.name}</div>
                  <div class="text-gray-400 text-sm">{test.description}</div>
                </div>
              </label>
            {/each}
          </div>
        </div>
      {/each}

      <!-- Run Tests Button -->
      <div class="flex items-center space-x-4 mt-6">
        <button
          on:click="{runIntegrationTests}"
          disabled={testing || selectedTests.length === 0}
          class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
        >
          {#if testing}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Running Tests...
          {:else}
            🧪 Run Selected Tests ({selectedTests.length})
          {/if}
        </button>

        {#if testResults.length > 0}
          <button
            on:click="{clearResults}"
            class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Clear Results
          </button>
        {/if}
      </div>
    </div>

    <!-- Test Results -->
    {#if testResults.length > 0}
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Test Results</h2>
        
        <!-- Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {#each ['passed', 'failed', 'skipped'] as status}
            {@const count = testResults.filter(r => r.status === status).length}
            <div class="bg-white/5 rounded-lg p-4 text-center">
              <div class="text-2xl mb-1">{getStatusIcon(status)}</div>
              <div class="text-white font-bold text-xl">{count}</div>
              <div class="text-gray-400 text-sm capitalize">{status}</div>
            </div>
          {/each}
          <div class="bg-white/5 rounded-lg p-4 text-center">
            <div class="text-2xl mb-1">📊</div>
            <div class="text-white font-bold text-xl">{testResults.length}</div>
            <div class="text-gray-400 text-sm">Total</div>
          </div>
        </div>

        <!-- Detailed Results -->
        <div class="space-y-3">
          {#each testResults as result}
            <div class="bg-white/5 rounded-lg p-4 border border-white/10">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-3">
                  <span class="text-xl">{getStatusIcon(result.status)}</span>
                  <div>
                    <div class="text-white font-medium">{result.name}</div>
                    <div class="text-gray-400 text-sm">{result.description}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="{getStatusColor(result.status)} font-medium text-sm uppercase">{result.status}</div>
                  <div class="text-gray-400 text-xs">{result.duration}ms</div>
                </div>
              </div>
              
              {#if result.message}
                <div class="text-gray-300 text-sm mt-2 bg-white/5 rounded p-2">
                  {result.message}
                </div>
              {/if}
              
              {#if result.error}
                <div class="text-red-300 text-sm mt-2 bg-red-500/10 rounded p-2">
                  <strong>Error:</strong> {result.error}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
