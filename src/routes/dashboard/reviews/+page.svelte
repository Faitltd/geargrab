<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { getUserReviews, getUserRatingStats, toggleHelpfulVote, addReviewResponse, updateReviewResponse, deleteReviewResponse } from '$lib/services/reviews.service';
  import { showToast } from '$lib/stores/toast.store';
  import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ReviewCard from '$lib/components/reviews/ReviewCard.svelte';
  import ReviewRequestsList from '$lib/components/reviews/ReviewRequestsList.svelte';
  import StarRating from '$lib/components/reviews/StarRating.svelte';
  import type { ReviewData, UserRatingStats, ReviewRequest } from '$lib/types/reviews';

  // State
  let loading = true;
  let error = '';
  let activeTab = 'pending'; // 'pending' | 'received' | 'given'
  let receivedReviews: ReviewData[] = [];
  let givenReviews: ReviewData[] = [];
  let userRatingStats: UserRatingStats | null = null;
  let reviewsLoading = false;

  // Get current user
  $: user = $authStore.data;

  onMount(async () => {
    if (!user) {
      goto('/auth/signin');
      return;
    }

    await loadInitialData();
  });

  async function loadInitialData() {
    try {
      loading = true;
      error = '';

      // Load user rating stats
      if (user?.uid) {
        userRatingStats = await getUserRatingStats(user.uid);
      }

      // Load initial tab data
      await loadTabData(activeTab);

    } catch (err: any) {
      error = err.message || 'Failed to load reviews data';
      console.error('Error loading reviews data:', err);
    } finally {
      loading = false;
    }
  }

  async function loadTabData(tab: string) {
    if (!user?.uid) return;

    try {
      reviewsLoading = true;

      if (tab === 'received') {
        const result = await getUserReviews(user.uid, undefined, 20);
        receivedReviews = result.data || [];
      } else if (tab === 'given') {
        // For given reviews, we need to query where the user is the reviewer
        // This would need a different query method - for now using the same
        const result = await getUserReviews(user.uid, undefined, 20);
        givenReviews = result.data || [];
      }
      // 'pending' tab is handled by ReviewRequestsList component

    } catch (err: any) {
      console.error('Error loading tab data:', err);
      showToast('error', 'Failed to load reviews');
    } finally {
      reviewsLoading = false;
    }
  }

  function switchTab(tab: string) {
    activeTab = tab;
    loadTabData(tab);
  }

  function handleWriteReview(event: CustomEvent<{ request: ReviewRequest }>) {
    const { request } = event.detail;
    goto(`/reviews/write?requestId=${request.id}&listingId=${request.listingId}&type=${request.type}`);
  }

  async function handleHelpfulVote(event: CustomEvent<{ reviewId: string; userId: string }>) {
    try {
      await toggleHelpfulVote(event.detail.reviewId, event.detail.userId);
      
      // Refresh the current tab data
      await loadTabData(activeTab);
      
      showToast('success', 'Vote updated');
    } catch (err: any) {
      console.error('Error updating helpful vote:', err);
      showToast('error', 'Failed to update vote');
    }
  }

  async function handleAddResponse(event: CustomEvent<{ reviewId: string; comment: string }>) {
    try {
      await addReviewResponse(event.detail.reviewId, user!.uid, event.detail.comment);
      
      // Refresh the current tab data
      await loadTabData(activeTab);
      
      showToast('success', 'Response added');
    } catch (err: any) {
      console.error('Error adding response:', err);
      showToast('error', 'Failed to add response');
    }
  }

  async function handleUpdateResponse(event: CustomEvent<{ reviewId: string; comment: string }>) {
    try {
      await updateReviewResponse(event.detail.reviewId, event.detail.comment);
      
      // Refresh the current tab data
      await loadTabData(activeTab);
      
      showToast('success', 'Response updated');
    } catch (err: any) {
      console.error('Error updating response:', err);
      showToast('error', 'Failed to update response');
    }
  }

  async function handleDeleteResponse(event: CustomEvent<{ reviewId: string }>) {
    try {
      await deleteReviewResponse(event.detail.reviewId);
      
      // Refresh the current tab data
      await loadTabData(activeTab);
      
      showToast('success', 'Response deleted');
    } catch (err: any) {
      console.error('Error deleting response:', err);
      showToast('error', 'Failed to delete response');
    }
  }

  function getTabCount(tab: string): number {
    switch (tab) {
      case 'received':
        return userRatingStats?.overall.totalReviews || 0;
      case 'given':
        return givenReviews.length;
      default:
        return 0;
    }
  }
</script>

