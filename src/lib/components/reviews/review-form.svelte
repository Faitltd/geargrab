<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { reviewService, type Review } from '$lib/services/reviews';
  import { authStore } from '$lib/stores/auth';

  export let bookingId: string;
  export let listingId: string;
  export let listingTitle: string;
  export let otherPartyId: string;
  export let otherPartyName: string;
  export let otherPartyType: 'owner' | 'renter';

  const dispatch = createEventDispatcher();

  let submitting = false;
  let error = '';

  // Review data
  let overallRating = 0;
  let ratings = {
    communication: 0,
    condition: 0,
    cleanliness: 0,
    accuracy: 0,
    value: 0
  };
  let title = '';
  let comment = '';
  let pros: string[] = [''];
  let cons: string[] = [''];
  let wouldRecommend = true;

  function setRating(category: string, rating: number) {
    if (category === 'overall') {
      overallRating = rating;
    } else {
      ratings[category] = rating;
    }
  }

  function addPro() {
    pros = [...pros, ''];
  }

  function removePro(index: number) {
    pros = pros.filter((_, i) => i !== index);
  }

  function addCon() {
    cons = [...cons, ''];
  }

  function removeCon(index: number) {
    cons = cons.filter((_, i) => i !== index);
  }

  async function submitReview() {
    if (!$authStore.user) {
      error = 'You must be logged in to submit a review';
      return;
    }

    if (overallRating === 0) {
      error = 'Please provide an overall rating';
      return;
    }

    if (!title.trim() || !comment.trim()) {
      error = 'Please provide a title and comment';
      return;
    }

    submitting = true;
    error = '';

    try {
      const reviewData = {
        bookingId,
        listingId,
        reviewerId: $authStore.user.uid,
        reviewerName: $authStore.user.displayName || 'Anonymous',
        reviewerAvatar: $authStore.user.photoURL,
        revieweeId: otherPartyId,
        revieweeType: otherPartyType,
        overallRating,
        ratings,
        title: title.trim(),
        comment: comment.trim(),
        pros: pros.filter(p => p.trim()),
        cons: cons.filter(c => c.trim()),
        wouldRecommend,
        isVerifiedBooking: true,
        isPublic: true
      };

      const reviewId = await reviewService.submitReview(reviewData);
      dispatch('reviewSubmitted', { reviewId });
    } catch (err) {
      error = 'Failed to submit review. Please try again.';
      console.error('Review submission error:', err);
    } finally {
      submitting = false;
    }
  }

  function getRatingLabel(rating: number): string {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Not rated';
    }
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
  <h2 class="text-xl font-semibold text-white mb-6">
    Write a Review for {otherPartyName}
  </h2>

  <form on:submit|preventDefault="{submitReview}" class="space-y-6">
    
    <!-- Overall Rating -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-3">Overall Rating</label>
      <div class="flex items-center space-x-2">
        {#each [1, 2, 3, 4, 5] as rating}
          <button
            type="button"
            class="text-2xl transition-colors {overallRating >= rating ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}"
            on:click={() => setRating('overall', rating)}
          >
            ★
          </button>
        {/each}
        <span class="ml-3 text-sm text-gray-300">
          {getRatingLabel(overallRating)}
        </span>
      </div>
    </div>

    <!-- Category Ratings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each Object.entries(ratings) as [category, rating]}
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2 capitalize">
            {category}
          </label>
          <div class="flex items-center space-x-1">
            {#each [1, 2, 3, 4, 5] as r}
              <button
                type="button"
                class="text-lg transition-colors {rating >= r ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}"
                on:click={() => setRating(category, r)}
              >
                ★
              </button>
            {/each}
            <span class="ml-2 text-xs text-gray-400">
              {getRatingLabel(rating)}
            </span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Review Title -->
    <div>
      <label for="review-title" class="block text-sm font-medium text-gray-300 mb-2">Review Title</label>
      <input id="review-title"
        type="text"
        bind:value="{title}"
        placeholder="Summarize your experience..."
        class="w-full px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-600 text-white placeholder-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
        maxlength="100"
        required
      />
    </div>

    <!-- Review Comment -->
    <div>
      <label for="your-review" class="block text-sm font-medium text-gray-300 mb-2">Your Review</label>
      <textarea id="your-review"
        bind:value="{comment}"
        placeholder="Share details about your experience..."
        rows="4"
        class="w-full px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-600 text-white placeholder-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
        maxlength="1000"
        required
      ></textarea>
    </div>

    <!-- Pros -->
    <div>
      <label for="what-did-you-like" class="block text-sm font-medium text-gray-300 mb-2">What did you like?</label>
      {#each pros as pro, index}
        <div class="flex items-center space-x-2 mb-2">
          <input id="what-did-you-like"
            type="text"
            bind:value="{pros[index]}"
            placeholder="Something positive..."
            class="flex-1 px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-600 text-white placeholder-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
          />
          {#if pros.length > 1}
            <button
              type="button"
              class="p-2 text-red-400 hover:text-red-300"
              on:click={() => removePro(index)}
            >
              ✕
            </button>
          {/if}
        </div>
      {/each}
      <button
        type="button"
        class="text-green-400 hover:text-green-300 text-sm font-medium"
        on:click="{addPro}"
      >
        + Add another positive
      </button><label for="what-could-be-improved" class="block text-sm font-medium text-gray-300 mb-2">What could be improved?</label>-gray-300 mb-2">What could be improved?</label>
      {#each cons as con, index}
        <div class="flex items-center space-x-2 mb-2">
          <input id="what-could-be-improved"
            type="text"
            bind:value="{cons[index]}"
            placeholder="Something to improve..."
            class="flex-1 px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-600 text-white placeholder-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
          />
          {#if cons.length > 1}
            <button
              type="button"
              class="p-2 text-red-400 hover:text-red-300"
              on:click={() => removeCon(index)}
            >
              ✕
            </button>
          {/if}
        </div>
      {/each}
      <button
        type="button"
        class="text-green-400 hover:text-green-300 text-sm font-medium"
        on:click="{addCon}"
      >
     <label for="would-you-recommend-otherpartytype-owner-this-gear-this-renter" class="block text-sm font-medium text-gray-300 mb-3">
        Would you recommend {otherPartyType === 'owner' ? 'this gear' : 'this renter'}?
      </label>
        Would you recommend {otherPartyType === 'owner' ? 'this gear' : 'this renter'}?
      </label>
      <div class="flex space-x-4">
        <label class="flex items-center">
          <input id="would-you-recommend-otherpartytype-owner-this-gear-this-renter"
            type="radio"
            bind:group="{wouldRecommend}"
            value="{true}"
            class="mr-2 text-green-600 focus:ring-green-500"
          />
          <span class="text-white">Yes, I would recommend</span>
        </label>
        <label class="flex items-center">
          <input
            type="radio"
            bind:group="{wouldRecommend}"
            value="{false}"
            class="mr-2 text-red-600 focus:ring-red-500"
          />
          <span class="text-white">No, I would not recommend</span>
        </label>
      </div>
    </div>

    {#if error}
      <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
        <p class="text-red-200">{error}</p>
      </div>
    {/if}

    <!-- Submit Button -->
    <div class="flex justify-end space-x-4">
      <button
        type="button"
        class="px-6 py-2 text-gray-300 hover:text-white transition-colors"
        on:click={() => dispatch('cancel')}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled="{submitting" || overallRating === 0}
        class="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {#if submitting}
          <div class="flex items-center">
            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Submitting...
          </div>
        {:else}
          Submit Review
        {/if}
      </button>
    </div>

  </form>
</div>
