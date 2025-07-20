<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import StarRating from './StarRating.svelte';
  import ReviewTags from './ReviewTags.svelte';
  import ReviewResponse from './ReviewResponse.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { ReviewData } from '$lib/types/reviews';
  import { authStore } from '$lib/stores/auth.store';

  // Props
  export let review: ReviewData;
  export let showActions: boolean = true;
  export let showPhotos: boolean = true;
  export let compact: boolean = false;
  export let showVerifiedBadge: boolean = true;
  export let showResponse: boolean = true;
  export let currentUserId: string | undefined = undefined;

  // Events
  const dispatch = createEventDispatcher<{
    helpful: { reviewId: string; userId: string };
    report: { reviewId: string };
    viewPhotos: { photos: string[] };
    addResponse: { reviewId: string; comment: string };
    updateResponse: { reviewId: string; comment: string };
    deleteResponse: { reviewId: string };
  }>();

  // State
  let showFullComment = false;
  let isExpanded = false;

  // Get current user
  $: user = $authStore.data;
  $: userId = currentUserId || user?.uid;

  // Reactive statements
  $: truncatedComment = review.comment.length > 200 ?
    review.comment.substring(0, 200) + '...' :
    review.comment;
  $: shouldTruncate = review.comment.length > 200;
  $: displayComment = showFullComment ? review.comment : truncatedComment;
  $: hasPhotos = review.photos && review.photos.length > 0;
  $: reviewerName = review.reviewerName || 'Anonymous User';
  $: reviewDate = formatDate(review.createdAt);
  $: hasUserVoted = userId && review.helpfulVotes?.includes(userId);
  $: isReviewee = userId === review.revieweeId;
  $: isReviewer = userId === review.reviewerId;
  $: canRespond = isReviewee && !review.response;
  $: showListingTitle = review.listingTitle && review.type === 'listing';
  $: reviewTags = review.tags?.map(tag => tag.id) || [];

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
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  function handleHelpful() {
    if (!userId) return;
    dispatch('helpful', { reviewId: review.id!, userId });
  }

  function handleReport() {
    dispatch('report', { reviewId: review.id! });
  }

  function handleAddResponse(event: CustomEvent<{ comment: string }>) {
    dispatch('addResponse', { reviewId: review.id!, comment: event.detail.comment });
  }

  function handleUpdateResponse(event: CustomEvent<{ comment: string }>) {
    dispatch('updateResponse', { reviewId: review.id!, comment: event.detail.comment });
  }

  function handleDeleteResponse() {
    dispatch('deleteResponse', { reviewId: review.id! });
  }

  function handleViewPhotos() {
    if (hasPhotos) {
      dispatch('viewPhotos', { photos: review.photos! });
    }
  }

  function toggleComment() {
    showFullComment = !showFullComment;
  }

  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 {compact ? 'p-3' : 'p-6'} hover:shadow-md transition-shadow">
  <!-- Header -->
  <div class="flex items-start space-x-3 mb-3">
    <!-- Avatar -->
    <Avatar
      src={review.reviewerAvatar}
      alt={reviewerName}
      size={compact ? 'sm' : 'md'}
      fallback={reviewerName.charAt(0).toUpperCase()}
    />

    <div class="flex-1 min-w-0">
      <!-- Reviewer info -->
      <div class="flex items-center space-x-2 mb-1">
        <h4 class="font-semibold text-gray-900 truncate {compact ? 'text-sm' : 'text-base'}">
          {reviewerName}
        </h4>

        {#if review.verified && showVerifiedBadge}
          <div class="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Verified</span>
          </div>
        {/if}
      </div>

      <!-- Rating and date -->
      <div class="flex items-center space-x-3 mb-2">
        <StarRating
          rating={review.rating}
          size={compact ? 'sm' : 'md'}
          readonly={true}
        />
        <span class="text-gray-500 {compact ? 'text-xs' : 'text-sm'}">
          {reviewDate}
        </span>
      </div>

      <!-- Title -->
      {#if review.title}
        <h5 class="font-medium text-gray-900 mb-2 {compact ? 'text-sm' : 'text-base'}">
          {review.title}
        </h5>
      {/if}
    </div>
    
    <!-- Rating -->
    <div class="flex items-center space-x-1">
      {#each [1, 2, 3, 4, 5] as star}
        <svg 
          class="w-4 h-4 {star <= review.rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'}"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      {/each}
      <span class="ml-1 text-sm font-medium text-neutral-700">
        {review.rating}
      </span>
    </div>
  </div>

  <!-- Listing Title (if shown) -->
  {#if showListingTitle}
    <div class="mb-3">
      <p class="text-sm text-neutral-600">
        Review for: <span class="font-medium text-neutral-900">{review.listingTitle}</span>
      </p>
    </div>
  {/if}

  <!-- Review Content -->
  <div class="mb-4">
    <p class="text-neutral-700 leading-relaxed {compact ? 'text-sm' : ''}">
      {review.comment}
    </p>
  </div>

  <!-- Tags -->
  <!-- Tags -->
  {#if reviewTags.length > 0}
    <div class="mb-4">
      <ReviewTags
        selectedTags={reviewTags}
        reviewType={review.type === 'listing' ? 'listing' : 'user'}
        interactive={false}
        size="sm"
      />
    </div>
  {/if}

  <!-- Actions -->
  {#if !compact}
    <div class="flex items-center justify-between pt-3 border-t border-neutral-100">
      <div class="flex items-center space-x-4">
        <!-- Helpful Button -->
        <button
          on:click={handleHelpful}
          class="flex items-center space-x-1 text-sm transition-colors"
          class:text-blue-600={hasUserVoted}
          class:text-neutral-500={!hasUserVoted}
          class:hover:text-blue-700={hasUserVoted}
          class:hover:text-neutral-700={!hasUserVoted}
          disabled={!userId}
        >
          <svg
            class="w-4 h-4"
            fill={hasUserVoted ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>
            {hasUserVoted ? 'Helpful' : 'Helpful'} ({review.helpful || 0})
          </span>
        </button>
        
        <!-- Report Button -->
        <button
          on:click={handleReport}
          class="flex items-center space-x-1 text-sm text-neutral-500 hover:text-red-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <span>Report</span>
        </button>
      </div>
      
      <!-- Review Type Badge -->
      <div class="flex items-center space-x-2">
        {#if review.type === 'listing'}
          <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            Listing Review
          </span>
        {:else}
          <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
            User Review
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Review Response -->
  {#if showResponse}
    <ReviewResponse
      response={review.response}
      canRespond={canRespond}
      isOwner={isReviewee}
      revieweeAvatar={review.revieweeAvatar}
      revieweeName={review.revieweeName || 'Owner'}
      on:addResponse={handleAddResponse}
      on:updateResponse={handleUpdateResponse}
      on:deleteResponse={handleDeleteResponse}
    />
  {/if}
</div>
