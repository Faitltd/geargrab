<script>
  import { onMount } from 'svelte';

  let amount = 60; // $60 test amount
  let currency = 'usd';
  let loading = false;
  let result = null;
  let error = null;

  async function testPaymentIntent() {
    loading = true;
    error = null;
    result = null;

    try {
      console.log('🧪 Testing payment intent creation...');
      
      const response = await fetch('/api/payments/test-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency,
          metadata: {
            test: 'true',
            source: 'test-page'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      result = data;
      console.log('✅ Test payment intent result:', data);

    } catch (err) {
      console.error('❌ Test payment intent error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function testOriginalEndpoint() {
    loading = true;
    error = null;
    result = null;

    try {
      console.log('🧪 Testing original payment intent endpoint...');
      
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency,
          metadata: {
            test: 'true',
            source: 'test-page-original'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      result = data;
      console.log('✅ Original payment intent result:', data);

    } catch (err) {
      console.error('❌ Original payment intent error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Payment Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 py-12">
  <div class="max-w-4xl mx-auto px-4">
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
      <h1 class="text-3xl font-bold text-white mb-8">Payment Intent Test</h1>
      
      <div class="space-y-6">
        <!-- Test Configuration -->
        <div class="bg-white/5 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">Test Configuration</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
              <input 
                type="number" 
                bind:value={amount}
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                min="1"
                step="0.01"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Currency</label>
              <select 
                bind:value={currency}
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="usd">USD</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Test Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            on:click={testPaymentIntent}
            disabled={loading}
            class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {#if loading}
              Testing New Endpoint...
            {:else}
              Test New Endpoint (/test-intent)
            {/if}
          </button>

          <button
            on:click={testOriginalEndpoint}
            disabled={loading}
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {#if loading}
              Testing Original Endpoint...
            {:else}
              Test Original Endpoint (/create-intent)
            {/if}
          </button>
        </div>

        <!-- Results -->
        {#if error}
          <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-red-200 mb-2">Error</h3>
            <p class="text-red-200">{error}</p>
          </div>
        {/if}

        {#if result}
          <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-green-200 mb-2">Success</h3>
            <pre class="text-green-200 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        {/if}

        <!-- Instructions -->
        <div class="bg-white/5 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <div class="text-gray-300 space-y-2">
            <p>• <strong>New Endpoint</strong>: Tests the /api/payments/test-intent endpoint with no authentication</p>
            <p>• <strong>Original Endpoint</strong>: Tests the /api/payments/create-intent endpoint (may have auth issues)</p>
            <p>• Both endpoints should create payment intents, but the new one bypasses all authentication</p>
            <p>• Check the browser console for detailed logs</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom scrollbar for pre elements */
  pre::-webkit-scrollbar {
    height: 8px;
  }
  
  pre::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  pre::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  
  pre::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style>
