<script lang="ts">
  import { goto } from '$app/navigation';

  // Sample data for display
  let messages = [
    {
      id: '1',
      conversationId: 'conv_1',
      from: 'John Smith',
      subject: 'Question about Mountain Bike rental',
      preview: 'Hi, I\'m interested in renting your Trek X-Caliber for the weekend...',
      timestamp: '2 hours ago',
      unread: true,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
    },
    {
      id: '2',
      conversationId: 'conv_2',
      from: 'Sarah Johnson',
      subject: 'Booking confirmation needed',
      preview: 'Please confirm the pickup time for the camping tent rental...',
      timestamp: '1 day ago',
      unread: false,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
    }
  ];

  // Function to handle clicking on a message
  function openMessage(message: any) {
    console.log('Opening message:', message);
    // Navigate to the main messages page with the conversation selected
    goto(`/messages?conversation=${message.conversationId}`);
  }
</script>

<svelte:head>
  <title>Messages - GearGrab</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Messages</h1>
        <p class="text-gray-300 mt-1">Messages related to your bookings and listings</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-right">
          <div class="text-2xl font-bold text-white">{messages.filter(m => m.unread).length}</div>
          <div class="text-sm text-gray-300">Unread</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Total Messages</dt>
            <dd class="text-lg font-medium text-white">{messages.length}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Unread</dt>
            <dd class="text-lg font-medium text-white">{messages.filter(m => m.unread).length}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-300 truncate">Conversations</dt>
            <dd class="text-lg font-medium text-white">{messages.length}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  <!-- Messages List -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
    <div class="px-6 py-4 border-b border-white/20">
      <h2 class="text-lg font-medium text-white">Recent Messages</h2>
    </div>
    <div class="p-6">
      {#if messages.length === 0}
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-300">No messages yet</h3>
          <p class="mt-1 text-sm text-gray-400">Messages will appear here when you start renting or listing gear.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each messages as message}
            <div
              class="border border-white/20 rounded-lg p-4 hover:bg-white/5 transition-all bg-white/5 cursor-pointer"
              on:click={() => openMessage(message)}
              on:keydown={(e) => e.key === 'Enter' && openMessage(message)}
              role="button"
              tabindex="0"
            >
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <img class="h-12 w-12 rounded-full" src="{message.avatar}" alt="{message.from}" />
                  {#if message.unread}
                    <div class="absolute -mt-2 -ml-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="text-lg font-medium text-white truncate">{message.from}</p>
                    <p class="text-sm text-gray-300">{message.timestamp}</p>
                  </div>
                  <p class="text-sm font-medium text-gray-200 mt-1">{message.subject}</p>
                  <p class="text-sm text-gray-300 truncate mt-1">{message.preview}</p>
                  {#if message.unread}
                    <div class="mt-2">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                        New
                      </span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
