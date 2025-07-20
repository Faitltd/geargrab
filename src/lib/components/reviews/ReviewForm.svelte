<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import type { ReviewFormData } from '$lib/services/reviews';

  export let listingTitle: string = '';
  export let ownerName: string = '';
  export let disabled: boolean = false;
  export let isSubmitting: boolean = false;

  const dispatch = createEventDispatcher<{
    submit: ReviewFormData;
    cancel: void;
  }>();

  // Form state
  let rating: number = 0;
  let comment: string = '';
  let selectedTags: string[] = [];
  let hoveredRating: number = 0;

  // Available tags
  const availableTags = [
    { id: 'clean', label: 'Clean & Well-Maintained', color: 'green' },
    { id: 'responsive', label: 'Responsive Owner', color: 'blue' },
    { id: 'accurate', label: 'Accurate Description', color: 'purple' },
    { id: 'easy-pickup', label: 'Easy Pickup/Return', color: 'indigo' },
    { id: 'good-value', label: 'Good Value', color: 'emerald' },
    { id: 'damaged', label: 'Some Damage', color: 'red' },
    { id: 'late', label: 'Late Response', color: 'orange' },
    { id: 'unclear', label: 'Unclear Instructions', color: 'yellow' }
  ];

  const handleStarClick = (starRating: number) => {
    if (disabled) return;
    rating = starRating;
  };

  const handleStarHover = (starRating: number) => {
    if (disabled) return;
    hoveredRating = starRating;
  };

  const handleStarLeave = () => {
    hoveredRating = 0;
  };

  const toggleTag = (tagId: string) => {
    if (disabled) return;
    
    if (selectedTags.includes(tagId)) {
      selectedTags = selectedTags.filter(id => id !== tagId);
    } else {
      selectedTags = [...selectedTags, tagId];
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      return; // Rating is required
    }

    if (!comment.trim()) {
      return; // Comment is required
    }

    const reviewData: ReviewFormData = {
      rating,
      comment: comment.trim(),
      tags: selectedTags
    };

    dispatch('submit', reviewData);
  };

  const handleCancel = () => {
    dispatch('cancel');
  };

  // Computed values
  $: displayRating = hoveredRating || rating;
  $: canSubmit = rating > 0 && comment.trim().length > 0 && !disabled && !isSubmitting;
  $: ratingText = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }[displayRating] || 'Select Rating';
</script>

<div class="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
  <!-- Header -->
  <div class="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-accent-50">
    <div class="flex items-center space-x-3">
      <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <div>
        <h2 class="text-xl font-semibold text-neutral-900">
          Review Your Rental Experience
        </h2>
        <p class="text-sm text-neutral-600">
          {listingTitle} • {ownerName}
        </p>
      </div>
    </div>
  </div>

  <!-- Form Content -->
  <div class="p-6 space-y-6">
    <!-- Rating Section -->
    <div>
      <label class="block text-sm font-medium text-neutral-900 mb-3">
        Overall Rating *
      </label>
      
      <div class="flex items-center space-x-2 mb-2">
        {#each [1, 2, 3, 4, 5] as star}
          <button
            type="button"
            on:click={() => handleStarClick(star)}
            on:mouseenter={() => handleStarHover(star)}
            on:mouseleave={handleStarLeave}
            disabled={disabled}
            class="p-1 rounded-full hover:bg-neutral-100 disabled:cursor-not-allowed transition-colors"
          >
            <svg 
              class="w-8 h-8 transition-colors {
                star <= displayRating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-neutral-300'
              }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        {/each}
        
        <span class="ml-3 text-sm font-medium text-neutral-700">
          {ratingText}
        </span>
      </div>
      
      {#if rating === 0}
        <p class="text-xs text-neutral-500">Click a star to rate your experience</p>
      {/if}
    </div>

    <!-- Comment Section -->
    <div>
      <label for="comment" class="block text-sm font-medium text-neutral-900 mb-3">
        Your Review *
      </label>
      
      <textarea
        id="comment"
        bind:value={comment}
        disabled={disabled}
        placeholder="Share your experience with this rental. What went well? What could be improved? Your feedback helps other renters and owners."
        class="w-full h-32 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed resize-none"
        maxlength="1000"
      ></textarea>
      
      <div class="flex justify-between items-center mt-2">
        <span class="text-xs text-neutral-500">
          {comment.length}/1000 characters
        </span>
        {#if comment.length === 0}
          <span class="text-xs text-red-500">Review comment is required</span>
        {/if}
      </div>
    </div>

    <!-- Tags Section -->
    <div>
      <label class="block text-sm font-medium text-neutral-900 mb-3">
        Tags (Optional)
      </label>
      <p class="text-xs text-neutral-600 mb-3">
        Select tags that describe your experience
      </p>
      
      <div class="flex flex-wrap gap-2">
        {#each availableTags as tag}
          <button
            type="button"
            on:click={() => toggleTag(tag.id)}
            disabled={disabled}
            class="px-3 py-1.5 text-sm rounded-full border transition-all disabled:cursor-not-allowed {
              selectedTags.includes(tag.id)
                ? `bg-${tag.color}-100 border-${tag.color}-300 text-${tag.color}-800`
                : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }"
          >
            {tag.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Preview Section -->
    {#if rating > 0 && comment.trim()}
      <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200" transition:fade>
        <h4 class="text-sm font-medium text-neutral-900 mb-2">Preview</h4>
        
        <div class="flex items-center space-x-2 mb-2">
          <div class="flex">
            {#each [1, 2, 3, 4, 5] as star}
              <svg 
                class="w-4 h-4 {star <= rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'}"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            {/each}
          </div>
          <span class="text-sm text-neutral-600">{ratingText}</span>
        </div>
        
        <p class="text-sm text-neutral-700 mb-2">
          {comment.trim()}
        </p>
        
        {#if selectedTags.length > 0}
          <div class="flex flex-wrap gap-1">
            {#each selectedTags as tagId}
              {@const tag = availableTags.find(t => t.id === tagId)}
              {#if tag}
                <span class="px-2 py-0.5 text-xs bg-neutral-200 text-neutral-700 rounded-full">
                  {tag.label}
                </span>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Footer Actions -->
  <div class="p-6 border-t border-neutral-200 bg-neutral-50">
    <div class="flex items-center justify-between">
      <button
        type="button"
        on:click={handleCancel}
        disabled={isSubmitting}
        class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:cursor-not-allowed transition-colors"
      >
        Cancel
      </button>
      
      <button
        type="button"
        on:click={handleSubmit}
        disabled={!canSubmit}
        class="px-6 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
      >
        {#if isSubmitting}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Submitting...</span>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>Submit Review</span>
        {/if}
      </button>
    </div>
  </div>
</div>
