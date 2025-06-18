<script lang="ts">
  import { onMount } from 'svelte';
  import { analyticsService, type DashboardMetrics, type BookingAnalytics } from '$lib/services/analytics';
  import { authStore } from '$lib/stores/auth';

  let metrics: DashboardMetrics | null = null;
  let bookingAnalytics: BookingAnalytics | null = null;
  let loading = true;
  let selectedPeriod = 'month';

  onMount(async () => {
    if ($authStore.user) {
      await loadAnalyticsData();
    }
  });

  async function loadAnalyticsData() {
    loading = true;
    try {
      if ($authStore.user) {
        [metrics, bookingAnalytics] = await Promise.all([
          analyticsService.getDashboardMetrics($authStore.user.uid, selectedPeriod as any),
          analyticsService.getBookingAnalytics($authStore.user.uid)
        ]);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      loading = false;
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatPercentage(value: number) {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  function getGrowthColor(growth: number) {
    return growth > 0 ? 'text-green-400' : growth < 0 ? 'text-red-400' : 'text-gray-400';
  }
</script>

<svelte:head>
  <title>Analytics - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">📊 Analytics Dashboard</h1>
          <p class="text-gray-300">Detailed insights into your gear rental performance</p>
        </div>
        <div class="flex items-center space-x-4">
          <select
            bind:value={selectedPeriod}
            on:change={loadAnalyticsData}
            class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="text-center py-12">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
          <div class="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-white mt-4">Loading analytics...</p>
        </div>
      </div>
    {:else if metrics}
      
      <!-- Key Performance Indicators -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <!-- Total Revenue -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-300">Total Revenue</p>
              <p class="text-2xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</p>
              <p class="text-sm {getGrowthColor(metrics.revenueGrowth)}">
                {formatPercentage(metrics.revenueGrowth)} from last period
              </p>
            </div>
            <div class="text-3xl">💰</div>
          </div>
        </div>

        <!-- Total Bookings -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-300">Total Bookings</p>
              <p class="text-2xl font-bold text-white">{metrics.totalBookings}</p>
              <p class="text-sm {getGrowthColor(metrics.bookingGrowth)}">
                {formatPercentage(metrics.bookingGrowth)} from last period
              </p>
            </div>
            <div class="text-3xl">📅</div>
          </div>
        </div>

        <!-- Occupancy Rate -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-300">Occupancy Rate</p>
              <p class="text-2xl font-bold text-white">{metrics.occupancyRate}%</p>
              <p class="text-sm text-blue-400">of available days</p>
            </div>
            <div class="text-3xl">📊</div>
          </div>
        </div>

        <!-- Average Rating -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-300">Average Rating</p>
              <p class="text-2xl font-bold text-white">{metrics.averageRating}</p>
              <p class="text-sm text-yellow-400">
                {'★'.repeat(Math.floor(metrics.averageRating))}{'☆'.repeat(5 - Math.floor(metrics.averageRating))}
              </p>
            </div>
            <div class="text-3xl">⭐</div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <!-- Response Rate -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Response Rate</h3>
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl font-bold text-white">{metrics.responseRate}%</span>
            <span class="text-sm text-gray-300">within 24h</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3">
            <div 
              class="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style="width: {metrics.responseRate}%"
            ></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">Industry average: 85%</p>
        </div>

        <!-- Cancellation Rate -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Cancellation Rate</h3>
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl font-bold text-white">{metrics.cancellationRate}%</span>
            <span class="text-sm text-gray-300">of bookings</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3">
            <div 
              class="bg-red-500 h-3 rounded-full transition-all duration-500"
              style="width: {metrics.cancellationRate}%"
            ></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">Industry average: 8%</p>
        </div>

        <!-- Repeat Customer Rate -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Repeat Customers</h3>
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl font-bold text-white">42%</span>
            <span class="text-sm text-gray-300">return rate</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3">
            <div 
              class="bg-purple-500 h-3 rounded-full transition-all duration-500"
              style="width: 42%"
            ></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">Industry average: 35%</p>
        </div>
      </div>

      <!-- Revenue & Bookings Charts -->
      {#if bookingAnalytics}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          <!-- Monthly Revenue Chart -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Monthly Revenue Trend</h3>
            <div class="space-y-3">
              {#each bookingAnalytics.bookingsByMonth.slice(-6) as month}
                {@const maxRevenue = Math.max(...bookingAnalytics.bookingsByMonth.map(m => m.revenue))}
                <div class="flex items-center justify-between">
                  <span class="text-gray-300 w-12 text-sm">{month.month}</span>
                  <div class="flex-1 mx-4">
                    <div class="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        class="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-700"
                        style="width: {(month.revenue / maxRevenue) * 100}%"
                      ></div>
                    </div>
                  </div>
                  <span class="text-white font-semibold w-20 text-right text-sm">{formatCurrency(month.revenue)}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Booking Volume Chart -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Monthly Booking Volume</h3>
            <div class="space-y-3">
              {#each bookingAnalytics.bookingsByMonth.slice(-6) as month}
                {@const maxBookings = Math.max(...bookingAnalytics.bookingsByMonth.map(m => m.bookings))}
                <div class="flex items-center justify-between">
                  <span class="text-gray-300 w-12 text-sm">{month.month}</span>
                  <div class="flex-1 mx-4">
                    <div class="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        class="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-700"
                        style="width: {(month.bookings / maxBookings) * 100}%"
                      ></div>
                    </div>
                  </div>
                  <span class="text-white font-semibold w-16 text-right text-sm">{month.bookings}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Category Performance -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <h3 class="text-lg font-semibold text-white mb-6">Category Performance</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {#each bookingAnalytics.bookingsByCategory as category}
              <div class="bg-white/5 rounded-lg p-4 text-center">
                <div class="text-2xl mb-2">
                  {#if category.category === 'Camping'}🏕️
                  {:else if category.category === 'Hiking'}🥾
                  {:else if category.category === 'Cycling'}🚴
                  {:else if category.category === 'Water Sports'}🏄
                  {:else if category.category === 'Winter Sports'}⛷️
                  {:else}🎒
                  {/if}
                </div>
                <h4 class="font-medium text-white text-sm">{category.category}</h4>
                <p class="text-lg font-bold text-green-400">{formatCurrency(category.revenue)}</p>
                <p class="text-xs text-gray-400">{category.bookings} bookings</p>
                <p class="text-xs text-gray-400">{category.percentage.toFixed(1)}% of total</p>
              </div>
            {/each}
          </div>
        </div>

        <!-- Geographic Performance -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <h3 class="text-lg font-semibold text-white mb-6">Top Locations</h3>
          <div class="space-y-4">
            {#each bookingAnalytics.bookingsByLocation.slice(0, 5) as location}
              <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div class="flex items-center space-x-3">
                  <div class="text-xl">📍</div>
                  <div>
                    <h4 class="font-medium text-white">{location.city}, {location.state}</h4>
                    <p class="text-sm text-gray-400">{location.bookings} bookings</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-green-400">{formatCurrency(location.revenue)}</p>
                  <p class="text-xs text-gray-400">revenue</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Financial Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        <!-- Earnings Breakdown -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Earnings Breakdown</h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span class="text-gray-300">Gross Revenue</span>
              <span class="text-white font-semibold">{formatCurrency(metrics.totalEarnings)}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span class="text-gray-300">Platform Fees (15%)</span>
              <span class="text-red-300">-{formatCurrency(metrics.platformFees)}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
              <span class="text-white font-semibold">Net Earnings</span>
              <span class="text-green-400 font-bold text-lg">
                {formatCurrency(metrics.totalEarnings - metrics.platformFees)}
              </span>
            </div>
          </div>
        </div>

        <!-- Payout Information -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Payout Status</h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span class="text-gray-300">Available Balance</span>
              <span class="text-green-400 font-semibold">{formatCurrency(metrics.availableBalance)}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span class="text-gray-300">Pending Payouts</span>
              <span class="text-yellow-400 font-semibold">{formatCurrency(metrics.pendingPayouts)}</span>
            </div>
            <button class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Request Payout
            </button>
            <p class="text-xs text-gray-400 text-center">
              Payouts are processed within 2-3 business days
            </p>
          </div>
        </div>
      </div>

      <!-- Insights & Recommendations -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h3 class="text-lg font-semibold text-white mb-6">📈 Insights & Recommendations</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div class="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-blue-400">💡</span>
              <h4 class="font-medium text-white">Peak Season Opportunity</h4>
            </div>
            <p class="text-sm text-gray-300">Summer bookings are 40% higher. Consider adding more camping gear to your inventory.</p>
          </div>

          <div class="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-green-400">📊</span>
              <h4 class="font-medium text-white">Pricing Optimization</h4>
            </div>
            <p class="text-sm text-gray-300">Your tent pricing is 15% below market average. Consider increasing rates by $5-10/day.</p>
          </div>

          <div class="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-purple-400">⭐</span>
              <h4 class="font-medium text-white">Excellent Performance</h4>
            </div>
            <p class="text-sm text-gray-300">Your response rate is above average! Keep up the great communication with renters.</p>
          </div>
        </div>
      </div>

    {/if}

  </div>
</div>
