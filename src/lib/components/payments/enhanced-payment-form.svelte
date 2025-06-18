<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { initializeStripe, createPaymentIntent } from '$lib/services/payments';
  import { authStore } from '$lib/stores/auth';
  import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

  export let amount: number;
  export let currency: string = 'usd';
  export let metadata: Record<string, string> = {};
  export let disabled: boolean = false;
  export let requireEmail: boolean = true;

  const dispatch = createEventDispatcher();

  let stripe: Stripe | null = null;
  let elements: StripeElements | null = null;
  let paymentElement: StripePaymentElement | null = null;
  let clientSecret: string = '';
  let processing: boolean = false;
  let error: string = '';
  let emailError: string = '';
  let paymentReady: boolean = false;
  let guestEmail: string = '';
  let showEmailInput: boolean = false;
  
  // Payment form container
  let paymentElementContainer: HTMLElement;

  // Reactive values
  $: isAuthenticated = !!$authStore.user;
  $: showEmailInput = !isAuthenticated && requireEmail;
  $: canProceed = isAuthenticated || (guestEmail && validateEmail(guestEmail));

  // Validate email format
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Handle email input
  function handleEmailInput() {
    emailError = '';
    if (guestEmail && !validateEmail(guestEmail)) {
      emailError = 'Please enter a valid email address';
    }
  }

  // Initialize payment form
  async function initializePayment() {
    try {
      error = '';
      emailError = '';
      console.log('🚀 Initializing enhanced payment form...');

      // Validate email for guest users
      if (!isAuthenticated && requireEmail) {
        if (!guestEmail) {
          emailError = 'Email address is required';
          return;
        }
        if (!validateEmail(guestEmail)) {
          emailError = 'Please enter a valid email address';
          return;
        }
      }

      // Initialize Stripe
      stripe = await initializeStripe();
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      // Create payment intent
      const { clientSecret: secret, paymentIntentId } = await createPaymentIntent(
        amount,
        currency,
        metadata
      );
      
      clientSecret = secret;
      console.log('✅ Payment intent created:', paymentIntentId);

      // Create Stripe elements
      elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#10b981',
            colorBackground: 'rgba(255, 255, 255, 0.1)',
            colorText: '#ffffff',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          }
        }
      });

      // Create and mount payment element
      paymentElement = elements.create('payment');
      paymentElement.mount(paymentElementContainer);

      // Listen for changes
      paymentElement.on('change', (event: any) => {
        if (event.error) {
          error = event.error.message;
          paymentReady = false;
        } else {
          error = '';
          paymentReady = event.complete;
        }
      });

      paymentElement.on('ready', () => {
        paymentReady = true;
        console.log('✅ Payment element ready');
      });

    } catch (err: unknown) {
      console.error('❌ Error initializing payment:', err);
      error = (err as Error).message || 'Failed to initialize payment form';
    }
  }

  // Handle payment submission
  async function handleSubmit() {
    if (!canProceed) {
      if (!isAuthenticated && !guestEmail) {
        emailError = 'Email address is required';
      }
      return;
    }

    processing = true;
    error = '';

    try {
      // Stripe payment
      if (!stripe || !elements) {
        throw new Error('Payment system not initialized');
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required'
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        dispatch('success', {
          paymentIntent,
          paymentIntentId: paymentIntent.id,
          userEmail: guestEmail || $authStore.user?.email
        });
      } else {
        throw new Error('Payment was not successful');
      }

    } catch (err: any) {
      console.error('❌ Payment error:', err);
      error = err.message || 'Payment failed. Please try again.';
      dispatch('error', { error: err.message });
    } finally {
      processing = false;
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  onMount(() => {
    // Auto-initialize if user is authenticated
    if (isAuthenticated) {
      initializePayment();
    }
  });
</script>

<div class="enhanced-payment-form">
  <!-- Payment Amount Display -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 mb-6">
    <div class="flex justify-between items-center">
      <span class="text-gray-300">Total Amount:</span>
      <span class="text-2xl font-bold text-white">{formatCurrency(amount)}</span>
    </div>
  </div>

  <!-- User Status Display -->
  <div class="mb-6">
    {#if isAuthenticated}
      <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
        <p class="text-green-200 text-sm">
          ✅ Signed in as {$authStore.user?.email}
        </p>
      </div>
    {:else}
      <div class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
        <p class="text-blue-200 text-sm">
          👤 Checking out as guest
        </p>
      </div>
    {/if}
  </div>

  <!-- Guest Email Input -->
  {#if showEmailInput}
    <div class="mb-6">
      <label for="guest-email" class="block text-sm font-medium text-gray-300 mb-2">
        Email Address *
      </label>
      <input
        id="guest-email"
        type="email"
        bind:value={guestEmail}
        on:input={handleEmailInput}
        placeholder="your@email.com"
        class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        required
      />
      {#if emailError}
        <p class="text-red-400 text-sm mt-1">{emailError}</p>
      {/if}
      <p class="text-gray-400 text-xs mt-1">
        We'll send your receipt and order updates to this email
      </p>
    </div>

    <!-- Initialize Payment Button for Guests -->
    {#if !clientSecret && canProceed}
      <div class="mb-6">
        <button
          type="button"
          on:click={initializePayment}
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Continue to Payment
        </button>
      </div>
    {/if}
  {/if}

  <!-- Payment Form -->
  {#if clientSecret}
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h3 class="text-lg font-semibold text-white mb-4">Payment Information</h3>

      <!-- Stripe Payment Element Container -->
      <div bind:this={paymentElementContainer} class="mb-6">
        <!-- Stripe Elements will be mounted here -->
      </div>

      <!-- Error Display -->
      {#if error}
        <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
          <p class="text-red-200 text-sm">{error}</p>
        </div>
      {/if}
      
      <!-- Submit Button -->
      <button
        type="button"
        on:click={handleSubmit}
        disabled={disabled || processing || !paymentReady || !canProceed}
        class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        {#if processing}
          <div class="flex items-center justify-center">
            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Processing Payment...
          </div>
        {:else}
          Pay {formatCurrency(amount)}
        {/if}
      </button>
      
      <!-- Security Notice -->
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-400">
          🔒 Your payment information is secure and encrypted
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Powered by Stripe
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  .enhanced-payment-form {
    max-width: 500px;
    margin: 0 auto;
  }
</style>
