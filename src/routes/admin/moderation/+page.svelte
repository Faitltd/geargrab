<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { collection, getDocs, query, where, orderBy, limit, updateDoc, doc, deleteDoc } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { isCurrentUserAdmin } from '$lib/auth/admin';
  import { notifications } from '$lib/stores/notifications';

  let loading = true;
  let isAdmin = false;
  let activeTab = 'reviews';

  // Moderation data
  let pendingReviews = [];
  let reportedContent = [];
  let flaggedListings = [];
  let suspiciousUsers = [];
  let moderationStats = {
    pendingReviews: 0,
    reportedContent: 0,
    flaggedListings: 0,
    suspiciousUsers: 0,
    totalActions: 0
  };

  onMount(async () => {
    await checkAdminAccess();
    if (isAdmin) {
      await loadModerationData();
    }
  });

  async function checkAdminAccess() {
    try {
      await simpleAuth.waitForAuthReady();
      
      if (!simpleAuth.user) {
        goto('/auth/login');
        return;
      }

      isAdmin = await isCurrentUserAdmin();
      
      if (!isAdmin) {
        notifications.add({
          type: 'error',
          message: 'Admin access required',
          timeout: 5000
        });
        goto('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      goto('/dashboard');
    }
  }

  async function loadModerationData() {
    try {
      loading = true;

      // Load pending reviews
      const reviewsQuery = query(
        collection(firestore, 'reviews'),
        where('moderationStatus', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      pendingReviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load reported content
      const reportsQuery = query(
        collection(firestore, 'reviewReports'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const reportsSnap = await getDocs(reportsQuery);
      reportedContent = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load flagged listings (inactive or reported)
      const flaggedQuery = query(
        collection(firestore, 'listings'),
        where('isActive', '==', false),
        limit(20)
      );
      const flaggedSnap = await getDocs(flaggedQuery);
      flaggedListings = flaggedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load users with multiple reports or suspicious activity
      const usersQuery = query(
        collection(firestore, 'users'),
        limit(50)
      );
      const usersSnap = await getDocs(usersQuery);
      suspiciousUsers = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.reportCount > 0 || !user.isVerified && user.createdAt?.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000));

      // Update stats
      moderationStats = {
        pendingReviews: pendingReviews.length,
        reportedContent: reportedContent.length,
        flaggedListings: flaggedListings.length,
        suspiciousUsers: suspiciousUsers.length,
        totalActions: pendingReviews.length + reportedContent.length + flaggedListings.length
      };

    } catch (error) {
      console.error('Error loading moderation data:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load moderation data',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  async function approveReview(reviewId: string) {
    try {
      await updateDoc(doc(firestore, 'reviews', reviewId), {
        moderationStatus: 'approved',
        moderatedAt: new Date(),
        moderatedBy: simpleAuth.user?.uid
      });

      pendingReviews = pendingReviews.filter(review => review.id !== reviewId);
      moderationStats.pendingReviews--;

      notifications.add({
        type: 'success',
        message: 'Review approved',
        timeout: 3000
      });
    } catch (error) {
      console.error('Error approving review:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to approve review',
        timeout: 5000
      });
    }
  }

  async function rejectReview(reviewId: string) {
    try {
      await updateDoc(doc(firestore, 'reviews', reviewId), {
        moderationStatus: 'rejected',
        moderatedAt: new Date(),
        moderatedBy: simpleAuth.user?.uid
      });

      pendingReviews = pendingReviews.filter(review => review.id !== reviewId);
      moderationStats.pendingReviews--;

      notifications.add({
        type: 'success',
        message: 'Review rejected',
        timeout: 3000
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to reject review',
        timeout: 5000
      });
    }
  }

  async function dismissReport(reportId: string) {
    try {
      await deleteDoc(doc(firestore, 'reviewReports', reportId));
      
      reportedContent = reportedContent.filter(report => report.id !== reportId);
      moderationStats.reportedContent--;

      notifications.add({
        type: 'success',
        message: 'Report dismissed',
        timeout: 3000
      });
    } catch (error) {
      console.error('Error dismissing report:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to dismiss report',
        timeout: 5000
      });
    }
  }

  async function activateListing(listingId: string) {
    try {
      await updateDoc(doc(firestore, 'listings', listingId), {
        isActive: true,
        moderatedAt: new Date(),
        moderatedBy: simpleAuth.user?.uid
      });

      flaggedListings = flaggedListings.filter(listing => listing.id !== listingId);
      moderationStats.flaggedListings--;

      notifications.add({
        type: 'success',
        message: 'Listing activated',
        timeout: 3000
      });
    } catch (error) {
      console.error('Error activating listing:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to activate listing',
        timeout: 5000
      });
    }
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
</script>

<svelte:head>
  <title>Content Moderation - GearGrab Admin</title>
</svelte:head>

{#if !isAdmin}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
      <p class="text-gray-300">Checking admin access...</p>
    </div>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-white">Content Moderation</h1>
        <p class="text-gray-400 mt-1">Review and moderate platform content</p>
      </div>
      <button
        on:click={loadModerationData}
        class="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        🔄 Refresh
      </button>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-yellow-200 text-sm font-medium">Pending Reviews</p>
            <p class="text-3xl font-bold text-white">{moderationStats.pendingReviews}</p>
          </div>
          <div class="text-4xl">📝</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-200 text-sm font-medium">Reported Content</p>
            <p class="text-3xl font-bold text-white">{moderationStats.reportedContent}</p>
          </div>
          <div class="text-4xl">🚨</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-md rounded-xl p-6 border border-orange-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-200 text-sm font-medium">Flagged Listings</p>
            <p class="text-3xl font-bold text-white">{moderationStats.flaggedListings}</p>
          </div>
          <div class="text-4xl">🏷️</div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-200 text-sm font-medium">Suspicious Users</p>
            <p class="text-3xl font-bold text-white">{moderationStats.suspiciousUsers}</p>
          </div>
          <div class="text-4xl">👤</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
      <div class="border-b border-white/20">
        <nav class="flex space-x-8 px-6">
          {#each [
            { id: 'reviews', label: 'Pending Reviews', count: moderationStats.pendingReviews },
            { id: 'reports', label: 'Reported Content', count: moderationStats.reportedContent },
            { id: 'listings', label: 'Flagged Listings', count: moderationStats.flaggedListings },
            { id: 'users', label: 'Suspicious Users', count: moderationStats.suspiciousUsers }
          ] as tab}
            <button
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === tab.id ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-300'}"
              on:click={() => activeTab = tab.id}
            >
              {tab.label}
              {#if tab.count > 0}
                <span class="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{tab.count}</span>
              {/if}
            </button>
          {/each}
        </nav>
      </div>

      <div class="p-6">
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <span class="ml-3 text-gray-300">Loading moderation data...</span>
          </div>
        {:else if activeTab === 'reviews'}
          <!-- Pending Reviews -->
          {#if pendingReviews.length === 0}
            <div class="text-center py-8">
              <div class="text-6xl mb-4">✅</div>
              <h3 class="text-xl font-medium text-white mb-2">No pending reviews</h3>
              <p class="text-gray-400">All reviews have been moderated</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each pendingReviews as review}
                <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="text-white font-medium">{review.title || 'No title'}</h4>
                      <p class="text-gray-400 text-sm">By {review.reviewerName} • {formatDate(review.createdAt)}</p>
                    </div>
                    <div class="flex items-center space-x-1">
                      {#each Array(5) as _, i}
                        <span class="text-lg {i < review.overallRating ? 'text-yellow-400' : 'text-gray-500'}">★</span>
                      {/each}
                    </div>
                  </div>
                  
                  <p class="text-gray-200 mb-4">{review.comment}</p>
                  
                  <div class="flex justify-end space-x-3">
                    <button
                      on:click={() => rejectReview(review.id)}
                      class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      on:click={() => approveReview(review.id)}
                      class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === 'reports'}
          <!-- Reported Content -->
          {#if reportedContent.length === 0}
            <div class="text-center py-8">
              <div class="text-6xl mb-4">🛡️</div>
              <h3 class="text-xl font-medium text-white mb-2">No reported content</h3>
              <p class="text-gray-400">No content has been reported by users</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each reportedContent as report}
                <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="text-white font-medium">Report: {report.reason}</h4>
                      <p class="text-gray-400 text-sm">Reported {formatDate(report.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div class="flex justify-end space-x-3">
                    <button
                      on:click={() => dismissReport(report.id)}
                      class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === 'listings'}
          <!-- Flagged Listings -->
          {#if flaggedListings.length === 0}
            <div class="text-center py-8">
              <div class="text-6xl mb-4">📦</div>
              <h3 class="text-xl font-medium text-white mb-2">No flagged listings</h3>
              <p class="text-gray-400">All listings are active</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each flaggedListings as listing}
                <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="text-white font-medium">{listing.title}</h4>
                      <p class="text-gray-400 text-sm">Category: {listing.category} • ${listing.dailyPrice}/day</p>
                    </div>
                  </div>
                  
                  <div class="flex justify-end space-x-3">
                    <button
                      on:click={() => activateListing(listing.id)}
                      class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Activate
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === 'users'}
          <!-- Suspicious Users -->
          {#if suspiciousUsers.length === 0}
            <div class="text-center py-8">
              <div class="text-6xl mb-4">👥</div>
              <h3 class="text-xl font-medium text-white mb-2">No suspicious users</h3>
              <p class="text-gray-400">All users appear to be legitimate</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each suspiciousUsers as user}
                <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="text-white font-medium">{user.displayName || 'No name'}</h4>
                      <p class="text-gray-400 text-sm">{user.email} • Joined {formatDate(user.createdAt)}</p>
                      <p class="text-gray-400 text-sm">Verified: {user.isVerified ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  
                  <div class="flex justify-end space-x-3">
                    <a
                      href="/admin/users?user={user.id}"
                      class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
