<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { verificationService, type VerificationRequest } from '$lib/services/verification';
  import { backgroundCheckService } from '$lib/services/backgroundCheck';
  
  export let showDetails = false;
  
  let backgroundCheckRequest: VerificationRequest | null = null;
  let loading = true;
  let error = '';
  
  onMount(async () => {
    await loadBackgroundCheckStatus();
  });
  
  async function loadBackgroundCheckStatus() {
    if (!$authStore.user?.uid) return;
    
    try {
      loading = true;
      error = '';
      
      const requests = await verificationService.getUserVerificationRequests($authStore.user.uid);
      backgroundCheckRequest = requests.find(r => r.type === 'background_check') || null;
      
    } catch (err) {
      error = 'Failed to load background check status';
      console.error('Background check status error:', err);
    } finally {
      loading = false;
    }
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'in_progress': return 'text-blue-400';
      case 'rejected': return 'text-red-400';
      case 'expired': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  }
  
  function getStatusIcon(status: string): string {
    switch (status) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'rejected': return '❌';
      case 'expired': return '⚠️';
      default: return '❓';
    }
  }
  
  function getStatusText(status: string): string {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending Review';
      case 'in_progress': return 'In Progress';
      case 'rejected': return 'Rejected';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  }
  
  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function isExpiringSoon(expiresAt: Date | string): boolean {
    if (!expiresAt) return false;
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30; // Warn if expiring within 30 days
  }
  
  async function handleRenewBackgroundCheck() {
    if (!$authStore.user?.uid || !backgroundCheckRequest?.backgroundCheckData) return;
    
    try {
      await verificationService.submitBackgroundCheck(
        $authStore.user.uid,
        backgroundCheckRequest.backgroundCheckData.checkType,
        backgroundCheckRequest.backgroundCheckData.provider
      );
      
      // Reload status
      await loadBackgroundCheckStatus();
      
    } catch (err) {
      error = 'Failed to renew background check';
      console.error('Background check renewal error:', err);
    }
  }
</script>

