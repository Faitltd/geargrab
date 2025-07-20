<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';
  import { dev } from '$app/environment';
  import { 
    isCurrentUserAdmin,
    getDisputes,
    getReviewQueue,
    type Dispute,
    type ReviewQueueItem
  } from '$lib/services/admin.service';
  import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
  import DisputeCard from '$lib/components/admin/DisputeCard.svelte';
  import ReviewQueueCard from '$lib/components/admin/ReviewQueueCard.svelte';
  import UserManagement from '$lib/components/admin/UserManagement.svelte';
  import AuditLog from '$lib/components/admin/AuditLog.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';

  // State
  let isAdmin = false;
  let isLoading = true;
  let error = '';
  let disputes: Dispute[] = [];
  let reviewQueue: ReviewQueueItem[] = [];
  let activeTab: 'overview' | 'disputes' | 'queue' | 'users' | 'audit' = 'overview';

  // Check authentication state (including mock auth for testing)
  function checkAuthState() {
    if (dev && typeof window !== 'undefined') {
      // In development, check localStorage for mock auth
      const mockUser = window.localStorage.getItem('user');
      return mockUser !== null;
    }
    return $authStore.data !== null;
  }

  // Reactive statements
  $: pendingDisputes = disputes.filter(d => d.status === 'pending');
  $: urgentDisputes = disputes.filter(d => d.priority === 'urgent');
  $: pendingReviews = reviewQueue.filter(r => r.status === 'pending');
  $: highPriorityReviews = reviewQueue.filter(r => r.priority === 'high');

  onMount(async () => {
    await checkAuthAndAdmin();
  });

  async function checkAuthAndAdmin() {
    // Check authentication first
    const authenticated = checkAuthState();

    if (!authenticated) {
      showToast('error', 'Please sign in to access the admin panel');
      goto('/auth/signin');
      return;
    }

    await checkAdminAccess();
  }

  async function checkAdminAccess() {
    try {
      isLoading = true;
      error = '';

      // Check if user is admin
      isAdmin = await isCurrentUserAdmin();
      
      if (!isAdmin) {
        showToast('error', 'Access denied: Admin privileges required');
        goto('/dashboard');
        return;
      }

      // Load admin data
      await loadAdminData();

    } catch (err) {
      console.error('Error checking admin access:', err);
      error = err instanceof Error ? err.message : 'Failed to verify admin access';
    } finally {
      isLoading = false;
    }
  }

  async function loadAdminData() {
    try {
      // Load disputes and review queue in parallel
      const [disputesData, queueData] = await Promise.all([
        getDisputes(),
        getReviewQueue()
      ]);

      disputes = disputesData;
      reviewQueue = queueData;

    } catch (err) {
      console.error('Error loading admin data:', err);
      error = err instanceof Error ? err.message : 'Failed to load admin data';
    }
  }

  function switchTab(tab: typeof activeTab) {
    activeTab = tab;
  }
</script>

<svelte:head>
  <title>Admin Panel - GearGrab</title>
  <meta name="description" content="GearGrab administration and moderation panel" />
</svelte:head>

