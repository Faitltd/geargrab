<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { chatService, type ChatMessage } from '$lib/services/chat';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { notifications } from '$lib/stores/notifications';

  export let conversationId: string;
  export let otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  export let listingTitle: string = '';

  let messages: ChatMessage[] = [];
  let newMessage = '';
  let messagesContainer: HTMLElement;
  let sending = false;
  let loading = true;
  let fileInput: HTMLInputElement;
  let uploadingFile = false;

  // Get the auth state store
  $: authState = simpleAuth.authState;

  onMount(() => {
    if (conversationId) {
      loadMessages();

      // Set up periodic refresh for real-time updates
      const interval = setInterval(loadMessages, 3000); // Refresh every 3 seconds

      // Mark messages as read when conversation is opened
      if ($authState.user) {
        chatService.markMessagesAsRead(conversationId, $authState.user.uid);
      }

      // Clean up interval on destroy
      return () => clearInterval(interval);
    }
  });

  async function loadMessages() {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=50`);
      if (response.ok) {
        const result = await response.json();
        messages = result.messages;
        loading = false;
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      loading = false;
    }
  }

  // Cleanup is handled by the interval cleanup in onMount

  afterUpdate(() => {
    // Scroll to bottom when new messages arrive
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  async function sendMessage() {
    if (!newMessage.trim() || !$authState.user || sending) return;

    sending = true;
    try {
      await chatService.sendMessage(
        conversationId,
        $authState.user.uid,
        newMessage.trim()
      );
      newMessage = '';

      // Refresh messages immediately after sending
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      sending = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function formatDate(date: Date): string {
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
        day: 'numeric'
      });
    }
  }

  function shouldShowDateSeparator(currentMessage: ChatMessage, previousMessage: ChatMessage | undefined): boolean {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);

    return currentDate.toDateString() !== previousDate.toDateString();
  }

  function handleAttachmentClick() {
    fileInput?.click();
  }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      notifications.add({
        type: 'error',
        message: 'File size must be less than 10MB',
        timeout: 5000
      });
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      notifications.add({
        type: 'error',
        message: 'Only images, PDFs, and text files are allowed',
        timeout: 5000
      });
      return;
    }

    try {
      uploadingFile = true;

      // In a real app, you would upload to cloud storage first
      // For now, we'll simulate the upload and send a message with file info
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload

      const fileMessage = `📎 Shared a file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      await chatService.sendMessage(conversationId, $authState.user!.uid, fileMessage);

      notifications.add({
        type: 'success',
        message: 'File shared successfully',
        timeout: 3000
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to share file. Please try again.',
        timeout: 5000
      });
    } finally {
      uploadingFile = false;
      // Reset file input
      target.value = '';
    }
  }
</script>

<div class="flex flex-col h-full bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
  <!-- Chat Header -->
  <div class="flex items-center justify-between p-4 border-b border-white/20">
    <div class="flex items-center space-x-3">
      <img 
        src={otherUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
        alt={otherUser.name}
        class="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <h3 class="font-semibold text-white">{otherUser.name}</h3>
        {#if listingTitle}
          <p class="text-sm text-gray-300">About: {listingTitle}</p>
        {/if}
      </div>
    </div>
    <div class="flex items-center space-x-2">
      <button class="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
        </svg>
      </button>
      <button class="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
    </div>
  </div>

  <!-- Messages Area -->
  <div 
    bind:this="{messagesContainer}"
    class="flex-1 overflow-y-auto p-4 space-y-4 max-h-96"
  >
    {#if messages.length === 0}
      <div class="text-center text-gray-400 py-8">
        <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <p>Start your conversation</p>
        <p class="text-sm mt-1">Send a message to get started</p>
      </div>
    {:else}
      {#each messages as message, index}
        <!-- Date Separator -->
        {#if shouldShowDateSeparator(message, messages[index - 1])}
          <div class="flex justify-center my-4">
            <span class="bg-white/20 text-gray-300 text-xs px-3 py-1 rounded-full">
              {formatDate(message.timestamp)}
            </span>
          </div>
        {/if}

        <!-- Message -->
        <div class="flex {message.senderId === $authState.user?.uid ? 'justify-end' : 'justify-start'}">
          <div class="flex items-end space-x-2 max-w-xs lg:max-w-md">
            {#if message.senderId !== $authState.user?.uid}
              <img
                src={otherUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
                alt={otherUser.name}
                class="w-6 h-6 rounded-full object-cover"
              />
            {/if}

            <div class="flex flex-col">
              <div class="px-4 py-2 rounded-2xl {
                message.senderId === $authState.user?.uid
                  ? 'bg-green-600 text-white'
                  : 'bg-white/20 text-white'
              }">
                <p class="text-sm">{message.content}</p>
              </div>
              <span class="text-xs text-gray-400 mt-1 {
                message.senderId === $authState.user?.uid ? 'text-right' : 'text-left'
              }">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Message Input -->
  <div class="p-4 border-t border-white/20">
    <!-- Hidden file input -->
    <input
      bind:this="{fileInput}"
      type="file"
      on:change="{handleFileSelect}"
      accept="image/*,.pdf,.txt"
      class="hidden"
    />

    <div class="flex items-end space-x-2">
      <!-- Attachment button -->
      <button
        on:click="{handleAttachmentClick}"
        disabled="{uploadingFile}"
        class="p-2 text-gray-300 hover:text-white hover:bg-white/10 disabled:text-gray-600 rounded-lg transition-colors"
        title="Attach file"
      >
        {#if uploadingFile}
          <div class="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
          </svg>
        {/if}
      </button>
      
      <div class="flex-1">
        <textarea
          bind:value="{newMessage}"
          on:keypress="{handleKeyPress}"
          placeholder="Type a message..."
          rows="1"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          disabled="{sending}"
        ></textarea>
      </div>
      
      <button 
        on:click={sendMessage}
        disabled={!newMessage.trim() || sending}
        class="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        {#if sending}
          <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>
