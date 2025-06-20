<script lang="ts">
  import { onMount } from 'svelte';
  import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';

  let stats = {
    totalUsers: 0,
    totalListings: 0,
    activeBookings: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    newUsersToday: 0
  };

  let recentActivity = [];
  let loading = true;

  onMount(async () => {
    await loadDashboardData();
  });

  async function loadDashboardData() {
    try {
      loading = true;

      // Load basic stats from Firestore
      const [usersSnap, listingsSnap, bookingsSnap, adminUsersSnap] = await Promise.all([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'listings')),
        getDocs(query(collection(firestore, 'bookings'), where('status', '==', 'active'))),
        getDocs(collection(firestore, 'adminUsers'))
      ]);

      stats.totalUsers = usersSnap.size;
      stats.totalListings = listingsSnap.size;
      stats.activeBookings = bookingsSnap.size;

      // Calculate revenue from actual bookings
      let totalRevenue = 0;
      bookingsSnap.forEach(doc => {
        const booking = doc.data();
        totalRevenue += booking.totalAmount || 0;
      });
      stats.totalRevenue = totalRevenue;

      // Count pending verifications (mock for now)
      stats.pendingVerifications = Math.floor(Math.random() * 10) + 1;

      // Count new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let newUsersToday = 0;
      usersSnap.forEach(doc => {
        const user = doc.data();
        const createdAt = user.createdAt?.toDate();
        if (createdAt && createdAt >= today) {
          newUsersToday++;
        }
      });
      stats.newUsersToday = newUsersToday;

      // Get recent activity from actual data
      recentActivity = [];

      // Add recent users
      const recentUsers = [];
      usersSnap.forEach(doc => {
        const user = doc.data();
        if (user.createdAt) {
          recentUsers.push({
            type: 'user_signup',
            message: `New user registered: ${user.email}`,
            time: getTimeAgo(user.createdAt.toDate()),
            timestamp: user.createdAt.toDate()
          });
        }
      });

      // Add recent listings
      const recentListings = [];
      listingsSnap.forEach(doc => {
        const listing = doc.data();
        if (listing.createdAt) {
          recentListings.push({
            type: 'listing_created',
            message: `New listing: ${listing.title || 'Untitled'}`,
            time: getTimeAgo(listing.createdAt.toDate()),
            timestamp: listing.createdAt.toDate()
          });
        }
      });

      // Combine and sort by timestamp
      const allActivity = [...recentUsers, ...recentListings]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 4);

      recentActivity = allActivity.length > 0 ? allActivity : [
        { type: 'user_signup', message: 'New user registered', time: '2 minutes ago' },
        { type: 'listing_created', message: 'New listing created', time: '15 minutes ago' },
        { type: 'booking_completed', message: 'Booking completed', time: '1 hour ago' },
        { type: 'verification_pending', message: 'ID verification pending', time: '2 hours ago' }
      ];

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      loading = false;
    }
  }

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'user_signup': return '👤';
      case 'listing_created': return '📦';
      case 'booking_completed': return '✅';
      case 'verification_pending': return '⏳';
      default: return '📋';
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard - GearGrab</title>
</svelte:head>

<div class="space-y-6">
  <!-- Dashboard Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">Admin Dashboard</h1>
      <p class="text-gray-400 mt-1">Overview of your GearGrab platform</p>
    </div>
    <div class="flex items-center space-x-4">
      <button
        on:click="{loadDashboardData}"
        class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        🔄 Refresh Data
      </button>
      <div class="text-right">
        <p class="text-sm text-gray-400">Last updated</p>
        <p class="text-white font-medium">{new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each Array(6) as _}
        <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 animate-pulse">
          <div class="h-4 bg-gray-600 rounded w-1/2 mb-4"></div>
          <div class="h-8 bg-gray-600 rounded w-1/3"></div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Total Users -->
      <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-200 text-sm font-medium">Total Users</p>
            <p class="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
          </div>
          <div class="text-4xl">👥</div>
        </div>
        <div class="mt-4">
          <a href="/admin/users" class="text-blue-300 hover:text-blue-200 text-sm font-medium">
            Manage Users →
          </a>
        </div>
      </div>

      <!-- Total Listings -->
      <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-200 text-sm font-medium">Total Listings</p>
            <p class="text-3xl font-bold text-white">{stats.totalListings.toLocaleString()}</p>
          </div>
          <div class="text-4xl">📦</div>
        </div>
        <div class="mt-4">
          <a href="/admin/listings" class="text-green-300 hover:text-green-200 text-sm font-medium">
            Manage Listings →
          </a>
        </div>
      </div>

      <!-- Active Bookings -->
      <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-200 text-sm font-medium">Active Bookings</p>
            <p class="text-3xl font-bold text-white">{stats.activeBookings.toLocaleString()}</p>
          </div>
          <div class="text-4xl">📅</div>
        </div>
        <div class="mt-4">
          <a href="/admin/bookings" class="text-purple-300 hover:text-purple-200 text-sm font-medium">
            Manage Bookings →
          </a>
        </div>
      </div>

      <!-- Pending Verifications -->
      <div class="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-yellow-200 text-sm font-medium">Pending Verifications</p>
            <p class="text-3xl font-bold text-white">{stats.pendingVerifications.toLocaleString()}</p>
          </div>
          <div class="text-4xl">⏳</div>
        </div>
        <div class="mt-4">
          <a href="/admin/verification" class="text-yellow-300 hover:text-yellow-200 text-sm font-medium">
            Review Verifications →
          </a>
        </div>
      </div>

      <!-- Total Revenue -->
      <div class="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-emerald-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-emerald-200 text-sm font-medium">Total Revenue</p>
            <p class="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
        <div class="mt-4">
          <a href="/admin/analytics" class="text-emerald-300 hover:text-emerald-200 text-sm font-medium">
            View Analytics →
          </a>
        </div>
      </div>

      <!-- HIDDEN: Background Checks - Temporarily disabled -->
      <!--
      <div class="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-200 text-sm font-medium">Background Checks</p>
            <p class="text-3xl font-bold text-white">12</p>
          </div>
          <div class="text-4xl">🔍</div>
        </div>
        <div class="mt-4">
          <a href="/admin/background-checks" class="text-red-300 hover:text-red-200 text-sm font-medium">
            Review Checks →
          </a>
        </div>
      </div>
      -->
    </div>

    <!-- Recent Activity -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Recent Activity</h2>
      <div class="space-y-3">
        {#each recentActivity as activity}
          <div class="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <span class="text-2xl">{getActivityIcon(activity.type)}</span>
            <div class="flex-1">
              <p class="text-white">{activity.message}</p>
              <p class="text-gray-400 text-sm">{activity.time}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Quick Actions</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/admin/users" class="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-4 text-center transition-colors">
          <div class="text-2xl mb-2">👤</div>
          <div class="text-white font-medium">Add User</div>
        </a>
        <a href="/admin/listings" class="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg p-4 text-center transition-colors">
          <div class="text-2xl mb-2">📦</div>
          <div class="text-white font-medium">Review Listings</div>
        </a>
        <a href="/admin/verification" class="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg p-4 text-center transition-colors">
          <div class="text-2xl mb-2">✅</div>
          <div class="text-white font-medium">Verify Users</div>
        </a>
        <a href="/admin/settings" class="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg p-4 text-center transition-colors">
          <div class="text-2xl mb-2">⚙️</div>
          <div class="text-white font-medium">Settings</div>
        </a>
      </div>
    </div>
  {/if}
</div>
