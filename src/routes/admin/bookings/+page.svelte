<script lang="ts">
  import { onMount } from 'svelte';
  import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';
  import { notifications } from '$lib/stores/notifications';

  let bookings = [];
  let filteredBookings = [];
  let loading = true;
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedBooking = null;
  let showDetailsModal = false;

  const statusOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'disputed', label: 'Disputed' }
  ];

  onMount(async () => {
    await loadBookings();
  });

  async function loadBookings() {
    try {
      loading = true;
      const bookingsRef = collection(firestore, 'bookings');
      const bookingsSnap = await getDocs(query(bookingsRef, orderBy('createdAt', 'desc')));
      
      bookings = bookingsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || new Date()
      }));
      
      filterBookings();
    } catch (error) {
      console.error('Error loading bookings:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load bookings',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  function filterBookings() {
    filteredBookings = bookings.filter(booking => {
      const matchesSearch = booking.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           booking.renterEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           booking.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           booking.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  $: {
    searchQuery;
    statusFilter;
    filterBookings();
  }

  async function updateBookingStatus(bookingId: string, newStatus: string) {
    try {
      const bookingRef = doc(firestore, 'bookings', bookingId);
      await updateDoc(bookingRef, { 
        status: newStatus,
        updatedAt: new Date(),
        adminUpdated: true
      });
      
      notifications.add({
        type: 'success',
        message: `Booking ${newStatus} successfully`,
        timeout: 3000
      });
      
      await loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to update booking',
        timeout: 5000
      });
    }
  }

  function openDetailsModal(booking) {
    selectedBooking = booking;
    showDetailsModal = true;
  }

  function closeDetailsModal() {
    selectedBooking = null;
    showDetailsModal = false;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return { class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'Pending' };
      case 'confirmed':
        return { class: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'Confirmed' };
      case 'active':
        return { class: 'bg-green-500/20 text-green-300 border-green-500/30', text: 'Active' };
      case 'completed':
        return { class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'Completed' };
      case 'cancelled':
        return { class: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: 'Cancelled' };
      case 'disputed':
        return { class: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'Disputed' };
      default:
        return { class: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: status };
    }
  }

  function calculateDuration(startDate: Date, endDate: Date) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return diffDays;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Bookings Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">Bookings Management</h1>
      <p class="text-gray-400 mt-1">Manage all bookings on the platform</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-400">Total Bookings</p>
      <p class="text-2xl font-bold text-white">{bookings.length}</p>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Search -->
      <div>
        <label for="search-bookings" class="block text-sm font-medium text-gray-300 mb-2">Search Bookings</label>
        <input id="search-bookings"
          type="text"
          bind:value="{searchQuery}"
          placeholder="Search by listing, user, or booking ID..."
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
          <p class="text-xl font-bold text-white">{filteredBookings.length}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Bookings Table -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
    {#if loading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p class="text-gray-400">Loading bookings...</p>
      </div>
    {:else if filteredBookings.length === 0}
      <div class="p-8 text-center">
        <p class="text-gray-400">No bookings found matching your criteria.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Booking</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Listing</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Renter</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dates</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            {#each filteredBookings as booking}
              <tr class="hover:bg-white/5">
                <td class="px-6 py-4">
                  <div class="text-white font-medium">#{booking.id.slice(0, 8)}</div>
                  <div class="text-gray-400 text-sm">{booking.createdAt.toLocaleDateString()}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white">{booking.listingTitle || 'Unknown Listing'}</div>
                  <div class="text-gray-400 text-sm">Owner: {booking.ownerEmail || 'Unknown'}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white">{booking.renterEmail || 'Unknown'}</div>
                  <div class="text-gray-400 text-sm">ID: {booking.renterUid?.slice(0, 8)}...</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white text-sm">
                    {booking.startDate.toLocaleDateString()} - {booking.endDate.toLocaleDateString()}
                  </div>
                  <div class="text-gray-400 text-sm">
                    {calculateDuration(booking.startDate, booking.endDate)} days
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white font-medium">
                    {formatCurrency(booking.totalAmount || 0)}
                  </div>
                </td>
                <td class="px-6 py-4">
                  {#if booking.status}
                    {@const badge = getStatusBadge(booking.status)}
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class}">
                      {badge.text}
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="flex space-x-2">
                    <button
                      on:click={() => openDetailsModal(booking)}
                      class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Details
                    </button>
                    {#if booking.status === 'pending'}
                      <button
                        on:click={() => updateBookingStatus(booking.id, 'confirmed')}
                        class="text-green-400 hover:text-green-300 text-sm font-medium"
                      >
                        Confirm
                      </button>
                    {/if}
                    {#if booking.status === 'disputed'}
                      <button
                        on:click={() => updateBookingStatus(booking.id, 'completed')}
                        class="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                      >
                        Resolve
                      </button>
                    {/if}
                    {#if booking.status !== 'cancelled' && booking.status !== 'completed'}
                      <button
                        on:click={() => updateBookingStatus(booking.id, 'cancelled')}
                        class="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Cancel
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
</div>

<!-- Details Modal -->
{#if showDetailsModal && selectedBooking}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-6 w-full max-w-4xl mx-4 border border-white/20 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">Booking Details</h2>
        <button
          on:click="{closeDetailsModal}"
          class="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Booking Info -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Booking Information</h3>
          <div class="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-gray-400">Booking ID:</span>
              <span class="text-white ml-2">#{selectedBooking.id}</span>
            </div>
            <div>
              <span class="text-gray-400">Status:</span>
              {#if selectedBooking.status}
                {@const badge = getStatusBadge(selectedBooking.status)}
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class} ml-2">
                  {badge.text}
                </span>
              {/if}
            </div>
            <div>
              <span class="text-gray-400">Created:</span>
              <span class="text-white ml-2">{selectedBooking.createdAt.toLocaleString()}</span>
            </div>
            <div>
              <span class="text-gray-400">Duration:</span>
              <span class="text-white ml-2">
                {calculateDuration(selectedBooking.startDate, selectedBooking.endDate)} days
              </span>
            </div>
            <div>
              <span class="text-gray-400">Total Amount:</span>
              <span class="text-white ml-2 font-semibold">
                {formatCurrency(selectedBooking.totalAmount || 0)}
              </span>
            </div>
          </div>
        </div>

        <!-- Listing Info -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Listing Information</h3>
          <div class="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-gray-400">Title:</span>
              <span class="text-white ml-2">{selectedBooking.listingTitle || 'Unknown'}</span>
            </div>
            <div>
              <span class="text-gray-400">Owner:</span>
              <span class="text-white ml-2">{selectedBooking.ownerEmail || 'Unknown'}</span>
            </div>
            <div>
              <span class="text-gray-400">Daily Rate:</span>
              <span class="text-white ml-2">{formatCurrency(selectedBooking.dailyPrice || 0)}</span>
            </div>
          </div>
        </div>

        <!-- Renter Info -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Renter Information</h3>
          <div class="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-gray-400">Email:</span>
              <span class="text-white ml-2">{selectedBooking.renterEmail || 'Unknown'}</span>
            </div>
            <div>
              <span class="text-gray-400">User ID:</span>
              <span class="text-white ml-2">{selectedBooking.renterUid || 'Unknown'}</span>
            </div>
          </div>
        </div>

        <!-- Dates -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Rental Period</h3>
          <div class="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-gray-400">Start Date:</span>
              <span class="text-white ml-2">{selectedBooking.startDate.toLocaleDateString()}</span>
            </div>
            <div>
              <span class="text-gray-400">End Date:</span>
              <span class="text-white ml-2">{selectedBooking.endDate.toLocaleDateString()}</span>
            </div>
          </div>
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
        <div class="flex space-x-2">
          {#if selectedBooking.status === 'pending'}
            <button
              on:click={() => {updateBookingStatus(selectedBooking.id, 'confirmed'); closeDetailsModal();}}
              class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              Confirm Booking
            </button>
          {/if}
          {#if selectedBooking.status === 'disputed'}
            <button
              on:click={() => {updateBookingStatus(selectedBooking.id, 'completed'); closeDetailsModal();}}
              class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Resolve Dispute
            </button>
          {/if}
          {#if selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed'}
            <button
              on:click={() => {updateBookingStatus(selectedBooking.id, 'cancelled'); closeDetailsModal();}}
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel Booking
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
