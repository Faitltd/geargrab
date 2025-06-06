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

  // Test background check form data
  let backgroundCheckTest = {
    checkType: 'standard',
    provider: 'checkr',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      dateOfBirth: '1990-01-01',
      ssn: '123-45-6789',
      address: {
        street: '123 Main St',
        city: 'Salt Lake City',
        state: 'UT',
        zipCode: '84101',
        country: 'US'
      }
    }
  };

  onMount(async () => {
    try {
      if (!$authStore.user) {
        goto('/auth/login?redirectTo=/admin/background-checks/test');
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

  async function testBackgroundCheck() {
    if (testing) return;

    testing = true;
    try {
      const response = await fetch('/api/background-check/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backgroundCheckTest)
      });

      const result = await response.json();

      if (response.ok) {
        testResults = [
          {
            timestamp: new Date().toISOString(),
            checkType: backgroundCheckTest.checkType,
            provider: backgroundCheckTest.provider,
            status: 'success',
            message: result.message,
            externalId: result.externalId,
            requestId: result.requestId
          },
          ...testResults
        ];

        notifications.add({
          type: 'success',
          message: 'Background check test completed successfully',
          timeout: 5000
        });
      } else {
        testResults = [
          {
            timestamp: new Date().toISOString(),
            checkType: backgroundCheckTest.checkType,
            provider: backgroundCheckTest.provider,
            status: 'error',
            message: result.error
          },
          ...testResults
        ];

        notifications.add({
          type: 'error',
          message: `Background check test failed: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Background check test error:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to send background check test',
        timeout: 5000
      });
    } finally {
      testing = false;
    }
  }

  function clearResults() {
    testResults = [];
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }
</script>

<svelte:head>
  <title>Background Check Testing | Admin | GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 pt-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    {#if loading}
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    {:else}
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Background Check Testing</h1>
        <p class="text-gray-300">Test background check provider integrations and API connections</p>
      </div>

      <!-- Background Check Test Form -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <h2 class="text-xl font-bold text-white mb-4">Test Background Check API</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Check Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Check Type</label>
            <select
              bind:value={backgroundCheckTest.checkType}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="basic">Basic ($19.99)</option>
              <option value="standard">Standard ($29.99)</option>
              <option value="comprehensive">Comprehensive ($49.99)</option>
            </select>
          </div>

          <!-- Provider -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Provider</label>
            <select
              bind:value={backgroundCheckTest.provider}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="checkr">Checkr</option>
              <option value="sterling">Sterling</option>
              <option value="mock">Mock (Development)</option>
            </select>
          </div>

          <!-- First Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">First Name</label>
            <input
              type="text"
              bind:value={backgroundCheckTest.personalInfo.firstName}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="John"
            />
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
            <input
              type="text"
              bind:value={backgroundCheckTest.personalInfo.lastName}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Doe"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              bind:value={backgroundCheckTest.personalInfo.email}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="john.doe@example.com"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              bind:value={backgroundCheckTest.personalInfo.phone}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="555-123-4567"
            />
          </div>

          <!-- Date of Birth -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
            <input
              type="date"
              bind:value={backgroundCheckTest.personalInfo.dateOfBirth}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <!-- SSN -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">SSN (Test)</label>
            <input
              type="text"
              bind:value={backgroundCheckTest.personalInfo.ssn}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="123-45-6789"
            />
          </div>

          <!-- City -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">City</label>
            <input
              type="text"
              bind:value={backgroundCheckTest.personalInfo.address.city}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Salt Lake City"
            />
          </div>

          <!-- State -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">State</label>
            <input
              type="text"
              bind:value={backgroundCheckTest.personalInfo.address.state}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="UT"
            />
          </div>

          <!-- ZIP Code -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">ZIP Code</label>
            <input
              type="text"
              bind:value={backgroundCheckTest.personalInfo.address.zipCode}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="84101"
            />
          </div>
        </div>

        <!-- Test Button -->
        <div class="mt-6 flex items-center space-x-4">
          <button
            on:click={testBackgroundCheck}
            disabled={testing}
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
          >
            {#if testing}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Testing...
            {:else}
              🔍 Test Background Check
            {/if}
          </button>

          {#if testResults.length > 0}
            <button
              on:click={clearResults}
              class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Clear Results
            </button>
          {/if}
        </div>
      </div>

      <!-- Test Results -->
      {#if testResults.length > 0}
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h2 class="text-xl font-bold text-white mb-4">Test Results</h2>
          
          <div class="space-y-4">
            {#each testResults as result}
              <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-3">
                    <span class="px-2 py-1 rounded-full text-xs border {getStatusBadgeClass(result.status)}">
                      {result.status.toUpperCase()}
                    </span>
                    <span class="text-white font-medium">{result.provider} - {result.checkType}</span>
                  </div>
                  <span class="text-gray-400 text-sm">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {#if result.externalId}
                    <div>
                      <span class="text-gray-400">External ID:</span>
                      <span class="text-white ml-2 font-mono">{result.externalId}</span>
                    </div>
                  {/if}
                  {#if result.requestId}
                    <div>
                      <span class="text-gray-400">Request ID:</span>
                      <span class="text-white ml-2 font-mono">{result.requestId}</span>
                    </div>
                  {/if}
                </div>
                
                <div class="mt-2">
                  <span class="text-gray-400">Message:</span>
                  <span class="text-white ml-2">{result.message}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Provider Information -->
      <div class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-bold text-white mb-4">Provider Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="font-semibold text-white mb-2">Checkr</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Industry leader</li>
              <li>• Fast turnaround</li>
              <li>• Comprehensive reports</li>
              <li>• Real-time webhooks</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-semibold text-white mb-2">Sterling</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Enterprise grade</li>
              <li>• Global coverage</li>
              <li>• Detailed reporting</li>
              <li>• Compliance focused</li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold text-white mb-2">Mock Provider</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Development only</li>
              <li>• Instant results</li>
              <li>• No real checks</li>
              <li>• Testing purposes</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
