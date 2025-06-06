<script lang="ts">
  import { onMount } from 'svelte';
  import { verificationService, type VerificationRequest } from '$lib/services/verification';
  import { backgroundCheckService } from '$lib/services/backgroundCheck';
  import { authStore } from '$lib/stores/auth';
  
  let backgroundCheckRequests: VerificationRequest[] = [];
  let loading = true;
  let error = '';
  let selectedRequest: VerificationRequest | null = null;
  let filterStatus: 'all' | 'pending' | 'in_progress' | 'approved' | 'rejected' = 'all';
  let searchQuery = '';
  
  onMount(async () => {
    await loadBackgroundCheckRequests();
  });
  
  async function loadBackgroundCheckRequests() {
    try {
      loading = true;
      error = '';
      
      // In a real implementation, this would be an admin-only endpoint
      // For now, we'll simulate loading background check requests
      const allRequests = await verificationService.getAllVerificationRequests();
      backgroundCheckRequests = allRequests.filter(req => req.type === 'background_check');
      
    } catch (err) {
      error = 'Failed to load background check requests';
      console.error('Error loading background checks:', err);
    } finally {
      loading = false;
    }
  }
  
  async function approveBackgroundCheck(requestId: string) {
    try {
      await verificationService.approveVerificationRequest(requestId, 'Background check manually approved by admin');
      await loadBackgroundCheckRequests();
      selectedRequest = null;
    } catch (err) {
      error = 'Failed to approve background check';
      console.error('Error approving background check:', err);
    }
  }
  
  async function rejectBackgroundCheck(requestId: string, reason: string) {
    try {
      await verificationService.rejectVerificationRequest(requestId, reason);
      await loadBackgroundCheckRequests();
      selectedRequest = null;
    } catch (err) {
      error = 'Failed to reject background check';
      console.error('Error rejecting background check:', err);
    }
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'in_progress': return 'text-blue-400 bg-blue-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  }
  
  function getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'high': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  }
  
  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  $: filteredRequests = backgroundCheckRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = !searchQuery || 
      request.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.backgroundCheckData?.provider?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
</script>

<svelte:head>
  <title>Background Check Administration - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-50"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8 pt-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">Background Check Administration</h1>
          <p class="text-gray-300">Review and manage background check requests</p>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-white">{backgroundCheckRequests.length}</div>
          <div class="text-sm text-gray-300">Total Requests</div>
        </div>
      </div>
    </div>

    {#if error}
      <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
        <p class="text-red-200">{error}</p>
        <button 
          on:click={loadBackgroundCheckRequests}
          class="mt-2 text-red-300 hover:text-red-100 underline text-sm"
        >
          Try again
        </button>
      </div>
    {/if}

    <!-- Filters and Search -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium text-gray-300 mb-2">Search</label>
          <input
            id="search"
            type="text"
            bind:value={searchQuery}
            placeholder="Search by user ID or provider..."
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="status-filter" class="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            id="status-filter"
            bind:value={filterStatus}
            class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
        <div class="animate-pulse">
          <div class="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
          <div class="space-y-3">
            {#each Array(5) as _}
              <div class="h-16 bg-white/20 rounded"></div>
            {/each}
          </div>
        </div>
      </div>
    {:else if filteredRequests.length === 0}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">No Background Checks Found</h3>
        <p class="text-gray-300">No background check requests match your current filters.</p>
      </div>
    {:else}
      <!-- Background Check Requests Table -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-white/5">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Provider</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Risk Level</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              {#each filteredRequests as request}
                <tr class="hover:bg-white/5">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white">{request.userId}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white capitalize">{request.backgroundCheckData?.provider || 'N/A'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-white capitalize">{request.backgroundCheckData?.checkType || 'N/A'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(request.status)}">
                      {request.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if request.backgroundCheckData?.riskLevel}
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRiskLevelColor(request.backgroundCheckData.riskLevel)}">
                        {request.backgroundCheckData.riskLevel}
                      </span>
                    {:else}
                      <span class="text-gray-400 text-sm">Pending</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(request.submittedAt)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      on:click={() => selectedRequest = request}
                      class="text-blue-400 hover:text-blue-300 mr-3"
                    >
                      View Details
                    </button>
                    {#if request.status === 'pending' || request.status === 'in_progress'}
                      <button
                        on:click={() => approveBackgroundCheck(request.id)}
                        class="text-green-400 hover:text-green-300 mr-3"
                      >
                        Approve
                      </button>
                      <button
                        on:click={() => rejectBackgroundCheck(request.id, 'Manual review required')}
                        class="text-red-400 hover:text-red-300"
                      >
                        Reject
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Background Check Details Modal -->
    {#if selectedRequest}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Background Check Details</h2>
            <button
              on:click={() => selectedRequest = null}
              class="text-gray-400 hover:text-white"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <!-- Basic Info -->
            <div class="bg-white/5 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3">Request Information</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-300">User ID:</span>
                  <span class="text-white ml-2">{selectedRequest.userId}</span>
                </div>
                <div>
                  <span class="text-gray-300">Request ID:</span>
                  <span class="text-white ml-2">{selectedRequest.id}</span>
                </div>
                <div>
                  <span class="text-gray-300">Provider:</span>
                  <span class="text-white ml-2 capitalize">{selectedRequest.backgroundCheckData?.provider}</span>
                </div>
                <div>
                  <span class="text-gray-300">Check Type:</span>
                  <span class="text-white ml-2 capitalize">{selectedRequest.backgroundCheckData?.checkType}</span>
                </div>
                <div>
                  <span class="text-gray-300">Status:</span>
                  <span class="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(selectedRequest.status)}">
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <span class="text-gray-300">Submitted:</span>
                  <span class="text-white ml-2">{formatDate(selectedRequest.submittedAt)}</span>
                </div>
              </div>
            </div>

            <!-- Background Check Results -->
            {#if selectedRequest.backgroundCheckData?.results}
              <div class="bg-white/5 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-white mb-3">Background Check Results</h3>
                <div class="space-y-3">
                  {#each Object.entries(selectedRequest.backgroundCheckData.results) as [category, result]}
                    <div class="border border-white/10 rounded p-3">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-white font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span class="text-xs px-2 py-1 rounded {result.status === 'clear' || result.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                          {result.status}
                        </span>
                      </div>
                      {#if result.details}
                        <p class="text-gray-300 text-sm">{result.details}</p>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Actions -->
            {#if selectedRequest.status === 'pending' || selectedRequest.status === 'in_progress'}
              <div class="flex space-x-4">
                <button
                  on:click={() => approveBackgroundCheck(selectedRequest.id)}
                  class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Approve
                </button>
                <button
                  on:click={() => rejectBackgroundCheck(selectedRequest.id, 'Manual review required')}
                  class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>
