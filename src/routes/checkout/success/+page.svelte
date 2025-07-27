<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base44 } from '../../../api/base44Client.js';
  
  let rental = null;
  let paymentStatus = null;
  let loading = true;
  let error = null;
  
  const rentalId = $page.url.searchParams.get('rental_id');
  const paymentIntentId = $page.url.searchParams.get('payment_intent');
  
  onMount(async () => {
    if (!rentalId || !paymentIntentId) {
      error = 'Missing payment information';
      loading = false;
      return;
    }
    
    await loadPaymentStatus();
  });
  
  async function loadPaymentStatus() {
    try {
      loading = true;
      error = null;
      
      // Get rental details
      const rentalResponse = await base44.entities.Rental.get(rentalId);
      rental = rentalResponse.rental;
      
      // Get payment status
      const paymentResponse = await fetch(`/api/payments/rental/${rentalId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Failed to load payment status');
      }
      
      paymentStatus = await paymentResponse.json();
      
      // Confirm payment with backend if not already done
      if (paymentStatus.payment_status === 'succeeded' && paymentStatus.rental_status === 'pending') {
        await fetch('/api/payments/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntentId
          })
        });
        
        // Reload status
        await loadPaymentStatus();
      }
      
    } catch (err) {
      console.error('Failed to load payment status:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Payment Successful - GearGrab</title>
  <meta name="description" content="Your rental payment was successful" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if loading}
      <div class="flex justify-center items-center py-12">
        <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-gray-600">Confirming payment...</span>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <h3 class="mt-2 text-lg font-medium text-red-800">Error</h3>
        <p class="mt-1 text-red-600">{error}</p>
      </div>
    {:else}
      <!-- Success Message -->
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p class="text-gray-600 mb-8">Your rental has been confirmed and payment processed.</p>
        
        {#if rental}
          <!-- Rental Summary -->
          <div class="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Rental Confirmation</h2>
            
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Item:</span>
                <span class="font-medium">{rental.gear_title}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600">Rental Period:</span>
                <span class="font-medium">
                  {new Date(rental.start_date).toLocaleDateString()} - 
                  {new Date(rental.end_date).toLocaleDateString()}
                </span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600">Duration:</span>
                <span class="font-medium">{rental.total_days} day{rental.total_days !== 1 ? 's' : ''}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600">Total Paid:</span>
                <span class="font-medium text-green-600">
                  ${(paymentStatus?.transaction_amount || rental.total_amount).toFixed(2)}
                </span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600">Status:</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {paymentStatus?.rental_status || 'Confirmed'}
                </span>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Next Steps -->
        <div class="bg-blue-50 rounded-lg p-6 mb-8 text-left">
          <h3 class="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
          <ul class="space-y-2 text-blue-800">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              You'll receive a confirmation email with rental details
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              The gear owner will contact you about pickup/delivery
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              You can track your rental status in your dashboard
            </li>
          </ul>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            on:click={() => goto('/dashboard/rentals')}
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            View My Rentals
          </button>
          
          <button
            on:click={() => goto('/browse')}
            class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Browse More Gear
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
