<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { chatService, type ChatConversation } from '$lib/services/chat';
  import { simpleAuth } from '$lib/auth/simple-auth';

  export let selectedConversationId: string | null = null;
  export let onConversationSelect: (conversation: ChatConversation) => void;

  let conversations: ChatConversation[] = [];
  let refreshInterval: number | null = null;
  let loading = true;

  // Get the auth state store
  $: authState = simpleAuth.authState;

  onMount(() => {
    if ($authState.user) {
      loadConversations();

      // Set up periodic refresh for real-time updates
      refreshInterval = setInterval(loadConversations, 5000); // Refresh every 5 seconds
    }
  });

  async function loadConversations() {
    if (!$authState.user) return;

    try {
      conversations = await chatService.getRecentConversations($authState.user.uid);
      loading = false;
    } catch (error) {
      console.error('Error loading conversations:', error);
      loading = false;
    }
  }

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  function formatLastMessageTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }

  function getOtherParticipant(conversation: ChatConversation): any {
    if (!$authState.user) return null;
    return conversation.participants.find(p => p.id !== $authState.user?.uid);
  }

  function getUnreadCount(conversation: ChatConversation): number {
    if (!$authState.user) return 0;
    return conversation.unreadCount[$authStore.user.uid] || 0;
  }

  function truncateMessage(message: string, maxLength: number = 50): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 h-full">
  <!-- Header -->
  <div class="p-4 border-b border-white/20">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">Messages</h2>
      <button class="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      </button>
    </div>
  </div>

  <!-- Conversations List -->
  <div class="overflow-y-auto h-96">
    {#if loading}
      <div class="p-4 text-center">
        <div class="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-gray-300 mt-2 text-sm">Loading conversations...</p>
      </div>
    {:else if conversations.length === 0}
      <div class="p-6 text-center">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <p class="text-gray-300 text-sm">No conversations yet</p>
        <p class="text-gray-400 text-xs mt-1">Start chatting with gear owners or renters</p>
      </div>
    {:else}
      {#each conversations as conversation}
        {@const otherUser = getOtherParticipant(conversation)}
        {@const unreadCount = getUnreadCount(conversation)}
        
        <button
          class="w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/10 {
            selectedConversationId === conversation.id ? 'bg-white/10' : ''
          }"
          on:click={() => onConversationSelect(conversation)}
        >
          <div class="flex items-center space-x-3">
            <!-- Avatar -->
            <div class="relative">
              <img
                src={otherUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
                alt={otherUser?.name || 'User'}
                class="w-12 h-12 rounded-full object-cover"
              />
              {#if unreadCount > 0}
                <div class="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              {/if}
            </div>

            <!-- Conversation Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="font-medium text-white truncate">
                  {otherUser?.name || 'Unknown User'}
                </h3>
                {#if conversation.lastMessage}
                  <span class="text-xs text-gray-400">
                    {formatLastMessageTime(conversation.lastMessage.timestamp)}
                  </span>
                {/if}
              </div>

              <!-- Listing Title (if applicable) -->
              {#if conversation.listingTitle}
                <p class="text-xs text-gray-400 truncate">
                  📦 {conversation.listingTitle}
                </p>
              {/if}

              <!-- Last Message -->
              {#if conversation.lastMessage}
                <p class="text-sm text-gray-300 truncate mt-1">
                  {#if conversation.lastMessage.senderId === $authState.user?.uid}
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
    {/if}
  </div>
</div>