<DashboardLayout>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reviews</h1>
        <p class="text-gray-600 mt-1">Manage your reviews and feedback</p>
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span class="text-red-700">{error}</span>
        </div>
      </div>
    {:else}
      <!-- Rating Stats Overview -->
      {#if userRatingStats}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Your Rating Overview</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- As Renter -->
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <h3 class="font-medium text-blue-900 mb-2">As Renter</h3>
              <div class="flex items-center justify-center mb-1">
                <StarRating rating={userRatingStats.asRenter.averageRating} readonly size="sm" />
                <span class="ml-2 font-semibold text-blue-900">
                  {userRatingStats.asRenter.averageRating.toFixed(1)}
                </span>
              </div>
              <p class="text-sm text-blue-700">
                {userRatingStats.asRenter.totalReviews} review{userRatingStats.asRenter.totalReviews === 1 ? '' : 's'}
              </p>
            </div>

            <!-- As Owner -->
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <h3 class="font-medium text-green-900 mb-2">As Owner</h3>
              <div class="flex items-center justify-center mb-1">
                <StarRating rating={userRatingStats.asOwner.averageRating} readonly size="sm" />
                <span class="ml-2 font-semibold text-green-900">
                  {userRatingStats.asOwner.averageRating.toFixed(1)}
                </span>
              </div>
              <p class="text-sm text-green-700">
                {userRatingStats.asOwner.totalReviews} review{userRatingStats.asOwner.totalReviews === 1 ? '' : 's'}
              </p>
            </div>

            <!-- Overall -->
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <h3 class="font-medium text-purple-900 mb-2">Overall</h3>
              <div class="flex items-center justify-center mb-1">
                <StarRating rating={userRatingStats.overall.averageRating} readonly size="sm" />
                <span class="ml-2 font-semibold text-purple-900">
                  {userRatingStats.overall.averageRating.toFixed(1)}
                </span>
              </div>
              <p class="text-sm text-purple-700">
                {userRatingStats.overall.responseRate}% response rate
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200">
          <nav class="flex space-x-8 px-6" aria-label="Tabs">
            <button
              on:click={() => switchTab('pending')}
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              class:border-blue-500={activeTab === 'pending'}
              class:text-blue-600={activeTab === 'pending'}
              class:border-transparent={activeTab !== 'pending'}
              class:text-gray-500={activeTab !== 'pending'}
              class:hover:text-gray-700={activeTab !== 'pending'}
            >
              Pending Reviews
            </button>
            
            <button
              on:click={() => switchTab('received')}
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              class:border-blue-500={activeTab === 'received'}
              class:text-blue-600={activeTab === 'received'}
              class:border-transparent={activeTab !== 'received'}
              class:text-gray-500={activeTab !== 'received'}
              class:hover:text-gray-700={activeTab !== 'received'}
            >
              Reviews Received ({getTabCount('received')})
            </button>
            
            <button
              on:click={() => switchTab('given')}
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              class:border-blue-500={activeTab === 'given'}
              class:text-blue-600={activeTab === 'given'}
              class:border-transparent={activeTab !== 'given'}
              class:text-gray-500={activeTab !== 'given'}
              class:hover:text-gray-700={activeTab !== 'given'}
            >
              Reviews Given ({getTabCount('given')})
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          {#if activeTab === 'pending'}
            <ReviewRequestsList
              maxRequests={10}
              showTitle={false}
              compact={false}
              on:writeReview={handleWriteReview}
            />
          {:else if activeTab === 'received'}
            {#if reviewsLoading}
              <div class="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            {:else if receivedReviews.length > 0}
              <div class="space-y-6">
                {#each receivedReviews as review (review.id)}
                  <ReviewCard
                    {review}
                    showActions={true}
                    showResponse={true}
                    currentUserId={user?.uid}
                    on:helpful={handleHelpfulVote}
                    on:addResponse={handleAddResponse}
                    on:updateResponse={handleUpdateResponse}
                    on:deleteResponse={handleDeleteResponse}
                  />
                {/each}
              </div>
            {:else}
              <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No reviews received yet</h3>
                <p class="text-gray-600">Complete some rentals to start receiving reviews!</p>
              </div>
            {/if}
          {:else if activeTab === 'given'}
            {#if reviewsLoading}
              <div class="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            {:else if givenReviews.length > 0}
              <div class="space-y-6">
                {#each givenReviews as review (review.id)}
                  <ReviewCard
                    {review}
                    showActions={false}
                    showResponse={true}
                    currentUserId={user?.uid}
                  />
                {/each}
              </div>
            {:else}
              <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No reviews written yet</h3>
                <p class="text-gray-600">Complete a rental to leave your first review!</p>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</DashboardLayout>
