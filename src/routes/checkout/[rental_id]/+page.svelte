<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base44 } from '../../../api/base44Client.js';
  import { user, isAuthenticated } from '../../../lib/stores/auth.js';
  import PaymentForm from '../../../lib/components/payments/PaymentForm.svelte';
  
  let rental = null;
  let paymentIntent = null;
  let loading = true;
  let error = null;
  
  const rentalId = $page.params.rental_id;
  
  onMount(async () => {
    // Check if user is authenticated
    if (!$isAuthenticated) {
      goto('/auth/login?redirect=' + encodeURIComponent($page.url.pathname));
      return;
    }
    
    await loadRental();
  });
  
  async function loadRental() {
    try {
      loading = true;
      error = null;
      
      // Get rental details
      const rentalResponse = await base44.entities.Rental.get(rentalId);
      rental = rentalResponse.rental;
      
      // Verify user is the renter
      if (rental.renter_id !== $user.id) {
        error = 'You can only pay for your own rentals';
        return;
      }
      
      // Check if rental is in correct status
      if (rental.status !== 'pending') {
        error = `Rental is ${rental.status}. Payment is only available for pending rentals.`;
        return;
      }
      
      // Create payment intent
      const paymentResponse = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          rental_id: rentalId
        })
      });
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
      
      paymentIntent = await paymentResponse.json();
      
    } catch (err) {
      console.error('Failed to load rental:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function handlePaymentSuccess(event) {
    const { paymentIntent, rental } = event.detail;
    
    // Redirect to success page
    goto(`/checkout/success?rental_id=${rental.id}&payment_intent=${paymentIntent.id}`);
  }
  
  function handlePaymentError(event) {
    error = event.detail.error;
  }
</script>

<svelte:head>
  <title>Checkout - GearGrab</title>
  <meta name="description" content="Complete your rental payment securely" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Complete Your Rental</h1>
      <p class="mt-2 text-gray-600">Secure checkout powered by Stripe</p>
    </div>
    
    {#if loading}
      <div class="flex justify-center items-center py-12">
        <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-gray-600">Loading checkout...</span>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <h3 class="mt-2 text-lg font-medium text-red-800">Checkout Error</h3>
        <p class="mt-1 text-red-600">{error}</p>
        <div class="mt-4">
          <button
            on:click={() => goto('/dashboard/rentals')}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Return to Rentals
          </button>
        </div>
      </div>
    {:else if rental && paymentIntent}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Rental Details -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Rental Details</h2>
          
          <div class="space-y-4">
            <!-- Gear Item -->
            <div class="flex items-start space-x-4">
              {#if rental.gear_images && rental.gear_images.length > 0}
                <img
                  src={rental.gear_images[0]}
                  alt={rental.gear_title}
                  class="w-20 h-20 object-cover rounded-lg"
                />
              {:else}
                <div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              {/if}
              
              <div class="flex-1">
                <h3 class="font-medium text-gray-900">{rental.gear_title}</h3>
                <p class="text-sm text-gray-600">Owner: {rental.owner_name}</p>
              </div>
            </div>
            
            <!-- Rental Period -->
            <div class="border-t pt-4">
              <h4 class="font-medium text-gray-900 mb-2">Rental Period</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Start Date:</span>
                  <p class="font-medium">{new Date(rental.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span class="text-gray-600">End Date:</span>
                  <p class="font-medium">{new Date(rental.end_date).toLocaleDateString()}</p>
                </div>
              </div>
              <p class="text-sm text-gray-600 mt-2">
                Duration: {rental.total_days} day{rental.total_days !== 1 ? 's' : ''}
              </p>
            </div>
            
            <!-- Delivery Method -->
            <div class="border-t pt-4">
              <h4 class="font-medium text-gray-900 mb-2">Delivery Method</h4>
              <p class="text-sm capitalize">{rental.delivery_method}</p>
              {#if rental.delivery_address}
                <p class="text-sm text-gray-600 mt-1">{rental.delivery_address}</p>
              {/if}
            </div>
          </div>
        </div>
        
        <!-- Payment Form -->
        <PaymentForm
          {rental}
          clientSecret={paymentIntent.client_secret}
          amount={paymentIntent.amount}
          on:success={handlePaymentSuccess}
          on:error={handlePaymentError}
        />
      </div>
    {/if}
  </div>
</div>
