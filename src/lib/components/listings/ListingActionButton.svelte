<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ActionButton from '$lib/components/ui/ActionButton.svelte';
  import type { ListingData } from '$lib/services/listings';
  import type { ListingPermissions } from '$lib/utils/ownership';
  import { getActionButtonState } from '$lib/utils/ownership';
  
  export let action: 'edit' | 'delete' | 'contact' | 'offer' | 'rent';
  export let listing: ListingData | null;
  export let permissions: ListingPermissions;
  export let loading = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const dispatch = createEventDispatcher<{
    action: { action: string; listing: ListingData };
  }>();
  
  $: buttonState = getActionButtonState(action, permissions, listing);
  
  // Get button variant based on action
  $: variant = (
    action === 'delete' ? 'danger' :
    action === 'edit' ? 'outline' :
    action === 'contact' ? 'primary' :
    action === 'offer' ? 'secondary' :
    'primary'
  ) as 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  
  // Get button text based on action
  $: buttonText = {
    edit: 'Edit Listing',
    delete: 'Delete Listing',
    contact: 'Contact Seller',
    offer: 'Make Offer',
    rent: 'Rent This Item'
  }[action];
  
  // Get loading text based on action
  $: loadingText = {
    edit: 'Loading...',
    delete: 'Deleting...',
    contact: 'Connecting...',
    offer: 'Submitting...',
    rent: 'Processing...'
  }[action];
  
  // Get icon for each action
  $: iconSvg = {
    edit: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
           </svg>`,
    delete: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>`,
    contact: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>`,
    offer: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>`,
    rent: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>`
  }[action];
  
  const handleClick = () => {
    if (listing && buttonState.enabled) {
      dispatch('action', { action, listing });
    }
  };
</script>

{#if buttonState.visible}
  <ActionButton
    {variant}
    {size}
    disabled={!buttonState.enabled}
    {loading}
    tooltip={buttonState.tooltip}
    on:click={handleClick}
  >
    <span slot="loading">{loadingText}</span>
    
    <div class="flex items-center space-x-2">
      {@html iconSvg}
      <span>{buttonText}</span>
    </div>
  </ActionButton>
{/if}
