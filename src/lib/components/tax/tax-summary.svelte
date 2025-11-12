<script lang="ts">
  export let subtotal: number; // Amount in cents
  export let taxAmount: number; // Tax amount in cents
  export let total: number; // Total amount in cents
  export let taxBreakdown: Array<{
    amount: number;
    rate: number;
    jurisdiction: string;
    type: string;
  }> = [];
  export let customerAddress: any = null;
  export let showDetails = false;

  function formatCurrency(amountInCents: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amountInCents / 100);
  }

  function formatTaxRate(rate: number): string {
    return `${(rate * 100).toFixed(2)}%`;
  }

  function getJurisdictionIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'state': return '🏛️';
      case 'county': return '🏢';
      case 'city': return '🏙️';
      case 'district': return '📍';
      default: return '💰';
    }
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-white">Tax Summary</h3>
    {#if customerAddress}
      <div class="text-right">
        <p class="text-gray-300 text-sm">Tax calculated for:</p>
        <p class="text-white text-sm font-medium">
          {customerAddress.city}, {customerAddress.state} {customerAddress.postal_code}
        </p>
      </div>
    {/if}
  </div>

  <!-- Price Breakdown -->
  <div class="space-y-3">
    <!-- Subtotal -->
    <div class="flex justify-between items-center">
      <span class="text-gray-300">Subtotal</span>
      <span class="text-white font-medium">{formatCurrency(subtotal)}</span>
    </div>

    <!-- Tax Line -->
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <span class="text-gray-300">Sales Tax</span>
        {#if taxBreakdown.length > 0}
          <button
            on:click={() => showDetails = !showDetails}
            class="ml-2 text-blue-400 hover:text-blue-300 text-sm"
            title="View tax breakdown"
          >
            {showDetails ? '▼' : '▶'} Details
          </button>
        {/if}
      </div>
      <span class="text-white font-medium">{formatCurrency(taxAmount)}</span>
    </div>

    <!-- Tax Breakdown Details -->
    {#if showDetails && taxBreakdown.length > 0}
      <div class="ml-4 space-y-2 border-l-2 border-blue-400/30 pl-4">
        {#each taxBreakdown as tax}
          <div class="flex justify-between items-center text-sm">
            <div class="flex items-center">
              <span class="mr-2">{getJurisdictionIcon(tax.type)}</span>
              <span class="text-gray-400">
                {tax.jurisdiction} ({tax.type}) - {formatTaxRate(tax.rate)}
              </span>
            </div>
            <span class="text-gray-300">{formatCurrency(tax.amount)}</span>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Total -->
    <div class="border-t border-white/20 pt-3 mt-3">
      <div class="flex justify-between items-center">
        <span class="text-white font-semibold text-lg">Total</span>
        <span class="text-white font-bold text-xl">{formatCurrency(total)}</span>
      </div>
    </div>
  </div>

  <!-- Tax Information -->
  {#if taxAmount > 0}
    <div class="mt-4 pt-4 border-t border-white/20">
      <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div class="flex items-start">
          <span class="text-blue-400 mr-2 mt-0.5">ℹ️</span>
          <div class="text-blue-200 text-sm">
            <p class="font-medium mb-1">Tax Information</p>
            <p>
              Sales tax is calculated based on your billing address and local tax rates. 
              Tax rates may vary by location and are subject to change.
            </p>
            {#if taxBreakdown.length > 0}
              <p class="mt-2">
                Total tax rate: <strong>{formatTaxRate(taxBreakdown.reduce((sum, tax) => sum + tax.rate, 0))}</strong>
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="mt-4 pt-4 border-t border-white/20">
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
        <div class="flex items-start">
          <span class="text-green-400 mr-2 mt-0.5">✅</span>
          <div class="text-green-200 text-sm">
            <p class="font-medium mb-1">No Sales Tax</p>
            <p>
              No sales tax applies to this transaction based on your location.
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Legal Disclaimer -->
  <div class="mt-4 pt-4 border-t border-white/20">
    <p class="text-gray-400 text-xs">
      Tax calculations are estimates and may vary. Final tax amounts will be confirmed at checkout. 
      GearGrab is required to collect sales tax in accordance with applicable state and local laws.
    </p>
  </div>
</div>
