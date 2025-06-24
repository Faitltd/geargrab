<script lang="ts">
  import { onMount } from 'svelte';
  import ConversationList from '$lib/components/chat/conversation-list.svelte';
  import ChatWindow from '$lib/components/chat/chat-window.svelte';
  import { chatService, type ChatConversation } from '$lib/services/chat';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { notifications } from '$lib/stores/notifications';

  let selectedConversation: ChatConversation | null = null;
  let otherUser: { id: string; name: string; avatar?: string } | null = null;
  let showMobileChat = false;
  let searchQuery = '';

  // Get the auth state store
  $: authState = simpleAuth.authState;

  onMount(() => {
    // Redirect if not authenticated
    if (!$authState.isAuthenticated || !$authState.user) {
        goto("/auth/login?redirectTo=/messages");
      return;
    }

    // Check if there's a conversation ID in the URL
    const conversationId = $page.url.searchParams.get('conversation');
    if (conversationId) {
      console.log('Auto-selecting conversation from URL:', conversationId);
      // We'll need to wait for the conversation list to load and then select it
      // This will be handled by the ConversationList component
    }
  });

  function handleConversationSelect(conversation: ChatConversation) {
    selectedConversation = conversation;
    showMobileChat = true;

    // Find the other participant
    if ($authState.user) {
      const other = conversation.participants.find(p => p.id !== $authState.user?.uid);
      if (other) {
        otherUser = other;
      }
    }
  }

  function handleBackToList() {
    showMobileChat = false;
    selectedConversation = null;
    otherUser = null;
  }

  async function startNewConversation() {
    notifications.add({
      type: 'info',
      message: 'To start a new conversation, visit a listing and click "Contact Owner"',
      timeout: 5000
    });
  }

  // Navigation functions for quick actions
  function handleFindGear() {
    console.log('Find Gear button clicked');
    alert('Navigating to Browse page...');
    goto('/browse');
  }

  function handleListGear() {
    console.log('List Gear button clicked');
    alert('Navigating to List Gear page...');
    goto('/list-gear');
  }

  function handleViewBookings() {
    console.log('View Bookings button clicked');
    alert('Navigating to Dashboard...');
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>Messages - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover" />
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">Messages</h1>
          <p class="text-gray-300">Chat with gear owners and renters</p>
        </div>
        <button
          on:click="{startNewConversation}"
          class="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Conversation
        </button>
      </div>
    </div>

    <!-- Desktop Chat Interface -->
    <div class="hidden lg:grid grid-cols-3 gap-6 h-[600px]">
      <!-- Conversations List -->
      <div class="col-span-1">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 h-full flex flex-col">
          <!-- Search -->
          <div class="p-4 border-b border-white/20">
            <div class="relative">
              <input
                type="text"
                bind:value="{searchQuery}"
                placeholder="Search conversations..."
                class="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <!-- Conversation List -->
          <div class="flex-1 overflow-hidden">
            <ConversationList
              selectedConversationId={selectedConversation?.id || null}
              onConversationSelect={handleConversationSelect}
            />
          </div>
        </div>
      </div>

      <!-- Chat Window -->
      <div class="col-span-2">
        {#if selectedConversation && otherUser}
          <ChatWindow
            conversationId={selectedConversation.id}
            otherUser={otherUser}
            listingTitle={selectedConversation.listingTitle || ''}
          />
        {:else}
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 h-full flex items-center justify-center">
            <div class="text-center">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <h3 class="text-lg font-medium text-white mb-2">Select a conversation</h3>
              <p class="text-gray-300 mb-4">Choose a conversation from the list to start chatting</p>
              <button
                on:click="{startNewConversation}"
                class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Mobile Chat Interface -->
    <div class="lg:hidden">
      {#if !showMobileChat}
        <!-- Mobile Conversation List -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <!-- Mobile Search -->
          <div class="p-4 border-b border-white/20">
            <div class="relative">
              <input
                type="text"
                bind:value="{searchQuery}"
                placeholder="Search conversations..."
                class="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <!-- Mobile Conversation List -->
          <ConversationList
            selectedConversationId={selectedConversation?.id || null}
            onConversationSelect={handleConversationSelect}
          />
        </div>
      {:else if selectedConversation && otherUser}
        <!-- Mobile Chat View -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden h-[600px]">
          <!-- Mobile Chat Header -->
          <div class="flex items-center p-4 border-b border-white/20">
            <button
              on:click="{handleBackToList}"
              class="mr-3 p-1 text-gray-300 hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div class="flex items-center space-x-3">
              <img
                src={otherUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
                alt={otherUser.name}
                class="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <h3 class="font-semibold text-white text-sm">{otherUser.name}</h3>
                {#if selectedConversation.listingTitle}
                  <p class="text-xs text-gray-300">About: {selectedConversation.listingTitle}</p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Mobile Chat Window -->
          <div class="flex-1">
            <ChatWindow
              conversationId="{selectedConversation.id}"
              otherUser="{otherUser}"
              listingTitle={selectedConversation.listingTitle || ''}
            />
          </div>
        </div>
      {/if}
    </div>

    <!-- Quick Actions -->
    <div class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          on:click="{handleFindGear}"
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Find Gear to Rent
        </button>
        <button
          type="button"
          on:click="{handleListGear}"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          List Your Gear
        </button>
        <button
          type="button"
          on:click="{handleViewBookings}"
          class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          View Bookings
        </button>
      </div>
    </div>

  </div>
</div>
