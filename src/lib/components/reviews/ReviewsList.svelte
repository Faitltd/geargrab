<script lang="ts">
  import { onMount } from 'svelte';
  import { getListingReviews, getListingReviewStats } from '$lib/services/reviews.service';
  import StarRating from './StarRating.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { ReviewData, ReviewStats } from '$lib/types';

  // Props
  export let listingId: string;
  export let showTitle: boolean = true;
  export let maxReviews: number = 3;
  export let showViewAllButton: boolean = true;
  export let compact: boolean = false;

  // State
  let reviews: ReviewData[] = [];
  let reviewStats: ReviewStats | null = null;
  let loading = true;
  let error = '';

  // Reactive statements
  $: hasReviews = reviews.length > 0;
  $: averageRating = reviewStats?.averageRating || 0;
  $: totalReviews = reviewStats?.totalReviews || 0;

  onMount(async () => {
    await loadReviews();
  });

  async function loadReviews() {
    try {
      loading = true;
      error = '';

      // Load reviews and stats in parallel
      const [reviewsResult, statsResult] = await Promise.all([
        getListingReviews(listingId, maxReviews),
        getListingReviewStats(listingId)
      ]);

      reviews = reviewsResult.data;
      reviewStats = statsResult;

    } catch (err) {
      console.error('Error loading reviews:', err);
      error = err instanceof Error ? err.message : 'Failed to load reviews';
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
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

  function getReviewerName(review: ReviewData): string {
    // In a real implementation, you would fetch user details
    // For now, we'll use a placeholder or extract from review data
    return review.reviewerName || `User ${review.reviewerId.slice(-4)}`;
  }

  function getReviewerAvatar(review: ReviewData): string | undefined {
    // In a real implementation, you would fetch user avatar
    return review.reviewerAvatar;
  }

  function truncateComment(comment: string, maxLength: number = 150): string {
    if (comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength).trim() + '...';
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  {#if showTitle}
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <h3 class="text-lg font-semibold text-gray-900">
          Reviews
        </h3>
        {#if totalReviews > 0}
          <div class="flex items-center space-x-2">
            <StarRating 
              rating={averageRating} 
              size="sm" 
              showValue={true}
              showCount={true}
              reviewCount={totalReviews}
              readonly={true}
            />
          </div>
        {/if}
      </div>
      
      {#if showViewAllButton && totalReviews > maxReviews}
        <Button
          variant="outline"
          size="sm"
          href="/listings/{listingId}/reviews"
        >
          View All ({totalReviews})
        </Button>
      {/if}
    </div>
  {/if}

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center py-8">
      <LoadingSpinner size="md" />
    </div>

  <!-- Error State -->
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span class="text-red-800 text-sm">{error}</span>
      </div>
    </div>

  <!-- Empty State -->
  {:else if !hasReviews}
    <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
      <p class="text-gray-500">Be the first to review this gear!</p>
    </div>

  <!-- Reviews List -->
  {:else}
    <div class="space-y-4">
      {#each reviews as review (review.id)}
        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <!-- Review Header -->
          <div class="flex items-start space-x-3 mb-3">
            <!-- Avatar -->
            <Avatar
              src={getReviewerAvatar(review)}
              alt={getReviewerName(review)}
              size={compact ? 'sm' : 'md'}
              fallback={getReviewerName(review).charAt(0).toUpperCase()}
            />

            <div class="flex-1 min-w-0">
              <!-- Reviewer info -->
              <div class="flex items-center space-x-2 mb-1">
                <h4 class="font-medium text-gray-900 truncate {compact ? 'text-sm' : 'text-base'}">
                  {getReviewerName(review)}
                </h4>
                
                {#if review.verified}
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
                  {formatDate(review.createdAt)}
                </span>
              </div>

              <!-- Title -->
              {#if review.title}
                <h5 class="font-medium text-gray-900 mb-2 {compact ? 'text-sm' : 'text-base'}">
                  {review.title}
                </h5>
              {/if}
            </div>
          </div>

          <!-- Comment -->
          <div class="text-gray-700 {compact ? 'text-sm' : 'text-base'} leading-relaxed mb-3">
            <p>{compact ? truncateComment(review.comment) : review.comment}</p>
          </div>

          <!-- Photos (if any) -->
          {#if review.photos && review.photos.length > 0}
            <div class="flex space-x-2 mb-3">
              {#each review.photos.slice(0, 3) as photo, index}
                <img
                  src={photo}
                  alt="Review photo {index + 1}"
                  class="w-12 h-12 object-cover rounded border border-gray-200"
                />
              {/each}
              {#if review.photos.length > 3}
                <div class="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                  <span class="text-xs text-gray-600 font-medium">
                    +{review.photos.length - 3}
                  </span>
                </div>
              {/if}
            </div>
          {/if}

          <!-- Tags -->
          {#if review.tags && review.tags.length > 0}
            <div class="flex flex-wrap gap-1">
              {#each review.tags.slice(0, 3) as tag}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tag.name}
                </span>
              {/each}
              {#if review.tags.length > 3}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  +{review.tags.length - 3}
                </span>
              {/if}
            </div>
          {/if}

          <!-- Owner Response -->
          {#if review.response}
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <div class="flex items-center space-x-2 mb-2">
                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <span class="font-medium text-blue-900 text-sm">Owner Response</span>
                <span class="text-blue-700 text-xs">
                  {formatDate(review.response.createdAt)}
                </span>
              </div>
              <p class="text-blue-800 text-sm leading-relaxed">
                {review.response.comment}
              </p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
