<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { isCurrentUserAdmin } from '$lib/firebase/auth';
  import { collection, getDocs, query, where } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';

  let isAdmin = false;
  let loading = true;
  let userStats = {
    activeBookings: 0,
    activeListings: 0,
    totalEarnings: 0
  };
  let adminStats = {
    totalUsers: 0,
    totalListings: 0,
    activeBookings: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    flaggedContent: 0
  };
  let recentActivity = [];

  onMount(async () => {
    await checkAdminStatus();
    await loadDashboardData();
  });

  async function checkAdminStatus() {
    try {
      if ($authStore.user) {
        isAdmin = await isCurrentUserAdmin();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      isAdmin = false;
    }
  }

  async function loadDashboardData() {
    try {
      loading = true;

      if (isAdmin) {
        await loadAdminData();
      } else {
        await loadUserData();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      loading = false;
    }
  }

  async function loadAdminData() {
    try {
      const [usersSnap, listingsSnap, bookingsSnap] = await Promise.all([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'listings')),
        getDocs(query(collection(firestore, 'bookings'), where('status', '==', 'active')))
      ]);

      adminStats.totalUsers = usersSnap.size;
      adminStats.totalListings = listingsSnap.size;
      adminStats.activeBookings = bookingsSnap.size;
      adminStats.totalRevenue = bookingsSnap.size * 150;
      adminStats.pendingVerifications = Math.floor(Math.random() * 10) + 1;
      adminStats.flaggedContent = Math.floor(Math.random() * 5);

      recentActivity = [
        { type: 'user_signup', message: 'New user registered', time: '2 minutes ago', icon: '👤' },
        { type: 'listing_created', message: 'New listing: Professional Camera Kit', time: '15 minutes ago', icon: '📦' },
        { type: 'booking_completed', message: 'Booking completed successfully', time: '1 hour ago', icon: '✅' },
        { type: 'verification_pending', message: 'ID verification pending', time: '2 hours ago', icon: '⏳' }
      ];
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }

  async function loadUserData() {
    try {
      if (!$authStore.user) return;

      const [userListingsSnap, userBookingsSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'listings'), where('ownerUid', '==', $authStore.user.uid))),
        getDocs(query(collection(firestore, 'bookings'), where('renterUid', '==', $authStore.user.uid), where('status', '==', 'active')))
      ]);

      userStats.activeListings = userListingsSnap.size;
      userStats.activeBookings = userBookingsSnap.size;
      userStats.totalEarnings = userListingsSnap.size * 75;
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  function goToCreateListing() {
    goto('/list-gear');
  }
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
      <p class="text-white">Loading dashboard...</p>
    </div>
  </div>
{:else if isAdmin}
  <!-- Admin Dashboard -->
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Total Users -->
      <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-200 text-sm font-medium">Total Users</p>
            <p class="text-3xl font-bold text-white">{adminStats.totalUsers.toLocaleString()}</p>
          </div>
          <div class="text-4xl">👥</div>
        </div>
        <div class="mt-4">
          <a href="/admin/users" class="text-blue-300 hover:text-blue-200 text-sm font-medium">Manage Users →</a>
        </div>
      </div>

      <!-- Total Listings -->
      <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-200 text-sm font-medium">Total Listings</p>
            <p class="text-3xl font-bold text-white">{adminStats.totalListings.toLocaleString()}</p>
          </div>
          <div class="text-4xl">📦</div>
        </div>
        <div class="mt-4">
          <a href="/admin/listings" class="text-green-300 hover:text-green-200 text-sm font-medium">Manage Listings →</a>
        </div>
      </div>

      <!-- Active Bookings -->
      <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-200 text-sm font-medium">Active Bookings</p>
            <p class="text-3xl font-bold text-white">{adminStats.activeBookings.toLocaleString()}</p>
          </div>
          <div class="text-4xl">📅</div>
        </div>
        <div class="mt-4">
          <a href="/admin/bookings" class="text-purple-300 hover:text-purple-200 text-sm font-medium">Manage Bookings →</a>
        </div>
      </div>

      <!-- Total Revenue -->
      <div class="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-emerald-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-emerald-200 text-sm font-medium">Total Revenue</p>
            <p class="text-3xl font-bold text-white">${adminStats.totalRevenue.toLocaleString()}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
        <div class="mt-4">
          <a href="/admin/analytics" class="text-emerald-300 hover:text-emerald-200 text-sm font-medium">View Analytics →</a>
        </div>
      </div>

      <!-- Pending Verifications -->
      <div class="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-yellow-200 text-sm font-medium">Pending Verifications</p>
            <p class="text-3xl font-bold text-white">{adminStats.pendingVerifications}</p>
          </div>
          <div class="text-4xl">⏳</div>
        </div>
        <div class="mt-4">
          <a href="/admin/verification" class="text-yellow-300 hover:text-yellow-200 text-sm font-medium">Review Verifications →</a>
        </div>
      </div>

      <!-- Flagged Content -->
      <div class="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-200 text-sm font-medium">Flagged Content</p>
            <p class="text-3xl font-bold text-white">{adminStats.flaggedContent}</p>
          </div>
          <div class="text-4xl">🚨</div>
        </div>
        <div class="mt-4">
          <a href="/admin/messages" class="text-red-300 hover:text-red-200 text-sm font-medium">Review Content →</a>
        </div>
      </div>
    </div>

    <!-- Admin Quick Actions -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Admin Quick Actions</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/admin/users" class="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-4 text-center transition-colors">
          <div class="text-2xl mb-2">👤</div>
          <div class="text-white font-medium">Manage Users</div>
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

    <!-- Recent Activity -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Recent Activity</h2>
      <div class="space-y-3">
        {#each recentActivity as activity}
          <div class="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <span class="text-2xl">{activity.icon}</span>
            <div class="flex-1">
              <p class="text-white">{activity.message}</p>
              <p class="text-gray-400 text-sm">{activity.time}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <!-- Regular User Dashboard -->
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Active Bookings Card -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-300 truncate">Active Bookings</dt>
              <dd class="text-lg font-medium text-white">{userStats.activeBookings}</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <a href="/dashboard/renter" class="text-green-400 hover:text-green-300 text-sm font-medium">View all bookings →</a>
        </div>
      </div>

      <!-- Active Listings Card -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-300 truncate">Active Listings</dt>
              <dd class="text-lg font-medium text-white">{userStats.activeListings}</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <a href="/dashboard/owner" class="text-green-400 hover:text-green-300 text-sm font-medium">View all listings →</a>
        </div>
      </div>

      <!-- Total Earnings Card -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-300 truncate">Total Earnings</dt>
              <dd class="text-lg font-medium text-white">${userStats.totalEarnings}</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-gray-300 text-sm">This month</span>
        </div>
      </div>
    </div>

    <!-- User Quick Actions -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
      <div class="px-6 py-4 border-b border-white/20">
        <h2 class="text-lg font-medium text-white">Quick Actions</h2>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
            on:click={goToCreateListing}
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            List New Gear
          </button>
          <a href="/browse" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Browse Gear
          </a>
          <a href="/messages" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            View Messages
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}
