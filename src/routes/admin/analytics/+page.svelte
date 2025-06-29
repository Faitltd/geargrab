<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { isCurrentUserAdmin } from '$lib/auth/admin';
  import { notifications } from '$lib/stores/notifications';

  let loading = true;
  let isAdmin = false;
  let timeRange = '30d';
  let lastUpdated = '';
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
    await checkAdminAccess();
    if (isAdmin) {
      await loadAnalytics();
    }
  });

  async function checkAdminAccess() {
    try {
      await simpleAuth.waitForAuthReady();

      if (!simpleAuth.user) {
        goto('/auth/login');
        return;
      }

      isAdmin = await isCurrentUserAdmin();

      if (!isAdmin) {
        notifications.add({
          type: 'error',
          message: 'Admin access required',
          timeout: 5000
        });
        goto('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      goto('/dashboard');
    }
  }

  async function loadAnalytics() {
    try {
      loading = true;
      console.log('📊 Loading analytics for time range:', timeRange);

      // Simulate API call with different data based on time range
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate different data based on time range
      const multiplier = getTimeRangeMultiplier(timeRange);

      analytics = {
        overview: {
          totalUsers: Math.floor(1247 * multiplier),
          totalListings: Math.floor(892 * multiplier),
          totalBookings: Math.floor(456 * multiplier),
          totalRevenue: Math.floor(45670 * multiplier),
          growthRate: 12.5 + (Math.random() - 0.5) * 5
        },
        userMetrics: {
          newUsers: Math.floor(89 * multiplier),
          activeUsers: Math.floor(567 * multiplier),
          retentionRate: 78.5 + (Math.random() - 0.5) * 10,
          averageSessionTime: '12m 34s'
        },
        listingMetrics: {
          newListings: Math.floor(34 * multiplier),
          averagePrice: 125 + Math.floor((Math.random() - 0.5) * 50),
          topCategory: 'Photography',
          conversionRate: 23.4 + (Math.random() - 0.5) * 5
        },
        bookingMetrics: {
          newBookings: Math.floor(67 * multiplier),
          completedBookings: Math.floor(89 * multiplier),
          cancelledBookings: Math.floor(12 * multiplier),
          averageBookingValue: 187 + Math.floor((Math.random() - 0.5) * 40)
        },
        revenueMetrics: {
          totalRevenue: Math.floor(45670 * multiplier),
          platformFees: Math.floor(4567 * multiplier),
          averageOrderValue: 187 + Math.floor((Math.random() - 0.5) * 40),
          monthlyGrowth: 15.2 + (Math.random() - 0.5) * 8
        }
      };

      console.log('✅ Analytics loaded successfully for', timeRange);
      lastUpdated = new Date().toLocaleString();

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      loading = false;
    }
  }

  function getTimeRangeMultiplier(range: string): number {
    switch (range) {
      case '7d': return 0.2;
      case '30d': return 1.0;
      case '90d': return 2.5;
      case '1y': return 12.0;
      default: return 1.0;
    }
  }

  // Reactive statement to reload analytics when time range changes
  $: if (timeRange) {
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
      {#if lastUpdated}
        <p class="text-gray-500 text-sm mt-1">Last updated: {lastUpdated}</p>
      {/if}
    </div>
    <div class="flex items-center space-x-3">
      <select
        bind:value="{timeRange}"
        disabled={loading}
        class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#each timeRangeOptions as option}
          <option value="{option.value}">{option.label}</option>
        {/each}
      </select>
      {#if loading}
        <div class="flex items-center space-x-2 text-yellow-400">
          <div class="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm">Updating...</span>
        </div>
      {/if}
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
