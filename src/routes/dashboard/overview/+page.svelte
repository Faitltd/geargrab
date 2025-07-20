<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import Header from '$lib/components/Header.svelte';
  import ReviewRequestsList from '$lib/components/reviews/ReviewRequestsList.svelte';
  import type { Booking } from '$lib/types/bookings';
  import type { ReviewRequest } from '$lib/types/reviews';
  import { formatBookingStatus, getBookingStatusColor } from '$lib/types/bookings';

  // State
  let loading = true;
  let error = '';
  let recentBookings: Booking[] = [];
  let pendingReviewsCount = 0;
  let stats = {
    totalBookings: 0,
    pendingRequests: 0,
    activeRentals: 0,
    totalEarnings: 0
  };

  $: user = $authStore.data;

  onMount(async () => {
    if (!user) {
      goto('/auth/signin');
      return;
    }

    await loadDashboardData();
  });

  async function loadDashboardData() {
    try {
      loading = true;
      error = '';

      // Load recent bookings
      const response = await fetch('/api/bookings?limit=5');
      const result = await response.json();

      if (!result.success) {
        error = result.error?.message || 'Failed to load dashboard data';
        return;
      }

      recentBookings = result.data.bookings.map((booking: any) => ({
        ...booking,
        startDate: new Date(booking.startDate),
        endDate: new Date(booking.endDate),
        createdAt: new Date(booking.createdAt)
      }));

      // Calculate stats
      calculateStats(recentBookings);

    } catch (err: any) {
      error = err.message || 'Failed to load dashboard data';
      console.error('Error loading dashboard data:', err);
    } finally {
      loading = false;
    }
  }

  function handleWriteReview(event: CustomEvent<{ request: ReviewRequest }>) {
    const { request } = event.detail;
    // Navigate to review writing page
    goto(`/reviews/write?requestId=${request.id}&listingId=${request.listingId}&type=${request.type}`);
  }

  function handleRequestsLoaded(event: CustomEvent<{ count: number }>) {
    pendingReviewsCount = event.detail.count;
  }

  function calculateStats(bookings: Booking[]) {
    stats = {
      totalBookings: bookings.length,
      pendingRequests: bookings.filter(b => b.status === 'pending' && b.ownerId === user?.uid).length,
      activeRentals: bookings.filter(b => ['confirmed', 'paid', 'active'].includes(b.status)).length,
      totalEarnings: bookings
        .filter(b => b.ownerId === user?.uid && ['completed'].includes(b.status))
        .reduce((sum, b) => sum + b.pricing.total, 0)
    };
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function viewBooking(bookingId: string) {
    goto(`/bookings/${bookingId}`);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'available': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-neutral-100 text-neutral-800';
      case 'unread': return 'bg-accent-100 text-accent-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };
</script>

<svelte:head>
  <title>Dashboard Overview - GearGrab</title>
  <meta name="description" content="Manage your gear rentals, bookings, and profile on GearGrab." />
</svelte:head>

<Header />

{#if loading}
  <div class="min-h-screen flex items-center justify-center bg-neutral-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
      <p class="text-neutral-600">Loading your dashboard...</p>
    </div>
  </div>
{:else if user}
  <main class="min-h-screen bg-neutral-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">
              Welcome back, {user.displayName || 'Adventurer'}! 🏔️
            </h1>
            <p class="text-neutral-600 mt-2">Manage your gear, bookings, and outdoor community</p>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <div class="text-sm text-neutral-500">Member since</div>
              <div class="font-semibold text-neutral-900">Jan 2024</div>
            </div>
            <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {(user.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-rei p-6">
          <div class="flex items-center">
            <div class="p-2 bg-primary-100 rounded-lg">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-neutral-600">Active Rentals</p>
              <p class="text-2xl font-bold text-neutral-900">{stats.activeRentals}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-rei p-6">
          <div class="flex items-center">
            <div class="p-2 bg-forest-100 rounded-lg">
              <svg class="w-6 h-6 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-neutral-600">Listed Gear</p>
              <p class="text-2xl font-bold text-neutral-900">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-rei p-6">
          <div class="flex items-center">
            <div class="p-2 bg-accent-100 rounded-lg">
              <svg class="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-neutral-600">Total Earnings</p>
              <p class="text-2xl font-bold text-neutral-900">{formatCurrency(stats.totalEarnings)}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-rei p-6">
          <div class="flex items-center">
            <div class="p-2 bg-mountain-100 rounded-lg">
              <svg class="w-6 h-6 text-mountain-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-neutral-600">Completed</p>
              <p class="text-2xl font-bold text-neutral-900">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-rei p-6">
          <div class="flex items-center">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-neutral-600">Rating</p>
              <p class="text-2xl font-bold text-neutral-900">4.9</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-rei p-6">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-neutral-600">Response Rate</p>
              <p class="text-2xl font-bold text-neutral-900">98%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Reviews Section -->
      <div class="mb-8">
        <ReviewRequestsList
          maxRequests={3}
          showTitle={true}
          compact={false}
          on:writeReview={handleWriteReview}
          on:requestsLoaded={handleRequestsLoaded}
        />
      </div>

      <!-- Recent Activity & Upcoming Rentals -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Recent Activity -->
        <div class="bg-white rounded-xl shadow-rei p-6">
          <h3 class="text-lg font-bold text-neutral-900 mb-6">Recent Activity</h3>
          <div class="space-y-4">
            {#each dashboardData.recentActivity as activity}
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-neutral-900">{activity.message}</p>
                  <p class="text-xs text-neutral-500 mt-1">{activity.time}</p>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(activity.status)}">
                  {activity.status}
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Upcoming Rentals -->
        <div class="bg-white rounded-xl shadow-rei p-6">
          <h3 class="text-lg font-bold text-neutral-900 mb-6">Upcoming Rentals</h3>
          <div class="space-y-4">
            {#each dashboardData.upcomingRentals as rental}
              <div class="border border-neutral-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-semibold text-neutral-900">{rental.item}</h4>
                  <span class="text-lg font-bold text-primary-600">{formatCurrency(rental.price)}/day</span>
                </div>
                <p class="text-sm text-neutral-600 mb-2">Rented to: {rental.renter}</p>
                <p class="text-xs text-neutral-500">{rental.startDate} - {rental.endDate}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-rei p-6">
        <h3 class="text-lg font-bold text-neutral-900 mb-6">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/listings/new" class="flex items-center justify-center px-6 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            List New Gear
          </a>
          <a href="/dashboard/messages" class="flex items-center justify-center px-6 py-4 bg-forest-500 text-white rounded-lg hover:bg-forest-600 transition-colors font-semibold">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            View Messages
          </a>
          <a href="/gear" class="flex items-center justify-center px-6 py-4 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors font-semibold">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Gear
          </a>
          <a href="/dashboard/profile" class="flex items-center justify-center px-6 py-4 bg-mountain-500 text-white rounded-lg hover:bg-mountain-600 transition-colors font-semibold">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Edit Profile
          </a>
        </div>
      </div>
    </div>
  </main>
{/if}

<Footer />
