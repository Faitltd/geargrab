<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user, isAuthenticated } from '../../lib/stores/auth.js';
  import ConversationList from '../../lib/components/messaging/ConversationList.svelte';
  import ChatInterface from '../../lib/components/messaging/ChatInterface.svelte';
  
  let selectedConversation = null;
  let selectedConversationId = null;
  let isMobile = false;
  let showChat = false;
  
  onMount(() => {
    // Check if user is authenticated
    if (!$isAuthenticated) {
      goto('/auth/login?redirect=' + encodeURIComponent('/messages'));
      return;
    }
    
    // Check if mobile
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });
  
  function checkMobile() {
    isMobile = window.innerWidth < 768;
  }
  
  function handleConversationSelected(event) {
    selectedConversation = event.detail;
    selectedConversationId = selectedConversation.id;
    
    if (isMobile) {
      showChat = true;
    }
  }
  
  function handleBackToList() {
    showChat = false;
    selectedConversation = null;
    selectedConversationId = null;
  }
  
  function handleMessageSent(event) {
    // Could update conversation list here if needed
    console.log('Message sent:', event.detail);
  }
</script>

<svelte:head>
  <title>Messages - GearGrab</title>
  <meta name="description" content="Chat with gear owners and renters" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Messages</h1>
      <p class="mt-2 text-gray-600">
        Chat with gear owners and renters about your bookings
      </p>
    </div>
    
    {#if !$isAuthenticated}
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">Sign In Required</h3>
        <p class="mt-1 text-gray-600">You need to be signed in to view your messages</p>
        <div class="mt-4">
          <button
            on:click={() => goto('/auth/login?redirect=' + encodeURIComponent('/messages'))}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Sign In
          </button>
        </div>
      </div>
    {:else}
      <!-- Desktop Layout -->
      <div class="hidden md:block">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <!-- Conversation List -->
          <div class="lg:col-span-1">
            <ConversationList 
              {selectedConversationId}
              on:conversation-selected={handleConversationSelected}
            />
          </div>
          
          <!-- Chat Interface -->
          <div class="lg:col-span-2">
            <ChatInterface 
              conversation={selectedConversation}
              on:message-sent={handleMessageSent}
            />
          </div>
        </div>
      </div>
      
      <!-- Mobile Layout -->
      <div class="md:hidden">
        {#if !showChat}
          <!-- Show conversation list -->
          <div class="h-[600px]">
            <ConversationList 
              {selectedConversationId}
              on:conversation-selected={handleConversationSelected}
            />
          </div>
        {:else}
          <!-- Show chat interface -->
          <div class="h-[600px]">
            <!-- Mobile Header with Back Button -->
            <div class="bg-white border-b border-gray-200 p-4 flex items-center space-x-3">
              <button
                on:click={handleBackToList}
                class="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              
              {#if selectedConversation}
                <div class="flex items-center space-x-3">
                  {#if selectedConversation.other_participant_photo}
                    <img
                      src={selectedConversation.other_participant_photo}
                      alt={selectedConversation.other_participant_name}
                      class="h-8 w-8 rounded-full object-cover"
                    />
                  {:else}
                    <div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                  {/if}
                  
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">
                      {selectedConversation.other_participant_name}
                    </h3>
                    {#if selectedConversation.gear_title}
                      <p class="text-sm text-gray-600">
                        {selectedConversation.gear_title}
                      </p>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
            
            <!-- Chat Interface without header -->
            <div class="h-[calc(600px-80px)]">
              <ChatInterface 
                conversation={selectedConversation}
                on:message-sent={handleMessageSent}
              />
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Help Text -->
      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div class="flex">
          <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">How messaging works</h3>
            <div class="mt-2 text-sm text-blue-700">
              <ul class="list-disc list-inside space-y-1">
                <li>Conversations are automatically created when you book gear or receive a booking request</li>
                <li>You can message gear owners before booking to ask questions</li>
                <li>All messages are private and secure</li>
                <li>Be respectful and follow our community guidelines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
