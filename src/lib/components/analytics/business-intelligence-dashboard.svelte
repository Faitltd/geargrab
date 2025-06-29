<script lang="ts">
  import { onMount } from 'svelte';
  import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';

  export let timeRange = '30d';

  let loading = true;
  let businessMetrics = {
    revenue: {
      total: 0,
      growth: 0,
      monthlyRecurring: 0,
      averageOrderValue: 0,
      conversionRate: 0
    },
    users: {
      total: 0,
      active: 0,
      new: 0,
      retention: 0,
      churnRate: 0
    },
    listings: {
      total: 0,
      active: 0,
      new: 0,
      averagePrice: 0,
      topCategories: []
    },
    bookings: {
      total: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      averageDuration: 0
    },
    performance: {
      responseTime: 0,
      uptime: 99.9,
      errorRate: 0.1,
      customerSatisfaction: 4.8
    }
  };

  let insights = [];
  let recommendations = [];

  onMount(async () => {
    await loadBusinessIntelligence();
  });

  async function loadBusinessIntelligence() {
    try {
      loading = true;

      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Load all collections
      const [usersSnap, listingsSnap, bookingsSnap, reviewsSnap] = await Promise.all([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'listings')),
        getDocs(collection(firestore, 'bookings')),
        getDocs(collection(firestore, 'reviews'))
      ]);

      // Process revenue metrics
      let totalRevenue = 0;
      let completedBookings = 0;
      let cancelledBookings = 0;
      let pendingBookings = 0;
      let bookingDurations = [];

      bookingsSnap.forEach(doc => {
        const booking = doc.data();
        
        if (booking.status === 'completed') {
          totalRevenue += booking.totalPrice || 0;
          completedBookings++;
          
          // Calculate duration
          if (booking.startDate && booking.endDate) {
            const start = booking.startDate.toDate();
            const end = booking.endDate.toDate();
            const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            bookingDurations.push(duration);
          }
        } else if (booking.status === 'cancelled') {
          cancelledBookings++;
        } else if (booking.status === 'pending') {
          pendingBookings++;
        }
      });

      // Process user metrics
      let activeUsers = 0;
      let newUsers = 0;
      usersSnap.forEach(doc => {
        const user = doc.data();
        const createdAt = user.createdAt?.toDate();
        
        if (createdAt && createdAt >= startDate) {
          newUsers++;
        }
        
        // Consider user active if they have recent activity
        if (user.lastLoginAt?.toDate() >= startDate) {
          activeUsers++;
        }
      });

      // Process listing metrics
      let activeListings = 0;
      let newListings = 0;
      let listingPrices = [];
      let categoryCount = {};

      listingsSnap.forEach(doc => {
        const listing = doc.data();
        
        if (listing.isActive) {
          activeListings++;
          if (listing.dailyPrice) {
            listingPrices.push(listing.dailyPrice);
          }
        }
        
        const createdAt = listing.createdAt?.toDate();
        if (createdAt && createdAt >= startDate) {
          newListings++;
        }
        
        const category = listing.category || 'Other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      // Calculate metrics
      const averageOrderValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;
      const conversionRate = usersSnap.size > 0 ? (completedBookings / usersSnap.size) * 100 : 0;
      const averagePrice = listingPrices.length > 0 ? listingPrices.reduce((a, b) => a + b, 0) / listingPrices.length : 0;
      const averageDuration = bookingDurations.length > 0 ? bookingDurations.reduce((a, b) => a + b, 0) / bookingDurations.length : 0;
      const retentionRate = usersSnap.size > 0 ? (activeUsers / usersSnap.size) * 100 : 0;

      // Top categories
      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      // Update metrics
      businessMetrics = {
        revenue: {
          total: totalRevenue,
          growth: Math.random() * 20 - 5, // Mock growth
          monthlyRecurring: totalRevenue * 0.3, // Estimated recurring
          averageOrderValue,
          conversionRate
        },
        users: {
          total: usersSnap.size,
          active: activeUsers,
          new: newUsers,
          retention: retentionRate,
          churnRate: 100 - retentionRate
        },
        listings: {
          total: listingsSnap.size,
          active: activeListings,
          new: newListings,
          averagePrice,
          topCategories
        },
        bookings: {
          total: bookingsSnap.size,
          completed: completedBookings,
          cancelled: cancelledBookings,
          pending: pendingBookings,
          averageDuration
        },
        performance: {
          responseTime: 245, // Mock data
          uptime: 99.9,
          errorRate: 0.1,
          customerSatisfaction: 4.8
        }
      };

      // Generate insights
      insights = generateInsights();
      recommendations = generateRecommendations();

    } catch (error) {
      console.error('Error loading business intelligence:', error);
    } finally {
      loading = false;
    }
  }

  function generateInsights() {
    const insights = [];
    
    if (businessMetrics.revenue.growth > 10) {
      insights.push({
        type: 'positive',
        title: 'Strong Revenue Growth',
        description: `Revenue is growing at ${businessMetrics.revenue.growth.toFixed(1)}% this period`,
        icon: '📈'
      });
    }
    
    if (businessMetrics.users.retention < 70) {
      insights.push({
        type: 'warning',
        title: 'Low User Retention',
        description: `Only ${businessMetrics.users.retention.toFixed(1)}% of users are active`,
        icon: '⚠️'
      });
    }
    
    if (businessMetrics.bookings.cancelled > businessMetrics.bookings.completed * 0.1) {
      insights.push({
        type: 'negative',
        title: 'High Cancellation Rate',
        description: `${businessMetrics.bookings.cancelled} bookings were cancelled`,
        icon: '❌'
      });
    }
    
    return insights;
  }

  function generateRecommendations() {
    const recommendations = [];
    
    if (businessMetrics.revenue.conversionRate < 5) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Conversion Rate',
        description: 'Consider optimizing the booking flow and adding trust signals',
        action: 'Review checkout process'
      });
    }
    
    if (businessMetrics.users.new < businessMetrics.users.total * 0.1) {
      recommendations.push({
        priority: 'medium',
        title: 'Increase User Acquisition',
        description: 'Implement referral programs and improve SEO',
        action: 'Launch marketing campaign'
      });
    }
    
    if (businessMetrics.listings.new < 5) {
      recommendations.push({
        priority: 'medium',
        title: 'Encourage More Listings',
        description: 'Incentivize users to list their gear with promotions',
        action: 'Create listing incentives'
      });
    }
    
    return recommendations;
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function getInsightColor(type: string): string {
    switch (type) {
      case 'positive': return 'border-green-500/30 bg-green-500/10';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'negative': return 'border-red-500/30 bg-red-500/10';
      default: return 'border-blue-500/30 bg-blue-500/10';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  }
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
    <span class="ml-3 text-gray-300">Loading business intelligence...</span>
  </div>
{:else}
  <div class="space-y-8">
    <!-- Key Performance Indicators -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Revenue KPI -->
      <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-green-400 font-medium">Total Revenue</h3>
          <span class="text-2xl">💰</span>
        </div>
        <div class="text-3xl font-bold text-white mb-2">{formatCurrency(businessMetrics.revenue.total)}</div>
        <div class="text-green-300 text-sm">
          {businessMetrics.revenue.growth > 0 ? '+' : ''}{formatPercentage(businessMetrics.revenue.growth)} growth
        </div>
      </div>

      <!-- Users KPI -->
      <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-blue-400 font-medium">Active Users</h3>
          <span class="text-2xl">👥</span>
        </div>
        <div class="text-3xl font-bold text-white mb-2">{businessMetrics.users.active.toLocaleString()}</div>
        <div class="text-blue-300 text-sm">
          {formatPercentage(businessMetrics.users.retention)} retention rate
        </div>
      </div>

      <!-- Bookings KPI -->
      <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-purple-400 font-medium">Completed Bookings</h3>
          <span class="text-2xl">📅</span>
        </div>
        <div class="text-3xl font-bold text-white mb-2">{businessMetrics.bookings.completed.toLocaleString()}</div>
        <div class="text-purple-300 text-sm">
          {formatCurrency(businessMetrics.revenue.averageOrderValue)} avg value
        </div>
      </div>

      <!-- Performance KPI -->
      <div class="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-orange-400 font-medium">Platform Health</h3>
          <span class="text-2xl">⚡</span>
        </div>
        <div class="text-3xl font-bold text-white mb-2">{businessMetrics.performance.uptime}%</div>
        <div class="text-orange-300 text-sm">
          {businessMetrics.performance.responseTime}ms avg response
        </div>
      </div>
    </div>

    <!-- Insights & Recommendations -->
    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Business Insights -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">📊 Business Insights</h2>
        
        {#if insights.length === 0}
          <div class="text-center py-8">
            <div class="text-4xl mb-2">🔍</div>
            <p class="text-gray-400">No significant insights detected</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each insights as insight}
              <div class="border rounded-lg p-4 {getInsightColor(insight.type)}">
                <div class="flex items-start space-x-3">
                  <span class="text-2xl">{insight.icon}</span>
                  <div>
                    <h4 class="text-white font-medium">{insight.title}</h4>
                    <p class="text-gray-300 text-sm mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Recommendations -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">💡 Recommendations</h2>
        
        {#if recommendations.length === 0}
          <div class="text-center py-8">
            <div class="text-4xl mb-2">✅</div>
            <p class="text-gray-400">All metrics look good!</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each recommendations as rec}
              <div class="bg-white/5 border border-white/10 rounded-lg p-4">
                <div class="flex items-start justify-between mb-2">
                  <h4 class="text-white font-medium">{rec.title}</h4>
                  <span class="text-xs font-medium px-2 py-1 rounded {getPriorityColor(rec.priority)}">
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p class="text-gray-300 text-sm mb-3">{rec.description}</p>
                <button class="text-green-400 hover:text-green-300 text-sm font-medium">
                  {rec.action} →
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
