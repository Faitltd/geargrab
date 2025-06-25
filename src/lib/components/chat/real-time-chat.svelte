<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { websocketClient, socketConnected, typingUsers } from '$lib/services/websocket-client';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { chatService } from '$lib/services/chat';
  
  export let conversationId: string;
  export let otherUser: { id: string; name: string; avatar?: string };
  
  let messages: any[] = [];
  let newMessage = '';
  let messagesContainer: HTMLElement;
  let isTyping = false;
  let typingTimeout: NodeJS.Timeout;
  let loading = true;
  
  $: authState = simpleAuth.authState;
  $: isConnected = $socketConnected;
  $: currentTypingUsers = Array.from($typingUsers.values()).filter(email => 
    email !== $authState.user?.email
  );
  
  onMount(async () => {
    if (!conversationId) return;
    
    // Load initial messages
    await loadMessages();
    
    // Join WebSocket room
    if (websocketClient.isConnected) {
      websocketClient.joinConversation(conversationId);
    }
    
    // Listen for new messages
    websocketClient.onNewMessage(handleNewMessage);
    websocketClient.onMessagesRead(handleMessagesRead);
    
    // Scroll to bottom
    scrollToBottom();
  });
  
  onDestroy(() => {
    if (conversationId) {
      websocketClient.leaveConversation(conversationId);
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
  });
  
  async function loadMessages() {
    try {
      loading = true;
      // Use existing chat service to load messages
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        messages = data.messages.reverse(); // Reverse to show oldest first
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      loading = false;
    }
  }
  
  function handleNewMessage(message: any) {
    // Add message if it's for this conversation
    if (message.conversationId === conversationId || !message.conversationId) {
      messages = [...messages, message];
      scrollToBottom();
      
      // Mark as read if not from current user
      if (message.senderId !== $authState.user?.uid) {
        setTimeout(() => {
          websocketClient.markMessagesAsRead(conversationId, [message.id]);
        }, 1000);
      }
    }
  }
  
  function handleMessagesRead(data: any) {
    // Update message read status
    messages = messages.map(msg => {
      if (data.messageIds.includes(msg.id)) {
        return { ...msg, read: true };
      }
      return msg;
    });
  }
  
  async function sendMessage() {
    if (!newMessage.trim() || !$authState.user) return;
    
    const content = newMessage.trim();
    newMessage = '';
    
    // Stop typing indicator
    stopTyping();
    
    // Try WebSocket first, fallback to HTTP
    const sent = websocketClient.sendMessage(conversationId, content);
    
    if (!sent) {
      // Fallback to HTTP API
      try {
        await chatService.sendMessage(conversationId, $authState.user.uid, content);
        // Reload messages to get the new one
        await loadMessages();
      } catch (error) {
        console.error('Error sending message:', error);
        newMessage = content; // Restore message on error
      }
    }
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function handleInput() {
    if (!isTyping) {
      startTyping();
    }
    
    // Reset typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    typingTimeout = setTimeout(() => {
      stopTyping();
    }, 2000);
  }
  
  function startTyping() {
    isTyping = true;
    websocketClient.startTyping(conversationId);
  }
  
  function stopTyping() {
    isTyping = false;
    websocketClient.stopTyping(conversationId);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
  }
  
  async function scrollToBottom() {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  function formatTime(timestamp: any): string {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  function isOwnMessage(senderId: string): boolean {
    return senderId === $authState.user?.uid;
  }
</script>

<!-- Connection Status -->
{#if !isConnected}
  <div class="bg-yellow-500/20 text-yellow-300 px-4 py-2 text-sm text-center">
    🔄 Connecting to real-time chat...
  </div>
{/if}

<!-- Chat Header -->
<div class="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
  <div class="flex items-center space-x-3">
    <img 
      src={otherUser.avatar || 'https://via.placeholder.com/40'} 
      alt={otherUser.name}
      class="w-10 h-10 rounded-full"
    />
    <div>
      <h3 class="text-white font-medium">{otherUser.name}</h3>
      <div class="flex items-center space-x-2 text-sm">
        <span class="text-gray-300">
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>
    </div>
  </div>
</div>

<!-- Messages Container -->
<div 
  bind:this={messagesContainer}
  class="flex-1 overflow-y-auto p-4 space-y-4 max-h-96"
>
  {#if loading}
    <div class="text-center text-gray-400">
      <div class="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full mx-auto"></div>
      <p class="mt-2">Loading messages...</p>
    </div>
  {:else if messages.length === 0}
    <div class="text-center text-gray-400">
      <p>No messages yet. Start the conversation!</p>
    </div>
  {:else}
    {#each messages as message}
      <div class="flex {isOwnMessage(message.senderId) ? 'justify-end' : 'justify-start'}">
        <div class="max-w-xs lg:max-w-md">
          <div class="flex items-end space-x-2 {isOwnMessage(message.senderId) ? 'flex-row-reverse space-x-reverse' : ''}">
            {#if !isOwnMessage(message.senderId)}
              <img 
                src={otherUser.avatar || 'https://via.placeholder.com/32'} 
                alt={otherUser.name}
                class="w-8 h-8 rounded-full"
              />
            {/if}
            <div class="flex flex-col {isOwnMessage(message.senderId) ? 'items-end' : 'items-start'}">
              <div class="px-4 py-2 rounded-lg {
                isOwnMessage(message.senderId) 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white/10 text-white'
              }">
                <p class="text-sm">{message.content}</p>
              </div>
              <div class="flex items-center space-x-1 mt-1">
                <span class="text-xs text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
                {#if isOwnMessage(message.senderId)}
                  <span class="text-xs text-gray-400">
                    {message.read ? '✓✓' : '✓'}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  {/if}
  
  <!-- Typing Indicator -->
  {#if currentTypingUsers.length > 0}
    <div class="flex justify-start">
      <div class="bg-white/10 px-4 py-2 rounded-lg">
        <div class="flex items-center space-x-2">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
          <span class="text-xs text-gray-400">
            {currentTypingUsers[0]} is typing...
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Message Input -->
<div class="border-t border-white/20 p-4">
  <div class="flex space-x-2">
    <input
      bind:value={newMessage}
      on:keypress={handleKeyPress}
      on:input={handleInput}
      placeholder="Type a message..."
      class="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      disabled={!isConnected}
    />
    <button
      on:click={sendMessage}
      disabled={!newMessage.trim() || !isConnected}
      class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
      </svg>
    </button>
  </div>
</div>
