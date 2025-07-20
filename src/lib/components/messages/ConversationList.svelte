<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '$lib/stores/auth.store';
  import type { Conversation } from '$lib/services/messages.service';

  export let conversations: Conversation[];
  export let selectedConversation: Conversation | null = null;

  const dispatch = createEventDispatcher<{
    select: { conversation: Conversation };
  }>();

  $: user = $authStore.data;

  function selectConversation(conversation: Conversation) {
    dispatch('select', { conversation });
  }

  function formatLastMessageTime(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  function getOtherParticipantName(conversation: Conversation): string {
    if (!user) return 'Unknown';
    
    const otherParticipantId = conversation.participants.find(id => id !== user.uid);
    if (!otherParticipantId) return 'Unknown';
    
    return conversation.participantNames[otherParticipantId] || 'Unknown User';
  }

  function getOtherParticipantAvatar(conversation: Conversation): string | undefined {
    if (!user) return undefined;
    
    const otherParticipantId = conversation.participants.find(id => id !== user.uid);
    if (!otherParticipantId) return undefined;
    
    return conversation.participantAvatars[otherParticipantId];
  }

  function truncateMessage(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }
</script>

<div class="flex-1 overflow-y-auto">
  {#each conversations as conversation (conversation.id)}
    {@const isSelected = selectedConversation?.id === conversation.id}
    {@const otherParticipantName = getOtherParticipantName(conversation)}
    {@const otherParticipantAvatar = getOtherParticipantAvatar(conversation)}
    {@const hasUnread = conversation.unreadCount && conversation.unreadCount > 0}
    
    <button
      on:click={() => selectConversation(conversation)}
      class="w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left {isSelected ? 'bg-blue-50 border-blue-200' : ''}"
    >
      <div class="flex items-start space-x-3">
        <!-- Listing Image -->
        <div class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
          {#if conversation.listingImageUrl}
            <img
              src={conversation.listingImageUrl}
              alt={conversation.listingTitle}
              class="w-full h-full object-cover"
              loading="lazy"
            />
          {:else}
            <div class="w-full h-full flex items-center justify-center bg-gray-200">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          {/if}
        </div>

        <div class="flex-1 min-w-0">
          <!-- Conversation Header -->
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center space-x-2 min-w-0">
              <!-- Other Participant Avatar -->
              <div class="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full overflow-hidden">
                {#if otherParticipantAvatar}
                  <img
                    src={otherParticipantAvatar}
                    alt={otherParticipantName}
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                {:else}
                  <div class="w-full h-full flex items-center justify-center bg-blue-100">
                    <span class="text-xs font-medium text-blue-600">
                      {otherParticipantName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                {/if}
              </div>

              <h3 class="font-medium text-gray-900 truncate text-sm">
                {otherParticipantName}
              </h3>
            </div>

            <div class="flex items-center space-x-2 flex-shrink-0">
              {#if hasUnread}
                <span class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                  {(conversation.unreadCount || 0) > 9 ? '9+' : (conversation.unreadCount || 0)}
                </span>
              {/if}
              
              {#if conversation.lastMessage?.createdAt}
                <span class="text-xs text-gray-500">
                  {formatLastMessageTime(conversation.lastMessage.createdAt)}
                </span>
              {/if}
            </div>
          </div>

          <!-- Listing Title -->
          <p class="text-sm text-gray-600 truncate mb-1">
            {conversation.listingTitle}
          </p>

          <!-- Last Message -->
          {#if conversation.lastMessage}
            <p class="text-sm text-gray-500 truncate {hasUnread ? 'font-medium' : ''}">
              {#if conversation.lastMessage.senderId === user?.uid}
                <span class="text-gray-400">You: </span>
              {/if}
              {truncateMessage(conversation.lastMessage.content)}
            </p>
          {:else}
            <p class="text-sm text-gray-400 italic">No messages yet</p>
          {/if}
        </div>
      </div>
    </button>
  {/each}
</div>
