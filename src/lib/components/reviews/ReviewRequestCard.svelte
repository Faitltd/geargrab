<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from '$lib/components/ui/Button.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import type { ReviewRequest } from '$lib/types/reviews';

  // Props
  export let request: ReviewRequest;
  export let compact: boolean = false;

  // Events
  const dispatch = createEventDispatcher<{
    writeReview: { request: ReviewRequest };
    dismiss: { requestId: string };
  }>();

  // Reactive statements
  $: daysLeft = getDaysUntilDue(request.dueDate);
  $: isOverdue = daysLeft < 0;
  $: isUrgent = daysLeft <= 3 && daysLeft >= 0;
  $: urgencyColor = isOverdue ? 'red' : isUrgent ? 'amber' : 'gray';
  $: reviewTypeLabel = getReviewTypeLabel(request.type);

  function getDaysUntilDue(dueDate: any): number {
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getReviewTypeLabel(type: string): string {
    switch (type) {
      case 'listing':
        return 'Review the gear';
      case 'renter':
        return 'Review as renter';
      case 'owner':
        return 'Review as owner';
      case 'buyer':
        return 'Review as buyer';
      case 'seller':
        return 'Review as seller';
      default:
        return 'Write review';
    }
  }

  function formatDueDate(dueDate: any): string {
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    
    if (isOverdue) {
      const overdueDays = Math.abs(daysLeft);
      return `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`;
    } else if (daysLeft === 0) {
      return 'Due today';
    } else if (daysLeft === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${daysLeft} days`;
    }
  }

  function handleWriteReview() {
    dispatch('writeReview', { request });
  }

  function handleDismiss() {
    dispatch('dismiss', { requestId: request.id! });
  }

  function getUrgencyClasses(): string {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (urgencyColor) {
      case 'red':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'amber':
        return `${baseClasses} bg-amber-100 text-amber-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  }
</script>

<div 
  class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
  class:border-red-200={isOverdue}
  class:border-amber-200={isUrgent}
  transition:fade
>
  <div class="p-4" class:p-3={compact}>
    <div class="flex items-start space-x-3">
      <!-- Listing Image -->
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden" class:w-10={compact} class:h-10={compact}>
          {#if request.listingImageUrl}
            <img
              src={request.listingImageUrl}
              alt={request.listingTitle}
              class="w-full h-full object-cover"
              loading="lazy"
            />
          {:else}
            <div class="w-full h-full flex items-center justify-center bg-gray-200">
              <svg class="w-6 h-6 text-gray-400" class:w-5={compact} class:h-5={compact} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          {/if}
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-gray-900 truncate" class:text-sm={compact}>
              {request.listingTitle}
            </h3>
            <p class="text-sm text-gray-600 mt-1" class:text-xs={compact}>
              {reviewTypeLabel} • {request.revieweeName}
            </p>
          </div>

          <!-- Urgency Badge -->
          <span class={getUrgencyClasses()}>
            {formatDueDate(request.dueDate)}
          </span>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between mt-3" class:mt-2={compact}>
          <div class="flex items-center space-x-2">
            <Avatar
              src={request.revieweeAvatar}
              alt={request.revieweeName}
              size={compact ? 'xs' : 'sm'}
              fallback={request.revieweeName.charAt(0).toUpperCase()}
            />
            <span class="text-xs text-gray-500">
              Waiting for your review
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <Button
              variant="outline"
              size={compact ? 'xs' : 'sm'}
              on:click={handleDismiss}
              class="text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </Button>
            
            <Button
              variant="primary"
              size={compact ? 'xs' : 'sm'}
              on:click={handleWriteReview}
            >
              Write Review
            </Button>
          </div>
        </div>

        <!-- Reminder Info -->
        {#if request.remindersSent > 0}
          <div class="mt-2 text-xs text-gray-500">
            {request.remindersSent} reminder{request.remindersSent === 1 ? '' : 's'} sent
          </div>
        {/if}
      </div>
    </div>

    <!-- Overdue Warning -->
    {#if isOverdue}
      <div class="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span class="text-xs text-red-700">
            This review request is overdue. Please submit your review as soon as possible.
          </span>
        </div>
      </div>
    {:else if isUrgent}
      <div class="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-xs text-amber-700">
            Review due soon. Help others by sharing your experience!
          </span>
        </div>
      </div>
    {/if}
  </div>
</div>
