<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import {
    getSellerSales,
    getSalesSummary,
    groupSalesByPeriod,
    type SaleData,
    type SalesSummary
  } from '$lib/services/sales';
  import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
  import SaleCard from '$lib/components/dashboard/SaleCard.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { showToast } from '$lib/stores/toast.store';

  // State
  let sales: SaleData[] = [];
  let salesSummary: SalesSummary | null = null;
  let isLoading = true;
  let error = '';

  // Filters
  let statusFilter: 'all' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' = 'all';
  let sortBy: 'newest' | 'oldest' | 'amount-high' | 'amount-low' = 'newest';
  let searchQuery = '';

  // Reactive statements
  $: user = $authStore.data;
  $: isAuthenticated = !!user;

  onMount(async () => {
    // Check authentication
    if (!isAuthenticated) {
      showToast('error', 'Please sign in to access your dashboard');
      goto('/auth/signin');
      return;
    }

    await loadSalesData();
  });

  const loadSalesData = async () => {
    if (!user) return;

    isLoading = true;
    error = '';

    try {
      // Load sales data and summary in parallel
      const [salesData, summaryData] = await Promise.all([
        getSellerSales(user.uid),
        getSalesSummary(user.uid)
      ]);

      sales = salesData;
      salesSummary = summaryData;

    } catch (err: any) {
      console.error('Error loading sales data:', err);
      error = err.message || 'Failed to load sales data';
    } finally {
      isLoading = false;
    }
  };

  const handleViewSale = (event: CustomEvent) => {
    const { saleId } = event.detail;
    goto(`/sales/${saleId}`);
  };

  const handleViewListing = (event: CustomEvent) => {
    const { listingId } = event.detail;
    goto(`/gear/${listingId}`);
  };

  // Computed values
  $: filteredSales = sales.filter(sale => {
    // Status filter
    if (statusFilter !== 'all' && sale.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        sale.listingTitle.toLowerCase().includes(query) ||
        sale.buyerName?.toLowerCase().includes(query) ||
        sale.buyerEmail.toLowerCase().includes(query)
      );
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() - 
               new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt?.toDate?.() || a.createdAt).getTime() - 
               new Date(b.createdAt?.toDate?.() || b.createdAt).getTime();
      case 'amount-high':
        return b.amount - a.amount;
      case 'amount-low':
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  $: revenueGrowthPositive = salesSummary && salesSummary.revenueGrowth >= 0;
  $: salesGrowthPositive = salesSummary && salesSummary.salesGrowth >= 0;
  $: monthlyData = groupSalesByPeriod(sales, 'month');
  $: recentMonths = Object.entries(monthlyData)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 6);
</script>

<svelte:head>
  <title>Sales Dashboard - GearGrab</title>
  <meta name="description" content="Track your gear sales and revenue performance" />
</svelte:head>

<DashboardLayout 
  title="Sales Dashboard" 
  description="Track your gear sales and revenue performance"
>
  <div slot="header-actions">
    <a
      href="/listings/new"
      class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span>New Listing</span>
    </a>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="primary" text="Loading sales data..." />
      </div>
      
    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-semibold text-red-900 mb-2">Error Loading Sales</h2>
        <p class="text-red-700 mb-4">{error}</p>
        <button
          on:click={loadSalesData}
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
      
    {:else}
      <!-- Dashboard Content -->
      <div class="space-y-8">
        <!-- Sales Summary Banner -->
        {#if salesSummary}
          <div class="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl shadow-lg text-white p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <!-- Total Revenue -->
              <div class="text-center">
                <div class="text-3xl font-bold mb-2">
                  ${salesSummary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div class="text-primary-100 text-sm">Total Revenue</div>
                {#if salesSummary.revenueGrowth !== 0}
                  <div class="flex items-center justify-center mt-2 text-xs">
                    <svg class="w-3 h-3 mr-1 {revenueGrowthPositive ? 'text-green-300' : 'text-red-300'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{revenueGrowthPositive ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'}" />
                    </svg>
                    <span class="{revenueGrowthPositive ? 'text-green-300' : 'text-red-300'}">
                      {Math.abs(salesSummary.revenueGrowth).toFixed(1)}% vs last month
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Total Sales -->
              <div class="text-center">
                <div class="text-3xl font-bold mb-2">
                  {salesSummary.totalSales}
                </div>
                <div class="text-primary-100 text-sm">Total Sales</div>
                {#if salesSummary.salesGrowth !== 0}
                  <div class="flex items-center justify-center mt-2 text-xs">
                    <svg class="w-3 h-3 mr-1 {salesGrowthPositive ? 'text-green-300' : 'text-red-300'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{salesGrowthPositive ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'}" />
                    </svg>
                    <span class="{salesGrowthPositive ? 'text-green-300' : 'text-red-300'}">
                      {Math.abs(salesSummary.salesGrowth).toFixed(1)}% vs last month
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Average Sale Price -->
              <div class="text-center">
                <div class="text-3xl font-bold mb-2">
                  ${salesSummary.averageSalePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div class="text-primary-100 text-sm">Average Sale</div>
              </div>

              <!-- This Month -->
              <div class="text-center">
                <div class="text-3xl font-bold mb-2">
                  ${salesSummary.thisMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div class="text-primary-100 text-sm">This Month ({salesSummary.thisMonthSales} sales)</div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Sales Analytics -->
        {#if sales.length > 0 && recentMonths.length > 1}
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 class="text-lg font-semibold text-neutral-900 mb-4">Sales Trends</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {#each recentMonths as [month, monthSales]}
                {@const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.amount, 0)}
                {@const monthName = new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}

                <div class="text-center p-3 bg-neutral-50 rounded-lg">
                  <div class="text-sm font-medium text-neutral-600 mb-1">{monthName}</div>
                  <div class="text-lg font-bold text-neutral-900">{monthSales.length}</div>
                  <div class="text-xs text-neutral-500">sales</div>
                  <div class="text-sm font-semibold text-green-600 mt-1">
                    ${monthRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Filters and Search -->
        <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Search -->
              <div class="relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  bind:value={searchQuery}
                  placeholder="Search sales..."
                  class="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <!-- Status Filter -->
              <div>
                <label for="status-filter" class="sr-only">Filter by status</label>
                <select
                  id="status-filter"
                  bind:value={statusFilter}
                  class="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <!-- Sort By -->
              <div>
                <label for="sort-filter" class="sr-only">Sort by</label>
                <select
                  id="sort-filter"
                  bind:value={sortBy}
                  class="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Highest Amount</option>
                  <option value="amount-low">Lowest Amount</option>
                </select>
              </div>
            </div>

            <div class="text-sm text-neutral-600">
              Showing {filteredSales.length} of {sales.length} sales
            </div>
          </div>
        </div>

        <!-- Sales List -->
        {#if sales.length === 0}
          <!-- Empty State -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <svg class="w-16 h-16 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">
              No sales yet
            </h3>
            <p class="text-neutral-600 mb-6">
              Start selling your gear to see sales data here!
            </p>
            <a
              href="/listings/new"
              class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Your First Listing
            </a>
          </div>
        {:else if filteredSales.length === 0}
          <!-- No Results -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <svg class="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 class="text-lg font-semibold text-neutral-900 mb-2">
              No sales match your filters
            </h3>
            <p class="text-neutral-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        {:else}
          <!-- Sales Grid -->
          <div class="space-y-4">
            {#each filteredSales as sale (sale.id)}
              <SaleCard
                {sale}
                on:view={handleViewSale}
                on:viewListing={handleViewListing}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</DashboardLayout>
