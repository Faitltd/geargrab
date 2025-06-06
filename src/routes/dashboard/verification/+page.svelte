<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { verificationService, type UserVerificationStatus, VERIFICATION_REQUIREMENTS } from '$lib/services/verification';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let verificationStatus: UserVerificationStatus | null = null;
  let loading = true;

  onMount(async () => {
    if (!$authStore.user) {
      goto('/auth/login');
      return;
    }
    
    await loadVerificationStatus();
  });

  async function loadVerificationStatus() {
    try {
      loading = true;
      verificationStatus = await verificationService.getUserVerificationStatus($authStore.user!.uid);
    } catch (error) {
      console.error('Error loading verification status:', error);
      notifications.add({
        message: 'Error loading verification status',
        type: 'error'
      });
    } finally {
      loading = false;
    }
  }

  function getVerificationLevelProgress(level: string): number {
    if (!verificationStatus) return 0;
    
    const requirements = VERIFICATION_REQUIREMENTS[level] || [];
    const completed = requirements.filter(req => 
      verificationStatus!.verifiedMethods[req.type as keyof typeof verificationStatus.verifiedMethods]
    ).length;
    
    return Math.round((completed / requirements.length) * 100);
  }

  function getOverallProgress(): number {
    if (!verificationStatus) return 0;
    
    const methods = Object.values(verificationStatus.verifiedMethods);
    const completed = methods.filter(Boolean).length;
    return Math.round((completed / methods.length) * 100);
  }

  function getVerificationLevelColor(level: string): string {
    switch (level) {
      case 'none': return 'text-gray-400';
      case 'basic': return 'text-green-400';
      case 'standard': return 'text-green-400';
      case 'premium': return 'text-green-400';
      default: return 'text-gray-400';
    }
  }

  function getStatusIcon(verified: boolean, pending = false): string {
    if (pending) return '⏳';
    return verified ? '✅' : '⭕';
  }

  function getStatusText(verified: boolean, pending = false): string {
    if (pending) return 'Pending';
    return verified ? 'Verified' : 'Not Verified';
  }

  function getStatusColor(verified: boolean, pending = false): string {
    if (pending) return 'text-yellow-400';
    return verified ? 'text-green-400' : 'text-gray-400';
  }
</script>

<svelte:head>
  <title>Verification Dashboard - GearGrab</title>
