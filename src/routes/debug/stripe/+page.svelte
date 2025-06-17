<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { initializeStripe } from '$lib/services/payments';

  let stripeStatus = 'Checking...';
  let stripeKey = '';
  let authStatus = 'Checking...';
  let testResults: string[] = [];

  // Get auth state from simple auth system
  $: authState = simpleAuth.authState;

  onMount(async () => {
    // Check authentication status
    if ($authState.user) {
      authStatus = `✅ Authenticated as: ${$authState.user.email}`;
    } else {
      authStatus = '❌ Not authenticated';
    }

    // Check Stripe initialization
    try {
      const stripe = await initializeStripe();
      if (stripe) {
        stripeStatus = '✅ Stripe initialized successfully';
        // Get the publishable key from environment
        stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'Not found';
      } else {
        stripeStatus = '❌ Stripe initialization failed';
      }
    } catch (error: any) {
      stripeStatus = `❌ Stripe error: ${error.message}`;
    }

    // Test payment intent creation (if authenticated)
    if ($authState.user) {
      try {
        testResults.push('🧪 Testing payment intent creation...');

        const token = await simpleAuth.getIdToken();
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: 1000, // $10.00
            currency: 'usd',
            metadata: { test: 'debug' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          testResults.push('✅ Payment intent created successfully');
          testResults.push(`   Client Secret: ${data.clientSecret.substring(0, 20)}...`);
        } else {
          const error = await response.text();
          testResults.push(`❌ Payment intent failed: ${response.status} ${error}`);
        }
      } catch (error: any) {
        testResults.push(`❌ Payment intent error: ${error.message}`);
      }
    } else {
      testResults.push('⚠️ Skipping payment intent test - not authenticated');
    }

    testResults = [...testResults]; // Trigger reactivity
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 py-12">
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-4">🔧 Stripe Debug Page</h1>
      <p class="text-gray-300">Testing Stripe integration and payment flow</p>
    </div>

    <div class="grid gap-6">
      <!-- Authentication Status -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Authentication Status</h2>
        <p class="text-gray-300">{authStatus}</p>
        {#if !$authState.user}
          <div class="mt-4">
            <a href="/auth/login" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              Log In to Test Payments
            </a>
          </div>
        {/if}
      </div>

      <!-- Stripe Status -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Stripe Configuration</h2>
        <div class="space-y-2">
          <p class="text-gray-300">{stripeStatus}</p>
          <p class="text-gray-300">Publishable Key: <code class="text-green-400">{stripeKey.substring(0, 20)}...</code></p>
        </div>
      </div>

      <!-- Test Results -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Test Results</h2>
        <div class="space-y-2">
          {#each testResults as result}
            <p class="text-gray-300 font-mono text-sm">{result}</p>
          {/each}
          {#if testResults.length === 0}
            <p class="text-gray-400">Running tests...</p>
          {/if}
        </div>
      </div>

      <!-- Manual Test -->
      {#if $authState.user}
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h2 class="text-xl font-semibent text-white mb-4">Manual Payment Test</h2>
          <p class="text-gray-300 mb-4">Test the actual payment form with a small amount:</p>
          <a 
            href="/payment?amount=1.00&currency=usd&title=Debug Test&listingId=debug" 
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-block"
          >
            Test $1.00 Payment Form
          </a>
        </div>
      {/if}

      <!-- Instructions -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Expected Behavior</h2>
        <div class="space-y-2 text-gray-300">
          <p>✅ <strong>Authentication:</strong> Should show your logged-in email</p>
          <p>✅ <strong>Stripe:</strong> Should initialize successfully with correct key</p>
          <p>✅ <strong>Payment Intent:</strong> Should create successfully when authenticated</p>
          <p>✅ <strong>Payment Form:</strong> Should show credit card input fields</p>
        </div>
      </div>
    </div>

    <!-- Back Link -->
    <div class="text-center mt-8">
      <a href="/" class="text-green-400 hover:text-green-300 underline">← Back to Home</a>
    </div>
  </div>
</div>
