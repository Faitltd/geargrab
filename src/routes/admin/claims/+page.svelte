<script lang="ts">
  import { onMount } from 'svelte';
  import { notifications } from '$lib/stores/notifications';

  let claims = [];
  let filteredClaims = [];
  let loading = true;
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedClaim = null;
  let showDetailsModal = false;

  const statusOptions = [
    { value: 'all', label: 'All Claims' },
    { value: 'pending', label: 'Pending' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'approved', label: 'Approved' },
    { value: 'denied', label: 'Denied' },
    { value: 'settled', label: 'Settled' }
  ];

  onMount(async () => {
    await loadClaims();
  });

  async function loadClaims() {
    try {
      loading = true;
      
      // Mock insurance claims data
      claims = [
        {
          id: 'CLM001',
          bookingId: 'BK123456',
          claimantEmail: 'john@example.com',
          claimantType: 'renter',
          itemName: 'Professional Camera Kit',
          ownerEmail: 'sarah@example.com',
          claimType: 'damage',
          status: 'pending',
          amount: 1200,
          description: 'Camera lens was cracked during rental period',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          evidence: ['damage_photo1.jpg', 'damage_photo2.jpg', 'receipt.pdf'],
          notes: ''
        },
        {
          id: 'CLM002',
          bookingId: 'BK789012',
          claimantEmail: 'mike@example.com',
          claimantType: 'owner',
          itemName: 'Drone with 4K Camera',
          renterEmail: 'lisa@example.com',
          claimType: 'theft',
          status: 'investigating',
          amount: 2500,
          description: 'Drone was not returned after rental period ended',
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          evidence: ['police_report.pdf', 'communication_log.pdf'],
          notes: 'Police report filed, investigating with local authorities'
        },
        {
          id: 'CLM003',
          bookingId: 'BK345678',
          claimantEmail: 'david@example.com',
          claimantType: 'renter',
          itemName: 'Mountain Bike',
          ownerEmail: 'emma@example.com',
          claimType: 'injury',
          status: 'approved',
          amount: 850,
          description: 'Brake failure caused accident and injury',
          submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          evidence: ['medical_report.pdf', 'bike_inspection.pdf'],
          notes: 'Approved for medical expenses, brake defect confirmed'
        }
      ];
      
      filterClaims();
    } catch (error) {
      console.error('Error loading claims:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load insurance claims',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  function filterClaims() {
    filteredClaims = claims.filter(claim => {
      const matchesSearch = claim.claimantEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           claim.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           claim.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           claim.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  $: {
    searchQuery;
    statusFilter;
    filterClaims();
  }

  async function updateClaimStatus(claimId: string, newStatus: string, notes: string = '') {
    try {
      const claimIndex = claims.findIndex(c => c.id === claimId);
      if (claimIndex !== -1) {
        claims[claimIndex].status = newStatus;
        claims[claimIndex].notes = notes;
        claims[claimIndex].updatedAt = new Date();
      }
      
      notifications.add({
        type: 'success',
        message: `Claim ${newStatus} successfully`,
        timeout: 3000
      });
      
      filterClaims();
    } catch (error) {
      console.error('Error updating claim:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to update claim',
        timeout: 5000
      });
    }
  }

  function openDetailsModal(claim) {
    selectedClaim = claim;
    showDetailsModal = true;
  }

  function closeDetailsModal() {
    selectedClaim = null;
    showDetailsModal = false;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return { class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'Pending' };
      case 'investigating':
        return { class: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'Investigating' };
      case 'approved':
        return { class: 'bg-green-500/20 text-green-300 border-green-500/30', text: 'Approved' };
      case 'denied':
        return { class: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'Denied' };
      case 'settled':
        return { class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'Settled' };
      default:
        return { class: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: status };
    }
  }

  function getClaimTypeIcon(type: string) {
    switch (type) {
      case 'damage': return '💥';
      case 'theft': return '🚨';
      case 'injury': return '🏥';
      case 'loss': return '❓';
      default: return '📋';
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Insurance Claims - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">Insurance Claims</h1>
      <p class="text-gray-400 mt-1">Manage and review insurance claims</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-400">Pending Claims</p>
      <p class="text-2xl font-bold text-white">{claims.filter(c => c.status === 'pending').length}</p>
    </div>
  </div>

  {#if loading}
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
      <p class="text-gray-400">Loading insurance claims...</p>
    </div>
  {:else}
    <!-- Filters -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Search Claims</label>
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search by claimant, item, or claim ID..."
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Status Filter</label>
          <select
            bind:value={statusFilter}
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {#each statusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- Results Count -->
        <div class="flex items-end">
          <div class="text-center">
            <p class="text-sm text-gray-400">Showing Results</p>
            <p class="text-xl font-bold text-white">{filteredClaims.length}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Claims Table -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
      {#if filteredClaims.length === 0}
        <div class="p-8 text-center">
          <p class="text-gray-400">No insurance claims found matching your criteria.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-white/5">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Claim</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Claimant</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Item</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              {#each filteredClaims as claim}
                <tr class="hover:bg-white/5">
                  <td class="px-6 py-4">
                    <div class="text-white font-medium">#{claim.id}</div>
                    <div class="text-gray-400 text-sm">{claim.submittedAt.toLocaleDateString()}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-white">{claim.claimantEmail}</div>
                    <div class="text-gray-400 text-sm capitalize">({claim.claimantType})</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-white">{claim.itemName}</div>
                    <div class="text-gray-400 text-sm">Booking: {claim.bookingId}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <span class="text-lg mr-2">{getClaimTypeIcon(claim.claimType)}</span>
                      <span class="text-white capitalize">{claim.claimType}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-white font-medium">{formatCurrency(claim.amount)}</div>
                  </td>
                  <td class="px-6 py-4">
                    {#if claim.status}
                      {@const badge = getStatusBadge(claim.status)}
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class}">
                        {badge.text}
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex space-x-2">
                      <button
                        on:click={() => openDetailsModal(claim)}
                        class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Review
                      </button>
                      {#if claim.status === 'pending'}
                        <button
                          on:click={() => updateClaimStatus(claim.id, 'investigating')}
                          class="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                        >
                          Investigate
                        </button>
                      {/if}
                      {#if claim.status === 'investigating'}
                        <button
                          on:click={() => updateClaimStatus(claim.id, 'approved')}
                          class="text-green-400 hover:text-green-300 text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          on:click={() => updateClaimStatus(claim.id, 'denied')}
                          class="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Deny
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
{#if showDetailsModal && selectedClaim}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-6 w-full max-w-4xl mx-4 border border-white/20 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">Claim Details - #{selectedClaim.id}</h2>
        <button
          on:click={closeDetailsModal}
          class="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Claim Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Claim Information</h3>
          <div class="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-gray-400">Claim ID:</span>
              <span class="text-white ml-2">#{selectedClaim.id}</span>
            </div>
            <div>
              <span class="text-gray-400">Booking ID:</span>
              <span class="text-white ml-2">{selectedClaim.bookingId}</span>
            </div>
            <div>
              <span class="text-gray-400">Type:</span>
              <span class="text-white ml-2 capitalize">{selectedClaim.claimType}</span>
            </div>
            <div>
              <span class="text-gray-400">Amount:</span>
              <span class="text-white ml-2 font-semibold">{formatCurrency(selectedClaim.amount)}</span>
            </div>
            <div>
              <span class="text-gray-400">Status:</span>
              {#if selectedClaim.status}
                {@const badge = getStatusBadge(selectedClaim.status)}
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class} ml-2">
                  {badge.text}
                </span>
              {/if}
            </div>
            <div>
              <span class="text-gray-400">Submitted:</span>
              <span class="text-white ml-2">{selectedClaim.submittedAt.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Parties Involved -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Parties Involved</h3>
          <div class="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-gray-400">Claimant:</span>
              <span class="text-white ml-2">{selectedClaim.claimantEmail}</span>
              <span class="text-gray-400 ml-2">({selectedClaim.claimantType})</span>
            </div>
            <div>
              <span class="text-gray-400">Item:</span>
              <span class="text-white ml-2">{selectedClaim.itemName}</span>
            </div>
            {#if selectedClaim.ownerEmail}
              <div>
                <span class="text-gray-400">Owner:</span>
                <span class="text-white ml-2">{selectedClaim.ownerEmail}</span>
              </div>
            {/if}
            {#if selectedClaim.renterEmail}
              <div>
                <span class="text-gray-400">Renter:</span>
                <span class="text-white ml-2">{selectedClaim.renterEmail}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Description -->
        <div class="lg:col-span-2 space-y-4">
          <h3 class="text-lg font-semibold text-white">Description</h3>
          <div class="bg-white/5 rounded-lg p-4">
            <p class="text-white">{selectedClaim.description}</p>
          </div>
        </div>

        <!-- Evidence -->
        <div class="lg:col-span-2 space-y-4">
          <h3 class="text-lg font-semibold text-white">Evidence</h3>
          <div class="bg-white/5 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each selectedClaim.evidence as evidence}
                <div class="flex items-center justify-between bg-white/5 rounded p-3">
                  <span class="text-white">{evidence}</span>
                  <button class="text-blue-400 hover:text-blue-300 text-sm">
                    View
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="lg:col-span-2 space-y-4">
          <h3 class="text-lg font-semibold text-white">Admin Notes</h3>
          <div class="bg-white/5 rounded-lg p-4">
            <p class="text-gray-300">{selectedClaim.notes || 'No notes available'}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-4 mt-6 pt-6 border-t border-white/20">
        <button
          on:click={closeDetailsModal}
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Close
        </button>
        {#if selectedClaim.status === 'pending'}
          <button
            on:click={() => {updateClaimStatus(selectedClaim.id, 'investigating'); closeDetailsModal();}}
            class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
          >
            Start Investigation
          </button>
        {/if}
        {#if selectedClaim.status === 'investigating'}
          <button
            on:click={() => {updateClaimStatus(selectedClaim.id, 'approved'); closeDetailsModal();}}
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
          >
            Approve Claim
          </button>
          <button
            on:click={() => {updateClaimStatus(selectedClaim.id, 'denied'); closeDetailsModal();}}
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
          >
            Deny Claim
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
