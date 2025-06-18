<script lang="ts">
  import StripePaymentForm from '$lib/components/payments/stripe-payment-form.svelte';
  import { page } from '$app/stores';
  
  // Get parameters from URL
  $: amount = parseFloat($page.url.searchParams.get('amount') || '1.00');
  $: currency = $page.url.searchParams.get('currency') || 'usd';
  $: title = $page.url.searchParams.get('title') || 'Test Payment';
  
  let paymentSuccess = false;
  let paymentError = '';
  
  function handlePaymentSuccess(event: CustomEvent) {
    paymentSuccess = true;
    console.log('Payment successful:', event.detail);
  }
  
  function handlePaymentError(event: CustomEvent) {
    paymentError = event.detail.error;
    console.error('Payment failed:', event.detail);
  }
</script>

<svelte:head>
  <title>Test Payment - GearGrab</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900">
  <div class="container mx-auto px-4 py-8">
    
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-4">🧪 Test Payment Form</h1>
      <p class="text-gray-300 text-lg">Testing Stripe integration with card input fields</p>
    </div>

    <!-- Test Info -->
    <div class="max-w-2xl mx-auto mb-8">
      <div class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <h2 class="text-lg font-semibold text-blue-200 mb-2">🔧 Test Mode Enabled</h2>
        <div class="text-blue-100 space-y-1">
          <p><strong>Amount:</strong> ${amount.toFixed(2)} {currency.toUpperCase()}</p>
          <p><strong>Title:</strong> {title}</p>
          <p><strong>Authentication:</strong> Bypassed for testing</p>
        </div>
      </div>
    </div>

    <!-- Payment Form -->
    {#if !paymentSuccess}
      <div class="max-w-2xl mx-auto">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
          <h2 class="text-2xl font-semibold text-white mb-4">{title}</h2>
          <p class="text-gray-300 mb-6">Amount: <span class="text-green-400 font-bold">${amount.toFixed(2)} {currency.toUpperCase()}</span></p>
          
          <StripePaymentForm 
            {amount}
            {currency}
            metadata={{ test: 'true', title }}
            testMode={true}
            on:success={handlePaymentSuccess}
            on:error={handlePaymentError}
          />
        </div>

        <!-- Error Display -->
        {#if paymentError}
          <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <h3 class="text-red-200 font-semibold mb-2">Payment Error</h3>
            <p class="text-red-100">{paymentError}</p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Success Message -->
      <div class="max-w-2xl mx-auto">
        <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center">
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-2xl font-semibold text-green-200 mb-2">Payment Successful!</h2>
          <p class="text-green-100 mb-4">Your test payment has been processed successfully.</p>
          <button 
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            on:click={() => { paymentSuccess = false; paymentError = ''; }}
          >
            Test Another Payment
          </button>
        </div>
      </div>
    {/if}

    <!-- Test Instructions -->
    <div class="max-w-2xl mx-auto mt-8">
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">🧪 Test Card Numbers</h3>
        <div class="space-y-2 text-gray-300">
          <p><strong>Success:</strong> <code class="bg-gray-800 px-2 py-1 rounded">4242 4242 4242 4242</code></p>
          <p><strong>Decline:</strong> <code class="bg-gray-800 px-2 py-1 rounded">4000 0000 0000 0002</code></p>
          <p><strong>3D Secure:</strong> <code class="bg-gray-800 px-2 py-1 rounded">4000 0025 0000 3155</code></p>
          <p class="text-sm text-gray-400 mt-4">
            Use any future expiry date (e.g., 12/25) and any 3-digit CVC.
          </p>
        </div>
      </div>
    </div>

    <!-- Back Link -->
    <div class="text-center mt-8">
      <a href="/" class="text-green-400 hover:text-green-300 transition-colors">
        ← Back to Home
      </a>
    </div>

  </div>
</main>
