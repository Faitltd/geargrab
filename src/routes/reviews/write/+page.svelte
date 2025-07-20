<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { reviewsService, completeReviewRequest } from '$lib/services/reviews.service';
  import { getListing } from '$lib/services/listings.service';
  import { getUserProfile } from '$lib/services/users.service';
  import { showToast } from '$lib/stores/toast.store';
  import Header from '$lib/components/Header.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ReviewForm from '$lib/components/reviews/ReviewForm.svelte';
  import type { ListingData } from '$lib/types';
  import type { ReviewType } from '$lib/types/reviews';
  import type { ReviewFormData } from '$lib/services/reviews';

  // State
  let loading = true;
  let error = '';
  let submitting = false;
  let listing: ListingData | null = null;
  let reviewee: any = null;
  let requestId: string | null = null;
  let listingId: string | null = null;
  let reviewType: ReviewType = 'listing';

  // Get current user
  $: user = $authStore.data;

  // Get URL parameters
  $: urlParams = $page.url.searchParams;

  onMount(async () => {
    if (!user) {
      goto('/auth/signin');
      return;
    }

    // Get parameters from URL
    requestId = urlParams.get('requestId');
    listingId = urlParams.get('listingId');
    const typeParam = urlParams.get('type');
    
    if (typeParam && ['listing', 'renter', 'owner', 'buyer', 'seller'].includes(typeParam)) {
      reviewType = typeParam as ReviewType;
    }

    if (!listingId) {
      error = 'Missing listing information';
      loading = false;
      return;
    }

    await loadReviewData();
  });

  async function loadReviewData() {
    try {
      loading = true;
      error = '';

      // Load listing data
      listing = await getListing(listingId!);
      if (!listing) {
        error = 'Listing not found';
        return;
      }

      // Load reviewee data (the person being reviewed)
      if (reviewType === 'listing' || reviewType === 'owner') {
        // Reviewing the listing or owner
        reviewee = await getUserProfile(listing.owner.id);
      } else {
        // Reviewing the renter (this would need additional data)
        // For now, we'll use the listing owner as fallback
        reviewee = await getUserProfile(listing.owner.id);
      }

    } catch (err: any) {
      error = err.message || 'Failed to load review data';
      console.error('Error loading review data:', err);
    } finally {
      loading = false;
    }
  }

  async function handleSubmitReview(event: CustomEvent<ReviewFormData>) {
    if (!user || !listing || !reviewee) return;

    try {
      submitting = true;

      // Create review using the reviews service
      const reviewData = {
        reviewerId: user.uid,
        revieweeId: reviewee.uid,
        listingId: listing.id,
        type: reviewType,
        rating: event.detail.rating,
        comment: event.detail.comment,
        tags: event.detail.tags?.map(tag => ({ id: tag, name: tag, category: 'neutral' as const })) || [],
        verified: false,
        helpful: 0,
        helpfulVotes: [],
        reported: false,
        reportCount: 0,
        status: 'active' as const
      };

      await reviewsService.create(reviewData);

      // Mark review request as completed if we have a request ID
      if (requestId) {
        await completeReviewRequest(requestId);
      }

      showToast('success', 'Review submitted successfully!');
      
      // Navigate back to dashboard
      goto('/dashboard/reviews');

    } catch (err: any) {
      console.error('Error submitting review:', err);
      showToast('error', err.message || 'Failed to submit review');
    } finally {
      submitting = false;
    }
  }

  function handleCancel() {
    goto('/dashboard/reviews');
  }

  function getReviewTitle(): string {
    switch (reviewType) {
      case 'listing':
        return `Review ${listing?.title}`;
      case 'owner':
        return `Review ${reviewee?.displayName} as Owner`;
      case 'renter':
        return `Review ${reviewee?.displayName} as Renter`;
      case 'buyer':
        return `Review ${reviewee?.displayName} as Buyer`;
      case 'seller':
        return `Review ${reviewee?.displayName} as Seller`;
      default:
        return 'Write Review';
    }
  }

  function getReviewDescription(): string {
    switch (reviewType) {
      case 'listing':
        return 'Share your experience with this gear to help other renters make informed decisions.';
      case 'owner':
        return 'Rate your experience with the gear owner. Your feedback helps build trust in the community.';
      case 'renter':
        return 'Rate your experience with this renter. Your feedback helps other owners make informed decisions.';
      case 'buyer':
        return 'Rate your experience with this buyer. Your feedback helps other sellers.';
      case 'seller':
        return 'Rate your experience with this seller. Your feedback helps other buyers.';
      default:
        return 'Share your experience to help the community.';
    }
  }
</script>

<Header />

<main class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if loading}
      <div class="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 class="text-lg font-medium text-red-800">Error</h3>
            <p class="text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div class="mt-4">
          <button
            on:click={() => goto('/dashboard/reviews')}
            class="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    {:else if listing && reviewee}
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-start space-x-4">
            <!-- Listing Image -->
            <div class="flex-shrink-0">
              <div class="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                {#if listing.images && listing.images.length > 0}
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <div class="w-full h-full flex items-center justify-center bg-gray-200">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                {getReviewTitle()}
              </h1>
              <p class="text-gray-600 mb-4">
                {getReviewDescription()}
              </p>
              
              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <span>Listing: {listing.title}</span>
                <span>•</span>
                <span>Category: {listing.category}</span>
                {#if reviewType !== 'listing'}
                  <span>•</span>
                  <span>User: {reviewee.displayName}</span>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Review Form -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ReviewForm
            listingTitle={listing.title}
            ownerName={reviewee.displayName}
            isSubmitting={submitting}
            on:submit={handleSubmitReview}
            on:cancel={handleCancel}
          />
        </div>
      </div>
    {/if}
  </div>
</main>
