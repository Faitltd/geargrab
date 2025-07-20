<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { authStore } from '$lib/stores/auth.store';
  import { getPendingReviewRequests, completeReviewRequest } from '$lib/services/reviews.service';
  import { showToast } from '$lib/stores/toast.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ReviewRequestCard from './ReviewRequestCard.svelte';
  import type { ReviewRequest } from '$lib/types/reviews';

  // Props
  export let maxRequests: number = 5;
  export let showTitle: boolean = true;
  export let compact: boolean = false;

  // Events
  const dispatch = createEventDispatcher<{
    writeReview: { request: ReviewRequest };
    requestsLoaded: { count: number };
  }>();

  // State
  let loading = true;
  let error = '';
  let requests: ReviewRequest[] = [];

  // Get current user
  $: user = $authStore.data;

  onMount(async () => {
    if (user?.uid) {
      await loadRequests();
    }
  });

  async function loadRequests() {
    if (!user?.uid) return;

    try {
      loading = true;
      error = '';
      
      const allRequests = await getPendingReviewRequests(user.uid);
      
      // Sort by urgency (overdue first, then by due date)
      requests = allRequests
        .sort((a, b) => {
          const aDue = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
          const bDue = b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
          const now = new Date();
          
          const aOverdue = aDue < now;
          const bOverdue = bDue < now;
          
          // Overdue items first
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;
          
          // Then by due date (earliest first)
          return aDue.getTime() - bDue.getTime();
        })
        .slice(0, maxRequests);

      dispatch('requestsLoaded', { count: allRequests.length });
      
    } catch (err: any) {
      error = err.message || 'Failed to load review requests';
      console.error('Error loading review requests:', err);
    } finally {
      loading = false;
    }
  }

  function handleWriteReview(event: CustomEvent<{ request: ReviewRequest }>) {
    dispatch('writeReview', event.detail);
  }

  async function handleDismiss(event: CustomEvent<{ requestId: string }>) {
    const { requestId } = event.detail;
    
    try {
      await completeReviewRequest(requestId);
      
      // Remove from local list
      requests = requests.filter(r => r.id !== requestId);
      
      showToast('success', 'Review request dismissed');
      
    } catch (err: any) {
      console.error('Error dismissing review request:', err);
      showToast('error', 'Failed to dismiss review request');
    }
  }

  function getUrgencyStats() {
    const now = new Date();
    const overdue = requests.filter(r => {
      const due = r.dueDate.toDate ? r.dueDate.toDate() : new Date(r.dueDate);
      return due < now;
    }).length;
    
    const urgent = requests.filter(r => {
      const due = r.dueDate.toDate ? r.dueDate.toDate() : new Date(r.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    }).length;
    
    return { overdue, urgent };
  }

  $: urgencyStats = getUrgencyStats();
</script>

<div class="space-y-4">
  {#if showTitle}
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">
          Pending Reviews
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          Share your experience to help the community
        </p>
      </div>
      
      {#if requests.length > 0}
        <div class="flex items-center space-x-4 text-sm">
          {#if urgencyStats.overdue > 0}
            <span class="flex items-center text-red-600">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {urgencyStats.overdue} overdue
            </span>
          {/if}
          
          {#if urgencyStats.urgent > 0}
            <span class="flex items-center text-amber-600">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {urgencyStats.urgent} due soon
            </span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center py-8">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="text-red-700 text-sm">{error}</span>
      </div>
    </div>
  {:else if requests.length > 0}
    <div class="space-y-3" class:space-y-2={compact}>
      {#each requests as request (request.id)}
        <div transition:fade={{ duration: 200 }}>
          <ReviewRequestCard
            {request}
            {compact}
            on:writeReview={handleWriteReview}
            on:dismiss={handleDismiss}
          />
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8" class:py-6={compact}>
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" class:w-8={compact} class:h-8={compact} class:mb-2={compact} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2" class:text-base={compact} class:mb-1={compact}>
        All caught up!
      </h3>
      <p class="text-gray-600 text-sm" class:text-xs={compact}>
        You don't have any pending review requests at the moment.
      </p>
    </div>
  {/if}

  <!-- Refresh Button -->
  {#if !loading && (error || requests.length > 0)}
    <div class="flex justify-center pt-4" class:pt-2={compact}>
      <button
        on:click={loadRequests}
        class="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center space-x-1"
        disabled={loading}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh</span>
      </button>
    </div>
  {/if}
</div>
