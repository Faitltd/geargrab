<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import {
    getRenterRentals,
    groupRentalsByStatus,
    getNextAction,
    formatRentalDates,
    type RentalData,
    type NextAction
  } from '$lib/services/rentals';
  import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
  import RenterRentalCard from '$lib/components/dashboard/RenterRentalCard.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { showToast } from '$lib/stores/toast.store';

  // State
  let rentals: RentalData[] = [];
  let isLoading = true;
  let error = '';

  // View options
  let viewMode: 'timeline' | 'grouped' = 'grouped';
  let statusFilter: 'all' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' = 'all';

  // Reactive statements
  $: user = $authStore.data;
  $: isAuthenticated = !!user;

  onMount(async () => {
    // Check authentication
    if (!isAuthenticated) {
      showToast('error', 'Please sign in to access your dashboard');
      goto('/auth/signin');
      return;
    }

    await loadRenterData();
  });

  const loadRenterData = async () => {
    if (!user) return;

    isLoading = true;
    error = '';

    try {
      rentals = await getRenterRentals(user.uid);
    } catch (err: any) {
      console.error('Error loading renter data:', err);
      error = err.message || 'Failed to load rental data';
    } finally {
      isLoading = false;
    }
  };

  const handleRentalAction = (event: CustomEvent) => {
    const { rental, action } = event.detail;
    const nextAction = getNextAction(rental);
    
    if (nextAction.url) {
      goto(nextAction.url);
    }
  };

  const handleViewRental = (event: CustomEvent) => {
    const { rentalId } = event.detail;
    goto(`/rentals/${rentalId}`);
  };

  // Computed values
  $: groupedRentals = groupRentalsByStatus(rentals);
  $: filteredRentals = statusFilter === 'all' 
    ? rentals 
    : rentals.filter(rental => {
        const groups = groupRentalsByStatus([rental]);
        return groups[statusFilter as keyof typeof groups].length > 0;
      });

  $: totalRentals = rentals.length;
  $: pendingRentals = groupedRentals.pending.length;
  $: confirmedRentals = groupedRentals.confirmed.length;
  $: activeRentals = groupedRentals.active.length;
  $: completedRentals = groupedRentals.completed.length;
  $: totalSpent = rentals.reduce((sum, rental) => sum + rental.totalCost, 0);

  // Get urgent actions
  $: urgentActions = rentals
    .map(rental => ({ rental, action: getNextAction(rental) }))
    .filter(({ action }) => action.urgent && action.type !== 'none')
    .slice(0, 3);
</script>

<svelte:head>
  <title>My Rentals - GearGrab</title>
  <meta name="description" content="Manage your gear rentals and track bookings" />
</svelte:head>

<DashboardLayout 
  title="My Rentals" 
  description="Manage your gear rentals and track bookings"
>
  <div slot="header-actions">
    <a
      href="/gear"
      class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>Browse Gear</span>
    </a>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="primary" text="Loading your rentals..." />
      </div>
      
    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-semibold text-red-900 mb-2">Error Loading Rentals</h2>
        <p class="text-red-700 mb-4">{error}</p>
        <button
          on:click={loadRenterData}
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
      
    {:else}
      <!-- Dashboard Content -->
      <div class="space-y-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Active Rentals -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-neutral-600">Active Rentals</p>
                <p class="text-2xl font-bold text-neutral-900">{activeRentals}</p>
              </div>
            </div>
          </div>

          <!-- Upcoming Rentals -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0h6" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-neutral-600">Confirmed</p>
                <p class="text-2xl font-bold text-neutral-900">{confirmedRentals}</p>
              </div>
            </div>
          </div>

          <!-- Pending Rentals -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-orange-100">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-neutral-600">Pending</p>
                <p class="text-2xl font-bold text-neutral-900">{pendingRentals}</p>
              </div>
            </div>
          </div>

          <!-- Completed Rentals -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-yellow-100">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-neutral-600">Completed</p>
                <p class="text-2xl font-bold text-neutral-900">{completedRentals}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Urgent Actions -->
        {#if urgentActions.length > 0}
          <div class="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div class="flex items-start space-x-3">
              <svg class="w-6 h-6 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-orange-900 mb-2">
                  Action Required
                </h3>
                <div class="space-y-2">
                  {#each urgentActions as { rental, action }}
                    <div class="flex items-center justify-between bg-white rounded-lg p-3">
                      <div>
                        <p class="font-medium text-orange-900">{rental.listingTitle}</p>
                        <p class="text-sm text-orange-700">{action.description}</p>
                      </div>
                      {#if action.url}
                        <a
                          href={action.url}
                          class="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          {action.label}
                        </a>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- View Controls -->
        <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-4">
              <!-- View Mode Toggle -->
              <div class="flex bg-neutral-100 rounded-lg p-1">
                <button
                  on:click={() => viewMode = 'grouped'}
                  class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors {
                    viewMode === 'grouped' 
                      ? 'bg-white text-neutral-900 shadow-sm' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }"
                >
                  Grouped
                </button>
                <button
                  on:click={() => viewMode = 'timeline'}
                  class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors {
                    viewMode === 'timeline' 
                      ? 'bg-white text-neutral-900 shadow-sm' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }"
                >
                  Timeline
                </button>
              </div>

              <!-- Status Filter -->
              <div>
                <label for="status-filter" class="sr-only">Filter by status</label>
                <select
                  id="status-filter"
                  bind:value={statusFilter}
                  class="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Rentals</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div class="text-sm text-neutral-600">
              Showing {statusFilter === 'all' ? totalRentals : filteredRentals.length} of {totalRentals} rentals
            </div>
          </div>
        </div>

        <!-- Rentals Display -->
        {#if totalRentals === 0}
          <!-- Empty State -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <svg class="w-16 h-16 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0h6" />
            </svg>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">
              No rentals yet
            </h3>
            <p class="text-neutral-600 mb-6">
              Start exploring gear to rent for your next adventure!
            </p>
            <a
              href="/gear"
              class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Available Gear
            </a>
          </div>
        {:else if viewMode === 'grouped'}
          <!-- Grouped View -->
          <div class="space-y-8">
            {#each Object.entries(groupedRentals) as [status, statusRentals]}
              {#if statusRentals.length > 0 && (statusFilter === 'all' || statusFilter === status)}
                <div>
                  <h2 class="text-xl font-semibold text-neutral-900 mb-4 capitalize">
                    {status} Rentals ({statusRentals.length})
                  </h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each statusRentals as rental (rental.id)}
                      <RenterRentalCard
                        {rental}
                        on:action={handleRentalAction}
                        on:view={handleViewRental}
                      />
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {:else}
          <!-- Timeline View -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 class="text-xl font-semibold text-neutral-900 mb-6">
              Rental Timeline
            </h2>
            <div class="space-y-6">
              {#each filteredRentals as rental, index (rental.id)}
                <div class="flex items-start space-x-4">
                  <!-- Timeline dot -->
                  <div class="flex-shrink-0 w-3 h-3 bg-primary-500 rounded-full mt-2"></div>
                  
                  <!-- Timeline content -->
                  <div class="flex-1 min-w-0">
                    <RenterRentalCard
                      {rental}
                      compact={true}
                      on:action={handleRentalAction}
                      on:view={handleViewRental}
                    />
                  </div>
                </div>
                
                {#if index < filteredRentals.length - 1}
                  <div class="ml-1.5 w-0.5 h-6 bg-neutral-200"></div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</DashboardLayout>
