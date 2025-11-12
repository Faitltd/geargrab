<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  
  export let bookingId: string;
  export let showDetails = true;

  let refundCase: any = null;
  let loading = true;
  let error = '';

  $: currentUser = $authStore.user;

  onMount(() => {
    if (bookingId) {
      loadRefundStatus();
    }
  });

  async function loadRefundStatus() {
    try {
      loading = true;
      error = '';

      // Check if there's an auto-refund case for this booking
      const response = await fetch(`/api/bookings/${bookingId}/refund-status`);
      
      if (response.ok) {
        const data = await response.json();
        refundCase = data.refundCase;
      } else if (response.status !== 404) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load refund status');
      }

    } catch (err) {
      console.error('Error loading refund status:', err);
      error = err.message || 'Failed to load refund status';
    } finally {
      loading = false;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30';
      case 'processing': return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
      case 'completed': return 'text-green-300 bg-green-500/20 border-green-500/30';
      case 'failed': return 'text-red-300 bg-red-500/20 border-red-500/30';
      case 'cancelled': return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  }

  function getStatusMessage(status: string, trigger: any): string {
    switch (status) {
      case 'pending': return 'Your refund request is being reviewed';
      case 'processing': return 'Your refund is being processed';
      case 'completed': return 'Your refund has been completed';
      case 'failed': return 'There was an issue processing your refund';
      case 'cancelled': return 'The refund request was cancelled';
      default: return 'Unknown refund status';
    }
  }

  function getTriggerIcon(type: string): string {
    switch (type) {
      case 'no_response': return '📵';
      case 'no_show': return '👻';
      case 'cancelled_late': return '⏰';
      case 'unresponsive_during_rental': return '🔇';
      default: return '❓';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getEstimatedRefundTime(status: string): string {
    switch (status) {
      case 'pending': return '1-2 business days';
      case 'processing': return '3-5 business days';
      case 'completed': return 'Complete';
      default: return 'Unknown';
    }
  }
</script>

{#if loading}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
    <div class="flex items-center">
      <div class="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full mr-3"></div>
      <span class="text-white text-sm">Checking refund status...</span>
    </div>
  </div>

{:else if error}
  <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
    <p class="text-red-300 text-sm">{error}</p>
  </div>

{:else if refundCase}
  <!-- Auto-Refund Case Found -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
    
    <!-- Status Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center {getStatusColor(refundCase.status)}">
          <span class="text-sm">{getStatusIcon(refundCase.status)}</span>
        </div>
        <div>
          <h4 class="text-white font-semibold">Automatic Refund</h4>
          <p class="text-gray-300 text-sm">{refundCase.gearTitle}</p>
        </div>
      </div>
      
      <div class="text-right">
        <div class="px-3 py-1 rounded-full border {getStatusColor(refundCase.status)} text-sm font-medium">
          {refundCase.status.replace('_', ' ').toUpperCase()}
        </div>
        <p class="text-gray-400 text-xs mt-1">
          {formatCurrency(refundCase.refundAmount)}
        </p>
      </div>
    </div>

    <!-- Refund Reason -->
    <div class="mb-4">
      <div class="flex items-center space-x-2 mb-2">
        <span class="text-lg">{getTriggerIcon(refundCase.trigger.type)}</span>
        <p class="text-white font-medium">Refund Reason</p>
      </div>
      <p class="text-gray-300 text-sm">{refundCase.trigger.description}</p>
    </div>

    <!-- Status Message -->
    <div class="mb-4">
      <p class="text-gray-300 text-sm">{getStatusMessage(refundCase.status, refundCase.trigger)}</p>
    </div>

    {#if showDetails}
      <!-- Refund Details -->
      <div class="border-t border-white/20 pt-4">
        <div class="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p class="text-gray-400">Refund Amount</p>
            <p class="text-white font-medium">{formatCurrency(refundCase.refundAmount)}</p>
          </div>
          <div>
            <p class="text-gray-400">Original Amount</p>
            <p class="text-white">{formatCurrency(refundCase.totalAmount)}</p>
          </div>
          <div>
            <p class="text-gray-400">Detected</p>
            <p class="text-white">{formatDate(refundCase.detection?.detectedAt)}</p>
          </div>
          <div>
            <p class="text-gray-400">Estimated Processing</p>
            <p class="text-white">{getEstimatedRefundTime(refundCase.status)}</p>
          </div>
        </div>

        <!-- Processing Timeline -->
        {#if refundCase.status === 'processing' || refundCase.status === 'completed'}
          <div class="mb-4">
            <h5 class="text-white font-medium mb-2">Processing Timeline</h5>
            <div class="space-y-2">
              <!-- Detected -->
              <div class="flex items-center space-x-3">
                <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                <div class="flex-1">
                  <p class="text-white text-sm">Issue Detected</p>
                  <p class="text-gray-400 text-xs">{formatDate(refundCase.detection?.detectedAt)}</p>
                </div>
              </div>
              
              <!-- Processing -->
              {#if refundCase.refund?.initiatedAt}
                <div class="flex items-center space-x-3">
                  <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div class="flex-1">
                    <p class="text-white text-sm">Refund Initiated</p>
                    <p class="text-gray-400 text-xs">{formatDate(refundCase.refund.initiatedAt)}</p>
                  </div>
                </div>
              {/if}
              
              <!-- Completed -->
              {#if refundCase.refund?.completedAt}
                <div class="flex items-center space-x-3">
                  <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div class="flex-1">
                    <p class="text-white text-sm">Refund Completed</p>
                    <p class="text-gray-400 text-xs">{formatDate(refundCase.refund.completedAt)}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Additional Information -->
        {#if refundCase.status === 'completed'}
          <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div class="flex items-start">
              <span class="text-green-400 mr-3 mt-0.5">✅</span>
              <div>
                <p class="text-green-300 font-medium">Refund Completed</p>
                <p class="text-green-200 text-sm mt-1">
                  Your refund has been processed and should appear in your account within 3-5 business days.
                  {#if refundCase.refund?.stripeRefundId}
                    Reference ID: {refundCase.refund.stripeRefundId}
                  {/if}
                </p>
              </div>
            </div>
          </div>
        {:else if refundCase.status === 'pending'}
          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div class="flex items-start">
              <span class="text-yellow-400 mr-3 mt-0.5">⏳</span>
              <div>
                <p class="text-yellow-300 font-medium">Under Review</p>
                <p class="text-yellow-200 text-sm mt-1">
                  Your refund case is being reviewed by our team. We'll process it within 1-2 business days.
                </p>
              </div>
            </div>
          </div>
        {:else if refundCase.status === 'processing'}
          <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div class="flex items-start">
              <span class="text-blue-400 mr-3 mt-0.5">🔄</span>
              <div>
                <p class="text-blue-300 font-medium">Processing Refund</p>
                <p class="text-blue-200 text-sm mt-1">
                  Your refund is being processed. It should appear in your account within 3-5 business days.
                </p>
              </div>
            </div>
          </div>
        {:else if refundCase.status === 'failed'}
          <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div class="flex items-start">
              <span class="text-red-400 mr-3 mt-0.5">❌</span>
              <div>
                <p class="text-red-300 font-medium">Refund Failed</p>
                <p class="text-red-200 text-sm mt-1">
                  There was an issue processing your refund. Our support team will contact you shortly.
                  {#if refundCase.refund?.failureReason}
                    <br>Reason: {refundCase.refund.failureReason}
                  {/if}
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Support Contact -->
    <div class="border-t border-white/20 pt-4 mt-4">
      <p class="text-gray-400 text-xs">
        Questions about your refund? 
        <a href="/contact" class="text-blue-400 hover:text-blue-300 underline">Contact Support</a>
      </p>
    </div>

  </div>
{/if}
