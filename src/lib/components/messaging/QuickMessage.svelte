<script>
  import { createEventDispatcher } from 'svelte';
  import { user, isAuthenticated } from '../../stores/auth.js';
  
  export let recipientId = null;
  export let rentalId = null;
  export let recipientName = '';
  export let placeholder = 'Send a message...';
  export let buttonText = 'Send Message';
  
  const dispatch = createEventDispatcher();
  
  let showForm = false;
  let message = '';
  let loading = false;
  let error = null;
  
  function toggleForm() {
    if (!$isAuthenticated) {
      dispatch('auth-required');
      return;
    }
    
    showForm = !showForm;
    if (!showForm) {
      resetForm();
    }
  }
  
  function resetForm() {
    message = '';
    error = null;
  }
  
  async function sendMessage() {
    if (!message.trim() || loading) return;
    
    loading = true;
    error = null;
    
    try {
      // First, create or get conversation
      const conversationResponse = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          rental_id: rentalId,
          recipient_id: recipientId
        })
      });
      
      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }
      
      const conversationData = await conversationResponse.json();
      
      // Then send the message
      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          conversation_id: conversationData.conversation_id,
          content: message.trim()
        })
      });
      
      if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const messageData = await messageResponse.json();
      
      dispatch('message-sent', {
        conversation_id: conversationData.conversation_id,
        message: messageData.message_data
      });
      
      showForm = false;
      resetForm();
      
    } catch (err) {
      console.error('Failed to send message:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4">
  <div class="flex items-center justify-between mb-3">
    <h4 class="text-sm font-medium text-gray-900">
      {recipientName ? `Message ${recipientName}` : 'Send Message'}
    </h4>
    
    <button
      on:click={toggleForm}
      class="text-sm text-green-600 hover:text-green-800 font-medium"
    >
      {showForm ? 'Cancel' : buttonText}
    </button>
  </div>
  
  {#if showForm}
    <div class="space-y-3">
      {#if error}
        <div class="bg-red-50 border border-red-200 rounded-md p-3">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="ml-3">
              <p class="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      {/if}
      
      <textarea
        bind:value={message}
        on:keypress={handleKeyPress}
        {placeholder}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
        disabled={loading}
      ></textarea>
      
      <div class="flex justify-end space-x-2">
        <button
          type="button"
          on:click={toggleForm}
          class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Cancel
        </button>
        
        <button
          type="button"
          on:click={sendMessage}
          disabled={!message.trim() || loading}
          class="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          {:else}
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Send
          {/if}
        </button>
      </div>
    </div>
  {:else}
    <p class="text-sm text-gray-600">
      {recipientName ? `Send a message to ${recipientName}` : 'Click to send a message'}
      {#if rentalId}
        about this rental
      {/if}
    </p>
  {/if}
</div>
