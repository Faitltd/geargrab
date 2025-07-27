<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { getStripe, formatAmount, confirmPaymentWithCard, handleStripeError } from '../../stripe/client.js';
  import { base44 } from '../../../api/base44Client.js';
  
  export let rental = null;
  export let clientSecret = null;
  export let amount = 0;
  export let disabled = false;
  
  const dispatch = createEventDispatcher();
  
  let stripe = null;
  let elements = null;
  let cardElement = null;
  let loading = false;
  let error = null;
  let processing = false;
  
  // Billing details
  let billingDetails = {
    name: '',
    email: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  };
  
  onMount(async () => {
    try {
      stripe = await getStripe();
      
      // Create elements instance
      elements = stripe.elements({
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#10b981', // Green theme
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px'
          }
        }
      });
      
      // Create card element
      cardElement = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#1f2937',
            '::placeholder': {
              color: '#9ca3af',
            },
          },
          invalid: {
            color: '#ef4444',
            iconColor: '#ef4444'
          }
        }
      });
      
      // Mount card element
      cardElement.mount('#card-element');
      
      // Listen for changes
      cardElement.on('change', ({ error }) => {
        if (error) {
          setError(error.message);
        } else {
          setError(null);
        }
      });
      
    } catch (err) {
      console.error('Failed to initialize Stripe:', err);
      setError('Failed to load payment form. Please refresh the page.');
    }
  });
  
  function setError(message) {
    error = message;
    dispatch('error', { error: message });
  }
  
  async function handleSubmit() {
    if (!stripe || !cardElement || !clientSecret) {
      setError('Payment form not ready. Please try again.');
      return;
    }
    
    if (!billingDetails.name || !billingDetails.email) {
      setError('Please fill in all required billing details.');
      return;
    }
    
    processing = true;
    setError(null);
    
    try {
      // Confirm payment
      const paymentIntent = await confirmPaymentWithCard(
        stripe,
        clientSecret,
        cardElement,
        billingDetails
      );
      
      if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        await base44.entities.Payment.create({
          payment_intent_id: paymentIntent.id
        });
        
        dispatch('success', {
          paymentIntent,
          rental
        });
      } else {
        setError('Payment was not completed. Please try again.');
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      processing = false;
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-6">Payment Details</h3>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div class="ml-3">
          <p class="text-sm text-red-800">{error}</p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Payment Summary -->
  {#if rental && amount}
    <div class="bg-gray-50 rounded-lg p-4 mb-6">
      <h4 class="font-medium text-gray-900 mb-2">Rental Summary</h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Item:</span>
          <span class="font-medium">{rental.gear_title}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Duration:</span>
          <span>{rental.total_days} days</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Daily Rate:</span>
          <span>{formatAmount(rental.daily_rate * 100)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Subtotal:</span>
          <span>{formatAmount(rental.subtotal * 100)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Service Fee:</span>
          <span>{formatAmount(rental.service_fee * 100)}</span>
        </div>
        <div class="border-t pt-2 flex justify-between font-semibold">
          <span>Total:</span>
          <span>{formatAmount(amount)}</span>
        </div>
      </div>
    </div>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Billing Details -->
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900">Billing Information</h4>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="name"
            bind:value={billingDetails.name}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            bind:value={billingDetails.email}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="john@example.com"
          />
        </div>
      </div>
      
      <div>
        <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
        <input
          type="text"
          id="address"
          bind:value={billingDetails.address.line1}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="123 Main St"
        />
      </div>
      
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label for="city" class="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            id="city"
            bind:value={billingDetails.address.city}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Denver"
          />
        </div>
        
        <div>
          <label for="state" class="block text-sm font-medium text-gray-700">State</label>
          <input
            type="text"
            id="state"
            bind:value={billingDetails.address.state}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="CO"
          />
        </div>
        
        <div>
          <label for="zip" class="block text-sm font-medium text-gray-700">ZIP Code</label>
          <input
            type="text"
            id="zip"
            bind:value={billingDetails.address.postal_code}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="80202"
          />
        </div>
      </div>
    </div>
    
    <!-- Card Element -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Card Information</label>
      <div id="card-element" class="p-3 border border-gray-300 rounded-md bg-white">
        <!-- Stripe Elements will create form elements here -->
      </div>
    </div>
    
    <!-- Submit Button -->
    <button
      type="submit"
      disabled={disabled || processing || !clientSecret}
      class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if processing}
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing Payment...
      {:else}
        Pay {amount ? formatAmount(amount) : ''}
      {/if}
    </button>
  </form>
  
  <!-- Security Notice -->
  <div class="mt-4 flex items-center text-sm text-gray-500">
    <svg class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
    </svg>
    Your payment information is secure and encrypted.
  </div>
</div>
