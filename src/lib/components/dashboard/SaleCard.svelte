<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    formatSaleDate,
    formatShippingAddress,
    getSaleStatusColor,
    getSaleStatusLabel,
    type SaleData 
  } from '$lib/services/sales';

  export let sale: SaleData;

  const dispatch = createEventDispatcher<{
    view: { saleId: string };
    viewListing: { listingId: string };
  }>();

  const handleViewSale = () => {
    dispatch('view', { saleId: sale.id! });
  };

  const handleViewListing = () => {
    dispatch('viewListing', { listingId: sale.listingId });
  };

  // Computed values
  $: statusColorClass = getSaleStatusColor(sale.status);
  $: statusLabel = getSaleStatusLabel(sale.status);
  $: saleDate = formatSaleDate(sale);
  $: shippingAddress = formatShippingAddress(sale.shippingAddress);
  $: hasImage = sale.listingImageUrl && sale.listingImageUrl.length > 0;
  $: buyerDisplayName = sale.buyerName || 'Anonymous Buyer';
</script>

<div class="bg-white rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-200">
  <div class="p-6">
    <div class="flex items-start space-x-4">
      <!-- Gear Thumbnail -->
      <div class="flex-shrink-0 w-20 h-20 bg-neutral-100 rounded-lg overflow-hidden">
        {#if hasImage}
          <img
            src={sale.listingImageUrl}
            alt={sale.listingTitle}
            class="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
            on:click={handleViewListing}
            loading="lazy"
          />
        {:else}
          <!-- Placeholder Image -->
          <div 
            class="w-full h-full flex items-center justify-center bg-neutral-200 cursor-pointer hover:bg-neutral-300 transition-colors"
            on:click={handleViewListing}
          >
            <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        {/if}
      </div>

      <!-- Sale Information -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <!-- Item Title -->
            <h3 
              class="text-lg font-semibold text-neutral-900 cursor-pointer hover:text-primary-600 transition-colors truncate"
              on:click={handleViewListing}
            >
              {sale.listingTitle}
            </h3>

            <!-- Sale Details -->
            <div class="mt-2 space-y-1">
              <!-- Buyer Info -->
              <div class="flex items-center text-sm text-neutral-600">
                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="truncate">
                  {buyerDisplayName}
                  {#if sale.buyerEmail !== buyerDisplayName}
                    <span class="text-neutral-500">({sale.buyerEmail})</span>
                  {/if}
                </span>
              </div>

              <!-- Sale Date -->
              <div class="flex items-center text-sm text-neutral-600">
                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0h6" />
                </svg>
                <span>{saleDate}</span>
              </div>

              <!-- Shipping Address -->
              {#if sale.shippingAddress}
                <div class="flex items-start text-sm text-neutral-600">
                  <svg class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="line-clamp-2">{shippingAddress}</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Sale Price and Status -->
          <div class="flex flex-col items-end space-y-2 ml-4">
            <!-- Sale Price -->
            <div class="text-right">
              <div class="text-2xl font-bold text-neutral-900">
                ${sale.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div class="text-xs text-neutral-500 uppercase tracking-wide">
                {sale.currency}
              </div>
            </div>

            <!-- Status Badge -->
            <span class="px-3 py-1 text-xs font-semibold rounded-full {statusColorClass}">
              {statusLabel}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
          <div class="flex items-center space-x-2 text-xs text-neutral-500">
            <!-- Payment Info -->
            <div class="flex items-center space-x-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Payment ID: {sale.paymentIntentId.slice(-8)}</span>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <!-- View Listing Button -->
            <button
              on:click={handleViewListing}
              class="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
            >
              View Listing
            </button>

            <!-- View Sale Details Button -->
            <button
              on:click={handleViewSale}
              class="px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
