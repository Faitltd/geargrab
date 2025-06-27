<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { isCurrentUserAdmin } from '$lib/firebase/auth';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let loading = true;
  let isAdmin = false;
  let testing = false;
  let testResults: any[] = [];
  let selectedSuite = 'all';

  const testSuites = [
    { id: 'all', name: 'All Tests', description: 'Run complete E2E test suite' },
    { id: 'auth', name: 'Authentication', description: 'User login, signup, and logout flows' },
    { id: 'listings', name: 'Listings', description: 'Create, edit, and view listings' },
    { id: 'booking', name: 'Booking Flow', description: 'Complete booking process' },
    { id: 'payments', name: 'Payments', description: 'Payment processing and webhooks' },
    { id: 'admin', name: 'Admin Panel', description: 'Admin functionality and permissions' },
    { id: 'mobile', name: 'Mobile Responsive', description: 'Mobile device compatibility' }
  ];

  onMount(async () => {
    try {
      if (!$authStore.user) {
        goto("/auth/login?redirectTo=/admin/e2e-testing");
        return;
      }

      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        goto('/dashboard');
        return;
      }
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      goto('/dashboard');
    } finally {
      loading = false;
    }
  });

  async function runE2ETests() {
    if (testing) return;

    testing = true;
    testResults = [];

    try {
      const response = await fetch('/api/admin/e2e-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ suite: selectedSuite })
      });

      const result = await response.json();

      if (response.ok) {
        testResults = result.results || [];
        
        const passedTests = testResults.filter(r => r.status === 'passed').length;
        const totalTests = testResults.length;

        notifications.add({
          type: passedTests === totalTests ? 'success' : 'warning',
          message: `E2E tests completed: ${passedTests}/${totalTests} passed`,
          timeout: 5000
        });
      } else {
        notifications.add({
          type: 'error',
          message: `Failed to run E2E tests: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Error running E2E tests:', error);
      notifications.add({
        type: 'error',
        message: 'Error running E2E tests',
        timeout: 5000
      });
    } finally {
      testing = false;
    }
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
</script>

<svelte:head>
  <title>E2E Testing - Admin Panel</title>
</svelte:head>

{#if loading}
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
    <p class="text-gray-400">Loading E2E testing...</p>
  </div>
{:else if !isAdmin}
  <div class="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30 text-center">
    <h2 class="text-xl font-bold text-white mb-2">Access Denied</h2>
    <p class="text-gray-300">Admin privileges required to access E2E testing.</p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-white">End-to-End Testing</h1>
        <p class="text-gray-400 mt-1">Run automated browser tests for complete user flows</p>
      </div>
      <a href="/admin" class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
        ← Back to Admin
      </a>
    </div>

    <!-- Test Suite Selection -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Select Test Suite</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {#each testSuites as suite}
          <label class="flex items-start space-x-3 bg-white/5 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors border border-white/10">
            <input
              type="radio"
              bind:group={selectedSuite}
              value={suite.id}
              class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 focus:ring-yellow-500 mt-1"
            />
            <div class="flex-1">
              <div class="text-white font-medium">{suite.name}</div>
              <div class="text-gray-400 text-sm">{suite.description}</div>
            </div>
          </label>
        {/each}
      </div>

      <!-- Run Tests Button -->
      <div class="flex items-center space-x-4">
        <button
          on:click="{runE2ETests}"
          disabled={testing}
          class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
        >
          {#if testing}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Running Tests...
          {:else}
            🔬 Run E2E Tests
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
            <div class="text-2xl mb-1">⏱️</div>
            <div class="text-white font-bold text-xl">{Math.round(testResults.reduce((sum, r) => sum + r.duration, 0) / 1000)}s</div>
            <div class="text-gray-400 text-sm">Duration</div>
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
                  <div class="text-gray-400 text-xs">{Math.round(result.duration / 1000)}s</div>
                </div>
              </div>
              
              {#if result.steps && result.steps.length > 0}
                <div class="mt-3">
                  <div class="text-gray-300 text-sm font-medium mb-2">Test Steps:</div>
                  <div class="space-y-1">
                    {#each result.steps as step}
                      <div class="flex items-center space-x-2 text-sm">
                        <span class="text-{step.status === 'passed' ? 'green' : step.status === 'failed' ? 'red' : 'yellow'}-400">
                          {getStatusIcon(step.status)}
                        </span>
                        <span class="text-gray-300">{step.description}</span>
                        <span class="text-gray-500">({step.duration}ms)</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              {#if result.error}
                <div class="text-red-300 text-sm mt-2 bg-red-500/10 rounded p-2">
                  <strong>Error:</strong> {result.error}
                </div>
              {/if}

              {#if result.screenshot}
                <div class="mt-2">
                  <a href="{result.screenshot}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm">
                    📸 View Screenshot
                  </a>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Testing Information -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Testing Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-semibold text-white mb-3">Test Environment</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Browser:</span>
              <span class="text-white">Chrome Headless</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Viewport:</span>
              <span class="text-white">1920x1080</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Base URL:</span>
              <span class="text-white">https://geargrab.co</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Timeout:</span>
              <span class="text-white">30 seconds</span>
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white mb-3">Test Coverage</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">User Flows:</span>
              <span class="text-white">15 scenarios</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Page Coverage:</span>
              <span class="text-white">25 pages</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">API Endpoints:</span>
              <span class="text-white">12 tested</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Mobile Tests:</span>
              <span class="text-white">8 scenarios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
