<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from '$lib/components/ui/Button.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import type { ReviewResponse as ReviewResponseType } from '$lib/types/reviews';

  // Props
  export let response: ReviewResponseType | undefined = undefined;
  export let canRespond: boolean = false;
  export let isOwner: boolean = false;
  export let revieweeAvatar: string | undefined = undefined;
  export let revieweeName: string = '';

  // Events
  const dispatch = createEventDispatcher<{
    addResponse: { comment: string };
    updateResponse: { comment: string };
    deleteResponse: void;
  }>();

  // State
  let isEditing = false;
  let isAdding = false;
  let responseComment = '';
  let isSubmitting = false;

  // Initialize comment when editing existing response
  $: if (isEditing && response) {
    responseComment = response.comment;
  }

  function startAdding() {
    isAdding = true;
    responseComment = '';
  }

  function startEditing() {
    isEditing = true;
    responseComment = response?.comment || '';
  }

  function cancelEdit() {
    isEditing = false;
    isAdding = false;
    responseComment = '';
  }

  async function submitResponse() {
    if (!responseComment.trim() || isSubmitting) return;

    isSubmitting = true;
    try {
      if (isEditing && response) {
        dispatch('updateResponse', { comment: responseComment.trim() });
      } else {
        dispatch('addResponse', { comment: responseComment.trim() });
      }
      
      isEditing = false;
      isAdding = false;
      responseComment = '';
    } finally {
      isSubmitting = false;
    }
  }

  function deleteResponse() {
    if (confirm('Are you sure you want to delete this response?')) {
      dispatch('deleteResponse');
    }
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  $: canSubmit = responseComment.trim().length > 0 && responseComment.trim().length <= 500;
</script>

<div class="mt-4">
  {#if response && !isEditing}
    <!-- Existing Response -->
    <div class="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500" transition:fade>
      <div class="flex items-start space-x-3">
        <Avatar
          src={revieweeAvatar}
          alt={revieweeName}
          size="sm"
          fallback={revieweeName.charAt(0).toUpperCase()}
        />
        
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <span class="font-medium text-gray-900 text-sm">{revieweeName}</span>
              <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Owner Response</span>
            </div>
            
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-500">{formatDate(response.createdAt)}</span>
              {#if isOwner}
                <button
                  on:click={startEditing}
                  class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  title="Edit response"
                >
                  Edit
                </button>
                <button
                  on:click={deleteResponse}
                  class="text-xs text-red-500 hover:text-red-700 transition-colors"
                  title="Delete response"
                >
                  Delete
                </button>
              {/if}
            </div>
          </div>
          
          <p class="text-gray-700 text-sm leading-relaxed">{response.comment}</p>
          
          {#if response.updatedAt && response.updatedAt !== response.createdAt}
            <p class="text-xs text-gray-500 mt-2 italic">
              Edited {formatDate(response.updatedAt)}
            </p>
          {/if}
        </div>
      </div>
    </div>
  {:else if (isEditing || isAdding)}
    <!-- Response Form -->
    <div class="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500" transition:fade>
      <div class="flex items-start space-x-3">
        <Avatar
          src={revieweeAvatar}
          alt={revieweeName}
          size="sm"
          fallback={revieweeName.charAt(0).toUpperCase()}
        />
        
        <div class="flex-1">
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {isEditing ? 'Edit your response' : 'Respond to this review'}
            </label>
            <textarea
              bind:value={responseComment}
              placeholder="Share your perspective or thank the reviewer..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows="3"
              maxlength="500"
              disabled={isSubmitting}
            ></textarea>
            <div class="flex justify-between items-center mt-1">
              <span class="text-xs text-gray-500">
                {responseComment.length}/500 characters
              </span>
              {#if responseComment.length > 500}
                <span class="text-xs text-red-500">Too long</span>
              {/if}
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              disabled={!canSubmit || isSubmitting}
              loading={isSubmitting}
              on:click={submitResponse}
            >
              {isEditing ? 'Update Response' : 'Post Response'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              on:click={cancelEdit}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  {:else if canRespond && !response}
    <!-- Add Response Button -->
    <div class="mt-3">
      <button
        on:click={startAdding}
        class="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center space-x-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        <span>Respond to this review</span>
      </button>
    </div>
  {/if}
</div>
