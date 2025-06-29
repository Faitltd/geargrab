<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/scroll-linked-sequential.svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { isCurrentUserAdmin } from '$lib/auth/admin';
  import ProfileCompletionWidget from '$lib/components/profile/profile-completion-widget.svelte';

  let isAdmin = false;

  // Navigate to create listing
  function goToCreateListing() {
    goto('/list-gear');
  }

  // Check admin status
  onMount(async () => {
    try {
      await simpleAuth.waitForAuthReady();
      if (simpleAuth.user) {
        isAdmin = await isCurrentUserAdmin();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  });
</script>

<div class="space-y-8">
  <!-- Profile Completion Widget -->
  <ProfileCompletionWidget compact={true} />

  <!-- Dashboard Overview -->
  <ScrollLinkedSequential animation="fade-up" baseDelay="{0.1}" incrementDelay="{0.15}" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" startOffset="{0}" endOffset="{0.6}">
      <!-- Active Bookings Card -->
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/20 transition-all duration-300">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-500/30 shadow-lg">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-300 truncate drop-shadow-lg">Active Bookings</dt>
              <dd class="text-2xl font-bold text-white drop-shadow-lg">2</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <a href="/dashboard/renter" class="text-green-400 hover:text-green-300 text-sm font-medium drop-shadow-lg">View all bookings →</a>
        </div>
      </div>

      <!-- Active Listings Card -->
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/20 transition-all duration-300">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-500/30 shadow-lg">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-300 truncate drop-shadow-lg">Active Listings</dt>
              <dd class="text-2xl font-bold text-white drop-shadow-lg">3</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <a href="/dashboard/owner" class="text-green-400 hover:text-green-300 text-sm font-medium drop-shadow-lg">View all listings →</a>
        </div>
      </div>

      <!-- Active Sales Card -->
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/20 transition-all duration-300">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-blue-500/30 shadow-lg">
              <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-300 truncate drop-shadow-lg">Active Sales</dt>
              <dd class="text-2xl font-bold text-white drop-shadow-lg">1</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <a href="/dashboard/sales" class="text-blue-400 hover:text-blue-300 text-sm font-medium drop-shadow-lg">View all sales →</a>
        </div>
      </div>

      <!-- Guide Profiles Card -->
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/20 transition-all duration-300">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-purple-500/30 shadow-lg">
              <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-300 truncate drop-shadow-lg">Guide Profiles</dt>
              <dd class="text-2xl font-bold text-white drop-shadow-lg">0</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <a href="/dashboard/guides" class="text-purple-400 hover:text-purple-300 text-sm font-medium drop-shadow-lg">View guide profiles →</a>
        </div>
      </div>

      <!-- Verification Status Card -->
      <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/20 transition-all duration-300">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-500/30 shadow-lg">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-300 truncate drop-shadow-lg">Verification</dt>
              <dd class="text-2xl font-bold text-white drop-shadow-lg">Verified</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-gray-300 text-sm drop-shadow-lg">All set!</span>
        </div>
      </div>
    </ScrollLinkedSequential>

  <!-- Admin Section (only visible to admins) -->
  {#if isAdmin}
    <ScrollLinkedAnimator animation="fade-up" startOffset="{0.15}" endOffset="{0.65}">
      <div class="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl border border-yellow-500/30 shadow-lg">
        <div class="px-6 py-4 border-b border-yellow-500/20">
          <h2 class="text-lg font-medium text-yellow-400 drop-shadow-lg flex items-center">
            ⚡ Admin Panel
            <span class="ml-2 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">ADMIN</span>
          </h2>
        </div>
        <div class="p-6">
          <ScrollLinkedSequential animation="fade-up" baseDelay="{0.1}" incrementDelay="{0.1}" className="grid grid-cols-1 md:grid-cols-4 gap-4" startOffset="{0.1}" endOffset="{0.8}">
            <a
              href="/admin"
              class="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Admin Dashboard
            </a>
            <a
              href="/admin/users"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
              Manage Users
            </a>
            <a
              href="/admin/listings"
              class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              Manage Listings
            </a>
            <a
              href="/admin/bookings"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Manage Bookings
            </a>
          </ScrollLinkedSequential>
        </div>
      </div>
    </ScrollLinkedAnimator>
  {/if}

  <!-- Quick Actions -->
  <ScrollLinkedAnimator animation="fade-up" startOffset="{0.2}" endOffset="{0.7}">
    <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
      <div class="px-6 py-4 border-b border-white/20">
        <h2 class="text-lg font-medium text-white drop-shadow-lg">Quick Actions</h2>
      </div>
      <div class="p-6">
        <ScrollLinkedSequential animation="fade-up" baseDelay="{0.1}" incrementDelay="{0.1}" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" startOffset="{0.1}" endOffset="{0.8}">
          <button
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105"
            on:click="{goToCreateListing}"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            List New Gear
          </button>
          <a href="/sell-gear" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
            Sell Gear
          </a>
          <a href="/become-guide" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Become Guide
          </a>
          <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Browse Gear
          </a>
          <a href="/messages" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            View Messages
          </a>
        </ScrollLinkedSequential>
      </div>
    </div>
  </ScrollLinkedAnimator>
</div>
