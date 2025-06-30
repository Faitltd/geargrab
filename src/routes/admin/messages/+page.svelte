<script lang="ts">
  import { onMount } from 'svelte';
  import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';
  import { notifications } from '$lib/stores/notifications';
  import { chatService, type ChatConversation } from '$lib/services/chat';
  import { isCurrentUserAdmin, initializeAdminUser } from '$lib/auth/admin';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { goto } from '$app/navigation';

  let conversations = [];
  let filteredConversations = [];
  let loading = true;
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedConversation = null;
  let showConversationModal = false;

  const statusOptions = [
    { value: 'all', label: 'All Conversations' },
    { value: 'active', label: 'Active' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'archived', label: 'Archived' }
  ];

  onMount(async () => {
    try {
      // Wait for auth to be ready
      await simpleAuth.waitForAuthReady();

      if (!simpleAuth.user) {
        goto('/auth/login?redirectTo=/admin/messages');
        return;
      }

      // Initialize admin user if needed
      await initializeAdminUser();

      // Check admin status
      const isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        console.warn('🚫 User is not admin:', simpleAuth.user.email);
        goto('/?error=admin_required');
        return;
      }

      console.log('✅ Admin access granted for message management:', simpleAuth.user.email);
      await loadConversations();
    } catch (error) {
      console.error('Error checking admin access:', error);
      goto('/?error=admin_check_failed');
    }
  });

  async function loadConversations() {
    try {
      loading = true;

      // Load messages/conversations using API endpoint
      const response = await fetch(`/api/admin/messages?status=${statusFilter}&limit=100`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load messages');
      }

      const data = await response.json();
      conversations = data.conversations || [];
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load conversations',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  function filterConversations() {
    filteredConversations = conversations.filter(conversation => {
      const matchesSearch = conversation.participants.some(p => 
        p.toLowerCase().includes(searchQuery.toLowerCase())
      ) || conversation.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  $: {
    searchQuery;
    statusFilter;
    filterConversations();
  }

  async function updateConversationStatus(conversationId: string, newStatus: string) {
    try {
      // Update all messages in the conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;
      
      const updatePromises = conversation.messages.map(message => {
        const messageRef = doc(firestore, 'messages', message.id);
        return updateDoc(messageRef, { 
          status: newStatus,
          adminUpdated: true,
          updatedAt: new Date()
        });
      });
      
      await Promise.all(updatePromises);
      
      notifications.add({
        type: 'success',
        message: `Conversation ${newStatus} successfully`,
        timeout: 3000
      });
      
      await loadConversations();
    } catch (error) {
      console.error('Error updating conversation:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to update conversation',
        timeout: 5000
      });
    }
  }

  async function deleteConversation(conversationId: string) {
    if (!confirm('Are you sure you want to delete this entire conversation? This action cannot be undone.')) {
      return;
    }
    
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;
      
      const deletePromises = conversation.messages.map(message => 
        deleteDoc(doc(firestore, 'messages', message.id))
      );
      
      await Promise.all(deletePromises);
      
      notifications.add({
        type: 'success',
        message: 'Conversation deleted successfully',
        timeout: 3000
      });
      
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to delete conversation',
        timeout: 5000
      });
    }
  }

  function openConversationModal(conversation) {
    selectedConversation = conversation;
    showConversationModal = true;
  }

  function closeConversationModal() {
    selectedConversation = null;
    showConversationModal = false;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return { class: 'bg-green-500/20 text-green-300 border-green-500/30', text: 'Active' };
      case 'flagged':
        return { class: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'Flagged' };
      case 'resolved':
        return { class: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'Resolved' };
      case 'archived':
        return { class: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: 'Archived' };
      default:
        return { class: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: status };
    }
  }

  function truncateMessage(content: string, maxLength: number = 100) {
    if (!content) return 'No content';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
</script>

<svelte:head>
  <title>Messages Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">Messages Management</h1>
      <p class="text-gray-400 mt-1">Monitor and manage user conversations</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-400">Total Conversations</p>
      <p class="text-2xl font-bold text-white">{conversations.length}</p>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Search -->
      <div>
        <label for="search-conversations" class="block text-sm font-medium text-gray-300 mb-2">Search Conversations</label>
        <input id="search-conversations"
          type="text"
          bind:value="{searchQuery}"
          placeholder="Search by participant or message content..."
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      <!-- Status Filter -->
      <div>
        <label for="status-filter" class="block text-sm font-medium text-gray-300 mb-2">Status Filter</label>
        <select id="status-filter"
          bind:value="{statusFilter}"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          {#each statusOptions as option}
            <option value="{option.value}">{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Results Count -->
      <div class="flex items-end">
        <div class="text-center">
          <p class="text-sm text-gray-400">Showing Results</p>
          <p class="text-xl font-bold text-white">{filteredConversations.length}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Conversations Table -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
    {#if loading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p class="text-gray-400">Loading conversations...</p>
      </div>
    {:else if filteredConversations.length === 0}
      <div class="p-8 text-center">
        <p class="text-gray-400">No conversations found matching your criteria.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Participants</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Message</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Messages</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Activity</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            {#each filteredConversations as conversation}
              <tr class="hover:bg-white/5">
                <td class="px-6 py-4">
                  <div class="space-y-1">
                    {#each conversation.participants as participant}
                      <div class="text-white text-sm">{participant}</div>
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white text-sm">
                    {truncateMessage(conversation.lastMessage?.content)}
                  </div>
                  <div class="text-gray-400 text-xs mt-1">
                    From: {conversation.lastMessage?.senderEmail || 'Unknown'}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white font-medium">{conversation.messageCount}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-gray-400 text-sm">
                    {conversation.lastActivity.toLocaleDateString()}
                  </div>
                  <div class="text-gray-500 text-xs">
                    {conversation.lastActivity.toLocaleTimeString()}
                  </div>
                </td>
                <td class="px-6 py-4">
                  {#if conversation.status}
                    {@const badge = getStatusBadge(conversation.status)}
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class}">
                      {badge.text}
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="flex space-x-2">
                    <button
                      on:click={() => openConversationModal(conversation)}
                      class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      View
                    </button>
                    {#if conversation.status === 'flagged'}
                      <button
                        on:click={() => updateConversationStatus(conversation.id, 'resolved')}
                        class="text-green-400 hover:text-green-300 text-sm font-medium"
                      >
                        Resolve
                      </button>
                    {:else}
                      <button
                        on:click={() => updateConversationStatus(conversation.id, 'flagged')}
                        class="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                      >
                        Flag
                      </button>
                    {/if}
                    <button
                      on:click={() => updateConversationStatus(conversation.id, 'archived')}
                      class="text-gray-400 hover:text-gray-300 text-sm font-medium"
                    >
                      Archive
                    </button>
                    <button
                      on:click={() => deleteConversation(conversation.id)}
                      class="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Conversation Modal -->
{#if showConversationModal && selectedConversation}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-6 w-full max-w-4xl mx-4 border border-white/20 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">Conversation Details</h2>
        <button
          on:click="{closeConversationModal}"
          class="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <!-- Conversation Info -->
      <div class="bg-white/5 rounded-lg p-4 mb-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-gray-400">Participants:</span>
            <div class="text-white mt-1">
              {#each selectedConversation.participants as participant}
                <div>{participant}</div>
              {/each}
            </div>
          </div>
          <div>
            <span class="text-gray-400">Status:</span>
            {#if selectedConversation.status}
              {@const badge = getStatusBadge(selectedConversation.status)}
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class} ml-2">
                {badge.text}
              </span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="space-y-4 max-h-96 overflow-y-auto">
        <h3 class="text-lg font-semibold text-white">Messages ({selectedConversation.messageCount})</h3>
        {#each selectedConversation.messages.sort((a, b) => a.createdAt - b.createdAt) as message}
          <div class="bg-white/5 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <div class="text-sm text-gray-400">
                From: {message.senderEmail || 'Unknown'}
              </div>
              <div class="text-xs text-gray-500">
                {message.createdAt.toLocaleString()}
              </div>
            </div>
            <div class="text-white">
              {message.content || 'No content'}
            </div>
            {#if message.flagged}
              <div class="mt-2">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-red-500/20 text-red-300 border-red-500/30">
                  Flagged
                </span>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-4 mt-6 pt-6 border-t border-white/20">
        <button
          on:click="{closeConversationModal}"
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Close
        </button>
        <div class="flex space-x-2">
          {#if selectedConversation.status === 'flagged'}
            <button
              on:click={() => {updateConversationStatus(selectedConversation.id, 'resolved'); closeConversationModal();}}
              class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              Resolve
            </button>
          {:else}
            <button
              on:click={() => {updateConversationStatus(selectedConversation.id, 'flagged'); closeConversationModal();}}
              class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
            >
              Flag Conversation
            </button>
          {/if}
          <button
            on:click={() => {updateConversationStatus(selectedConversation.id, 'archived'); closeConversationModal();}}
            class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