{#if loading}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="animate-pulse">
      <div class="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
      <div class="h-3 bg-white/20 rounded w-3/4 mb-2"></div>
      <div class="h-3 bg-white/20 rounded w-1/2"></div>
    </div>
  </div>
{:else if error}
  <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
    <p class="text-red-200">{error}</p>
    <button 
      on:click="{loadBackgroundCheckStatus}"
      class="mt-2 text-red-300 hover:text-red-100 underline text-sm"
    >
      Try again
    </button>
  </div>
{:else if !backgroundCheckRequest}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-white mb-2">No Background Check</h3>
      <p class="text-gray-300 text-sm mb-4">
        You haven't completed a background check yet. Complete one to unlock premium features.
      </p>
      <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
        Start Background Check
      </button>
    </div>
  </div>
{:else}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3">
        <span class="text-2xl">{getStatusIcon(backgroundCheckRequest.status)}</span>
        <div>
          <h3 class="text-lg font-semibold text-white">Background Check</h3>
          <p class="text-sm {getStatusColor(backgroundCheckRequest.status)}">
            {getStatusText(backgroundCheckRequest.status)}
          </p>
        </div>
      </div>
      
      {#if showDetails}
        <button 
          on:click={() => showDetails = false}
          class="text-gray-400 hover:text-white"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </button>
      {:else}
        <button 
          on:click={() => showDetails = true}
          class="text-gray-400 hover:text-white"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      {/if}
    </div>
    
    <!-- Basic Info -->
    <div class="space-y-2 text-sm">
      {#if backgroundCheckRequest.backgroundCheckData}
        <div class="flex justify-between">
          <span class="text-gray-300">Type:</span>
          <span class="text-white capitalize">{backgroundCheckRequest.backgroundCheckData.checkType}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-300">Provider:</span>
          <span class="text-white capitalize">{backgroundCheckRequest.backgroundCheckData.provider}</span>
        </div>
        {#if backgroundCheckRequest.backgroundCheckData.completedAt}
          <div class="flex justify-between">
            <span class="text-gray-300">Completed:</span>
            <span class="text-white">{formatDate(backgroundCheckRequest.backgroundCheckData.completedAt)}</span>
          </div>
        {/if}
        {#if backgroundCheckRequest.backgroundCheckData.expiresAt}
          <div class="flex justify-between">
            <span class="text-gray-300">Expires:</span>
            <span class="text-white {isExpiringSoon(backgroundCheckRequest.backgroundCheckData.expiresAt) ? 'text-orange-400' : ''}">
              {formatDate(backgroundCheckRequest.backgroundCheckData.expiresAt)}
            </span>
          </div>
        {/if}
      {/if}
    </div>
    
    <!-- Expiration Warning -->
    {#if backgroundCheckRequest.backgroundCheckData?.expiresAt && isExpiringSoon(backgroundCheckRequest.backgroundCheckData.expiresAt)}
      <div class="mt-4 bg-orange-500/20 border border-orange-500/50 rounded-lg p-3">
        <div class="flex items-center space-x-2">
          <span class="text-orange-400">⚠️</span>
          <span class="text-orange-200 text-sm">Your background check expires soon. Renew to maintain verification status.</span>
        </div>
        <button 
          on:click="{handleRenewBackgroundCheck}"
          class="mt-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold py-1 px-3 rounded transition-colors"
        >
          Renew Now
        </button>
      </div>
    {/if}
    
    <!-- Detailed Results -->
    {#if showDetails && backgroundCheckRequest.backgroundCheckData?.results}
      <div class="mt-6 space-y-4">
        <h4 class="text-white font-semibold">Background Check Results</h4>
        
        {#if backgroundCheckRequest.backgroundCheckData.results.criminalHistory}
          <div class="bg-white/5 rounded-lg p-3 border border-white/10">
            <div class="flex items-center justify-between mb-2">
              <span class="text-white text-sm font-medium">Criminal History</span>
              <span class="text-xs {backgroundCheckRequest.backgroundCheckData.results.criminalHistory.status === 'clear' ? 'text-green-400' : 'text-yellow-400'}">
                {backgroundCheckRequest.backgroundCheckData.results.criminalHistory.status === 'clear' ? 'Clear' : 'Records Found'}
              </span>
            </div>
            <p class="text-gray-300 text-xs">{backgroundCheckRequest.backgroundCheckData.results.criminalHistory.details}</p>
          </div>
        {/if}
        
        {#if backgroundCheckRequest.backgroundCheckData.results.sexOffenderRegistry}
          <div class="bg-white/5 rounded-lg p-3 border border-white/10">
            <div class="flex items-center justify-between mb-2">
              <span class="text-white text-sm font-medium">Sex Offender Registry</span>
              <span class="text-xs {backgroundCheckRequest.backgroundCheckData.results.sexOffenderRegistry.status === 'clear' ? 'text-green-400' : 'text-red-400'}">
                {backgroundCheckRequest.backgroundCheckData.results.sexOffenderRegistry.status === 'clear' ? 'Clear' : 'Found'}
              </span>
            </div>
            <p class="text-gray-300 text-xs">{backgroundCheckRequest.backgroundCheckData.results.sexOffenderRegistry.details}</p>
          </div>
        {/if}
        
        {#if backgroundCheckRequest.backgroundCheckData.results.globalWatchlist}
          <div class="bg-white/5 rounded-lg p-3 border border-white/10">
            <div class="flex items-center justify-between mb-2">
              <span class="text-white text-sm font-medium">Global Watchlist</span>
              <span class="text-xs {backgroundCheckRequest.backgroundCheckData.results.globalWatchlist.status === 'clear' ? 'text-green-400' : 'text-red-400'}">
                {backgroundCheckRequest.backgroundCheckData.results.globalWatchlist.status === 'clear' ? 'Clear' : 'Found'}
              </span>
            </div>
            <p class="text-gray-300 text-xs">{backgroundCheckRequest.backgroundCheckData.results.globalWatchlist.details}</p>
          </div>
        {/if}
        
        {#if backgroundCheckRequest.backgroundCheckData.results.identityVerification}
          <div class="bg-white/5 rounded-lg p-3 border border-white/10">
            <div class="flex items-center justify-between mb-2">
              <span class="text-white text-sm font-medium">Identity Verification</span>
              <span class="text-xs {backgroundCheckRequest.backgroundCheckData.results.identityVerification.status === 'verified' ? 'text-green-400' : 'text-red-400'}">
                {backgroundCheckRequest.backgroundCheckData.results.identityVerification.status === 'verified' ? 'Verified' : 'Failed'}
              </span>
            </div>
            <div class="space-y-1">
              {#if backgroundCheckRequest.backgroundCheckData.results.identityVerification.ssnTrace}
                <p class="text-gray-300 text-xs">✓ SSN Trace Verified</p>
              {/if}
              {#if backgroundCheckRequest.backgroundCheckData.results.identityVerification.addressHistory}
                <p class="text-gray-300 text-xs">✓ Address History Verified</p>
              {/if}
            </div>
          </div>
        {/if}
        
        {#if backgroundCheckRequest.backgroundCheckData.riskLevel}
          <div class="bg-white/5 rounded-lg p-3 border border-white/10">
            <div class="flex items-center justify-between">
              <span class="text-white text-sm font-medium">Risk Level</span>
              <span class="text-xs px-2 py-1 rounded {
                backgroundCheckRequest.backgroundCheckData.riskLevel === 'low' ? 'bg-green-500/20 text-green-400' :
                backgroundCheckRequest.backgroundCheckData.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }">
                {backgroundCheckRequest.backgroundCheckData.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Action Buttons -->
    {#if backgroundCheckRequest.status === 'rejected'}
      <div class="mt-4 pt-4 border-t border-white/20">
        <button class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded transition-colors">
          Request Review
        </button>
      </div>
    {/if}
  </div>
{/if}