{#if isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>

{:else if error}
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <ErrorBanner message={error} />
      <div class="mt-4 text-center">
        <button
          on:click={checkAdminAccess}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>

{:else if isAdmin}
  <AdminLayout>
    <div data-cy="admin-dashboard">
      <!-- Header -->
      <div class="mb-8" data-cy="admin-header">
        <h1 class="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p class="mt-2 text-gray-600">
          Manage disputes, review content, and moderate the GearGrab platform
        </p>
      </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          on:click={() => switchTab('overview')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'overview' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Overview
        </button>
        <button
          on:click={() => switchTab('disputes')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'disputes' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Disputes
          {#if pendingDisputes.length > 0}
            <span class="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {pendingDisputes.length}
            </span>
          {/if}
        </button>
        <button
          on:click={() => switchTab('queue')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'queue' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Review Queue
          {#if pendingReviews.length > 0}
            <span class="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
              {pendingReviews.length}
            </span>
          {/if}
        </button>
        <button
          on:click={() => switchTab('users')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'users'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          User Management
        </button>
        <button
          on:click={() => switchTab('audit')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'audit'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Audit Log
        </button>
      </nav>
    </div>

    <!-- Content -->
    {#if activeTab === 'overview'}
      <!-- Overview Dashboard -->
      <div class="space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Pending Disputes -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Pending Disputes</p>
                <p class="text-2xl font-semibold text-gray-900">{pendingDisputes.length}</p>
              </div>
            </div>
          </div>

          <!-- Urgent Disputes -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Urgent Disputes</p>
                <p class="text-2xl font-semibold text-gray-900">{urgentDisputes.length}</p>
              </div>
            </div>
          </div>

          <!-- Pending Reviews -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Pending Reviews</p>
                <p class="text-2xl font-semibold text-gray-900">{pendingReviews.length}</p>
              </div>
            </div>
          </div>

          <!-- High Priority Reviews -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">High Priority</p>
                <p class="text-2xl font-semibold text-gray-900">{highPriorityReviews.length}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Disputes -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Disputes</h3>
            {#if disputes.length === 0}
              <p class="text-gray-500 text-center py-4">No disputes to review</p>
            {:else}
              <div class="space-y-3">
                {#each disputes.slice(0, 3) as dispute}
                  <DisputeCard {dispute} compact={true} on:resolve={loadAdminData} />
                {/each}
              </div>
              {#if disputes.length > 3}
                <div class="mt-4 text-center">
                  <button
                    on:click={() => switchTab('disputes')}
                    class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View All Disputes ({disputes.length})
                  </button>
                </div>
              {/if}
            {/if}
          </div>

          <!-- Recent Review Queue -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Review Queue</h3>
            {#if reviewQueue.length === 0}
              <p class="text-gray-500 text-center py-4">No items in review queue</p>
            {:else}
              <div class="space-y-3">
                {#each reviewQueue.slice(0, 3) as item}
                  <ReviewQueueCard {item} compact={true} on:action={loadAdminData} />
                {/each}
              </div>
              {#if reviewQueue.length > 3}
                <div class="mt-4 text-center">
                  <button
                    on:click={() => switchTab('queue')}
                    class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View All Items ({reviewQueue.length})
                  </button>
                </div>
              {/if}
            {/if}
          </div>
        </div>
      </div>

    {:else if activeTab === 'disputes'}
      <!-- Disputes Management -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Dispute Management</h2>
          <div class="text-sm text-gray-500">
            {disputes.length} total disputes
          </div>
        </div>

        {#if disputes.length === 0}
          <div class="text-center py-12">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No disputes</h3>
            <p class="text-gray-600">All disputes have been resolved</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each disputes as dispute}
              <DisputeCard {dispute} on:resolve={loadAdminData} />
            {/each}
          </div>
        {/if}
      </div>

    {:else if activeTab === 'queue'}
      <!-- Review Queue -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Review Queue</h2>
          <div class="text-sm text-gray-500">
            {reviewQueue.length} items pending review
          </div>
        </div>

        {#if reviewQueue.length === 0}
          <div class="text-center py-12">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Queue is empty</h3>
            <p class="text-gray-600">No items require review at this time</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each reviewQueue as item}
              <ReviewQueueCard {item} on:action={loadAdminData} />
            {/each}
          </div>
        {/if}
      </div>

    {:else if activeTab === 'users'}
      <!-- User Management -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">User Management</h2>
        </div>

        <UserManagement />
      </div>

    {:else if activeTab === 'audit'}
      <!-- Audit Log -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Audit Log</h2>
        </div>

        <AuditLog />
      </div>
    {/if}
    </div>
  </AdminLayout>

{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center" data-cy="access-denied">
      <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
      </svg>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p class="text-gray-600 mb-4">You don't have permission to access the admin panel</p>
      <button
        on:click={() => goto('/dashboard')}
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  </div>
{/if}
