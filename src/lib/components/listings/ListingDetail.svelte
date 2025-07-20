<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore, showToast } from '$lib/stores/auth';
  import ListingActionButton from './ListingActionButton.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { ListingData } from '$lib/services/listings';
  import { getListingPermissions, getOwnershipMessage, shouldShowOwnerActions, shouldShowBuyerActions } from '$lib/utils/ownership';
  import { deleteListing, updateListing } from '$lib/services/listings';
  
  export let listing: ListingData;
  
  const dispatch = createEventDispatcher<{
    edit: { listing: ListingData };
    deleted: { listingId: string };
    contact: { listing: ListingData };
    offer: { listing: ListingData };
    rent: { listing: ListingData };
  }>();
  
  $: ({ user } = $authStore);
  $: permissions = getListingPermissions(listing, user);
  $: ownershipMessage = getOwnershipMessage(listing, user);
  $: showOwnerActions = shouldShowOwnerActions(listing, user);
  $: showBuyerActions = shouldShowBuyerActions(listing, user);
  
  let actionLoading = {
    edit: false,
    delete: false,
    contact: false,
    offer: false,
    rent: false,
    statusChange: false
  };
  
  let error = '';
  let showDeleteConfirm = false;
  
  const handleAction = async (event: CustomEvent) => {
    const { action, listing: actionListing } = event.detail;

    error = '';
    if (action in actionLoading) {
      actionLoading[action as keyof typeof actionLoading] = true;
    }

    try {
      switch (action) {
        case 'edit':
          dispatch('edit', { listing: actionListing });
          break;

        case 'delete':
          showDeleteConfirm = true;
          break;

        case 'contact':
          dispatch('contact', { listing: actionListing });
          break;

        case 'offer':
          dispatch('offer', { listing: actionListing });
          break;

        case 'rent':
          dispatch('rent', { listing: actionListing });
          break;
      }
    } catch (err: any) {
      error = err.message || `Failed to ${action} listing`;
      showToast('error', error);
    } finally {
      if (action in actionLoading) {
        actionLoading[action as keyof typeof actionLoading] = false;
      }
    }
  };
  
  const confirmDelete = async () => {
    if (!listing || !permissions.canDelete || !user) return;

    actionLoading.delete = true;
    error = '';

    try {
      await deleteListing(listing.id!, user.uid);
      showToast('success', 'Listing deleted successfully');
      dispatch('deleted', { listingId: listing.id! });
    } catch (err: any) {
      error = err.message || 'Failed to delete listing';
      showToast('error', error);
    } finally {
      actionLoading.delete = false;
      showDeleteConfirm = false;
    }
  };
  
  const cancelDelete = () => {
    showDeleteConfirm = false;
    actionLoading.delete = false;
  };
  
  const changeStatus = async (newStatus: 'active' | 'sold' | 'rented' | 'inactive') => {
    if (!listing || !permissions.canChangeStatus || !user) return;

    actionLoading.statusChange = true;
    error = '';

    try {
      await updateListing(listing.id!, { status: newStatus }, user.uid);
      listing.status = newStatus;
      showToast('success', `Listing marked as ${newStatus}`);
    } catch (err: any) {
      error = err.message || 'Failed to update listing status';
      showToast('error', error);
    } finally {
      actionLoading.statusChange = false;
    }
  };
  
  const formatPrice = (price: string, period?: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numPrice);
    
    return period ? `${formatted}/${period}` : formatted;
  };
</script>

