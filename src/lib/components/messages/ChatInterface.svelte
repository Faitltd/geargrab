<script lang="ts">
  import { createEventDispatcher, afterUpdate } from 'svelte';
  import { authStore } from '$lib/stores/auth.store';
  import type { Conversation, Message } from '$lib/services/messages.service';

  export let conversation: Conversation;
  export let messages: Message[];
  export let newMessage: string;
  export let isSending: boolean;

  const dispatch = createEventDispatcher<{
    sendMessage: void;
    messageInput: { value: string };
    keyPress: { event: KeyboardEvent };
  }>();

  let messagesContainer: HTMLElement;
  let messageInput: HTMLTextAreaElement;

  $: user = $authStore.data;

  // Auto-scroll to bottom when new messages arrive
  afterUpdate(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  function handleSendMessage() {
    dispatch('sendMessage');
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    dispatch('messageInput', { value: target.value });
  }

  function handleKeyPress(event: KeyboardEvent) {
    dispatch('keyPress', { event });
  }

  function formatMessageTime(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function formatMessageDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  function shouldShowDateSeparator(currentMessage: Message, previousMessage: Message | undefined): boolean {
    if (!previousMessage) return true;
    
    const currentDate = currentMessage.createdAt?.toDate?.() || new Date(currentMessage.createdAt);
    const previousDate = previousMessage.createdAt?.toDate?.() || new Date(previousMessage.createdAt);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  }

  function getOtherParticipantName(): string {
    if (!user) return 'Unknown';
    
    const otherParticipantId = conversation.participants.find(id => id !== user.uid);
    if (!otherParticipantId) return 'Unknown';
    
    return conversation.participantNames[otherParticipantId] || 'Unknown User';
  }

  function getOtherParticipantAvatar(): string | undefined {
    if (!user) return undefined;
    
    const otherParticipantId = conversation.participants.find(id => id !== user.uid);
    if (!otherParticipantId) return undefined;
    
    return conversation.participantAvatars[otherParticipantId];
  }

  // Auto-resize textarea
  function autoResize(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  }
</script>

<div class="flex flex-col h-full">
  <!-- Chat Header -->
  <div class="p-4 border-b border-gray-200 bg-white">
    <div class="flex items-center space-x-3">
      <!-- Listing Image -->
      <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
        {#if conversation.listingImageUrl}
          <img
            src={conversation.listingImageUrl}
            alt={conversation.listingTitle}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        {:else}
          <div class="w-full h-full flex items-center justify-center bg-gray-200">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        {/if}
      </div>

      <div class="flex-1 min-w-0">
        <h2 class="text-lg font-semibold text-gray-900 truncate">
          {getOtherParticipantName()}
        </h2>
        <p class="text-sm text-gray-600 truncate">
          About: {conversation.listingTitle}
        </p>
      </div>

      <!-- Other Participant Avatar -->
      <div class="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full overflow-hidden">
        {#if getOtherParticipantAvatar()}
          <img
            src={getOtherParticipantAvatar()}
            alt={getOtherParticipantName()}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        {:else}
          <div class="w-full h-full flex items-center justify-center bg-blue-100">
            <span class="text-sm font-medium text-blue-600">
              {getOtherParticipantName().charAt(0).toUpperCase()}
            </span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Messages Area -->
  <div 
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
  >
    {#if messages.length === 0}
      <div class="text-center py-8">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-gray-600">Start the conversation!</p>
      </div>
    {:else}
      {#each messages as message, index (message.id)}
        {@const isOwnMessage = message.senderId === user?.uid}
        {@const previousMessage = index > 0 ? messages[index - 1] : undefined}
        {@const showDateSeparator = shouldShowDateSeparator(message, previousMessage)}

        {#if showDateSeparator}
          <div class="flex justify-center my-4">
            <span class="px-3 py-1 text-xs text-gray-500 bg-white rounded-full border">
              {formatMessageDate(message.createdAt)}
            </span>
          </div>
        {/if}

        <div class="flex {isOwnMessage ? 'justify-end' : 'justify-start'}">
          <div class="max-w-xs lg:max-w-md">
            {#if message.type === 'system'}
              <div class="text-center text-sm text-gray-500 italic py-2">
                {message.content}
              </div>
            {:else}
              <div class="flex items-end space-x-2 {isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}">
                <!-- Avatar (only for other user's messages) -->
                {#if !isOwnMessage}
                  <div class="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full overflow-hidden">
                    {#if getOtherParticipantAvatar()}
                      <img
                        src={getOtherParticipantAvatar()}
                        alt={getOtherParticipantName()}
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    {:else}
                      <div class="w-full h-full flex items-center justify-center bg-blue-100">
                        <span class="text-xs font-medium text-blue-600">
                          {getOtherParticipantName().charAt(0).toUpperCase()}
                        </span>
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Message Bubble -->
                <div class="relative">
                  <div class="px-4 py-2 rounded-2xl {isOwnMessage 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-900 border border-gray-200'
                  }">
                    <p class="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  
                  <!-- Message Time -->
                  <div class="mt-1 {isOwnMessage ? 'text-right' : 'text-left'}">
                    <span class="text-xs text-gray-500">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Message Input -->
  <div class="p-4 border-t border-gray-200 bg-white">
    <div class="flex items-end space-x-3">
      <div class="flex-1">
        <textarea
          bind:this={messageInput}
          bind:value={newMessage}
          on:input={handleInput}
          on:input={autoResize}
          on:keydown={handleKeyPress}
          placeholder="Type a message..."
          rows="1"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSending}
        ></textarea>
      </div>
      
      <button
        on:click={handleSendMessage}
        disabled={!newMessage.trim() || isSending}
        class="flex-shrink-0 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if isSending}
          <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>
