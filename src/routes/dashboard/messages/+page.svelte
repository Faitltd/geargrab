<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';
  import { 
    getConversations, 
    getMessages, 
    sendMessage, 
    markConversationAsRead,
    subscribeToConversations,
    subscribeToMessages,
    type Conversation,
    type Message
  } from '$lib/services/messages.service';
  import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
  import ConversationList from '$lib/components/messages/ConversationList.svelte';
  import ChatInterface from '$lib/components/messages/ChatInterface.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  // State
  let conversations: Conversation[] = [];
  let messages: Message[] = [];
  let selectedConversation: Conversation | null = null;
  let isLoading = true;
  let error = '';
  let newMessage = '';
  let isSending = false;

  // Subscriptions for real-time updates
  let conversationsUnsubscribe: (() => void) | null = null;
  let messagesUnsubscribe: (() => void) | null = null;

  // Reactive statements
  $: user = $authStore.data;
  $: isAuthenticated = !!user;
  $: totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  onMount(async () => {
    // Check authentication
    if (!isAuthenticated) {
      showToast('error', 'Please sign in to access your messages');
      goto('/auth/signin');
      return;
    }

    await loadConversations();
  });

  onDestroy(() => {
    // Clean up subscriptions
    if (conversationsUnsubscribe) {
      conversationsUnsubscribe();
    }
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }
  });

  async function loadConversations() {
    if (!user) return;

    try {
      isLoading = true;
      error = '';

      // Load initial conversations
      conversations = await getConversations(user.uid);

      // Set up real-time subscription for conversations
      conversationsUnsubscribe = subscribeToConversations(user.uid, (updatedConversations) => {
        conversations = updatedConversations;
      });

    } catch (err) {
      console.error('Error loading conversations:', err);
      error = err instanceof Error ? err.message : 'Failed to load conversations';
    } finally {
      isLoading = false;
    }
  }

  async function selectConversation(conversation: Conversation) {
    if (selectedConversation?.id === conversation.id || !conversation.id) return;

    try {
      // Clean up previous messages subscription
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }

      selectedConversation = conversation;
      messages = [];

      // Load messages for this conversation
      messages = await getMessages(conversation.id);

      // Set up real-time subscription for messages
      messagesUnsubscribe = subscribeToMessages(conversation.id, (updatedMessages) => {
        messages = updatedMessages;
      });

      // Mark conversation as read
      if (conversation.unreadCount && conversation.unreadCount > 0) {
        await markConversationAsRead(conversation.id, user!.uid);
      }

    } catch (err) {
      console.error('Error loading messages:', err);
      showToast('error', 'Failed to load messages');
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedConversation?.id || !user || isSending) return;

    try {
      isSending = true;

      await sendMessage({
        conversationId: selectedConversation.id,
        senderId: user.uid,
        content: newMessage.trim(),
        type: 'text'
      });

      newMessage = '';
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('error', 'Failed to send message');
    } finally {
      isSending = false;
    }
  }

  function handleKeyPress(event: CustomEvent<{ event: KeyboardEvent }>) {
    const keyboardEvent = event.detail.event;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      handleSendMessage();
    }
  }
</script>

<svelte:head>
  <title>Messages - GearGrab</title>
  <meta name="description" content="Manage your conversations and messages" />
</svelte:head>

<DashboardLayout 
  title="Messages" 
  description="Manage your conversations and messages"
>
  <div slot="header-actions">
    {#if totalUnreadCount > 0}
      <div class="flex items-center space-x-2 text-sm text-gray-600">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        <span>{totalUnreadCount} unread</span>
      </div>
    {/if}
  </div>

  <div class="h-[calc(100vh-200px)] flex bg-white rounded-lg border border-gray-200 overflow-hidden">
    <!-- Conversations Sidebar -->
    <div class="w-1/3 border-r border-gray-200 flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Conversations</h2>
      </div>

      {#if isLoading}
        <div class="flex-1 flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      {:else if error}
        <div class="flex-1 flex items-center justify-center p-4">
          <div class="text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p class="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      {:else if conversations.length === 0}
        <div class="flex-1 flex items-center justify-center p-4">
          <div class="text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p class="text-gray-600 text-sm">Start a conversation by contacting a gear owner</p>
          </div>
        </div>
      {:else}
        <ConversationList 
          {conversations}
          {selectedConversation}
          on:select={(e) => selectConversation(e.detail.conversation)}
        />
      {/if}
    </div>

    <!-- Chat Interface -->
    <div class="flex-1 flex flex-col">
      {#if selectedConversation}
        <ChatInterface
          conversation={selectedConversation}
          {messages}
          {newMessage}
          {isSending}
          on:sendMessage={handleSendMessage}
          on:messageInput={(e) => newMessage = e.detail.value}
          on:keyPress={handleKeyPress}
        />
      {:else}
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 class="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p class="text-gray-600">Choose a conversation from the sidebar to start messaging</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</DashboardLayout>
