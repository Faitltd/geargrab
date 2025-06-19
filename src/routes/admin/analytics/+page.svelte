<script lang="ts">
  import { onMount } from 'svelte';

  let loading = true;
  let timeRange = '30d';
  let analytics = {
    overview: {
      totalUsers: 1247,
      totalListings: 892,
      totalBookings: 456,
      totalRevenue: 45670,
      growthRate: 12.5
    },
    userMetrics: {
      newUsers: 89,
      activeUsers: 567,
      retentionRate: 78.5,
      averageSessionTime: '12m 34s'
    },
    listingMetrics: {
      newListings: 34,
      averagePrice: 125,
      topCategory: 'Photography',
      conversionRate: 23.4
    },
    bookingMetrics: {
      newBookings: 67,
      completedBookings: 89,
      cancelledBookings: 12,
      averageBookingValue: 187
    },
    revenueMetrics: {
      totalRevenue: 45670,
      platformFees: 4567,
      averageOrderValue: 187,
      monthlyGrowth: 15.2
    }
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  onMount(async () => {
    await loadAnalytics();
  });

  async function loadAnalytics() {
    try {
      loading = true;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would fetch from your analytics service
      // analytics = await fetchAnalytics(timeRange);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      loading = false;
    }
  }

  $: {
    timeRange;
    loadAnalytics();
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatPercentage(value: number) {
    return `${value.toFixed(1)}%`;
  }
</script>

<svelte:head>
  <title>Analytics - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">Analytics Dashboard</h1>
      <p class="text-gray-400 mt-1">Platform performance and insights</p>
    </div>
    <div>
      <select
        bind:value="{timeRange}"
        class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        {#each timeRangeOptions as option}
          <option value="{option.value}">{option.label}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if loading}
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
      <p class="text-gray-400">Loading analytics...</p>
    </div>
  {:else}
    <!-- Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Users -->
      <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-200 text-sm font-medium">Total Users</p>
            <p class="text-3xl font-bold text-white">{analytics.overview.totalUsers.toLocaleString()}</p>
            <p class="text-blue-300 text-sm mt-1">+{analytics.userMetrics.newUsers} this period</p>
          </div>
          <div class="text-4xl">👥</div>
        </div>
      </div>

      <!-- Total Listings -->
      <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-200 text-sm font-medium">Total Listings</p>
            <p class="text-3xl font-bold text-white">{analytics.overview.totalListings.toLocaleString()}</p>
            <p class="text-green-300 text-sm mt-1">+{analytics.listingMetrics.newListings} this period</p>
          </div>
          <div class="text-4xl">📦</div>
        </div>
      </div>

      <!-- Total Bookings -->
      <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-200 text-sm font-medium">Total Bookings</p>
            <p class="text-3xl font-bold text-white">{analytics.overview.totalBookings.toLocaleString()}</p>
            <p class="text-purple-300 text-sm mt-1">+{analytics.bookingMetrics.newBookings} this period</p>
          </div>
          <div class="text-4xl">📅</div>
        </div>
      </div>

      <!-- Total Revenue -->
      <div class="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-emerald-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-emerald-200 text-sm font-medium">Total Revenue</p>
            <p class="text-3xl font-bold text-white">{formatCurrency(analytics.overview.totalRevenue)}</p>
            <p class="text-emerald-300 text-sm mt-1">+{formatPercentage(analytics.revenueMetrics.monthlyGrowth)} growth</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
      </div>
    </div>

    <!-- Detailed Metrics -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- User Metrics -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">User Metrics</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">New Users</span>
            <span class="text-white font-semibold">{analytics.userMetrics.newUsers}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Active Users</span>
            <span class="text-white font-semibold">{analytics.userMetrics.activeUsers}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Retention Rate</span>
            <span class="text-white font-semibold">{formatPercentage(analytics.userMetrics.retentionRate)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Avg Session Time</span>
            <span class="text-white font-semibold">{analytics.userMetrics.averageSessionTime}</span>
          </div>
        </div>
      </div>

      <!-- Listing Metrics -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Listing Metrics</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">New Listings</span>
            <span class="text-white font-semibold">{analytics.listingMetrics.newListings}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Average Price</span>
            <span class="text-white font-semibold">{formatCurrency(analytics.listingMetrics.averagePrice)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Top Category</span>
            <span class="text-white font-semibold">{analytics.listingMetrics.topCategory}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Conversion Rate</span>
            <span class="text-white font-semibold">{formatPercentage(analytics.listingMetrics.conversionRate)}</span>
          </div>
        </div>
      </div>

      <!-- Booking Metrics -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Booking Metrics</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">New Bookings</span>
            <span class="text-white font-semibold">{analytics.bookingMetrics.newBookings}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Completed</span>
            <span class="text-white font-semibold">{analytics.bookingMetrics.completedBookings}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Cancelled</span>
            <span class="text-white font-semibold">{analytics.bookingMetrics.cancelledBookings}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Avg Booking Value</span>
            <span class="text-white font-semibold">{formatCurrency(analytics.bookingMetrics.averageBookingValue)}</span>
          </div>
        </div>
      </div>

      <!-- Revenue Metrics -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Revenue Metrics</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Total Revenue</span>
            <span class="text-white font-semibold">{formatCurrency(analytics.revenueMetrics.totalRevenue)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Platform Fees</span>
            <span class="text-white font-semibold">{formatCurrency(analytics.revenueMetrics.platformFees)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Avg Order Value</span>
            <span class="text-white font-semibold">{formatCurrency(analytics.revenueMetrics.averageOrderValue)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Monthly Growth</span>
            <span class="text-white font-semibold">{formatPercentage(analytics.revenueMetrics.monthlyGrowth)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Placeholder -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Revenue Trend</h2>
      <div class="h-64 bg-white/5 rounded-lg flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl mb-2">📈</div>
          <p class="text-gray-400">Chart visualization would go here</p>
          <p class="text-gray-500 text-sm">Integration with Chart.js or similar library</p>
        </div>
      </div>
    </div>

    <!-- Top Performers -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Listings -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Top Performing Listings</h2>
        <div class="space-y-3">
          {#each ['Professional Camera Kit', 'Drone with 4K Camera', 'Studio Lighting Set', 'MacBook Pro M2', 'Gaming Setup'] as listing, index}
            <div class="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <div class="flex items-center">
                <span class="text-yellow-400 font-bold mr-3">#{index + 1}</span>
                <span class="text-white">{listing}</span>
              </div>
              <span class="text-gray-400">{Math.floor(Math.random() * 50) + 10} bookings</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Top Users -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Top Users by Revenue</h2>
        <div class="space-y-3">
          {#each ['john@example.com', 'sarah@example.com', 'mike@example.com', 'lisa@example.com', 'david@example.com'] as user, index}
            <div class="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <div class="flex items-center">
                <span class="text-yellow-400 font-bold mr-3">#{index + 1}</span>
                <span class="text-white">{user}</span>
              </div>
              <span class="text-gray-400">{formatCurrency(Math.floor(Math.random() * 5000) + 1000)}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
