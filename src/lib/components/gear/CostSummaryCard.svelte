<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ListingData } from '$lib/services/listings';
  
  export let listing: ListingData;
  export let selectedDates: string[] = [];
  export let deliveryOption: 'pickup' | 'delivery' = 'pickup';
  export let deliveryFee = 0;
  export let insuranceOption = false;
  export let insuranceFee = 0;
  export let taxRate = 0.0875; // 8.75% default tax rate
  export let showBreakdown = true;
  export let sticky = true;
  
  const dispatch = createEventDispatcher<{
    proceed: { 
      listing: ListingData; 
      dates: string[]; 
      total: number; 
      breakdown: CostBreakdown 
    };
    optionChange: { 
      delivery: boolean; 
      insurance: boolean 
    };
  }>();
  
  interface CostBreakdown {
    basePrice: number;
    days: number;
    subtotal: number;
    deliveryFee: number;
    insuranceFee: number;
    taxAmount: number;
    total: number;
  }
  
  $: basePrice = parseFloat(listing.rentalPrice || listing.price || '0');
  $: rentalDays = selectedDates.length || 1;
  $: subtotal = basePrice * rentalDays;
  $: currentDeliveryFee = deliveryOption === 'delivery' ? deliveryFee : 0;
  $: currentInsuranceFee = insuranceOption ? insuranceFee : 0;
  $: taxableAmount = subtotal + currentDeliveryFee + currentInsuranceFee;
  $: taxAmount = taxableAmount * taxRate;
  $: totalCost = taxableAmount + taxAmount;
  
  $: costBreakdown: CostBreakdown = {
    basePrice,
    days: rentalDays,
    subtotal,
    deliveryFee: currentDeliveryFee,
    insuranceFee: currentInsuranceFee,
    taxAmount,
    total: totalCost
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDateRange = (dates: string[]): string => {
    if (dates.length === 0) return 'No dates selected';
    if (dates.length === 1) return new Date(dates[0]).toLocaleDateString();
    
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };
  
  const handleProceed = () => {
    dispatch('proceed', {
      listing,
      dates: selectedDates,
      total: totalCost,
      breakdown: costBreakdown
    });
  };
  
  const handleDeliveryChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    deliveryOption = target.checked ? 'delivery' : 'pickup';
    dispatch('optionChange', {
      delivery: deliveryOption === 'delivery',
      insurance: insuranceOption
    });
  };
  
  const handleInsuranceChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    insuranceOption = target.checked;
    dispatch('optionChange', {
      delivery: deliveryOption === 'delivery',
      insurance: insuranceOption
    });
  };
</script>

<!-- Cost Summary Card -->
<div class="bg-white rounded-2xl shadow-lg border border-neutral-200 {sticky ? 'sticky top-24' : ''}">
  <!-- Header -->
  <div class="bg-primary-500 text-white p-6 rounded-t-2xl">
    <h3 class="text-lg font-semibold mb-2">Rental Summary</h3>
    <p class="text-primary-100 text-sm">
      {listing.title}
    </p>
  </div>
  
  <!-- Content -->
  <div class="p-6 space-y-6">
    <!-- Date Selection -->
    <div>
      <h4 class="font-medium text-neutral-900 mb-2">Selected Dates</h4>
      <div class="bg-neutral-50 rounded-lg p-3">
        <p class="text-sm text-neutral-700">
          {formatDateRange(selectedDates)}
        </p>
        <p class="text-xs text-neutral-500 mt-1">
          {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
        </p>
      </div>
    </div>
    
    <!-- Options -->
    <div class="space-y-4">
      <h4 class="font-medium text-neutral-900">Options</h4>
      
      <!-- Delivery Option -->
      <label class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
        <div class="flex-1">
          <div class="flex items-center">
            <input
              type="checkbox"
              checked={deliveryOption === 'delivery'}
              on:change={handleDeliveryChange}
              class="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span class="ml-3 text-sm font-medium text-neutral-900">
              Delivery
            </span>
          </div>
          <p class="text-xs text-neutral-500 ml-7">
            Have the item delivered to your location
          </p>
        </div>
        <span class="text-sm font-medium text-neutral-700">
          {formatCurrency(deliveryFee)}
        </span>
      </label>
      
      <!-- Insurance Option -->
      <label class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
        <div class="flex-1">
          <div class="flex items-center">
            <input
              type="checkbox"
              bind:checked={insuranceOption}
              on:change={handleInsuranceChange}
              class="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span class="ml-3 text-sm font-medium text-neutral-900">
              Damage Protection
            </span>
          </div>
          <p class="text-xs text-neutral-500 ml-7">
            Coverage for accidental damage
          </p>
        </div>
        <span class="text-sm font-medium text-neutral-700">
          {formatCurrency(insuranceFee)}
        </span>
      </label>
    </div>
    
    <!-- Cost Breakdown -->
    {#if showBreakdown}
      <div class="space-y-3">
        <h4 class="font-medium text-neutral-900">Cost Breakdown</h4>
        
        <div class="space-y-2 text-sm">
          <!-- Base Price -->
          <div class="flex justify-between">
            <span class="text-neutral-600">
              {formatCurrency(basePrice)} × {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
            </span>
            <span class="text-neutral-900">
              {formatCurrency(subtotal)}
            </span>
          </div>
          
          <!-- Delivery Fee -->
          {#if currentDeliveryFee > 0}
            <div class="flex justify-between">
              <span class="text-neutral-600">Delivery fee</span>
              <span class="text-neutral-900">
                {formatCurrency(currentDeliveryFee)}
              </span>
            </div>
          {/if}
          
          <!-- Insurance Fee -->
          {#if currentInsuranceFee > 0}
            <div class="flex justify-between">
              <span class="text-neutral-600">Damage protection</span>
              <span class="text-neutral-900">
                {formatCurrency(currentInsuranceFee)}
              </span>
            </div>
          {/if}
          
          <!-- Tax -->
          <div class="flex justify-between">
            <span class="text-neutral-600">
              Tax ({(taxRate * 100).toFixed(2)}%)
            </span>
            <span class="text-neutral-900">
              {formatCurrency(taxAmount)}
            </span>
          </div>
        </div>
        
        <!-- Total -->
        <div class="border-t border-neutral-200 pt-3">
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold text-neutral-900">Total</span>
            <span class="text-xl font-bold text-primary-500">
              {formatCurrency(totalCost)}
            </span>
          </div>
        </div>
      </div>
    {:else}
      <!-- Simple Total -->
      <div class="bg-primary-50 rounded-lg p-4 border border-primary-200">
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold text-primary-800">Total</span>
          <span class="text-2xl font-bold text-primary-600">
            {formatCurrency(totalCost)}
          </span>
        </div>
      </div>
    {/if}
    
    <!-- Action Button -->
    <button
      on:click={handleProceed}
      disabled={selectedDates.length === 0}
      class="w-full bg-accent-500 text-white font-semibold py-4 px-6 rounded-lg hover:bg-accent-600 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
    >
      {selectedDates.length === 0 ? 'Select Dates to Continue' : 'Proceed to Checkout'}
    </button>
    
    <!-- Terms -->
    <div class="text-xs text-neutral-500 space-y-1">
      <p>• Cancellation policy applies</p>
      <p>• Security deposit may be required</p>
      <p>• Items must be returned in original condition</p>
    </div>
  </div>
</div>
