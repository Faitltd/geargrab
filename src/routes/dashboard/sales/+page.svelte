<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { getSalesBySeller, updateSale, deleteSale } from '$lib/firebase/db/sales';
  import { toastNotifications } from '$lib/stores/notifications';
  import type { Sale } from '$lib/types/firestore';

  let sales: Sale[] = [];
  let loading = false;
  let totalEarnings = 0;
  let totalSales = 0;
  let totalViews = 0;

  $: authState = simpleAuth.authState;

  // Load user's sales from Firebase
  async function loadUserSales() {
    if (!$authState.isAuthenticated || !$authState.user) {
      console.log('User not authenticated, cannot load sales');
      return;
    }

    try {
      loading = true;
      console.log('Loading sales for user:', $authState.user.uid);

      const result = await getSalesBySeller($authState.user.uid, 50);
      sales = result.sales;

      console.log(`Loaded ${sales.length} sales:`, sales);

      // Calculate totals
      totalSales = sales.filter(sale => sale.status === 'sold').length;
      totalEarnings = sales
        .filter(sale => sale.status === 'sold')
        .reduce((sum, sale) => sum + sale.price, 0);
      totalViews = sales.reduce((sum, sale) => sum + (sale.views || 0), 0);

    } catch (error) {
      console.error('Error loading sales:', error);
      toastNotifications.error('Failed to load your sales. Please try again.');
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await loadUserSales();
  });

  function goToCreateSale() {
    goto('/sell-gear');
  }

  async function toggleSaleStatus(sale: Sale) {
    try {
      const newStatus = sale.isActive ? 'inactive' : 'active';
      await updateSale(sale.id, {
        status: newStatus,
        isActive: newStatus === 'active'
      });
      
      // Update local state
      sales = sales.map(s => 
        s.id === sale.id 
          ? { ...s, status: newStatus, isActive: newStatus === 'active' }
          : s
      );
      
      toastNotifications.success(`Sale ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating sale status:', error);
      toastNotifications.error('Failed to update sale status');
    }
  }

  async function handleDeleteSale(sale: Sale) {
    if (!confirm(`Are you sure you want to delete "${sale.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteSale(sale.id);
      sales = sales.filter(s => s.id !== sale.id);
      toastNotifications.success('Sale deleted successfully');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toastNotifications.error('Failed to delete sale');
    }
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'sold': return 'text-blue-400';
      case 'inactive': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  }

  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'sold': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">My Sales</h1>
        <p class="text-gray-300 mt-1">Manage your items for sale</p>
      </div>
      <button
        on:click={goToCreateSale}
        class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Sell New Item
      </button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Total Earnings</dt>
            <dd class="text-lg font-medium text-white">{formatPrice(totalEarnings)}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Items Sold</dt>
            <dd class="text-lg font-medium text-white">{totalSales}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Total Views</dt>
            <dd class="text-lg font-medium text-white">{totalViews}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  <!-- Sales List -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
    <div class="px-6 py-4 border-b border-white/20">
      <h2 class="text-lg font-medium text-white">Your Sales ({sales.length})</h2>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    {:else if sales.length === 0}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-white">No sales yet</h3>
        <p class="mt-1 text-sm text-gray-400">Get started by listing your first item for sale.</p>
        <div class="mt-6">
          <button
            on:click={goToCreateSale}
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            List Your First Item
          </button>
        </div>
      </div>
    {:else}
      <!-- Sales Table -->
      <div class="overflow-hidden">
        <div class="grid grid-cols-1 gap-6 p-6">
          {#each sales as sale}
            <div class="border border-white/20 rounded-lg p-6 hover:bg-white/5 transition-all bg-white/5">
              <div class="space-y-4">
                <!-- Top Row: Image, Title, Status, Actions -->
                <div class="flex items-start gap-4">
                  <!-- Image placeholder -->
                  <div class="flex-shrink-0">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-lg flex items-center justify-center">
                      <span class="text-2xl">🎒</span>
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <div>
                        <h3 class="text-lg font-medium text-white truncate">{sale.title}</h3>
                        <p class="text-sm text-gray-300 mt-1">{sale.category} • {sale.condition}</p>
                      </div>
                      <div class="flex items-center space-x-2 ml-4">
                        <span class="px-2 py-1 text-xs font-medium rounded-full border {getStatusBadgeColor(sale.status)}">
                          {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Details Row -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-gray-400">Price:</span>
                    <span class="text-white font-medium ml-1">{formatPrice(sale.price)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Views:</span>
                    <span class="text-white font-medium ml-1">{sale.views || 0}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Location:</span>
                    <span class="text-white font-medium ml-1">{sale.location.city}, {sale.location.state}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Listed:</span>
                    <span class="text-white font-medium ml-1">
                      {sale.createdAt ? new Date(sale.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>

                <!-- Actions Row -->
                <div class="flex flex-wrap gap-2 pt-2">
                  <button
                    on:click={() => toggleSaleStatus(sale)}
                    class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    disabled={sale.status === 'sold'}
                  >
                    {sale.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    class="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    on:click={() => handleDeleteSale(sale)}
                    class="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
