<script lang="ts">
  import type { BookingPricing } from '$lib/types/bookings';

  export let pricing: BookingPricing;

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">Price breakdown</h3>
  
  <div class="space-y-3">
    {#each pricing.breakdown as item}
      <div class="flex items-center justify-between">
        <div>
          <span class="text-gray-700">{item.label}</span>
          {#if item.description}
            <p class="text-xs text-gray-500">{item.description}</p>
          {/if}
        </div>
        <span class="font-medium {item.type === 'discount' ? 'text-green-600' : 'text-gray-900'}">
          {item.type === 'discount' ? '-' : ''}{formatCurrency(item.amount)}
        </span>
      </div>
    {/each}
  </div>

  <div class="border-t border-gray-200 mt-4 pt-4">
    <div class="flex items-center justify-between">
      <span class="text-lg font-semibold text-gray-900">Total</span>
      <span class="text-xl font-bold text-primary-600">{formatCurrency(pricing.total)}</span>
    </div>
  </div>

  <div class="mt-4 p-3 bg-gray-50 rounded-lg">
    <p class="text-xs text-gray-600">
      You won't be charged until the owner accepts your booking request.
      Cancellation policies apply.
    </p>
  </div>
</div>
