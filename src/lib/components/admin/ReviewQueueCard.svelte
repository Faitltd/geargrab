<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { showToast } from '$lib/stores/toast.store';
  import { 
    removeListing,
    banUser,
    logAdminAction,
    type ReviewQueueItem 
  } from '$lib/services/admin.service';
  import Button from '$lib/components/ui/Button.svelte';

  export let item: ReviewQueueItem;
  export let compact: boolean = false;

  const dispatch = createEventDispatcher<{
    action: void;
  }>();

  let isProcessing = false;
  let showActionModal = false;
  let selectedAction = '';
  let actionReason = '';

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'flagged': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'listing': return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16';
      case 'user': return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      case 'review': return 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';
      case 'message': return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
      default: return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
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

  function openActionModal() {
    showActionModal = true;
    selectedAction = '';
    actionReason = '';
  }

  function closeActionModal() {
    showActionModal = false;
    selectedAction = '';
    actionReason = '';
  }

  async function handleAction() {
    if (!selectedAction || !actionReason) {
      showToast('error', 'Please select an action and provide a reason');
      return;
    }

    if (!item.id) return;

    try {
      isProcessing = true;

      switch (selectedAction) {
        case 'approve':
          await approveItem();
          break;
        case 'reject':
          await rejectItem();
          break;
        case 'remove_listing':
          if (item.type === 'listing') {
            await removeListing(item.itemId, actionReason);
          }
          break;
        case 'ban_user':
          if (item.type === 'user') {
            await banUser(item.itemId, actionReason);
          }
          break;
        case 'flag':
          await flagItem();
          break;
      }

      showToast('success', 'Action completed successfully');
      closeActionModal();
      dispatch('action');

    } catch (error) {
      console.error('Error processing action:', error);
      showToast('error', 'Failed to process action');
    } finally {
      isProcessing = false;
    }
  }

  async function approveItem() {
    await logAdminAction({
      action: 'approve_review_item',
      targetType: item.type as any,
      targetId: item.itemId,
      details: { reason: actionReason },
      reason: actionReason
    });
  }

  async function rejectItem() {
    await logAdminAction({
      action: 'reject_review_item',
      targetType: item.type as any,
      targetId: item.itemId,
      details: { reason: actionReason },
      reason: actionReason
    });
  }

  async function flagItem() {
    await logAdminAction({
      action: 'flag_review_item',
      targetType: item.type as any,
      targetId: item.itemId,
      details: { reason: actionReason },
      reason: actionReason
    });
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 {compact ? '' : 'p-6'}">
  <!-- Header -->
  <div class="flex items-start justify-between mb-4">
    <div class="flex items-start space-x-3">
      <!-- Type Icon -->
      <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTypeIcon(item.type)} />
        </svg>
      </div>

      <!-- Content -->
      <div class="flex-1">
        <div class="flex items-center space-x-2 mb-2">
          <h3 class="font-semibold text-gray-900 {compact ? 'text-sm' : 'text-lg'}">
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Review
          </h3>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(item.status)}">
            {item.status}
          </span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getPriorityColor(item.priority)}">
            {item.priority}
          </span>
        </div>
        
        <div class="text-sm text-gray-600 space-y-1">
          <p><span class="font-medium">Item ID:</span> {item.itemId}</p>
          <p><span class="font-medium">Type:</span> {item.itemType}</p>
          {#if item.reportReason}
            <p><span class="font-medium">Report Reason:</span> {item.reportReason}</p>
          {/if}
          {#if item.reportedBy}
            <p><span class="font-medium">Reported By:</span> {item.reportedBy}</p>
          {/if}
          <p><span class="font-medium">Created:</span> {formatDate(item.createdAt)}</p>
        </div>
      </div>
    </div>

    {#if item.status === 'pending' && !compact}
      <Button
        variant="primary"
        size="sm"
        on:click={openActionModal}
      >
        Review
      </Button>
    {/if}
  </div>

  <!-- Notes (if any) -->
  {#if item.notes && !compact}
    <div class="bg-gray-50 rounded-lg p-3">
      <h4 class="font-medium text-gray-900 mb-1">Notes</h4>
      <p class="text-sm text-gray-700">{item.notes}</p>
    </div>
  {/if}

  <!-- Review History (if reviewed) -->
  {#if item.reviewedBy && !compact}
    <div class="mt-4 bg-blue-50 rounded-lg p-3">
      <h4 class="font-medium text-blue-900 mb-1">Review History</h4>
      <div class="text-sm text-blue-800 space-y-1">
        <p><span class="font-medium">Reviewed By:</span> {item.reviewedBy}</p>
        <p><span class="font-medium">Reviewed At:</span> {formatDate(item.reviewedAt)}</p>
      </div>
    </div>
  {/if}
</div>

<!-- Action Modal -->
{#if showActionModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Review Item</h3>
      
      <form on:submit|preventDefault={handleAction} class="space-y-4">
        <!-- Action -->
        <div>
          <label for="action" class="block text-sm font-medium text-gray-700 mb-1">
            Action *
          </label>
          <select
            id="action"
            bind:value={selectedAction}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select action...</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="flag">Flag for Further Review</option>
            {#if item.type === 'listing'}
              <option value="remove_listing">Remove Listing</option>
            {/if}
            {#if item.type === 'user'}
              <option value="ban_user">Ban User</option>
            {/if}
          </select>
        </div>

        <!-- Reason -->
        <div>
          <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
            Reason *
          </label>
          <textarea
            id="reason"
            bind:value={actionReason}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Explain the decision..."
            required
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            on:click={closeActionModal}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={isProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
