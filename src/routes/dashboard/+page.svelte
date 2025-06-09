<script lang="ts">
  import { goto } from '$app/navigation';
  import ScrollLinkedAnimator from '$lib/components/layout/ScrollLinkedAnimator.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/ScrollLinkedSequential.svelte';

  // Navigate to create listing
  function goToCreateListing() {
    goto('/list-gear');
  }
</script>

<div class="space-y-8">
  <!-- Dashboard Overview -->
  <ScrollLinkedSequential animation="fade-up" baseDelay={0.1} incrementDelay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-6" startOffset={0} endOffset={0.6}>
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

  <!-- Quick Actions -->
  <ScrollLinkedAnimator animation="fade-up" startOffset={0.2} endOffset={0.7}>
    <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
      <div class="px-6 py-4 border-b border-white/20">
        <h2 class="text-lg font-medium text-white drop-shadow-lg">Quick Actions</h2>
      </div>
      <div class="p-6">
        <ScrollLinkedSequential animation="fade-up" baseDelay={0.1} incrementDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-4" startOffset={0.1} endOffset={0.8}>
          <button
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:transform hover:scale-105"
            on:click={goToCreateListing}
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            List New Gear
          </button>
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
