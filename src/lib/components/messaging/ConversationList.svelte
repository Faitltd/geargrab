<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { user } from '../../stores/auth.js';
  
  export let selectedConversationId = null;
  
  const dispatch = createEventDispatcher();
  
  let conversations = [];
  let loading = false;
  let error = null;
  
  onMount(() => {
    loadConversations();
  });
  
  async function loadConversations() {
    loading = true;
    error = null;
    
    try {
      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }
      
      const data = await response.json();
      conversations = data.conversations || [];
      
    } catch (err) {
      console.error('Failed to load conversations:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function selectConversation(conversation) {
    selectedConversationId = conversation.id;
    dispatch('conversation-selected', conversation);
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
  
  function getImageUrl(images) {
    if (!images) return '/placeholder-gear.jpg';
    const imageArray = Array.isArray(images) ? images : JSON.parse(images || '[]');
    return imageArray.length > 0 ? imageArray[0] : '/placeholder-gear.jpg';
  }
  
  function truncateMessage(message, maxLength = 50) {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  }
</script>

<div class="bg-white rounded-lg shadow-md h-full flex flex-col">
  <div class="p-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900">Messages</h2>
  </div>
  
  <div class="flex-1 overflow-y-auto">
    {#if loading}
      <div class="p-4 text-center">
        <svg class="animate-spin h-6 w-6 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm text-gray-500 mt-2">Loading conversations...</p>
      </div>
    {:else if error}
      <div class="p-4 text-center">
        <svg class="h-8 w-8 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <p class="text-sm text-red-600 mt-2">{error}</p>
        <button
          on:click={loadConversations}
          class="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Try Again
        </button>
      </div>
    {:else if conversations.length === 0}
      <div class="p-4 text-center">
        <svg class="h-8 w-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <p class="text-sm text-gray-500 mt-2">No conversations yet</p>
        <p class="text-xs text-gray-400 mt-1">Start a conversation by booking gear or contacting an owner</p>
      </div>
    {:else}
      <div class="divide-y divide-gray-200">
        {#each conversations as conversation}
          <button
            type="button"
            on:click={() => selectConversation(conversation)}
            class="w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors {
              selectedConversationId === conversation.id ? 'bg-green-50 border-r-2 border-green-500' : ''
            }"
          >
            <div class="flex items-start space-x-3">
              <!-- Avatar -->
              <div class="flex-shrink-0">
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
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {conversation.other_participant_name}
                  </p>
                  <div class="flex items-center space-x-2">
                    {#if conversation.unread_count > 0}
                      <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {conversation.unread_count}
                      </span>
                    {/if}
                    {#if conversation.last_message_at}
                      <p class="text-xs text-gray-500">
                        {formatDate(conversation.last_message_at)}
                      </p>
                    {/if}
                  </div>
                </div>
                
                <!-- Gear info if rental conversation -->
                {#if conversation.gear_title}
                  <div class="flex items-center mt-1">
                    {#if conversation.gear_images}
                      <img
                        src={getImageUrl(conversation.gear_images)}
                        alt={conversation.gear_title}
                        class="h-4 w-4 rounded object-cover mr-2"
                      />
                    {/if}
                    <p class="text-xs text-gray-600 truncate">
                      {conversation.gear_title}
                    </p>
                    {#if conversation.rental_status}
                      <span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium {
                        conversation.rental_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        conversation.rental_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        conversation.rental_status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }">
                        {conversation.rental_status}
                      </span>
                    {/if}
                  </div>
                {/if}
                
                <!-- Last message -->
                {#if conversation.last_message_content}
                  <p class="text-sm text-gray-600 mt-1">
                    {#if conversation.last_message_sender_id === $user?.id}
                      <span class="text-gray-500">You:</span>
                    {/if}
                    {truncateMessage(conversation.last_message_content)}
                  </p>
                {:else}
                  <p class="text-sm text-gray-400 mt-1 italic">No messages yet</p>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Refresh Button -->
  <div class="p-4 border-t border-gray-200">
    <button
      on:click={loadConversations}
      disabled={loading}
      class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
    >
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  </div>
</div>
