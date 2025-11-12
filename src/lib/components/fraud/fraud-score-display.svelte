<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  
  export let bookingId: string;
  export let showDetails = false; // Only show details to admins
  export let compact = false;

  let fraudScore: any = null;
  let loading = true;
  let error = '';

  $: currentUser = $authStore.user;

  onMount(() => {
    if (bookingId) {
      loadFraudScore();
    }
  });

  async function loadFraudScore() {
    try {
      loading = true;
      error = '';

      const response = await fetch(`/api/fraud/analyze?bookingId=${bookingId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data.fraudScores.length > 0) {
          fraudScore = data.data.fraudScores[0];
        }
      } else if (response.status !== 404) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load fraud score');
      }

    } catch (err) {
      console.error('Error loading fraud score:', err);
      error = err.message || 'Failed to load fraud score';
    } finally {
      loading = false;
    }
  }

  function getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return 'text-green-300 bg-green-500/20 border-green-500/30';
      case 'medium': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30';
      case 'high': return 'text-orange-300 bg-orange-500/20 border-orange-500/30';
      case 'critical': return 'text-red-300 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
    }
  }

  function getRiskIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      case 'critical': return '🔴';
      default: return '❓';
    }
  }

  function getSecurityMessage(riskLevel: string, actions: any): string {
    if (actions?.blocked) {
      return 'This booking has been blocked for security reasons';
    } else if (actions?.flagged) {
      return 'This booking is under security review';
    } else if (riskLevel === 'low') {
      return 'This booking passed all security checks';
    } else {
      return 'Additional security verification may be required';
    }
  }

  function getSignalIcon(signalType: string): string {
    const icons = {
      'rapid_bookings': '⚡',
      'new_user_high_value': '🆕',
      'multiple_failed_payments': '💳',
      'impossible_travel': '✈️',
      'vpn_or_proxy': '🔒',
      'device_fingerprint_mismatch': '📱',
      'suspicious_user_agent': '🤖',
      'copy_paste_messages': '📋',
      'payment_method_cycling': '🔄',
      'chargeback_history': '⚠️'
    };
    return icons[signalType] || '🚨';
  }

  function formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

{#if loading}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3">
    <div class="flex items-center">
      <div class="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full mr-2"></div>
      <span class="text-white text-xs">Checking security...</span>
    </div>
  </div>

{:else if error && showDetails}
  <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
    <p class="text-red-300 text-xs">{error}</p>
  </div>

{:else if fraudScore}
  <!-- Fraud Score Display -->
  {#if compact}
    <!-- Compact Display -->
    <div class="flex items-center space-x-2">
      <div class="w-6 h-6 rounded-full flex items-center justify-center {getRiskColor(fraudScore.riskLevel)}">
        <span class="text-xs">{getRiskIcon(fraudScore.riskLevel)}</span>
      </div>
      <span class="text-white text-sm">Security Verified</span>
      {#if fraudScore.actions?.flagged}
        <span class="text-yellow-300 text-xs">Under Review</span>
      {/if}
    </div>
  {:else}
    <!-- Full Display -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
      
      <!-- Security Status Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center {getRiskColor(fraudScore.riskLevel)}">
            <span class="text-sm">{getRiskIcon(fraudScore.riskLevel)}</span>
          </div>
          <div>
            <h4 class="text-white font-semibold">Security Check</h4>
            <p class="text-gray-300 text-sm">AI-powered fraud detection</p>
          </div>
        </div>
        
        {#if showDetails}
          <div class="text-right">
            <div class="px-3 py-1 rounded-full border {getRiskColor(fraudScore.riskLevel)} text-sm font-medium">
              {fraudScore.riskLevel.toUpperCase()}
            </div>
            <p class="text-gray-400 text-xs mt-1">
              Score: {fraudScore.totalScore}/100
            </p>
          </div>
        {/if}
      </div>

      <!-- Security Message -->
      <div class="mb-3">
        <p class="text-gray-300 text-sm">{getSecurityMessage(fraudScore.riskLevel, fraudScore.actions)}</p>
      </div>

      {#if showDetails}
        <!-- Detailed Information (Admin Only) -->
        <div class="border-t border-white/20 pt-3">
          <div class="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <p class="text-gray-400">Risk Score</p>
              <p class="text-white font-medium">{fraudScore.totalScore}/100</p>
            </div>
            <div>
              <p class="text-gray-400">Confidence</p>
              <p class="text-white">{(fraudScore.confidence * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p class="text-gray-400">User Type</p>
              <p class="text-white">{fraudScore.userType.charAt(0).toUpperCase() + fraudScore.userType.slice(1)}</p>
            </div>
            <div>
              <p class="text-gray-400">Analyzed</p>
              <p class="text-white">{formatDate(fraudScore.analysis?.analyzedAt)}</p>
            </div>
          </div>

          <!-- Fraud Signals -->
          {#if fraudScore.signals && fraudScore.signals.length > 0}
            <div class="mb-3">
              <h5 class="text-white font-medium mb-2">Detected Signals ({fraudScore.signals.length})</h5>
              <div class="space-y-2">
                {#each fraudScore.signals.slice(0, 5) as signal}
                  <div class="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm">{getSignalIcon(signal.type)}</span>
                      <span class="text-gray-300 text-sm">{signal.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="px-2 py-1 rounded text-xs {getRiskColor(signal.severity)}">
                        {signal.severity.toUpperCase()}
                      </span>
                      <span class="text-white text-sm font-medium">{signal.score}</span>
                    </div>
                  </div>
                {/each}
                {#if fraudScore.signals.length > 5}
                  <p class="text-gray-400 text-xs">+{fraudScore.signals.length - 5} more signals</p>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Actions Taken -->
          <div class="mb-3">
            <h5 class="text-white font-medium mb-2">Security Actions</h5>
            <div class="flex flex-wrap gap-2">
              {#if fraudScore.actions?.blocked}
                <span class="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">🚫 Blocked</span>
              {/if}
              {#if fraudScore.actions?.flagged}
                <span class="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">🚩 Flagged</span>
              {/if}
              {#if fraudScore.actions?.requiresReview}
                <span class="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded">👁️ Under Review</span>
              {/if}
              {#if !fraudScore.actions?.blocked && !fraudScore.actions?.flagged}
                <span class="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">✅ Cleared</span>
              {/if}
            </div>
          </div>

          <!-- Admin Override -->
          {#if fraudScore.adminOverride}
            <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <h5 class="text-blue-300 font-medium mb-1">Admin Override</h5>
              <p class="text-blue-200 text-sm">
                Action: {fraudScore.adminOverride.action}
                {#if fraudScore.adminOverride.notes}
                  <br>Notes: {fraudScore.adminOverride.notes}
                {/if}
              </p>
            </div>
          {/if}
        </div>
      {:else}
        <!-- User-Friendly Information -->
        <div class="border-t border-white/20 pt-3">
          {#if fraudScore.actions?.blocked}
            <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div class="flex items-start">
                <span class="text-red-400 mr-3 mt-0.5">🚫</span>
                <div>
                  <p class="text-red-300 font-medium">Booking Blocked</p>
                  <p class="text-red-200 text-sm mt-1">
                    This booking has been blocked due to security concerns. Please contact support if you believe this is an error.
                  </p>
                </div>
              </div>
            </div>
          {:else if fraudScore.actions?.flagged}
            <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div class="flex items-start">
                <span class="text-yellow-400 mr-3 mt-0.5">⚠️</span>
                <div>
                  <p class="text-yellow-300 font-medium">Under Security Review</p>
                  <p class="text-yellow-200 text-sm mt-1">
                    This booking is being reviewed by our security team. You'll be notified once the review is complete.
                  </p>
                </div>
              </div>
            </div>
          {:else}
            <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div class="flex items-start">
                <span class="text-green-400 mr-3 mt-0.5">✅</span>
                <div>
                  <p class="text-green-300 font-medium">Security Verified</p>
                  <p class="text-green-200 text-sm mt-1">
                    This booking has passed all security checks and is safe to proceed.
                  </p>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}

    </div>
  {/if}

{:else if !loading}
  <!-- No Fraud Score (Clean Booking) -->
  {#if !compact}
    <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
      <div class="flex items-center">
        <span class="text-green-400 mr-3">✅</span>
        <div>
          <p class="text-green-300 text-sm font-medium">Security Verified</p>
          <p class="text-green-200 text-xs">No security concerns detected</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex items-center space-x-2">
      <div class="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
        <span class="text-green-400 text-xs">✅</span>
      </div>
      <span class="text-white text-sm">Security Verified</span>
    </div>
  {/if}
{/if}
