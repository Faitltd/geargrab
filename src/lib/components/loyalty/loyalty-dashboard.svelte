<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import LoyaltyBadge from './loyalty-badge.svelte';
  
  export let userId: string | null = null;

  let loyaltyStatus: any = null;
  let tierInfo: any = null;
  let allTiers: any = null;
  let progressToNext: any = null;
  let loading = true;
  let error = '';

  $: currentUser = $authStore.user;
  $: targetUserId = userId || currentUser?.uid;

  onMount(() => {
    if (targetUserId) {
      loadLoyaltyStatus();
    }
  });

  async function loadLoyaltyStatus() {
    try {
      loading = true;
      error = '';

      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`/api/loyalty/status${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load loyalty status');
      }

      const data = await response.json();
      loyaltyStatus = data.loyaltyStatus;
      tierInfo = data.tierInfo;
      allTiers = data.allTiers;
      progressToNext = data.progressToNext;

    } catch (err) {
      console.error('Error loading loyalty status:', err);
      error = err.message || 'Failed to load loyalty status';
    } finally {
      loading = false;
    }
  }

  async function refreshStatus() {
    try {
      loading = true;
      
      const response = await fetch('/api/loyalty/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'refresh',
          userId: targetUserId
        })
      });

      if (response.ok) {
        await loadLoyaltyStatus();
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
    } finally {
      loading = false;
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(0)}%`;
  }

  function getTierOrder(): string[] {
    return ['bronze', 'silver', 'gold', 'platinum'];
  }

  function getTierProgress(currentTier: string): number {
    const order = getTierOrder();
    const currentIndex = order.indexOf(currentTier);
    return ((currentIndex + 1) / order.length) * 100;
  }
</script>

{#if loading}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 text-center">
    <div class="animate-spin h-8 w-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p class="text-white">Loading loyalty status...</p>
  </div>

{:else if error}
  <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
    <p class="text-red-300 mb-4">{error}</p>
    <button 
      on:click={loadLoyaltyStatus}
      class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
    >
      Try Again
    </button>
  </div>

{:else if loyaltyStatus && tierInfo}
  <div class="space-y-6">
    
    <!-- Current Tier Status -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-4">
          <LoyaltyBadge tier={loyaltyStatus.currentTier} size="large" />
          <div>
            <h3 class="text-xl font-bold text-white">{tierInfo.name}</h3>
            <p class="text-gray-300 text-sm">{tierInfo.description}</p>
          </div>
        </div>
        <button
          on:click={refreshStatus}
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      <!-- Tier Since -->
      <div class="text-sm text-gray-300 mb-4">
        {tierInfo.name} since {formatDate(loyaltyStatus.tierSince)}
      </div>

      <!-- Benefits -->
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-300 mb-1">
            {formatPercentage(loyaltyStatus.benefits.platformFeeReduction)}
          </div>
          <div class="text-green-200 text-sm">Platform Fee Reduction</div>
        </div>
        
        <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-blue-300 mb-1">
            {formatCurrency(loyaltyStatus.benefits.totalSavings)}
          </div>
          <div class="text-blue-200 text-sm">Total Savings</div>
        </div>
        
        <div class="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-purple-300 mb-1">
            {formatCurrency(loyaltyStatus.benefits.lifetimeEarnings)}
          </div>
          <div class="text-purple-200 text-sm">Lifetime Earnings</div>
        </div>
      </div>
    </div>

    <!-- Current Performance -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h4 class="text-lg font-semibold text-white mb-4">30-Day Performance</h4>
      
      <div class="grid md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-white mb-1">
            {loyaltyStatus.metrics.completedRentals}
          </div>
          <div class="text-gray-300 text-sm">Completed Rentals</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-white mb-1">
            {loyaltyStatus.metrics.averageRating.toFixed(1)}⭐
          </div>
          <div class="text-gray-300 text-sm">Average Rating</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-white mb-1">
            {formatPercentage(loyaltyStatus.metrics.cancellationRate)}
          </div>
          <div class="text-gray-300 text-sm">Cancellation Rate</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-white mb-1">
            {loyaltyStatus.metrics.listingCount}
          </div>
          <div class="text-gray-300 text-sm">Active Listings</div>
        </div>
      </div>
    </div>

    <!-- Progress to Next Tier -->
    {#if progressToNext && progressToNext.nextTier}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h4 class="text-lg font-semibold text-white mb-4">
          Progress to {allTiers[progressToNext.nextTier].name}
        </h4>
        
        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-300 mb-2">
            <span>Overall Progress</span>
            <span>{progressToNext.progress.toFixed(0)}%</span>
          </div>
          <div class="w-full bg-white/20 rounded-full h-3">
            <div 
              class="bg-green-400 h-3 rounded-full transition-all duration-500" 
              style="width: {progressToNext.progress}%"
            ></div>
          </div>
        </div>

        <!-- Requirements -->
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Completed Rentals</span>
            <div class="text-right">
              <span class="text-white font-medium">
                {progressToNext.current.rentals} / {progressToNext.requirements.minRentals}
              </span>
              {#if progressToNext.needed.rentals > 0}
                <div class="text-yellow-300 text-sm">
                  {progressToNext.needed.rentals} more needed
                </div>
              {:else}
                <div class="text-green-300 text-sm">✓ Requirement met</div>
              {/if}
            </div>
          </div>

          {#if progressToNext.requirements.minRating}
            <div class="flex justify-between items-center">
              <span class="text-gray-300">Average Rating</span>
              <div class="text-right">
                <span class="text-white font-medium">
                  {progressToNext.current.rating.toFixed(1)} / {progressToNext.requirements.minRating}⭐
                </span>
                {#if progressToNext.needed.rating > 0}
                  <div class="text-yellow-300 text-sm">
                    +{progressToNext.needed.rating.toFixed(1)} needed
                  </div>
                {:else}
                  <div class="text-green-300 text-sm">✓ Requirement met</div>
                {/if}
              </div>
            </div>
          {/if}

          {#if progressToNext.requirements.maxCancellations}
            <div class="flex justify-between items-center">
              <span class="text-gray-300">Cancellation Rate</span>
              <div class="text-right">
                <span class="text-white font-medium">
                  {formatPercentage(progressToNext.current.cancellationRate)} / {formatPercentage(progressToNext.requirements.maxCancellations)} max
                </span>
                {#if progressToNext.needed.cancellationRate > 0}
                  <div class="text-red-300 text-sm">
                    Reduce by {formatPercentage(progressToNext.needed.cancellationRate)}
                  </div>
                {:else}
                  <div class="text-green-300 text-sm">✓ Requirement met</div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-center">
        <div class="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">👑</span>
        </div>
        <h4 class="text-lg font-semibold text-white mb-2">Maximum Tier Achieved!</h4>
        <p class="text-gray-300">
          You've reached the highest loyalty tier. Keep up the excellent work!
        </p>
      </div>
    {/if}

    <!-- Tier Benefits -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h4 class="text-lg font-semibold text-white mb-4">Your Current Benefits</h4>
      
      <div class="space-y-3">
        {#each tierInfo.benefits.specialPerks as perk}
          <div class="flex items-center">
            <span class="text-green-400 mr-3">✓</span>
            <span class="text-gray-300">{perk}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Next Evaluation -->
    <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
      <div class="flex items-center">
        <span class="text-blue-400 mr-3">📅</span>
        <div>
          <p class="text-blue-200 font-medium">Next Evaluation</p>
          <p class="text-blue-300 text-sm">
            {formatDate(loyaltyStatus.nextEvaluation)} - Tiers are evaluated weekly
          </p>
        </div>
      </div>
    </div>

  </div>
{/if}