</svelte:head>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
      <p class="text-white">Loading verification status...</p>
    </div>
  </div>
{:else if verificationStatus}
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Verification Dashboard</h1>
          <p class="text-gray-300 mt-1">Build trust and unlock premium features</p>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold {getVerificationLevelColor(verificationStatus.verificationLevel)}">
            {verificationStatus.verificationLevel.charAt(0).toUpperCase() + verificationStatus.verificationLevel.slice(1)}
          </div>
          <div class="text-sm text-gray-300">Verification Level</div>
        </div>
      </div>
    </div>

    <!-- Overall Progress -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-white">Overall Progress</h2>
        <div class="text-right">
          <div class="text-lg font-bold text-white">{getOverallProgress()}%</div>
          <div class="text-sm text-gray-300">Complete</div>
        </div>
      </div>
      
      <div class="w-full bg-gray-700 rounded-full h-3 mb-4">
        <div 
          class="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
          style="width: {getOverallProgress()}%"
        ></div>
      </div>

      <div class="text-center">
        <div class="text-3xl font-bold text-white mb-2">{verificationStatus.verificationScore}/100</div>
        <div class="text-gray-300">Trust Score</div>
      </div>
    </div>

    <!-- Verification Methods -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-6">Verification Methods</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Email Verification -->
        <div class="bg-white/5 rounded-lg p-4 border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">📧</span>
              <div>
                <h3 class="font-medium text-white">Email Verification</h3>
                <p class="text-sm text-gray-300">Verify your email address</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg">{getStatusIcon(verificationStatus.verifiedMethods.email)}</div>
              <div class="text-xs {getStatusColor(verificationStatus.verifiedMethods.email)}">
                {getStatusText(verificationStatus.verifiedMethods.email)}
              </div>
            </div>
          </div>
          {#if !verificationStatus.verifiedMethods.email}
            <button class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              Verify Email
            </button>
          {/if}
        </div>

        <!-- Phone Verification -->
        <div class="bg-white/5 rounded-lg p-4 border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">📱</span>
              <div>
                <h3 class="font-medium text-white">Phone Verification</h3>
                <p class="text-sm text-gray-300">Verify your phone number</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg">{getStatusIcon(verificationStatus.verifiedMethods.phone)}</div>
              <div class="text-xs {getStatusColor(verificationStatus.verifiedMethods.phone)}">
                {getStatusText(verificationStatus.verifiedMethods.phone)}
              </div>
            </div>
          </div>
          {#if !verificationStatus.verifiedMethods.phone}
            <button class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              Verify Phone
            </button>
          {/if}
        </div>

        <!-- Identity Verification -->
        <div class="bg-white/5 rounded-lg p-4 border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🆔</span>
              <div>
                <h3 class="font-medium text-white">Identity Verification</h3>
                <p class="text-sm text-gray-300">Upload government-issued ID</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg">{getStatusIcon(verificationStatus.verifiedMethods.identity)}</div>
              <div class="text-xs {getStatusColor(verificationStatus.verifiedMethods.identity)}">
                {getStatusText(verificationStatus.verifiedMethods.identity)}
              </div>
            </div>
          </div>
          {#if !verificationStatus.verifiedMethods.identity}
            <button class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              Upload ID
            </button>
          {/if}
        </div>

        <!-- Payment Verification -->
        <div class="bg-white/5 rounded-lg p-4 border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">💳</span>
              <div>
                <h3 class="font-medium text-white">Payment Verification</h3>
                <p class="text-sm text-gray-300">Verify payment method</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg">{getStatusIcon(verificationStatus.verifiedMethods.payment)}</div>
              <div class="text-xs {getStatusColor(verificationStatus.verifiedMethods.payment)}">
                {getStatusText(verificationStatus.verifiedMethods.payment)}
              </div>
            </div>
          </div>
          {#if !verificationStatus.verifiedMethods.payment}
            <button class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              Add Payment Method
            </button>
          {/if}
        </div>

        <!-- Address Verification -->
        <div class="bg-white/5 rounded-lg p-4 border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🏠</span>
              <div>
                <h3 class="font-medium text-white">Address Verification</h3>
                <p class="text-sm text-gray-300">Verify your home address</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg">{getStatusIcon(verificationStatus.verifiedMethods.address)}</div>
              <div class="text-xs {getStatusColor(verificationStatus.verifiedMethods.address)}">
                {getStatusText(verificationStatus.verifiedMethods.address)}
              </div>
            </div>
          </div>
          {#if !verificationStatus.verifiedMethods.address}
            <button class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
              Verify Address
            </button>
          {/if}
        </div>

        <!-- Background Check -->
        <div class="bg-white/5 rounded-lg p-4 border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🛡️</span>
              <div>
                <h3 class="font-medium text-white">Background Check</h3>
                <p class="text-sm text-gray-300">Complete background verification</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg">
                {getStatusIcon(
                  verificationStatus.verifiedMethods.background_check,
                  verificationStatus.backgroundCheckStatus?.status === 'pending' || verificationStatus.backgroundCheckStatus?.status === 'in_progress'
                )}
              </div>
              <div class="text-xs {getStatusColor(
                verificationStatus.verifiedMethods.background_check,
                verificationStatus.backgroundCheckStatus?.status === 'pending' || verificationStatus.backgroundCheckStatus?.status === 'in_progress'
              )}">
                {getStatusText(
                  verificationStatus.verifiedMethods.background_check,
                  verificationStatus.backgroundCheckStatus?.status === 'pending' || verificationStatus.backgroundCheckStatus?.status === 'in_progress'
                )}
              </div>
            </div>
          </div>
          {#if !verificationStatus.verifiedMethods.background_check && verificationStatus.backgroundCheckStatus?.status !== 'pending' && verificationStatus.backgroundCheckStatus?.status !== 'in_progress'}
            <a 
              href="/dashboard/verification/background-check"
              class="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm text-center"
            >
              Start Background Check
            </a>
          {:else if verificationStatus.backgroundCheckStatus?.status === 'pending' || verificationStatus.backgroundCheckStatus?.status === 'in_progress'}
            <div class="w-full bg-yellow-600/20 border border-yellow-600/30 text-yellow-200 font-medium py-2 px-4 rounded-lg text-sm text-center">
              Check in Progress
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Verification Badges -->
    {#if verificationStatus.badges.length > 0}
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Your Badges</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {#each verificationStatus.badges as badge}
            <div class="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div class="text-3xl mb-2">{badge.icon}</div>
              <div class="font-medium text-white text-sm">{badge.name}</div>
              <div class="text-xs text-gray-300 mt-1">{badge.description}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Benefits -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Verification Benefits</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="text-3xl mb-2">🔒</div>
          <h3 class="font-medium text-white mb-2">Enhanced Security</h3>
          <p class="text-sm text-gray-300">Protect your account and build trust with other users</p>
        </div>
        <div class="text-center">
          <div class="text-3xl mb-2">💰</div>
          <h3 class="font-medium text-white mb-2">Lower Deposits</h3>
          <p class="text-sm text-gray-300">Reduce security deposits required for gear rentals</p>
        </div>
        <div class="text-center">
          <div class="text-3xl mb-2">⭐</div>
          <h3 class="font-medium text-white mb-2">Priority Access</h3>
          <p class="text-sm text-gray-300">Get priority booking for premium gear and exclusive items</p>
        </div>
      </div>
    </div>
  </div>
{/if}
