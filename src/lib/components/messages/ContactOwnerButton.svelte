<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';
  import { startConversationAboutListing } from '$lib/services/messages.service';
  import Button from '$lib/components/ui/Button.svelte';

  export let listingId: string;
  export let listingTitle: string;
  export let listingImageUrl: string | undefined = undefined;
  export let ownerId: string;
  export let ownerName: string;
  export let ownerAvatar: string | undefined = undefined;
  export let variant: 'primary' | 'secondary' | 'outline' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let fullWidth: boolean = false;

  let isStartingConversation = false;

  $: user = $authStore.data;
  $: isAuthenticated = !!user;
  $: isOwnListing = user?.uid === ownerId;

  async function handleContactOwner() {
    if (!isAuthenticated) {
      showToast('error', 'Please sign in to contact the owner');
      goto('/auth/signin');
      return;
    }

    if (isOwnListing) {
      showToast('info', 'You cannot message yourself');
      return;
    }

    try {
      isStartingConversation = true;

      const conversationId = await startConversationAboutListing(
        listingId,
        listingTitle,
        listingImageUrl,
        ownerId,
        ownerName,
        ownerAvatar,
        user!.uid,
        user!.displayName || user!.email || 'Anonymous',
        user!.photoURL,
        `Hi! I'm interested in your listing: ${listingTitle}`
      );

      // Navigate to the messages page with the conversation selected
      goto(`/dashboard/messages?conversation=${conversationId}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      showToast('error', 'Failed to start conversation. Please try again.');
    } finally {
      isStartingConversation = false;
    }
  }
</script>

{#if !isOwnListing}
  <Button
    {variant}
    {size}
    {fullWidth}
    loading={isStartingConversation}
    on:click={handleContactOwner}
    class="flex items-center space-x-2"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    <span>{isStartingConversation ? 'Starting conversation...' : 'Contact Owner'}</span>
  </Button>
{/if}
