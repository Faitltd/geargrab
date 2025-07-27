<script>
  import { createEventDispatcher } from 'svelte';
  import { base44 } from '../../../api/base44Client.js';
  
  export let rental = null;
  export let canRequestRefund = false;
  
  const dispatch = createEventDispatcher();
  
  let showRefundForm = false;
  let loading = false;
  let error = null;
  let refundReason = '';
  let refundAmount = null;
  let fullRefund = true;
  
  const refundReasons = [
    { value: 'requested_by_customer', label: 'Customer Request' },
    { value: 'item_not_available', label: 'Item Not Available' },
    { value: 'item_damaged', label: 'Item Damaged' },
    { value: 'weather_cancellation', label: 'Weather Cancellation' },
    { value: 'other', label: 'Other' }
  ];
  
  function toggleRefundForm() {
    showRefundForm = !showRefundForm;
    if (!showRefundForm) {
      resetForm();
    }
  }
  
  function resetForm() {
    refundReason = '';
    refundAmount = null;
    fullRefund = true;
    error = null;
  }
  
  async function processRefund() {
    if (!refundReason) {
      error = 'Please select a refund reason';
      return;
    }
    
    if (!fullRefund && (!refundAmount || refundAmount <= 0)) {
      error = 'Please enter a valid refund amount';
      return;
    }
    
    loading = true;
    error = null;
    
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          rental_id: rental.id,
          reason: refundReason,
          amount: fullRefund ? null : refundAmount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }
      
      const refundData = await response.json();
      
      dispatch('refund-processed', {
        refund: refundData,
        rental
      });
      
      showRefundForm = false;
      resetForm();
      
    } catch (err) {
      console.error('Refund processing error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900">Refund Management</h3>
    
    {#if canRequestRefund}
      <button
        on:click={toggleRefundForm}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        {showRefundForm ? 'Cancel' : 'Request Refund'}
      </button>
    {/if}
  </div>
  
  {#if !canRequestRefund}
    <div class="bg-gray-50 rounded-md p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        <div class="ml-3">
          <p class="text-sm text-gray-700">
            Refunds are only available for confirmed or active rentals. 
            Contact support if you need assistance with this rental.
          </p>
        </div>
      </div>
    </div>
  {/if}
  
  {#if showRefundForm}
    <div class="border-t pt-6">
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
      
      <form on:submit|preventDefault={processRefund} class="space-y-6">
        <!-- Refund Reason -->
        <div>
          <label for="refund-reason" class="block text-sm font-medium text-gray-700">
            Reason for Refund
          </label>
          <select
            id="refund-reason"
            bind:value={refundReason}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select a reason...</option>
            {#each refundReasons as reason}
              <option value={reason.value}>{reason.label}</option>
            {/each}
          </select>
        </div>
        
        <!-- Refund Amount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Refund Amount
          </label>
          
          <div class="space-y-3">
            <div class="flex items-center">
              <input
                id="full-refund"
                type="radio"
                bind:group={fullRefund}
                value={true}
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <label for="full-refund" class="ml-3 block text-sm text-gray-700">
                Full refund (${rental?.total_amount?.toFixed(2) || '0.00'})
              </label>
            </div>
            
            <div class="flex items-center">
              <input
                id="partial-refund"
                type="radio"
                bind:group={fullRefund}
                value={false}
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <label for="partial-refund" class="ml-3 block text-sm text-gray-700">
                Partial refund
              </label>
            </div>
            
            {#if !fullRefund}
              <div class="ml-7">
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={rental?.total_amount || 0}
                    bind:value={refundAmount}
                    placeholder="0.00"
                    class="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 sm:text-sm">USD</span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Warning -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <div class="ml-3">
              <p class="text-sm text-yellow-800">
                <strong>Important:</strong> Refunds typically take 5-10 business days to appear on your original payment method. 
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            on:click={toggleRefundForm}
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if loading}
              <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            {:else}
              Process Refund
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
