<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { initializeStripe, createPaymentIntent, confirmPayment } from '$lib/services/payments';
  
  export let amount: number;
  export let currency: string = 'usd';
  export let metadata: Record<string, string> = {};
  export let disabled: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let stripe: any = null;
  let elements: any = null;
  let cardElement: any = null;
  let paymentElement: any = null;
  let clientSecret: string = '';
  let processing: boolean = false;
  let error: string = '';
  let paymentReady: boolean = false;
  
  // Payment form container
  let paymentElementContainer: HTMLElement;
  
  onMount(async () => {
    try {
      // Initialize Stripe
      stripe = await initializeStripe();
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }
      
      // Create payment intent
      const { clientSecret: secret } = await createPaymentIntent(amount, currency, metadata);
      clientSecret = secret;
      
      // Create elements
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
          },
          rules: {
            '.Input': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            },
            '.Input:focus': {
              border: '2px solid #10b981',
              boxShadow: '0 0 0 1px #10b981',
            },
            '.Label': {
              color: '#d1d5db',
              fontWeight: '500',
            }
          }
        }
      });
      
      // Create payment element
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
      });
      
    } catch (err) {
      console.error('Error setting up payment:', err);
      error = 'Failed to initialize payment form';
    }
  });
  
  async function handleSubmit() {
    if (!stripe || !elements || processing) return;
    
    processing = true;
    error = '';
    
    try {
      // Confirm payment
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
          paymentIntentId: paymentIntent.id
        });
      } else {
        throw new Error('Payment was not successful');
      }
      
    } catch (err) {
      console.error('Payment error:', err);
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
</script>

<div class="payment-form">
  <!-- Payment Amount Display -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 mb-6">
    <div class="flex justify-between items-center">
      <span class="text-gray-300">Total Amount:</span>
      <span class="text-2xl font-bold text-white">{formatCurrency(amount)}</span>
    </div>
  </div>
  
  <!-- Payment Form -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <h3 class="text-lg font-semibold text-white mb-4">Payment Information</h3>
    
    <!-- Stripe Payment Element Container -->
    <div bind:this={paymentElementContainer} class="mb-6"></div>
    
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
      disabled={disabled || processing || !paymentReady || !clientSecret}
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
</div>

<style>
  .payment-form {
    max-width: 500px;
  }
</style>
