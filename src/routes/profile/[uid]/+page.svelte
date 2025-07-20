<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { getUserProfile } from '$lib/services/users.service';
  import { getUserListings } from '$lib/services/listings.service';
  import { getUserReviews, getUserRatingStats } from '$lib/services/reviews.service';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import StarRating from '$lib/components/reviews/StarRating.svelte';
  import ReviewCard from '$lib/components/reviews/ReviewCard.svelte';
  import type { UserProfile } from '$lib/services/users.service';
  import type { ListingData } from '$lib/types';
  import type { ReviewData, UserRatingStats } from '$lib/types/reviews';

  // State
  let loading = true;
  let error = '';
  let userProfile: UserProfile | null = null;
  let userListings: ListingData[] = [];
  let userReviews: ReviewData[] = [];
  let userRatingStats: UserRatingStats | null = null;
  let isOwnProfile = false;
  let activeTab = 'listings'; // 'listings' | 'reviews-received' | 'reviews-given'
  let reviewsLoading = false;

  $: uid = $page.params.uid;
  $: currentUser = $authStore.data;

  onMount(async () => {
    if (uid) {
      await loadProfile();
    }
  });

  async function loadProfile() {
    if (!uid) return;

    try {
      loading = true;
      error = '';

      // Load user profile
      userProfile = await getUserProfile(uid);

      if (!userProfile) {
        error = 'User profile not found';
        return;
      }

      // Check if this is the current user's profile
      isOwnProfile = currentUser?.uid === uid;

      // Load user's listings
      userListings = await getUserListings(uid);

      // Load user rating stats
      userRatingStats = await getUserRatingStats(uid);

      // Load initial reviews (received reviews by default)
      await loadReviews('received');

    } catch (err: any) {
      error = err.message || 'Failed to load profile';
      console.error('Error loading profile:', err);
    } finally {
      loading = false;
    }
  }

  async function loadReviews(type: 'received' | 'given') {
    if (!uid) return;

    try {
      reviewsLoading = true;

      if (type === 'received') {
        // Load reviews where this user is the reviewee
        const result = await getUserReviews(uid, undefined, 10);
        userReviews = result.data || [];
      } else {
        // Load reviews where this user is the reviewer
        // This would need a different query - for now, we'll use the same
        const result = await getUserReviews(uid, undefined, 10);
        userReviews = result.data || [];
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      reviewsLoading = false;
    }
  }

  function switchTab(tab: string) {
    activeTab = tab;
    if (tab === 'reviews-received') {
      loadReviews('received');
    } else if (tab === 'reviews-given') {
      loadReviews('given');
    }
  }

  function formatJoinDate(date: any): string {
    if (!date) return 'Recently joined';
    
    try {
      const joinDate = date.toDate ? date.toDate() : new Date(date);
      return `Joined ${joinDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })}`;
    } catch {
      return 'Recently joined';
    }
  }

  function handleEditProfile() {
    goto('/profile/edit');
  }

  function handleContactUser() {
    if (!currentUser) {
      goto('/auth/signin');
      return;
    }
    goto(`/messages/new?user=${uid}`);
  }

  function viewListing(listing: ListingData) {
    goto(`/listings/${listing.id}`);
  }
</script>

<svelte:head>
  <title>{userProfile?.displayName || 'User Profile'} - GearGrab</title>
  <meta name="description" content="View {userProfile?.displayName || 'user'}'s profile and gear listings on GearGrab" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <div class="max-w-4xl mx-auto px-4 py-8">
      <ErrorBanner message={error} />
      <div class="text-center mt-6">
        <button
          on:click={() => goto('/')}
          class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Go Home
        </button>
      </div>
    </div>
  {:else if userProfile}
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Profile Header -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div class="h-32 bg-gradient-to-r from-primary-500 to-accent-500"></div>
        
        <div class="relative px-6 pb-6">
          <!-- Profile Photo -->
          <div class="absolute -top-16 left-6">
            <div class="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
              {#if userProfile.photoURL}
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  class="w-full h-full object-cover"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center bg-gray-300">
                  <svg class="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              {/if}
            </div>
          </div>

          <!-- Profile Info -->
          <div class="pt-20 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {userProfile.displayName}
              </h1>
              
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                {#if userProfile.location}
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {userProfile.location}
                  </div>
                {/if}
                
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatJoinDate(userProfile.createdAt)}
                </div>

                {#if userProfile.isVerified}
                  <div class="flex items-center text-green-600">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Verified
                  </div>
                {/if}
              </div>

              {#if userProfile.bio}
                <p class="text-gray-700 mb-4 max-w-2xl">
                  {userProfile.bio}
                </p>
              {/if}

              <!-- Stats -->
              <div class="flex flex-wrap gap-6 text-sm">
                <div class="text-center">
                  <div class="font-semibold text-gray-900">{userProfile.listingCount || 0}</div>
                  <div class="text-gray-600">Listings</div>
                </div>
                <div class="text-center">
                  <div class="font-semibold text-gray-900">{userProfile.rentalCount || 0}</div>
                  <div class="text-gray-600">Rentals</div>
                </div>
                {#if userProfile.rating && userProfile.reviewCount}
                  <div class="text-center">
                    <div class="font-semibold text-gray-900 flex items-center">
                      {userProfile.rating.toFixed(1)}
                      <svg class="w-4 h-4 ml-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div class="text-gray-600">{userProfile.reviewCount} reviews</div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-6 sm:mt-0 sm:ml-6 flex flex-col sm:flex-row gap-3">
              {#if isOwnProfile}
                <button
                  on:click={handleEditProfile}
                  class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Edit Profile
                </button>
              {:else}
                <button
                  on:click={handleContactUser}
                  class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Contact
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Stats Section with Reviews -->
      {#if userRatingStats}
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Rating Overview</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- As Renter -->
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <h3 class="font-semibold text-blue-900 mb-2">As Renter</h3>
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
              <h3 class="font-semibold text-green-900 mb-2">As Owner</h3>
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
              <h3 class="font-semibold text-purple-900 mb-2">Overall</h3>
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

      <!-- Tabbed Content Section -->
      <div class="bg-white rounded-lg shadow-md">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200">
          <nav class="flex space-x-8 px-6" aria-label="Tabs">
            <button
              on:click={() => switchTab('listings')}
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              class:border-primary-500={activeTab === 'listings'}
              class:text-primary-600={activeTab === 'listings'}
              class:border-transparent={activeTab !== 'listings'}
              class:text-gray-500={activeTab !== 'listings'}
              class:hover:text-gray-700={activeTab !== 'listings'}
            >
              Listings ({userListings.length})
            </button>

            <button
              on:click={() => switchTab('reviews-received')}
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              class:border-primary-500={activeTab === 'reviews-received'}
              class:text-primary-600={activeTab === 'reviews-received'}
              class:border-transparent={activeTab !== 'reviews-received'}
              class:text-gray-500={activeTab !== 'reviews-received'}
              class:hover:text-gray-700={activeTab !== 'reviews-received'}
            >
              Reviews Received ({userRatingStats?.overall.totalReviews || 0})
            </button>

            {#if isOwnProfile}
              <button
                on:click={() => switchTab('reviews-given')}
                class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                class:border-primary-500={activeTab === 'reviews-given'}
                class:text-primary-600={activeTab === 'reviews-given'}
                class:border-transparent={activeTab !== 'reviews-given'}
                class:text-gray-500={activeTab !== 'reviews-given'}
                class:hover:text-gray-700={activeTab !== 'reviews-given'}
              >
                Reviews Given
              </button>
            {/if}
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          {#if activeTab === 'listings'}
            <!-- Listings Content -->
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-gray-900">
                {isOwnProfile ? 'Your Listings' : `${userProfile.displayName}'s Listings`}
              </h2>
          
          {#if isOwnProfile}
            <button
              on:click={() => goto('/dashboard/listings/create')}
              class="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              Add Listing
            </button>
          {/if}
        </div>

        {#if userListings.length === 0}
          <div class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
            <p class="text-gray-600">
              {isOwnProfile 
                ? 'Start sharing your gear with the community!' 
                : `${userProfile.displayName} hasn't listed any gear yet.`}
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each userListings as listing}
              <div
                class="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                on:click={() => viewListing(listing)}
                on:keydown={(e) => e.key === 'Enter' && viewListing(listing)}
                role="button"
                tabindex="0"
              >
                <!-- Image -->
                <div class="aspect-video bg-gray-200 overflow-hidden">
                  {#if listing.images && listing.images.length > 0}
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  {/if}
                </div>

                <!-- Content -->
                <div class="p-4">
                  <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">{listing.title}</h3>
                  <p class="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
                  
                  <div class="flex items-center justify-between">
                    <span class="text-lg font-bold text-primary-600">
                      ${listing.pricing?.rentalPrice?.daily || listing.pricing?.salePrice || 0}
                      {#if listing.pricing?.rentalPrice?.daily}/day{/if}
                    </span>
                    
                    <span class="text-sm text-gray-500 capitalize">
                      {listing.category}
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}

          {:else if activeTab === 'reviews-received'}
            <!-- Reviews Received Content -->
            <div class="mb-6">
              <h2 class="text-xl font-bold text-gray-900 mb-2">
                Reviews Received
              </h2>
              <p class="text-gray-600 text-sm">
                See what others are saying about {isOwnProfile ? 'you' : userProfile.displayName}
              </p>
            </div>

            {#if reviewsLoading}
              <div class="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            {:else if userReviews.length > 0}
              <div class="space-y-6">
                {#each userReviews as review (review.id)}
                  <ReviewCard
                    {review}
                    showActions={true}
                    showResponse={true}
                    currentUserId={currentUser?.uid}
                    on:helpful={(e) => console.log('Helpful vote:', e.detail)}
                    on:report={(e) => console.log('Report review:', e.detail)}
                  />
                {/each}
              </div>
            {:else}
              <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p class="text-gray-600">
                  {isOwnProfile ? "You haven't received any reviews yet." : `${userProfile.displayName} hasn't received any reviews yet.`}
                </p>
              </div>
            {/if}

          {:else if activeTab === 'reviews-given' && isOwnProfile}
            <!-- Reviews Given Content -->
            <div class="mb-6">
              <h2 class="text-xl font-bold text-gray-900 mb-2">
                Reviews Given
              </h2>
              <p class="text-gray-600 text-sm">
                Reviews you've written for others
              </p>
            </div>

            {#if reviewsLoading}
              <div class="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            {:else if userReviews.length > 0}
              <div class="space-y-6">
                {#each userReviews as review (review.id)}
                  <ReviewCard
                    {review}
                    showActions={false}
                    showResponse={true}
                    currentUserId={currentUser?.uid}
                  />
                {/each}
              </div>
            {:else}
              <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No reviews written</h3>
                <p class="text-gray-600">
                  You haven't written any reviews yet. Complete a rental to leave your first review!
                </p>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-clamp: 2;
  }
</style>
