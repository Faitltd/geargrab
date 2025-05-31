<script lang="ts">
  import ConversationList from '$lib/components/chat/ConversationList.svelte';
  import ChatWindow from '$lib/components/chat/ChatWindow.svelte';
  import { chatService, type ChatConversation } from '$lib/services/chat';
  import { authStore } from '$lib/stores/auth';

  let selectedConversation: ChatConversation | null = null;
  let otherUser: { id: string; name: string; avatar?: string } | null = null;

  function handleConversationSelect(conversation: ChatConversation) {
    selectedConversation = conversation;

    // Find the other participant
    if ($authStore.user) {
      const other = conversation.participants.find(p => p.id !== $authStore.user?.uid);
      if (other) {
        otherUser = other;
      }
    }
  }

  // Sample user data (in real app, this would come from user service)
  function getUserData(userId: string) {
    const sampleUsers = {
      'user1': { name: 'David Wilson', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      'user2': { name: 'Sarah Johnson', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
      'user3': { name: 'Mike Chen', avatar: 'https://randomuser.me/api/portraits/men/25.jpg' }
    };
    return sampleUsers[userId] || { name: 'Unknown User' };
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
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h1 class="text-2xl font-bold text-white mb-2">Messages</h1>
      <p class="text-gray-300">Chat with gear owners and renters</p>
    </div>

    <!-- Chat Interface -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">

      <!-- Conversations List -->
      <div class="lg:col-span-1">
        <ConversationList
          selectedConversationId={selectedConversation?.id || null}
          onConversationSelect={handleConversationSelect}
        />
      </div>

      <!-- Chat Window -->
      <div class="lg:col-span-2">
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
              <p class="text-gray-300">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        {/if}
      </div>

    </div>

    <!-- Quick Actions -->
    <div class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Find Gear to Rent
        </button>
        <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          List Your Gear
        </button>
        <button class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          View Bookings
        </button>
      </div>
    </div>

  </div>
</div>
