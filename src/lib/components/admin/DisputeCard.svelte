<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { showToast } from '$lib/stores/toast.store';
  import { resolveDispute, type Dispute } from '$lib/services/admin.service';
  import Button from '$lib/components/ui/Button.svelte';

  export let dispute: Dispute;
  export let compact: boolean = false;

  const dispatch = createEventDispatcher<{
    resolve: void;
  }>();

  let isResolving = false;
  let showResolutionForm = false;
  let resolutionData = {
    action: '',
    reason: '',
    compensation: 0
  };

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function openResolutionForm() {
    showResolutionForm = true;
    resolutionData = {
      action: '',
      reason: '',
      compensation: 0
    };
  }

  function closeResolutionForm() {
    showResolutionForm = false;
    resolutionData = {
      action: '',
      reason: '',
      compensation: 0
    };
  }

  async function handleResolve() {
    if (!resolutionData.action || !resolutionData.reason) {
      showToast('error', 'Please provide action and reason');
      return;
    }

    if (!dispute.id) return;

    try {
      isResolving = true;

      await resolveDispute(dispute.id, {
        action: resolutionData.action,
        reason: resolutionData.reason,
        compensation: resolutionData.compensation || undefined
      });

      showToast('success', 'Dispute resolved successfully');
      closeResolutionForm();
      dispatch('resolve');

    } catch (error) {
      console.error('Error resolving dispute:', error);
      showToast('error', 'Failed to resolve dispute');
    } finally {
      isResolving = false;
    }
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 {compact ? '' : 'p-6'}">
  <!-- Header -->
  <div class="flex items-start justify-between mb-4">
    <div class="flex-1">
      <div class="flex items-center space-x-2 mb-2">
        <h3 class="font-semibold text-gray-900 {compact ? 'text-sm' : 'text-lg'}">
          {dispute.title}
        </h3>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(dispute.status)}">
          {dispute.status}
        </span>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getPriorityColor(dispute.priority)}">
          {dispute.priority}
        </span>
      </div>
      
      <div class="text-sm text-gray-600 space-y-1">
        <p><span class="font-medium">Type:</span> {dispute.type}</p>
        <p><span class="font-medium">Reporter:</span> {dispute.reporterName}</p>
        <p><span class="font-medium">Reported User:</span> {dispute.reportedUserName}</p>
        <p><span class="font-medium">Created:</span> {formatDate(dispute.createdAt)}</p>
      </div>
    </div>

    {#if dispute.status === 'pending' && !compact}
      <Button
        variant="primary"
        size="sm"
        on:click={openResolutionForm}
      >
        Resolve
      </Button>
    {/if}
  </div>

  <!-- Description -->
  {#if !compact}
    <div class="mb-4">
      <h4 class="font-medium text-gray-900 mb-2">Description</h4>
      <p class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
        {dispute.description}
      </p>
    </div>

    <!-- Evidence -->
    {#if dispute.evidence && (dispute.evidence.photos.length > 0 || dispute.evidence.documents.length > 0)}
      <div class="mb-4">
        <h4 class="font-medium text-gray-900 mb-2">Evidence</h4>
        <div class="space-y-2">
          {#if dispute.evidence.photos.length > 0}
            <div>
              <p class="text-sm text-gray-600 mb-1">Photos ({dispute.evidence.photos.length})</p>
              <div class="flex space-x-2">
                {#each dispute.evidence.photos.slice(0, 3) as photo}
                  <img
                    src={photo}
                    alt="Evidence"
                    class="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                {/each}
                {#if dispute.evidence.photos.length > 3}
                  <div class="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <span class="text-xs text-gray-500">+{dispute.evidence.photos.length - 3}</span>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
          
          {#if dispute.evidence.documents.length > 0}
            <div>
              <p class="text-sm text-gray-600">Documents ({dispute.evidence.documents.length})</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Resolution (if resolved) -->
    {#if dispute.resolution}
      <div class="bg-green-50 rounded-lg p-4">
        <h4 class="font-medium text-green-900 mb-2">Resolution</h4>
        <div class="text-sm text-green-800 space-y-1">
          <p><span class="font-medium">Action:</span> {dispute.resolution.action}</p>
          <p><span class="font-medium">Reason:</span> {dispute.resolution.reason}</p>
          {#if dispute.resolution.compensation}
            <p><span class="font-medium">Compensation:</span> ${dispute.resolution.compensation}</p>
          {/if}
          <p><span class="font-medium">Resolved:</span> {formatDate(dispute.resolution.resolvedAt)}</p>
        </div>
      </div>
    {/if}
  {:else}
    <!-- Compact view -->
    <p class="text-sm text-gray-600 line-clamp-2">
      {dispute.description}
    </p>
  {/if}
</div>

<!-- Resolution Modal -->
{#if showResolutionForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Resolve Dispute</h3>
      
      <form on:submit|preventDefault={handleResolve} class="space-y-4">
        <!-- Action -->
        <div>
          <label for="action" class="block text-sm font-medium text-gray-700 mb-1">
            Resolution Action *
          </label>
          <select
            id="action"
            bind:value={resolutionData.action}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select action...</option>
            <option value="refund_full">Full Refund</option>
            <option value="refund_partial">Partial Refund</option>
            <option value="compensation">Compensation</option>
            <option value="warning">Warning Issued</option>
            <option value="no_action">No Action Required</option>
            <option value="escalate">Escalate to Legal</option>
          </select>
        </div>

        <!-- Reason -->
        <div>
          <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
            Reason *
          </label>
          <textarea
            id="reason"
            bind:value={resolutionData.reason}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Explain the resolution decision..."
            required
          ></textarea>
        </div>

        <!-- Compensation Amount -->
        {#if resolutionData.action === 'compensation' || resolutionData.action === 'refund_partial'}
          <div>
            <label for="compensation" class="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              id="compensation"
              type="number"
              min="0"
              step="0.01"
              bind:value={resolutionData.compensation}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        {/if}

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            on:click={closeResolutionForm}
            disabled={isResolving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={isResolving}
            disabled={isResolving}
          >
            {isResolving ? 'Resolving...' : 'Resolve Dispute'}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
