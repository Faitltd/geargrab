<script lang="ts">
  import { onMount } from 'svelte';
  import { getListingReviewStats } from '$lib/services/reviews.service';
  import StarRating from './StarRating.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { ReviewStats } from '$lib/types';

  // Props
  export let listingId: string;
  export let showDistribution: boolean = true;
  export let showTopTags: boolean = true;
  export let compact: boolean = false;

  // State
  let stats: ReviewStats | null = null;
  let loading = true;
  let error = '';

  // Reactive statements
  $: hasReviews = stats && stats.totalReviews > 0;
  $: averageRating = stats?.averageRating || 0;
  $: totalReviews = stats?.totalReviews || 0;
  $: ratingDistribution = stats?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  $: topTags = stats?.topTags || [];

  onMount(async () => {
    await loadStats();
  });

  async function loadStats() {
    try {
      loading = true;
      error = '';
      stats = await getListingReviewStats(listingId);
    } catch (err) {
      console.error('Error loading review stats:', err);
      error = err instanceof Error ? err.message : 'Failed to load review statistics';
    } finally {
      loading = false;
    }
  }

  function getPercentage(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  function getRatingLabel(rating: number): string {
    const labels = {
      5: 'Excellent',
      4: 'Very Good',
      3: 'Good',
      2: 'Fair',
      1: 'Poor'
    };
    return labels[rating as keyof typeof labels] || `${rating} stars`;
  }
</script>

<div class="space-y-4">
  {#if loading}
    <div class="flex justify-center py-4">
      <LoadingSpinner size="sm" />
    </div>

  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-3">
      <div class="flex items-center">
        <svg class="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span class="text-red-800 text-sm">{error}</span>
      </div>
    </div>

  {:else if !hasReviews}
    <div class="text-center py-6 bg-gray-50 rounded-lg">
      <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p class="text-gray-500 text-sm">No reviews yet</p>
    </div>

  {:else}
    <!-- Overall Rating -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900 {compact ? 'text-base' : 'text-lg'}">
          Overall Rating
        </h3>
        <span class="text-sm text-gray-500">
          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </span>
      </div>

      <div class="flex items-center space-x-4">
        <!-- Large rating display -->
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-900 mb-1">
            {averageRating.toFixed(1)}
          </div>
          <StarRating 
            rating={averageRating} 
            size="md" 
            readonly={true}
          />
        </div>

        <!-- Rating distribution -->
        {#if showDistribution && !compact}
          <div class="flex-1 space-y-2">
            {#each [5, 4, 3, 2, 1] as rating}
              {@const count = ratingDistribution[rating]}
              {@const percentage = getPercentage(count, totalReviews)}
              
              <div class="flex items-center space-x-2 text-sm">
                <span class="w-8 text-gray-600">{rating}</span>
                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                
                <!-- Progress bar -->
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style="width: {percentage}%"
                  />
                </div>
                
                <span class="w-8 text-right text-gray-500">{count}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Top Tags -->
    {#if showTopTags && topTags.length > 0}
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-3 {compact ? 'text-base' : 'text-lg'}">
          What Reviewers Say
        </h3>
        
        <div class="space-y-2">
          {#each topTags.slice(0, compact ? 3 : 6) as tag}
            {@const percentage = getPercentage(tag.count, totalReviews)}
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tag.tag}
                </span>
                <span class="text-sm text-gray-500">
                  {tag.count} mention{tag.count !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style="width: {percentage}%"
                  />
                </div>
                <span class="text-xs text-gray-500 w-8 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Recent Reviews Summary -->
    {#if stats.recentReviews.length > 0 && !compact}
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-3">
          Recent Highlights
        </h3>
        
        <div class="space-y-3">
          {#each stats.recentReviews.slice(0, 2) as review}
            <div class="border-l-4 border-blue-500 pl-3">
              <div class="flex items-center space-x-2 mb-1">
                <StarRating 
                  rating={review.rating} 
                  size="sm" 
                  readonly={true}
                />
                <span class="text-sm text-gray-500">
                  {review.reviewerName || 'Anonymous'}
                </span>
              </div>
              
              {#if review.title}
                <p class="font-medium text-gray-900 text-sm mb-1">
                  {review.title}
                </p>
              {/if}
              
              <p class="text-gray-700 text-sm leading-relaxed">
                {review.comment.length > 120 
                  ? review.comment.substring(0, 120) + '...' 
                  : review.comment}
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
