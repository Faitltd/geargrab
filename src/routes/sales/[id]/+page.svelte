<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import {
    getSale,
    formatSaleDate,
    formatShippingAddress,
    getSaleStatusColor,
    getSaleStatusLabel,
    updateSaleStatus,
    type SaleData
  } from '$lib/services/sales';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { showToast } from '$lib/stores/toast.store';

  // URL parameters
  let saleId: string;

  // State
  let sale: SaleData | null = null;
  let isLoading = true;
  let error = '';
  let isUpdatingStatus = false;

  onMount(async () => {
    saleId = $page.params.id;

    // Check authentication
    if (!$authStore.user) {
      showToast('error', 'Please sign in to continue');
      goto('/auth/signin');
      return;
    }

    await loadSaleData();
  });

  const loadSaleData = async () => {
    if (!saleId) return;

    try {
      sale = await getSale(saleId);

      if (!sale) {
        error = 'Sale not found';
        return;
      }

      // Verify user has access to this sale
      if (sale.ownerId !== $authStore.user?.uid) {
        error = 'You do not have access to this sale';
        return;
      }

    } catch (err: any) {
      console.error('Error loading sale data:', err);
      error = err.message || 'Failed to load sale data';
    } finally {
      isLoading = false;
    }
  };

  const handleStatusUpdate = async (newStatus: SaleData['status']) => {
    if (!sale || isUpdatingStatus) return;

    isUpdatingStatus = true;

    try {
      await updateSaleStatus(sale.id!, newStatus);
      sale.status = newStatus;
      showToast('success', `Sale status updated to ${getSaleStatusLabel(newStatus)}`);
    } catch (error: any) {
      console.error('Error updating sale status:', error);
      showToast('error', error.message || 'Failed to update sale status');
    } finally {
      isUpdatingStatus = false;
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Computed values
  $: statusColorClass = sale ? getSaleStatusColor(sale.status) : '';
  $: statusLabel = sale ? getSaleStatusLabel(sale.status) : '';
  $: saleDate = sale ? formatSaleDate(sale) : '';
  $: shippingAddress = sale ? formatShippingAddress(sale.shippingAddress) : '';
  $: hasImage = sale?.listingImageUrl && sale.listingImageUrl.length > 0;
  $: buyerDisplayName = sale?.buyerName || 'Anonymous Buyer';
</script>

<svelte:head>
  <title>Sale Details - GearGrab</title>
  <meta name="description" content="View sale transaction details and manage order status" />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
  <div class="max-w-4xl mx-auto px-4 py-8">
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="primary" text="Loading sale details..." />
      </div>

    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-semibold text-red-900 mb-2">Error</h2>
        <p class="text-red-700 mb-4">{error}</p>
        <button
          on:click={() => goto('/dashboard/sales')}
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Return to Sales Dashboard
        </button>
      </div>

    {:else if sale}
      <!-- Sale Details -->
      <div class="space-y-8">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-neutral-900 mb-2">
                Sale Details
              </h1>
              <p class="text-neutral-600 mb-4">
                Sale ID: {sale.id}
              </p>

              <!-- Status and Actions -->
              <div class="flex items-center space-x-4">
                <span class="px-3 py-1 text-sm font-semibold rounded-full {statusColorClass}">
                  {statusLabel}
                </span>

                <!-- Status Update Buttons -->
                {#if sale.status === 'confirmed'}
                  <button
                    on:click={() => handleStatusUpdate('shipped')}
                    disabled={isUpdatingStatus}
                    class="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Mark as Shipped
                  </button>
                {:else if sale.status === 'shipped'}
                  <button
                    on:click={() => handleStatusUpdate('delivered')}
                    disabled={isUpdatingStatus}
                    class="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Mark as Delivered
                  </button>
                {:else if sale.status === 'delivered'}
                  <button
                    on:click={() => handleStatusUpdate('completed')}
                    disabled={isUpdatingStatus}
                    class="px-4 py-2 text-sm font-medium bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Mark as Completed
                  </button>
                {/if}
              </div>
            </div>

            <!-- Item Image -->
            {#if hasImage}
              <div class="flex-shrink-0 w-32 h-32 bg-neutral-100 rounded-xl overflow-hidden ml-6">
                <img
                  src={sale.listingImageUrl}
                  alt={sale.listingTitle}
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            {/if}
          </div>
        </div>
        <!-- Sale Information -->
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Item Details -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-neutral-900 mb-4">
              Item Details
            </h2>

            <div class="space-y-4">
              <div>
                <span class="text-sm font-medium text-neutral-600">Item Name</span>
                <p class="text-lg font-semibold text-neutral-900">{sale.listingTitle}</p>
              </div>

              <div>
                <span class="text-sm font-medium text-neutral-600">Sale Price</span>
                <p class="text-2xl font-bold text-green-600">
                  ${sale.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <span class="text-sm font-medium text-neutral-600">Currency</span>
                <p class="text-neutral-900 uppercase">{sale.currency}</p>
              </div>

              <div>
                <span class="text-sm font-medium text-neutral-600">Sale Date</span>
                <p class="text-neutral-900">{formatDateTime(sale.createdAt)}</p>
              </div>

              <div>
                <span class="text-sm font-medium text-neutral-600">Payment ID</span>
                <p class="text-neutral-900 font-mono text-sm">{sale.paymentIntentId}</p>
              </div>
            </div>
          </div>

          <!-- Buyer Information -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-neutral-900 mb-4">
              Buyer Information
            </h2>

            <div class="space-y-4">
              <div>
                <span class="text-sm font-medium text-neutral-600">Buyer Name</span>
                <p class="text-lg font-semibold text-neutral-900">{buyerDisplayName}</p>
              </div>

              <div>
                <span class="text-sm font-medium text-neutral-600">Email Address</span>
                <p class="text-neutral-900">{sale.buyerEmail}</p>
              </div>

              {#if sale.shippingAddress}
                <div>
                  <span class="text-sm font-medium text-neutral-600">Shipping Address</span>
                  <div class="text-neutral-900 whitespace-pre-line">
                    {#if sale.shippingAddress.line1}{sale.shippingAddress.line1}{/if}
                    {#if sale.shippingAddress.line2}
{sale.shippingAddress.line2}{/if}
                    {#if sale.shippingAddress.city || sale.shippingAddress.state || sale.shippingAddress.postal_code}
{[sale.shippingAddress.city, sale.shippingAddress.state, sale.shippingAddress.postal_code].filter(Boolean).join(', ')}{/if}
                    {#if sale.shippingAddress.country}
{sale.shippingAddress.country}{/if}
                  </div>
                </div>
              {:else}
                <div>
                  <span class="text-sm font-medium text-neutral-600">Shipping Address</span>
                  <p class="text-neutral-500 italic">No shipping address provided</p>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Transaction Details -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-neutral-900 mb-4">
            Transaction Details
          </h2>

          <div class="grid md:grid-cols-3 gap-6">
            <div>
              <span class="text-sm font-medium text-neutral-600">Payment Intent ID</span>
              <p class="text-neutral-900 font-mono text-sm break-all">{sale.paymentIntentId}</p>
            </div>

            <div>
              <span class="text-sm font-medium text-neutral-600">Checkout Session ID</span>
              <p class="text-neutral-900 font-mono text-sm break-all">{sale.checkoutSessionId}</p>
            </div>

            <div>
              <span class="text-sm font-medium text-neutral-600">Last Updated</span>
              <p class="text-neutral-900">{formatDateTime(sale.updatedAt)}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between">
          <button
            on:click={() => goto('/dashboard/sales')}
            class="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-colors"
          >
            Back to Sales Dashboard
          </button>

          <a
            href="/gear/{sale.listingId}"
            class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            View Original Listing
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>
