<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let price;
  export let available = true;
  export let startDate: Date  = null;
  export let endDate: Date  = null;
  
  const dispatch = createEventDispatcher();
  
  $: dateRange = startDate && endDate 
    ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    : 'Select dates';
    
  $: days = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
    
  $: totalPrice = days * price;
</script>

<div class="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-t flex justify-between items-center px-4 py-3 border-t md:hidden">
  <div>
    <span class="text-lg font-semibold">${price}/day</span>
    {#if startDate && endDate}
      <p class="text-xs text-gray-500">{days} days: ${totalPrice} total</p>
    {:else}
      <p class="text-xs text-gray-500">Flexible cancellation</p>
    {/if}
  </div>
  <button 
    class="bg-green-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    disabled="{!available" || !startDate || !endDate}
    on:click={() => dispatch('book')}
  >
    {startDate && endDate ? 'Book Now' : 'Select Dates'}
  </button>
</div>