<div class="bg-white rounded-2xl shadow-lg overflow-hidden">
  <!-- Error Banner -->
  {#if error}
    <div class="p-6 pb-0">
      <ErrorBanner message={error} onDismiss={() => error = ''} />
    </div>
  {/if}
  
  <!-- Ownership Message -->
  {#if ownershipMessage}
    <div class="bg-primary-50 border-b border-primary-100 px-6 py-3">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-primary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm font-medium text-primary-700">{ownershipMessage}</span>
      </div>
    </div>
  {/if}
  
  <!-- Main Content -->
  <div class="p-6">
    <!-- Title and Price -->
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">{listing.title}</h1>
        <div class="flex items-center space-x-4">
          <span class="text-3xl font-bold text-primary-500">
            {#if listing.listingType === 'sale'}
              {formatPrice(listing.price || '0')}
            {:else}
              {formatPrice(listing.rentalPrice || '0', listing.rentalPeriod)}
            {/if}
          </span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {listing.listingType === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
        </div>
      </div>
      
      <!-- Status Badge -->
      <div class="ml-4">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
          {listing.status === 'active' ? 'bg-green-100 text-green-800' :
           listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
           listing.status === 'rented' ? 'bg-purple-100 text-purple-800' :
           'bg-neutral-100 text-neutral-800'}">
          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
        </span>
      </div>
    </div>
    
    <!-- Quick Details -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div>
        <p class="text-sm font-medium text-neutral-500">Condition</p>
        <p class="text-sm text-neutral-900">{listing.condition}</p>
      </div>
      {#if listing.brand}
        <div>
          <p class="text-sm font-medium text-neutral-500">Brand</p>
          <p class="text-sm text-neutral-900">{listing.brand}</p>
        </div>
      {/if}
      <div>
        <p class="text-sm font-medium text-neutral-500">Category</p>
        <p class="text-sm text-neutral-900">{listing.category}</p>
      </div>
      <div>
        <p class="text-sm font-medium text-neutral-500">Location</p>
        <p class="text-sm text-neutral-900">{listing.location}</p>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-3 mb-6">
      {#if showOwnerActions}
        <!-- Owner Actions -->
        <ListingActionButton
          action="edit"
          {listing}
          {permissions}
          loading={actionLoading.edit}
          on:action={handleAction}
        />
        
        <ListingActionButton
          action="delete"
          {listing}
          {permissions}
          loading={actionLoading.delete}
          on:action={handleAction}
        />
        
        <!-- Status Change Buttons -->
        {#if permissions.canChangeStatus && listing.status === 'active'}
          <div class="flex space-x-2">
            {#if listing.listingType === 'sale'}
              <button
                on:click={() => changeStatus('sold')}
                disabled={actionLoading.statusChange}
                class="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark as Sold
              </button>
            {:else}
              <button
                on:click={() => changeStatus('rented')}
                disabled={actionLoading.statusChange}
                class="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark as Rented
              </button>
            {/if}
            
            <button
              on:click={() => changeStatus('inactive')}
              disabled={actionLoading.statusChange}
              class="px-3 py-1.5 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Deactivate
            </button>
          </div>
        {:else if permissions.canChangeStatus && listing.status !== 'active'}
          <button
            on:click={() => changeStatus('active')}
            disabled={actionLoading.statusChange}
            class="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reactivate
          </button>
        {/if}
        
      {:else if showBuyerActions}
        <!-- Buyer Actions -->
        <ListingActionButton
          action="contact"
          {listing}
          {permissions}
          loading={actionLoading.contact}
          on:action={handleAction}
        />
        
        {#if listing.listingType === 'sale'}
          <ListingActionButton
            action="offer"
            {listing}
            {permissions}
            loading={actionLoading.offer}
            on:action={handleAction}
          />
        {:else}
          <ListingActionButton
            action="rent"
            {listing}
            {permissions}
            loading={actionLoading.rent}
            on:action={handleAction}
          />
        {/if}
      {/if}
    </div>
    
    <!-- Description -->
    <div>
      <h3 class="text-lg font-semibold text-neutral-900 mb-3">Description</h3>
      <p class="text-neutral-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
    </div>
  </div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
      <h3 class="text-lg font-semibold text-neutral-900 mb-4">Delete Listing</h3>
      <p class="text-neutral-600 mb-6">
        Are you sure you want to delete this listing? This action cannot be undone.
      </p>
      
      <div class="flex space-x-3">
        <button
          on:click={cancelDelete}
          disabled={actionLoading.delete}
          class="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        
        <button
          on:click={confirmDelete}
          disabled={actionLoading.delete}
          class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {#if actionLoading.delete}
            <LoadingSpinner size="sm" color="white" />
            <span class="ml-2">Deleting...</span>
          {:else}
            Delete
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
