<script lang="ts">
  import { onMount } from 'svelte';
  import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';
  import { notifications } from '$lib/stores/notifications';

  let verificationRequests = [];
  let filteredRequests = [];
  let loading = true;
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedRequest = null;
  let showDetailsModal = false;

  const statusOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  onMount(async () => {
    await loadVerificationRequests();
  });

  async function loadVerificationRequests() {
    try {
      loading = true;
      
      // Mock verification requests data
      verificationRequests = [
        {
          id: '1',
          userEmail: 'john@example.com',
          userId: 'user123',
          type: 'identity',
          status: 'pending',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          documents: ['drivers_license.jpg', 'selfie.jpg'],
          notes: ''
        },
        {
          id: '2',
          userEmail: 'sarah@example.com',
          userId: 'user456',
          type: 'address',
          status: 'in_review',
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          documents: ['utility_bill.pdf'],
          notes: 'Address verification required'
        },
        {
          id: '3',
          userEmail: 'mike@example.com',
          userId: 'user789',
          type: 'identity',
          status: 'approved',
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          documents: ['passport.jpg'],
          notes: 'Verified successfully'
        }
      ];
      
      filterRequests();
    } catch (error) {
      console.error('Error loading verification requests:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load verification requests',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  function filterRequests() {
    filteredRequests = verificationRequests.filter(request => {
      const matchesSearch = request.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           request.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           request.type?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  $: {
    searchQuery;
    statusFilter;
    filterRequests();
  }

  async function updateRequestStatus(requestId: string, newStatus: string, notes: string = '') {
    try {
      // In a real app, this would update Firestore
      const requestIndex = verificationRequests.findIndex(r => r.id === requestId);
      if (requestIndex !== -1) {
        verificationRequests[requestIndex].status = newStatus;
        verificationRequests[requestIndex].notes = notes;
        verificationRequests[requestIndex].reviewedAt = new Date();
      }
      
      notifications.add({
        type: 'success',
        message: `Verification request ${newStatus} successfully`,
        timeout: 3000
      });
      
      filterRequests();
    } catch (error) {
      console.error('Error updating verification request:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to update verification request',
        timeout: 5000
      });
    }
  }

  function openDetailsModal(request) {
    selectedRequest = request;
    showDetailsModal = true;
  }

  function closeDetailsModal() {
    selectedRequest = null;
    showDetailsModal = false;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return { class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'Pending' };
      case 'in_review':
        return { class: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'In Review' };
      case 'approved':
        return { class: 'bg-green-500/20 text-green-300 border-green-500/30', text: 'Approved' };
      case 'rejected':
        return { class: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'Rejected' };
      default:
        return { class: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: status };
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'identity': return '🆔';
      case 'address': return '🏠';
      case 'phone': return '📱';
      case 'email': return '📧';
      default: return '📄';
    }
  }
</script>

<svelte:head>
  <title>User Verification - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">User Verification</h1>
      <p class="text-gray-400 mt-1">Review and approve user verification requests</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-400">Pending Requests</p>
      <p class="text-2xl font-bold text-white">{verificationRequests.filter(r => r.status === 'pending').length}</p>
    </div>
  </div>

  {#if loading}
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
      <p class="text-gray-400">Loading verification requests...</p>
    </div>
  {:else}
    <!-- Filters -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search -->
        <div>
          <label for="search-requests" class="block text-sm font-medium text-gray-300 mb-2">Search Requests</label>
          <input id="search-requests"
            type="text"
            bind:value="{searchQuery}"
            placeholder="Search by email, user ID, or type..."
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label for="status-filter" class="block text-sm font-medium text-gray-300 mb-2">Status Filter</label>
          <select id="status-filter"
            bind:value="{statusFilter}"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {#each statusOptions as option}
              <option value="{option.value}">{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- Results Count -->
        <div class="flex items-end">
          <div class="text-center">
            <p class="text-sm text-gray-400">Showing Results</p>
            <p class="text-xl font-bold text-white">{filteredRequests.length}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Verification Requests Table -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
      {#if filteredRequests.length === 0}
        <div class="p-8 text-center">
          <p class="text-gray-400">No verification requests found matching your criteria.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-white/5">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Documents</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              {#each filteredRequests as request}
                <tr class="hover:bg-white/5">
                  <td class="px-6 py-4">
                    <div class="text-white font-medium">{request.userEmail}</div>
                    <div class="text-gray-400 text-sm">ID: {request.userId.slice(0, 8)}...</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <span class="text-lg mr-2">{getTypeIcon(request.type)}</span>
                      <span class="text-white capitalize">{request.type}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    {#if request.status}
                      {@const badge = getStatusBadge(request.status)}
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class}">
                        {badge.text}
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-gray-400 text-sm">
                      {request.submittedAt.toLocaleDateString()}
                    </div>
                    <div class="text-gray-500 text-xs">
                      {request.submittedAt.toLocaleTimeString()}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-white text-sm">
                      {request.documents.length} file{request.documents.length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex space-x-2">
                      <button
                        on:click={() => openDetailsModal(request)}
                        class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Review
                      </button>
                      {#if request.status === 'pending' || request.status === 'in_review'}
                        <button
                          on:click={() => updateRequestStatus(request.id, 'approved')}
                          class="text-green-400 hover:text-green-300 text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          on:click={() => updateRequestStatus(request.id, 'rejected')}
                          class="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Reject
                        </button>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Details Modal -->
{#if showDetailsModal && selectedRequest}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-white/20 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">Verification Request Details</h2>
        <button
          on:click="{closeDetailsModal}"
          class="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div class="space-y-6">
        <!-- Request Info -->
        <div class="bg-white/5 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-white mb-3">Request Information</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-gray-400">User Email:</span>
              <span class="text-white ml-2">{selectedRequest.userEmail}</span>
            </div>
            <div>
              <span class="text-gray-400">User ID:</span>
              <span class="text-white ml-2">{selectedRequest.userId}</span>
            </div>
            <div>
              <span class="text-gray-400">Type:</span>
              <span class="text-white ml-2 capitalize">{selectedRequest.type}</span>
            </div>
            <div>
              <span class="text-gray-400">Status:</span>
              {#if selectedRequest.status}
                {@const badge = getStatusBadge(selectedRequest.status)}
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class} ml-2">
                  {badge.text}
                </span>
              {/if}
            </div>
            <div>
              <span class="text-gray-400">Submitted:</span>
              <span class="text-white ml-2">{selectedRequest.submittedAt.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div class="bg-white/5 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-white mb-3">Documents</h3>
          <div class="space-y-2">
            {#each selectedRequest.documents as document}
              <div class="flex items-center justify-between bg-white/5 rounded p-3">
                <span class="text-white">{document}</span>
                <button class="text-blue-400 hover:text-blue-300 text-sm">
                  View
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white/5 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-white mb-3">Notes</h3>
          <p class="text-gray-300">{selectedRequest.notes || 'No notes available'}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-4 mt-6 pt-6 border-t border-white/20">
        <button
          on:click="{closeDetailsModal}"
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Close
        </button>
        {#if selectedRequest.status === 'pending' || selectedRequest.status === 'in_review'}
          <button
            on:click={() => {updateRequestStatus(selectedRequest.id, 'approved'); closeDetailsModal();}}
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
          >
            Approve
          </button>
          <button
            on:click={() => {updateRequestStatus(selectedRequest.id, 'rejected'); closeDetailsModal();}}
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
          >
            Reject
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
