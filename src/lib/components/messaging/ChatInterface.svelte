<script>
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
  import { user } from '../../stores/auth.js';
  
  export let conversation = null;
  
  const dispatch = createEventDispatcher();
  
  let messages = [];
  let loading = false;
  let error = null;
  let newMessage = '';
  let sending = false;
  let messagesContainer;
  
  $: if (conversation) {
    loadMessages();
  }
  
  onMount(() => {
    if (conversation) {
      loadMessages();
    }
  });
  
  afterUpdate(() => {
    // Scroll to bottom when new messages are added
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
  
  async function loadMessages() {
    if (!conversation) return;
    
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/messages/conversations/${conversation.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      messages = data.messages || [];
      
    } catch (err) {
      console.error('Failed to load messages:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  async function sendMessage() {
    if (!newMessage.trim() || sending || !conversation) return;
    
    const messageContent = newMessage.trim();
    newMessage = '';
    sending = true;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          conversation_id: conversation.id,
          content: messageContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Add the new message to the list
      messages = [...messages, data.message_data];
      
      // Notify parent component
      dispatch('message-sent', data.message_data);
      
    } catch (err) {
      console.error('Failed to send message:', err);
      error = err.message;
      // Restore the message content if sending failed
      newMessage = messageContent;
    } finally {
      sending = false;
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  function formatMessageDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
  
  function shouldShowDateSeparator(currentMessage, previousMessage) {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    
    return currentDate !== previousDate;
  }
  
  function isConsecutiveMessage(currentMessage, previousMessage) {
    if (!previousMessage) return false;
    
    const timeDiff = new Date(currentMessage.created_at) - new Date(previousMessage.created_at);
    const fiveMinutes = 5 * 60 * 1000;
    
    return currentMessage.sender_id === previousMessage.sender_id && timeDiff < fiveMinutes;
  }
</script>

<div class="bg-white rounded-lg shadow-md h-full flex flex-col">
  {#if !conversation}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <svg class="h-12 w-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <p class="text-lg text-gray-500 mt-4">Select a conversation to start messaging</p>
      </div>
    </div>
  {:else}
    <!-- Chat Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center space-x-3">
        {#if conversation.other_participant_photo}
          <img
            src={conversation.other_participant_photo}
            alt={conversation.other_participant_name}
            class="h-10 w-10 rounded-full object-cover"
          />
        {:else}
          <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        {/if}
        
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {conversation.other_participant_name}
          </h3>
          {#if conversation.gear_title}
            <p class="text-sm text-gray-600">
              About: {conversation.gear_title}
            </p>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Messages Area -->
    <div 
      bind:this={messagesContainer}
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {#if loading}
        <div class="text-center py-8">
          <svg class="animate-spin h-6 w-6 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-sm text-gray-500 mt-2">Loading messages...</p>
        </div>
      {:else if error}
        <div class="text-center py-8">
          <svg class="h-8 w-8 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <p class="text-sm text-red-600 mt-2">{error}</p>
          <button
            on:click={loadMessages}
            class="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      {:else if messages.length === 0}
        <div class="text-center py-8">
          <svg class="h-8 w-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p class="text-sm text-gray-500 mt-2">No messages yet</p>
          <p class="text-xs text-gray-400 mt-1">Start the conversation by sending a message below</p>
        </div>
      {:else}
        {#each messages as message, index}
          <!-- Date Separator -->
          {#if shouldShowDateSeparator(message, messages[index - 1])}
            <div class="flex justify-center">
              <span class="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
                {formatMessageDate(message.created_at)}
              </span>
            </div>
          {/if}
          
          <!-- Message -->
          <div class="flex {message.sender_id === $user?.id ? 'justify-end' : 'justify-start'}">
            <div class="max-w-xs lg:max-w-md">
              {#if !isConsecutiveMessage(message, messages[index - 1])}
                <div class="flex items-center space-x-2 mb-1 {message.sender_id === $user?.id ? 'justify-end' : 'justify-start'}">
                  {#if message.sender_id !== $user?.id}
                    {#if message.sender_photo}
                      <img
                        src={message.sender_photo}
                        alt={message.sender_name}
                        class="h-6 w-6 rounded-full object-cover"
                      />
                    {:else}
                      <div class="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </div>
                    {/if}
                  {/if}
                  <span class="text-xs text-gray-500">
                    {message.sender_id === $user?.id ? 'You' : message.sender_name}
                  </span>
                  <span class="text-xs text-gray-400">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              {/if}
              
              <div class="px-4 py-2 rounded-lg {
                message.sender_id === $user?.id 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }">
                <p class="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
    
    <!-- Message Input -->
    <div class="p-4 border-t border-gray-200">
      {#if error}
        <div class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      {/if}
      
      <div class="flex space-x-2">
        <textarea
          bind:value={newMessage}
          on:keypress={handleKeyPress}
          placeholder="Type your message..."
          rows="1"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          disabled={sending}
        ></textarea>
        
        <button
          on:click={sendMessage}
          disabled={!newMessage.trim() || sending}
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if sending}
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {:else}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
