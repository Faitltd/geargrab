<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import PaymentButton from '$lib/components/payment/PaymentButton.svelte';
  import type { Booking, BookingStatus } from '$lib/types/bookings';

  export let booking: Booking;
  export let isOwner: boolean;
  export let isRenter: boolean;

  const dispatch = createEventDispatcher<{
    statusUpdate: { status: BookingStatus; message?: string };
  }>();



  let showMessageModal = false;
  let pendingAction: { status: BookingStatus; title: string } | null = null;
  let actionMessage = '';

  function handleAction(status: BookingStatus, title: string, requiresMessage = false) {
    if (requiresMessage) {
      pendingAction = { status, title };
      showMessageModal = true;
    } else {
      dispatch('statusUpdate', { status });
    }
  }

  function confirmAction() {
    if (pendingAction) {
      const message = actionMessage.trim();
      dispatch('statusUpdate', {
        status: pendingAction.status,
        ...(message && { message })
      });

      // Reset modal state
      showMessageModal = false;
      pendingAction = null;
      actionMessage = '';
    }
  }



  function cancelAction() {
    showMessageModal = false;
    pendingAction = null;
    actionMessage = '';
  }

  function getAvailableActions(): Array<{ status: BookingStatus; label: string; style: string; requiresMessage?: boolean }> {
    const actions = [];

    if (isOwner) {
      switch (booking.status) {
        case 'pending':
          actions.push(
            { status: 'confirmed' as BookingStatus, label: 'Accept Booking', style: 'bg-green-500 hover:bg-green-600 text-white' },
            { status: 'declined' as BookingStatus, label: 'Decline', style: 'bg-red-500 hover:bg-red-600 text-white', requiresMessage: true }
          );
          break;
        case 'confirmed':
        case 'paid':
          actions.push(
            { status: 'cancelled' as BookingStatus, label: 'Cancel Booking', style: 'bg-red-500 hover:bg-red-600 text-white', requiresMessage: true }
          );
          break;
        case 'active':
          actions.push(
            { status: 'completed' as BookingStatus, label: 'Mark Complete', style: 'bg-green-500 hover:bg-green-600 text-white' }
          );
          break;
      }
    }

    if (isRenter) {
      switch (booking.status) {
        case 'pending':
        case 'confirmed':
          actions.push(
            { status: 'cancelled' as BookingStatus, label: 'Cancel Request', style: 'bg-red-500 hover:bg-red-600 text-white', requiresMessage: true }
          );
          break;
      }
    }

    return actions;
  }

  $: availableActions = getAvailableActions();
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
  
  {#if availableActions.length > 0}
    <div class="space-y-3">
      {#each availableActions as action}
        <button
          on:click={() => handleAction(action.status, action.label, action.requiresMessage)}
          class="w-full px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 {action.style}"
        >
          {action.label}
        </button>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No actions available</h3>
      <p class="mt-1 text-sm text-gray-500">
        {#if booking.status === 'completed'}
          This booking has been completed.
        {:else if booking.status === 'cancelled'}
          This booking has been cancelled.
        {:else if booking.status === 'declined'}
          This booking has been declined.
        {:else}
          No actions are available at this time.
        {/if}
      </p>
    </div>
  {/if}

  <!-- Payment Info -->
  {#if booking.status === 'confirmed'}
    <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex">
        <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800">
            {isRenter ? 'Payment Required' : 'Waiting for Payment'}
          </h3>
          <p class="mt-1 text-sm text-blue-700">
            {isRenter 
              ? 'Your booking has been approved! Complete payment to confirm your rental.'
              : 'The renter needs to complete payment to confirm the booking.'
            }
          </p>
          {#if isRenter}
            <div class="mt-3">
              <PaymentButton
                bookingId={booking.id}
                listingId={booking.listingId}
                pricing={booking.pricing}
                bookingData={{
                  startDate: booking.startDate.toISOString(),
                  endDate: booking.endDate.toISOString(),
                  totalDays: booking.totalDays,
                  pickupMethod: booking.pickupMethod,
                  insurance: booking.insurance
                }}
                size="md"
                variant="primary"
              />
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Message Modal -->
{#if showMessageModal && pendingAction}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          {pendingAction.title}
        </h3>
        
        <div class="mb-4">
          <label for="actionMessage" class="block text-sm font-medium text-gray-700 mb-2">
            {pendingAction.status === 'declined' ? 'Reason for declining (optional)' : 
             pendingAction.status === 'cancelled' ? 'Reason for cancelling (optional)' : 
             'Message (optional)'}
          </label>
          <textarea
            id="actionMessage"
            bind:value={actionMessage}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Enter your message..."
          ></textarea>
        </div>
        
        <div class="flex items-center justify-end space-x-3">
          <button
            on:click={cancelAction}
            class="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            on:click={confirmAction}
            class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
