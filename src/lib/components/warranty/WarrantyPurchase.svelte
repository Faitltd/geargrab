<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { WARRANTY_PLANS, warrantyPaymentService } from '$lib/services/warrantyPayments';
  import StripePaymentForm from '$lib/components/payments/StripePaymentForm.svelte';
  
  export let itemValue: number;
  export let listingId: string;
  export let userId: string;
  export let bookingId: string = '';
  
  const dispatch = createEventDispatcher();
  
  let selectedPlan: string = 'standard';
  let showPayment = false;
  let processing = false;
  let error = '';
  let warrantyId = '';
  
  $: selectedPlanDetails = WARRANTY_PLANS.find(p => p.id === selectedPlan);
  $: warrantyCost = selectedPlanDetails ? warrantyPaymentService.calculateWarrantyCost(itemValue, selectedPlan as any) : 0;
  
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  
  async function handlePurchaseWarranty() {
    if (!selectedPlanDetails) return;
    
    processing = true;
    error = '';
    
    try {
      const result = await warrantyPaymentService.purchaseWarranty(
        userId,
        listingId,
        selectedPlan as any,
        itemValue,
        bookingId
      );
      
      warrantyId = result.warrantyId;
      showPayment = true;
    } catch (err) {
      console.error('Error creating warranty:', err);
      error = 'Failed to create warranty. Please try again.';
      processing = false;
    }
  }
  
  async function handlePaymentSuccess(event: any) {
    try {
      await warrantyPaymentService.confirmWarrantyPayment(warrantyId);
      dispatch('success', {
        warrantyId,
        planId: selectedPlan,
        cost: warrantyCost
      });
    } catch (err) {
      console.error('Error confirming warranty payment:', err);
      error = 'Payment successful but failed to activate warranty. Please contact support.';
    }
  }
  
  function handlePaymentError(event: any) {
    error = event.detail.error || 'Payment failed. Please try again.';
  }
</script>

<div class="warranty-purchase">
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <h3 class="text-xl font-semibold text-white mb-4">🛡️ Protect Your Rental</h3>
    <p class="text-gray-300 mb-6">
      Add warranty protection to your rental for peace of mind during your adventure.
    </p>
    
    <!-- Plan Selection -->
    <div class="space-y-4 mb-6">
      {#each WARRANTY_PLANS as plan}
        <label class="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
          <input
            type="radio"
            bind:group={selectedPlan}
            value={plan.id}
            class="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-semibold text-white">{plan.name}</h4>
                <p class="text-sm text-gray-300 mb-2">{plan.description}</p>
                <div class="text-xs text-gray-400">
                  Duration: {plan.duration} months
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-white">
                  {formatCurrency(warrantyPaymentService.calculateWarrantyCost(itemValue, plan.id))}
                </div>
                <div class="text-xs text-gray-400">
                  {plan.pricing.percentage}% of item value
                </div>
              </div>
            </div>
            
            <!-- Features -->
            <div class="mt-3">
              <div class="grid grid-cols-2 gap-2 text-xs">
                {#each plan.features.slice(0, 4) as feature}
                  <div class="flex items-center text-green-300">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    {feature}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </label>
      {/each}
    </div>
    
    <!-- Selected Plan Details -->
    {#if selectedPlanDetails}
      <div class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
        <h4 class="font-semibold text-blue-200 mb-2">Selected: {selectedPlanDetails.name}</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 class="font-medium text-blue-200 mb-1">Coverage Includes:</h5>
            <ul class="text-blue-100 space-y-1">
              {#each selectedPlanDetails.features as feature}
                <li class="flex items-center">
                  <svg class="w-3 h-3 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {feature}
                </li>
              {/each}
            </ul>
          </div>
          <div>
            <h5 class="font-medium text-blue-200 mb-1">Exclusions:</h5>
            <ul class="text-blue-100 space-y-1">
              {#each selectedPlanDetails.exclusions as exclusion}
                <li class="flex items-center">
                  <svg class="w-3 h-3 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                  {exclusion}
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Error Display -->
    {#if error}
      <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
        <p class="text-red-200 text-sm">{error}</p>
      </div>
    {/if}
    
    <!-- Purchase Button -->
    {#if !showPayment}
      <div class="flex justify-between items-center">
        <div>
          <div class="text-sm text-gray-300">Warranty Cost:</div>
          <div class="text-2xl font-bold text-white">{formatCurrency(warrantyCost)}</div>
        </div>
        <button
          on:click={handlePurchaseWarranty}
          disabled={processing}
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {#if processing}
            <div class="flex items-center">
              <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processing...
            </div>
          {:else}
            Add Warranty Protection
          {/if}
        </button>
      </div>
    {/if}
    
    <!-- Payment Form -->
    {#if showPayment}
      <div class="border-t border-white/20 pt-6">
        <h4 class="text-lg font-semibold text-white mb-4">Complete Warranty Payment</h4>
        <StripePaymentForm
          amount={warrantyCost}
          currency="usd"
          metadata={{
            type: 'warranty',
            warrantyId,
            planId: selectedPlan,
            listingId,
            userId
          }}
          on:success={handlePaymentSuccess}
          on:error={handlePaymentError}
        />
      </div>
    {/if}
    
    <!-- Skip Option -->
    <div class="mt-4 text-center">
      <button
        on:click={() => dispatch('skip')}
        class="text-gray-400 hover:text-gray-300 text-sm underline"
      >
        Skip warranty protection
      </button>
    </div>
  </div>
</div>

<style>
  .warranty-purchase {
    max-width: 800px;
  }
</style>
