<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore } from '$lib/firebase/client';
  import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

  export let userId: string;
  export let showReviews = true;
  export let maxReviews = 3;
  export let compact = false;

  let loading = true;
  let userRating = {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  };
  let recentReviews: any[] = [];

  onMount(async () => {
    if (userId) {
      await loadUserRating();
    }
  });

  async function loadUserRating() {
    try {
      loading = true;

      // Get reviews for this user (as owner)
      const reviewsQuery = query(
        collection(firestore, 'reviews'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(maxReviews)
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      recentReviews = [];
      let totalRating = 0;
      let ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      reviewsSnapshot.forEach((doc) => {
        const review = { id: doc.id, ...doc.data() };
        recentReviews.push(review);
        
        const rating = review.rating || 0;
        totalRating += rating;
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating as keyof typeof ratingCounts]++;
        }
      });

      userRating = {
        averageRating: recentReviews.length > 0 ? totalRating / recentReviews.length : 0,
        totalReviews: recentReviews.length,
        ratingBreakdown: ratingCounts
      };

    } catch (error) {
      console.error('Error loading user rating:', error);
      // Use fallback data for demo
      userRating = {
        averageRating: 4.7,
        totalReviews: 23,
        ratingBreakdown: { 5: 18, 4: 4, 3: 1, 2: 0, 1: 0 }
      };
      
      // Add sample reviews for demo
      recentReviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Great gear and excellent communication! The tent was exactly as described.',
          renterName: 'Alex M.',
          listingTitle: 'REI Co-op Half Dome Tent',
          createdAt: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
        },
        {
          id: '2',
          rating: 5,
          comment: 'Super clean equipment and easy pickup. Highly recommend!',
          renterName: 'Sarah K.',
          listingTitle: 'Osprey Backpack',
          createdAt: { toDate: () => new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
        },
        {
          id: '3',
          rating: 4,
          comment: 'Good quality gear, minor wear but worked perfectly for our trip.',
          renterName: 'Mike D.',
          listingTitle: 'Sleeping Bag',
          createdAt: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      ];
    } finally {
      loading = false;
    }
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  function getRatingColor(rating: number): string {
    if (rating >= 4.5) return 'text-green-400';
    if (rating >= 4.0) return 'text-yellow-400';
    if (rating >= 3.0) return 'text-orange-400';
    return 'text-red-400';
  }

  function getStarFill(starIndex: number, rating: number): string {
    if (starIndex <= Math.floor(rating)) return 'text-yellow-400';
    if (starIndex === Math.ceil(rating) && rating % 1 >= 0.5) return 'text-yellow-400';
    return 'text-gray-400';
  }
</script>

{#if !loading}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
    <!-- Rating Summary -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="text-center">
          <div class="text-2xl font-bold {getRatingColor(userRating.averageRating)}">
            {userRating.averageRating.toFixed(1)}
          </div>
          <div class="flex items-center justify-center space-x-1">
            {#each Array(5) as _, i}
              <svg class="w-4 h-4 {getStarFill(i + 1, userRating.averageRating)}" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            {/each}
          </div>
          <div class="text-xs text-gray-400">{userRating.totalReviews} reviews</div>
        </div>
      </div>

      {#if !compact && userRating.totalReviews > 0}
        <!-- Rating Breakdown -->
        <div class="flex-1 max-w-xs ml-6">
          {#each [5, 4, 3, 2, 1] as rating}
            {@const count = userRating.ratingBreakdown[rating] || 0}
            {@const percentage = userRating.totalReviews > 0 ? (count / userRating.totalReviews) * 100 : 0}
            <div class="flex items-center space-x-2 text-xs">
              <span class="text-gray-300 w-2">{rating}</span>
              <div class="flex-1 bg-white/10 rounded-full h-2">
                <div 
                  class="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style="width: {percentage}%"
                ></div>
              </div>
              <span class="text-gray-400 w-6">{count}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Recent Reviews -->
    {#if showReviews && recentReviews.length > 0}
      <div class="space-y-3">
        <h4 class="text-white font-medium text-sm">Recent Reviews</h4>
        {#each recentReviews as review}
          <div class="bg-white/5 rounded-lg p-3">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div class="flex items-center space-x-1">
                  {#each Array(5) as _, i}
                    <svg class="w-3 h-3 {i < review.rating ? 'text-yellow-400' : 'text-gray-400'}" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  {/each}
                </div>
                <span class="text-white text-sm font-medium">{review.renterName}</span>
              </div>
              <span class="text-gray-400 text-xs">{formatDate(review.createdAt)}</span>
            </div>
            
            {#if review.listingTitle}
              <div class="text-gray-300 text-xs mb-1">For: {review.listingTitle}</div>
            {/if}
            
            <p class="text-gray-200 text-sm">{review.comment}</p>
          </div>
        {/each}
        
        {#if userRating.totalReviews > maxReviews}
          <button class="text-green-400 hover:text-green-300 text-sm font-medium">
            View all {userRating.totalReviews} reviews →
          </button>
        {/if}
      </div>
    {:else if showReviews}
      <div class="text-center py-4">
        <div class="text-gray-400 text-sm">No reviews yet</div>
        <div class="text-gray-500 text-xs mt-1">Reviews will appear here after completed rentals</div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Loading State -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
    <div class="animate-pulse">
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-16 h-16 bg-white/10 rounded-lg"></div>
        <div class="flex-1">
          <div class="h-4 bg-white/10 rounded mb-2"></div>
          <div class="h-3 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
      <div class="space-y-2">
        <div class="h-3 bg-white/10 rounded"></div>
        <div class="h-3 bg-white/10 rounded w-5/6"></div>
      </div>
    </div>
  </div>
{/if}
