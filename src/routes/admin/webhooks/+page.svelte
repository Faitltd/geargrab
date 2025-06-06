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

  // Test webhook form data
  let webhookTest = {
    eventType: 'payment_intent.succeeded',
    paymentIntentId: '',
    metadata: {
      service: 'booking',
      userId: '',
      bookingId: '',
      amount: 5000
    }
  };

  onMount(async () => {
    try {
      if (!$authStore.user) {
        goto('/auth/login?redirectTo=/admin/webhooks');
        return;
      }

      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        goto('/dashboard');
        return;
      }

      // Set default values
      webhookTest.paymentIntentId = `pi_test_${Math.random().toString(36).substring(2, 15)}`;
      webhookTest.metadata.userId = $authStore.user.uid;
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      goto('/dashboard');
    } finally {
      loading = false;
    }
  });

  async function testStripeWebhook() {
    if (testing) return;

    testing = true;
    try {
      const response = await fetch('/api/webhooks/stripe/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookTest)
      });

      const result = await response.json();

      if (response.ok) {
        testResults = [
          {
            timestamp: new Date().toISOString(),
            eventType: webhookTest.eventType,
            paymentIntentId: webhookTest.paymentIntentId,
            status: 'success',
            message: result.message,
            eventId: result.eventId
          },
          ...testResults
        ];

        notifications.add({
          type: 'success',
          message: 'Webhook test completed successfully',
          timeout: 5000
        });

        // Generate new payment intent ID for next test
        webhookTest.paymentIntentId = `pi_test_${Math.random().toString(36).substring(2, 15)}`;
      } else {
        testResults = [
          {
            timestamp: new Date().toISOString(),
            eventType: webhookTest.eventType,
            paymentIntentId: webhookTest.paymentIntentId,
            status: 'error',
            message: result.error
          },
          ...testResults
        ];

        notifications.add({
          type: 'error',
          message: `Webhook test failed: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to send webhook test',
        timeout: 5000
      });
    } finally {
      testing = false;
    }
  }

  function clearResults() {
    testResults = [];
  }

  function generateNewPaymentIntent() {
    webhookTest.paymentIntentId = `pi_test_${Math.random().toString(36).substring(2, 15)}`;
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
  <title>Webhook Testing | Admin | GearGrab</title>
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
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Webhook Testing</h1>
        <p class="text-gray-300">Test Stripe webhook integration and payment processing</p>
      </div>

      <!-- Webhook Test Form -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <h2 class="text-xl font-bold text-white mb-4">Test Stripe Webhook</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Event Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
            <select
              bind:value={webhookTest.eventType}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="payment_intent.succeeded">Payment Succeeded</option>
              <option value="payment_intent.payment_failed">Payment Failed</option>
              <option value="payment_intent.canceled">Payment Canceled</option>
              <option value="payment_intent.requires_action">Payment Requires Action</option>
            </select>
          </div>

          <!-- Payment Intent ID -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Payment Intent ID</label>
            <div class="flex space-x-2">
              <input
                type="text"
                bind:value={webhookTest.paymentIntentId}
                class="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="pi_test_..."
              />
              <button
                on:click={generateNewPaymentIntent}
                class="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                title="Generate new ID"
              >
                🔄
              </button>
            </div>
          </div>

          <!-- Service Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Service Type</label>
            <select
              bind:value={webhookTest.metadata.service}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="booking">Booking Payment</option>
              <option value="background_check">Background Check</option>
              <option value="verification">Verification</option>
            </select>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Amount (cents)</label>
            <input
              type="number"
              bind:value={webhookTest.metadata.amount}
              min="50"
              step="1"
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="5000"
            />
          </div>

          <!-- User ID -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">User ID</label>
            <input
              type="text"
              bind:value={webhookTest.metadata.userId}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="User ID"
            />
          </div>

          <!-- Booking ID (optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Booking ID (optional)</label>
            <input
              type="text"
              bind:value={webhookTest.metadata.bookingId}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="booking_123"
            />
          </div>
        </div>

        <!-- Test Button -->
        <div class="mt-6 flex items-center space-x-4">
          <button
            on:click={testStripeWebhook}
            disabled={testing || !webhookTest.paymentIntentId || !webhookTest.metadata.userId}
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
          >
            {#if testing}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Testing...
            {:else}
              🧪 Test Webhook
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
                    <span class="text-white font-medium">{result.eventType}</span>
                  </div>
                  <span class="text-gray-400 text-sm">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-400">Payment Intent:</span>
                    <span class="text-white ml-2 font-mono">{result.paymentIntentId}</span>
                  </div>
                  {#if result.eventId}
                    <div>
                      <span class="text-gray-400">Event ID:</span>
                      <span class="text-white ml-2 font-mono">{result.eventId}</span>
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

      <!-- Webhook Information -->
      <div class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-bold text-white mb-4">Webhook Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold text-white mb-2">Supported Events</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• payment_intent.succeeded</li>
              <li>• payment_intent.payment_failed</li>
              <li>• payment_intent.canceled</li>
              <li>• payment_intent.requires_action</li>
              <li>• charge.dispute.created</li>
              <li>• invoice.payment_succeeded</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-semibold text-white mb-2">Webhook Endpoints</h3>
            <div class="text-gray-300 text-sm space-y-1">
              <div>
                <span class="text-gray-400">Production:</span>
                <code class="text-green-400 ml-2">/api/webhooks/stripe</code>
              </div>
              <div>
                <span class="text-gray-400">Test:</span>
                <code class="text-green-400 ml-2">/api/webhooks/stripe/test</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
