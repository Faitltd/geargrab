<script>
  import { createEventDispatcher } from 'svelte';
  
  export let rental = null;
  export let userRole = 'renter'; // 'renter' or 'owner'
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = null;
  let showRejectForm = false;
  let rejectionReason = '';
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function formatPrice(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  function getStatusColor(status) {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'active': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800',
      'disputed': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
  
  function getStatusText(status) {
    const texts = {
      'pending': 'Pending Approval',
      'confirmed': 'Confirmed',
      'active': 'Active',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected',
      'disputed': 'Disputed'
    };
    return texts[status] || status;
  }
  
  async function approveRental() {
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/rentals/${rental.id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve rental');
      }
      
      dispatch('rental-updated', {
        rental_id: rental.id,
        status: 'confirmed'
      });
      
    } catch (err) {
      console.error('Approval error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  async function rejectRental() {
    if (!rejectionReason.trim()) {
      error = 'Please provide a reason for rejection';
      return;
    }
    
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/rentals/${rental.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject rental');
      }
      
      dispatch('rental-updated', {
        rental_id: rental.id,
        status: 'rejected'
      });
      
      showRejectForm = false;
      rejectionReason = '';
      
    } catch (err) {
      console.error('Rejection error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  async function updateRentalStatus(newStatus) {
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/rentals/${rental.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update rental');
      }
      
      dispatch('rental-updated', {
        rental_id: rental.id,
        status: newStatus
      });
      
    } catch (err) {
      console.error('Status update error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function getAvailableActions() {
    if (!rental) return [];
    
    const actions = [];
    
    if (userRole === 'owner') {
      if (rental.status === 'pending') {
        actions.push(
          { id: 'approve', label: 'Approve', color: 'green', action: approveRental },
          { id: 'reject', label: 'Reject', color: 'red', action: () => showRejectForm = true }
        );
      } else if (rental.status === 'confirmed') {
        actions.push(
          { id: 'start', label: 'Mark as Active', color: 'blue', action: () => updateRentalStatus('active') }
        );
      } else if (rental.status === 'active') {
        actions.push(
          { id: 'complete', label: 'Mark as Completed', color: 'green', action: () => updateRentalStatus('completed') }
        );
      }
    } else if (userRole === 'renter') {
      if (rental.status === 'pending') {
        actions.push(
          { id: 'cancel', label: 'Cancel Request', color: 'red', action: () => updateRentalStatus('cancelled') }
        );
      } else if (rental.status === 'confirmed') {
        actions.push(
          { id: 'cancel', label: 'Cancel Booking', color: 'red', action: () => updateRentalStatus('cancelled') }
        );
      }
    }
    
    return actions;
  }
  
  $: availableActions = getAvailableActions();
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex items-start justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">
        {rental?.gear_title || 'Rental'}
      </h3>
      <p class="text-sm text-gray-600">
        {formatDate(rental?.start_date)} - {formatDate(rental?.end_date)}
        ({rental?.total_days} day{rental?.total_days !== 1 ? 's' : ''})
      </p>
    </div>
    
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(rental?.status)}">
      {getStatusText(rental?.status)}
    </span>
  </div>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div class="ml-3">
          <p class="text-sm text-red-800">{error}</p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Rental Details -->
  <div class="space-y-3 mb-6">
    <div class="flex justify-between text-sm">
      <span class="text-gray-600">
        {userRole === 'owner' ? 'Renter' : 'Owner'}:
      </span>
      <span class="font-medium">
        {userRole === 'owner' ? rental?.renter_name : rental?.owner_name}
      </span>
    </div>
    
    <div class="flex justify-between text-sm">
      <span class="text-gray-600">Delivery Method:</span>
      <span class="font-medium capitalize">{rental?.delivery_method}</span>
    </div>
    
    {#if rental?.delivery_address}
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">Delivery Address:</span>
        <span class="font-medium text-right max-w-xs">{rental.delivery_address}</span>
      </div>
    {/if}
    
    <div class="flex justify-between text-sm">
      <span class="text-gray-600">Total Amount:</span>
      <span class="font-semibold text-green-600">{formatPrice(rental?.total_amount)}</span>
    </div>
    
    {#if rental?.special_requests}
      <div class="pt-2 border-t">
        <span class="text-sm text-gray-600">Special Requests:</span>
        <p class="text-sm text-gray-900 mt-1">{rental.special_requests}</p>
      </div>
    {/if}
    
    {#if rental?.rejection_reason}
      <div class="pt-2 border-t">
        <span class="text-sm text-gray-600">Rejection Reason:</span>
        <p class="text-sm text-red-800 mt-1">{rental.rejection_reason}</p>
      </div>
    {/if}
  </div>
  
  <!-- Rejection Form -->
  {#if showRejectForm}
    <div class="border-t pt-4 mb-4">
      <h4 class="text-sm font-medium text-gray-900 mb-2">Reason for Rejection</h4>
      <textarea
        bind:value={rejectionReason}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
        placeholder="Please explain why you're rejecting this rental request..."
      ></textarea>
      
      <div class="flex justify-end space-x-2 mt-3">
        <button
          type="button"
          on:click={() => { showRejectForm = false; rejectionReason = ''; }}
          class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          on:click={rejectRental}
          disabled={loading || !rejectionReason.trim()}
          class="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Rejecting...' : 'Reject Rental'}
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Action Buttons -->
  {#if availableActions.length > 0}
    <div class="flex flex-wrap gap-2 pt-4 border-t">
      {#each availableActions as action}
        <button
          type="button"
          on:click={action.action}
          disabled={loading}
          class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white disabled:opacity-50 {
            action.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
            action.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
            action.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
            'bg-gray-600 hover:bg-gray-700'
          }"
        >
          {loading ? 'Processing...' : action.label}
        </button>
      {/each}
    </div>
  {/if}
  
  <!-- Status-specific Messages -->
  {#if rental?.status === 'pending' && userRole === 'renter'}
    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
      <p class="text-sm text-yellow-800">
        Your rental request is pending approval from the gear owner. You'll be notified once they respond.
      </p>
    </div>
  {:else if rental?.status === 'confirmed' && userRole === 'renter'}
    <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
      <p class="text-sm text-green-800">
        Your rental has been confirmed! You can now proceed to payment.
      </p>
    </div>
  {:else if rental?.status === 'pending' && userRole === 'owner'}
    <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <p class="text-sm text-blue-800">
        Please review this rental request and approve or reject it.
      </p>
    </div>
  {/if}
</div>
