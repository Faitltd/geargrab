<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { doc, getDoc } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { submitReview, canUserReview, type ReviewFormData } from '$lib/services/reviews';
  import ReviewForm from '$lib/components/reviews/ReviewForm.svelte';
  import { showToast } from '$lib/stores/toast';

  // URL parameters
  let rentalId: string;
  
  // State
  let rental: any = null;
  let listing: any = null;
  let owner: any = null;
  let isLoading = true;
  let error = '';
  let canReview = false;
  let reviewEligibilityReason = '';
  let isSubmittingReview = false;
  let reviewSubmitted = false;

  onMount(async () => {
    rentalId = $page.params.id;

    // Check authentication
    if (!$authStore.user) {
      showToast('error', 'Please sign in to continue');
      goto('/auth/signin');
      return;
    }

    await loadRentalData();
    await checkReviewEligibility();
  });

  const loadRentalData = async () => {
    if (!rentalId || !db) return;

    try {
      // Get rental data
      const rentalDoc = await getDoc(doc(db, 'rentals', rentalId));
      
      if (!rentalDoc.exists()) {
        error = 'Rental not found';
        return;
      }

      rental = { id: rentalDoc.id, ...rentalDoc.data() };

      // Verify user has access to this rental
      if (rental.renterId !== $authStore.user?.uid) {
        error = 'You do not have access to this rental';
        return;
      }

      // Get listing data
      const listingDoc = await getDoc(doc(db, 'listings', rental.listingId));
      if (listingDoc.exists()) {
        listing = { id: listingDoc.id, ...listingDoc.data() };
      }

      // Get owner data
      const ownerDoc = await getDoc(doc(db, 'users', rental.ownerId));
      if (ownerDoc.exists()) {
        owner = { id: ownerDoc.id, ...ownerDoc.data() };
      }

    } catch (err: any) {
      console.error('Error loading rental data:', err);
      error = err.message || 'Failed to load rental data';
    } finally {
      isLoading = false;
    }
  };

  const checkReviewEligibility = async () => {
    if (!rentalId || !$authStore.user) return;

    try {
      const eligibility = await canUserReview(rentalId, $authStore.user.uid);
      canReview = eligibility.canReview;
      reviewEligibilityReason = eligibility.reason || '';
    } catch (err: any) {
      console.error('Error checking review eligibility:', err);
      canReview = false;
      reviewEligibilityReason = 'Error checking review eligibility';
    }
  };

  const handleReviewSubmit = async (event: CustomEvent<ReviewFormData>) => {
    if (!rental || !listing || !owner || !$authStore.user) return;

    isSubmittingReview = true;

    try {
      await submitReview(
        rentalId,
        rental.listingId,
        listing.title,
        rental.ownerId,
        event.detail,
        $authStore.user.uid,
        $authStore.user.displayName || 'Anonymous',
        $authStore.user.email || ''
      );

      reviewSubmitted = true;
      showToast('success', 'Review submitted successfully!');

    } catch (error: any) {
      console.error('Error submitting review:', error);
      showToast('error', error.message || 'Failed to submit review');
    } finally {
      isSubmittingReview = false;
    }
  };

  const handleReviewCancel = () => {
    goto('/dashboard/bookings');
  };

  const goToDashboard = () => {
    goto('/dashboard/bookings');
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
</script>

<svelte:head>
  <title>Rental Complete - GearGrab</title>
  <meta name="description" content="Your rental has been completed successfully" />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
  <div class="max-w-4xl mx-auto px-4 py-8">
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mr-4"></div>
        <span class="text-lg text-neutral-600">Loading rental details...</span>
      </div>
      
    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-semibold text-red-900 mb-2">Error</h2>
        <p class="text-red-700 mb-4">{error}</p>
        <button
          on:click={goToDashboard}
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
      
    {:else if rental && listing}
      <!-- Success Content -->
      <div class="space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 class="text-3xl font-bold text-neutral-900 mb-4">
            Rental Completed Successfully!
          </h1>
          
          <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
            Your rental of <strong>{listing.title}</strong> has been completed. Thank you for using GearGrab!
          </p>
        </div>

        <!-- Rental Summary -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-neutral-900 mb-4">
            Rental Summary
          </h2>
          
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Rental Details -->
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-neutral-600">Item:</span>
                <span class="font-medium text-neutral-900">{listing.title}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Owner:</span>
                <span class="font-medium text-neutral-900">
                  {owner?.displayName || owner?.firstName || 'Owner'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Rental Period:</span>
                <span class="font-medium text-neutral-900">
                  {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Duration:</span>
                <span class="font-medium text-neutral-900">
                  {rental.dates?.length || 0} {rental.dates?.length === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
            
            <!-- Cost Details -->
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-neutral-600">Delivery:</span>
                <span class="font-medium text-neutral-900">
                  {rental.deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Insurance:</span>
                <span class="font-medium text-neutral-900">
                  {rental.insuranceOption ? 'Yes' : 'No'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Total Cost:</span>
                <span class="font-semibold text-neutral-900">
                  ${rental.totalCost?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Status:</span>
                <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Review Section -->
        {#if reviewSubmitted}
          <!-- Review Submitted -->
          <div class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <svg class="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-semibold text-green-900 mb-2">
              Review Submitted!
            </h3>
            <p class="text-green-700 mb-4">
              Thank you for your feedback. Your review helps other renters and owners in the GearGrab community.
            </p>
            <button
              on:click={goToDashboard}
              class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Return to Dashboard
            </button>
          </div>
          
        {:else if canReview}
          <!-- Review Form -->
          <div>
            <div class="text-center mb-6">
              <h2 class="text-2xl font-semibold text-neutral-900 mb-2">
                Share Your Experience
              </h2>
              <p class="text-neutral-600">
                Help other renters by sharing your experience with this rental
              </p>
            </div>
            
            <ReviewForm
              listingTitle={listing.title}
              ownerName={owner?.displayName || owner?.firstName || 'Owner'}
              disabled={isSubmittingReview}
              isSubmitting={isSubmittingReview}
              on:submit={handleReviewSubmit}
              on:cancel={handleReviewCancel}
            />
          </div>
          
        {:else}
          <!-- Cannot Review -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div class="flex items-start space-x-3">
              <svg class="w-6 h-6 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-yellow-900 mb-2">
                  Review Not Available
                </h3>
                <p class="text-yellow-800 mb-4">
                  {reviewEligibilityReason}
                </p>
                <button
                  on:click={goToDashboard}
                  class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
