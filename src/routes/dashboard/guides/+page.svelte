<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { getGuidesByUserId, getGuideBookings, updateGuide, deleteGuide } from '$lib/firebase/db/guides';
  import { toastNotifications } from '$lib/stores/notifications';
  import type { Guide, GuideBooking } from '$lib/types/firestore';
  import { GUIDE_SPECIALTIES } from '$lib/constants';

  let guides: Guide[] = [];
  let guideBookings: GuideBooking[] = [];
  let loading = false;
  let totalEarnings = 0;
  let totalBookings = 0;
  let totalClients = 0;

  $: authState = simpleAuth.authState;

  // Load user's guide profiles and bookings
  async function loadUserGuides() {
    if (!$authState.isAuthenticated || !$authState.user) {
      console.log('User not authenticated, cannot load guides');
      return;
    }

    try {
      loading = true;
      console.log('Loading guides for user:', $authState.user.uid);

      // Load guide profiles
      const guidesResult = await getGuidesByUserId($authState.user.uid, 50);
      guides = guidesResult.guides;

      // Load guide bookings if user has guide profiles
      if (guides.length > 0) {
        const bookingsResult = await getGuideBookings({ guideId: $authState.user.uid }, 50);
        guideBookings = bookingsResult.bookings;

        // Calculate totals
        totalBookings = guideBookings.filter(booking => booking.status === 'completed').length;
        totalEarnings = guideBookings
          .filter(booking => booking.status === 'completed')
          .reduce((sum, booking) => sum + booking.totalPrice, 0);
        
        // Count unique clients
        const uniqueClients = new Set(
          guideBookings
            .filter(booking => booking.status === 'completed')
            .map(booking => booking.clientId)
        );
        totalClients = uniqueClients.size;
      }

      console.log(`Loaded ${guides.length} guide profiles and ${guideBookings.length} bookings`);

    } catch (error) {
      console.error('Error loading guides:', error);
      toastNotifications.error('Failed to load your guide profiles. Please try again.');
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await loadUserGuides();
  });

  function goToCreateGuide() {
    goto('/become-guide');
  }

  async function toggleGuideStatus(guide: Guide) {
    try {
      const newStatus = guide.isActive ? 'inactive' : 'active';
      await updateGuide(guide.id, {
        status: newStatus,
        isActive: newStatus === 'active'
      });
      
      // Update local state
      guides = guides.map(g => 
        g.id === guide.id 
          ? { ...g, status: newStatus, isActive: newStatus === 'active' }
          : g
      );
      
      toastNotifications.success(`Guide profile ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating guide status:', error);
      toastNotifications.error('Failed to update guide status');
    }
  }

  async function handleDeleteGuide(guide: Guide) {
    if (!confirm(`Are you sure you want to delete your guide profile "${guide.displayName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteGuide(guide.id);
      guides = guides.filter(g => g.id !== guide.id);
      toastNotifications.success('Guide profile deleted successfully');
    } catch (error) {
      console.error('Error deleting guide:', error);
      toastNotifications.error('Failed to delete guide profile');
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
      case 'pending': return 'text-yellow-400';
      case 'inactive': return 'text-gray-400';
      case 'suspended': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'suspended': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  function getSpecialtyName(specialtyId: string): string {
    const specialty = GUIDE_SPECIALTIES.find(s => s.id === specialtyId);
    return specialty?.name || specialtyId;
  }

  function getSpecialtyIcon(specialtyId: string): string {
    const specialty = GUIDE_SPECIALTIES.find(s => s.id === specialtyId);
    return specialty?.icon || '🎯';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">My Guide Profiles</h1>
        <p class="text-gray-300 mt-1">Manage your guide services and bookings</p>
      </div>
      <button
        on:click={goToCreateGuide}
        class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Become a Guide
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Completed Sessions</dt>
            <dd class="text-lg font-medium text-white">{totalBookings}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Total Clients</dt>
            <dd class="text-lg font-medium text-white">{totalClients}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  <!-- Guide Profiles List -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
    <div class="px-6 py-4 border-b border-white/20">
      <h2 class="text-lg font-medium text-white">Your Guide Profiles ({guides.length})</h2>
    </div>

    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    {:else if guides.length === 0}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-white">No guide profiles yet</h3>
        <p class="mt-1 text-sm text-gray-400">Get started by creating your first guide profile.</p>
        <div class="mt-6">
          <button
            on:click={goToCreateGuide}
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Create Guide Profile
          </button>
        </div>
      </div>
    {:else}
      <!-- Guide Profiles Table -->
      <div class="overflow-hidden">
        <div class="grid grid-cols-1 gap-6 p-6">
          {#each guides as guide}
            <div class="border border-white/20 rounded-lg p-6 hover:bg-white/5 transition-all bg-white/5">
              <div class="space-y-4">
                <!-- Top Row: Name, Status, Actions -->
                <div class="flex items-start gap-4">
                  <!-- Avatar placeholder -->
                  <div class="flex-shrink-0">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-lg flex items-center justify-center">
                      <span class="text-2xl">👨‍🏫</span>
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <div>
                        <h3 class="text-lg font-medium text-white">{guide.displayName}</h3>
                        <p class="text-sm text-gray-300 mt-1">{guide.experience} • {guide.location.city}, {guide.location.state}</p>
                      </div>
                      <div class="flex items-center space-x-2 ml-4">
                        <span class="px-2 py-1 text-xs font-medium rounded-full border {getStatusBadgeColor(guide.status)}">
                          {guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}
                        </span>
                        {#if guide.isVerified}
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                            ✓ Verified
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bio -->
                <p class="text-white/60 text-sm">{guide.bio}</p>

                <!-- Specialties -->
                <div class="flex flex-wrap gap-2">
                  {#each guide.specialties as specialty}
                    <span class="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded flex items-center gap-1">
                      {getSpecialtyIcon(specialty)}
                      {getSpecialtyName(specialty)}
                    </span>
                  {/each}
                </div>

                <!-- Details Row -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-gray-400">Hourly Rate:</span>
                    <span class="text-white font-medium ml-1">{formatPrice(guide.hourlyRate)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Bookings:</span>
                    <span class="text-white font-medium ml-1">{guide.totalBookings || 0}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Rating:</span>
                    <span class="text-white font-medium ml-1">{guide.avgRating ? guide.avgRating.toFixed(1) : 'N/A'}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Response:</span>
                    <span class="text-white font-medium ml-1">{guide.responseTime}</span>
                  </div>
                </div>

                <!-- Actions Row -->
                <div class="flex flex-wrap gap-2 pt-2">
                  <button
                    on:click={() => toggleGuideStatus(guide)}
                    class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    disabled={guide.status === 'suspended'}
                  >
                    {guide.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    class="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    on:click={() => handleDeleteGuide(guide)}
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
