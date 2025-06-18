<script lang="ts">
  import StripePaymentForm from '$lib/components/payments/stripe-payment-form.svelte';
  import { onMount } from 'svelte';

  let testAmount = 10; // $10 test payment
  let paymentStatus = '';
  let paymentResult = null;

  function handlePaymentSuccess(event) {
    console.log('Payment successful:', event.detail);
    paymentStatus = 'success';
    paymentResult = event.detail;
  }

  function handlePaymentError(event) {
    console.error('Payment failed:', event.detail);
    paymentStatus = 'error';
    paymentResult = event.detail;
  }

  async function testDirectAPI() {
    try {
      console.log('Testing direct API call...');
      const response = await fetch('/api/payments/test-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1000, // $10 in cents
          currency: 'usd',
          metadata: {
            test: 'direct_api_call'
          }
        }),
      });

      const result = await response.json();
      console.log('Direct API result:', result);
      
      if (response.ok) {
        paymentStatus = 'api_success';
        paymentResult = result;
      } else {
        paymentStatus = 'api_error';
        paymentResult = result;
      }
    } catch (error) {
      console.error('Direct API error:', error);
      paymentStatus = 'api_error';
      paymentResult = { error: error.message };
    }
  }

  async function testPingEndpoint() {
    try {
      console.log('Testing ping endpoint...');
      const response = await fetch('/api/test/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: 'ping_test'
        }),
      });

      const result = await response.json();
      console.log('Ping result:', result);
      
      if (response.ok) {
        paymentStatus = 'ping_success';
        paymentResult = result;
      } else {
        paymentStatus = 'ping_error';
        paymentResult = result;
      }
    } catch (error) {
      console.error('Ping error:', error);
      paymentStatus = 'ping_error';
      paymentResult = { error: error.message };
    }
  }
</script>

<svelte:head>
  <title>Payment Debug Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-white mb-8">Payment System Debug Test</h1>
    
    <!-- Test Buttons -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">API Tests</h2>
      <div class="flex gap-4 mb-4">
        <button
          on:click={testPingEndpoint}
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Ping Endpoint
        </button>
        <button
          on:click={testDirectAPI}
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Payment API Directly
        </button>
      </div>
      
      {#if paymentStatus}
        <div class="mt-4 p-4 rounded-lg {paymentStatus.includes('success') ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}">
          <h3 class="font-semibold text-white mb-2">Status: {paymentStatus}</h3>
          <pre class="text-sm text-gray-300 overflow-auto">{JSON.stringify(paymentResult, null, 2)}</pre>
        </div>
      {/if}
    </div>

    <!-- Payment Form Test -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Stripe Payment Form Test</h2>
      
      <div class="mb-4">
        <label class="block text-gray-300 text-sm font-bold mb-2">
          Test Amount (USD):
        </label>
        <input
          type="number"
          bind:value={testAmount}
          min="1"
          max="100"
          class="bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
        />
      </div>

      <StripePaymentForm
        amount={testAmount}
        currency="usd"
        metadata={{ test: 'payment_form_test' }}
        on:success={handlePaymentSuccess}
        on:error={handlePaymentError}
      />
    </div>

    <!-- Debug Information -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mt-8">
      <h2 class="text-xl font-semibold text-white mb-4">Debug Information</h2>
      <div class="text-gray-300 text-sm space-y-2">
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
        <p><strong>Stripe Key:</strong> {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Missing'}</p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Additional styles for better visibility */
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
</style>