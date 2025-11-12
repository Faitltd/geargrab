<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  
  export let listingId: string;
  export let showDetails = true;
  export let showActions = true;

  let ownershipProof: any = null;
  let required = false;
  let loading = true;
  let error = '';

  $: currentUser = $authStore.user;

  onMount(() => {
    if (listingId) {
      loadOwnershipProof();
    }
  });

  async function loadOwnershipProof() {
    try {
      loading = true;
      error = '';

      const response = await fetch(`/api/ownership/submit?listingId=${listingId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load ownership proof');
      }

      const data = await response.json();
      ownershipProof = data.ownershipProof;
      required = data.required;

    } catch (err) {
      console.error('Error loading ownership proof:', err);
      error = err.message || 'Failed to load ownership proof';
    } finally {
      loading = false;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30';
      case 'approved': return 'text-green-300 bg-green-500/20 border-green-500/30';
      case 'rejected': return 'text-red-300 bg-red-500/20 border-red-500/30';
      case 'needs_more_info': return 'text-orange-300 bg-orange-500/20 border-orange-500/30';
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/30';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'needs_more_info': return '📝';
      default: return '❓';
    }
  }

  function getStatusMessage(status: string): string {
    switch (status) {
      case 'pending': return 'Your ownership proof is being reviewed';
      case 'approved': return 'Ownership has been verified and approved';
      case 'rejected': return 'Ownership proof was not approved';
      case 'needs_more_info': return 'Additional information is required';
      default: return 'Unknown ownership proof status';
    }
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

  function getDocumentTypeLabel(type: string): string {
    const types = {
      'receipt': '🧾 Purchase Receipt',
      'warranty': '📜 Warranty Documentation',
      'insurance': '🛡️ Insurance Documentation',
      'serial_number': '🔢 Serial Number Photo',
      'manual': '📖 Owner\'s Manual',
      'other': '📄 Other Documentation'
    };
    return types[type] || '📄 Document';
  }
</script>

{#if loading}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
    <div class="flex items-center">
      <div class="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full mr-3"></div>
      <span class="text-white text-sm">Loading ownership proof status...</span>
    </div>
  </div>

{:else if error}
  <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
    <p class="text-red-300 text-sm">{error}</p>
  </div>

{:else if !required}
  <!-- No Proof Required -->
  <div class="bg-gray-500/20 border border-gray-500/30 rounded-lg p-4">
    <div class="flex items-center">
      <span class="text-gray-400 mr-3">ℹ️</span>
      <div>
        <p class="text-gray-300 text-sm font-medium">No ownership proof required</p>
        <p class="text-gray-400 text-xs">This item doesn't require additional verification</p>
      </div>
    </div>
  </div>

{:else if !ownershipProof}
  <!-- Proof Required but Not Submitted -->
  <div class="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <span class="text-yellow-400 mr-3">⚠️</span>
        <div>
          <p class="text-yellow-300 text-sm font-medium">Ownership proof required</p>
          <p class="text-yellow-200 text-xs">This listing requires proof of ownership before it can be published</p>
        </div>
      </div>
      
      {#if showActions}
        <button class="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
          Submit Proof
        </button>
      {/if}
    </div>
  </div>

{:else}
  <!-- Proof Submitted -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
    
    <!-- Status Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center {getStatusColor(ownershipProof.status)}">
          <span class="text-sm">{getStatusIcon(ownershipProof.status)}</span>
        </div>
        <div>
          <h4 class="text-white font-semibold">Ownership Proof</h4>
          <p class="text-gray-300 text-sm">{ownershipProof.gearTitle}</p>
        </div>
      </div>
      
      <div class="text-right">
        <div class="px-3 py-1 rounded-full border {getStatusColor(ownershipProof.status)} text-sm font-medium">
          {ownershipProof.status.replace('_', ' ').toUpperCase()}
        </div>
        <p class="text-gray-400 text-xs mt-1">
          ID: {ownershipProof.id?.substring(0, 8)}...
        </p>
      </div>
    </div>

    <!-- Status Message -->
    <div class="mb-4">
      <p class="text-gray-300 text-sm">{getStatusMessage(ownershipProof.status)}</p>
    </div>

    {#if showDetails}
      <!-- Submission Details -->
      <div class="border-t border-white/20 pt-4">
        <div class="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p class="text-gray-400">Submitted</p>
            <p class="text-white">{formatDate(ownershipProof.verification?.submittedAt)}</p>
          </div>
          <div>
            <p class="text-gray-400">Documents</p>
            <p class="text-white">{ownershipProof.documents?.length || 0} uploaded</p>
          </div>
          {#if ownershipProof.verification?.reviewedAt}
            <div>
              <p class="text-gray-400">Reviewed</p>
              <p class="text-white">{formatDate(ownershipProof.verification.reviewedAt)}</p>
            </div>
          {/if}
          <div>
            <p class="text-gray-400">Gear Value</p>
            <p class="text-white">${ownershipProof.gearValue?.toLocaleString()}</p>
          </div>
        </div>

        <!-- Documents List -->
        {#if ownershipProof.documents && ownershipProof.documents.length > 0}
          <div class="mb-4">
            <h5 class="text-white font-medium mb-2">Submitted Documents</h5>
            <div class="space-y-2">
              {#each ownershipProof.documents as document}
                <div class="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span class="text-gray-300 text-sm">{getDocumentTypeLabel(document.type)}</span>
                  <span class="text-xs {document.verified ? 'text-green-400' : 'text-gray-400'}">
                    {document.verified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Review Notes -->
        {#if ownershipProof.verification?.notes}
          <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h5 class="text-blue-300 font-medium mb-1">Review Notes</h5>
            <p class="text-blue-200 text-sm">{ownershipProof.verification.notes}</p>
          </div>
        {/if}

        <!-- Rejection Reason -->
        {#if ownershipProof.status === 'rejected' && ownershipProof.verification?.rejectionReason}
          <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <h5 class="text-red-300 font-medium mb-1">Rejection Reason</h5>
            <p class="text-red-200 text-sm">{ownershipProof.verification.rejectionReason}</p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Action Buttons -->
    {#if showActions}
      <div class="border-t border-white/20 pt-4 mt-4">
        {#if ownershipProof.status === 'rejected' || ownershipProof.status === 'needs_more_info'}
          <button class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
            Submit New Proof
          </button>
        {:else if ownershipProof.status === 'pending'}
          <p class="text-gray-400 text-xs">
            You'll receive an email notification when the review is complete.
          </p>
        {:else if ownershipProof.status === 'approved'}
          <div class="flex items-center text-green-400 text-sm">
            <span class="mr-2">✅</span>
            <span>Your listing is now eligible for publication</span>
          </div>
        {/if}
      </div>
    {/if}

  </div>
{/if}
