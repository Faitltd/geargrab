<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import { chatService } from '$lib/services/chat';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import type { ChatMessage, ChatConversation } from '$lib/services/chat';
  
  export let conversationId: string;
  export let otherParticipant: { id: string; name: string; avatar?: string };
  
  let messages: ChatMessage[] = [];
  let newMessage = '';
  let loading = true;
  let sending = false;
  let messagesContainer: HTMLElement;
  let unsubscribe: (() => void) | null = null;
  
  $: authState = simpleAuth.authState;
  $: currentUser = $authState.user;
  
  onMount(async () => {
    if (conversationId && currentUser) {
      await loadMessages();
      scrollToBottom();
    }
  });
  
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
  
  afterUpdate(() => {
    scrollToBottom();
  });
  
  async function loadMessages() {
    try {
      loading = true;
      
      // Subscribe to real-time messages
      unsubscribe = await chatService.subscribeToMessages(
        conversationId,
        (newMessages) => {
          messages = newMessages;
          loading = false;
          
          // Mark messages as read
          if (currentUser) {
            chatService.markMessagesAsRead(conversationId, currentUser.uid);
          }
        }
      );
      
    } catch (error) {
      console.error('Error loading messages:', error);
      loading = false;
    }
  }
  
  async function sendMessage() {
    if (!newMessage.trim() || !currentUser || sending) return;
    
    try {
      sending = true;
      
      await chatService.sendMessage(conversationId, {
        content: newMessage.trim(),
        type: 'text'
      });
      
      newMessage = '';
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      sending = false;
    }
  }
  
  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }
  
  function formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  }
  
  function shouldShowDateSeparator(message: ChatMessage, index: number): boolean {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    const currentDate = new Date(message.timestamp).toDateString();
    const prevDate = new Date(prevMessage.timestamp).toDateString();
    
    return currentDate !== prevDate;
  }
</script>

<div class="chat-window">
  <!-- Chat Header -->
  <div class="chat-header">
    <div class="participant-info">
      {#if otherParticipant.avatar}
        <img src={otherParticipant.avatar} alt={otherParticipant.name} class="avatar" />
      {:else}
        <div class="avatar-placeholder">
          {otherParticipant.name.charAt(0).toUpperCase()}
        </div>
      {/if}
      <div class="participant-details">
        <h3>{otherParticipant.name}</h3>
        <span class="status">Online</span>
      </div>
    </div>
  </div>

  <!-- Messages Container -->
  <div class="messages-container" bind:this={messagesContainer}>
    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading messages...</p>
      </div>
    {:else if messages.length === 0}
      <div class="empty-state">
        <p>No messages yet. Start the conversation!</p>
      </div>
    {:else}
      {#each messages as message, index}
        {#if shouldShowDateSeparator(message, index)}
          <div class="date-separator">
            <span>{formatDate(new Date(message.timestamp))}</span>
          </div>
        {/if}
        
        <div class="message {message.senderId === currentUser?.uid ? 'sent' : 'received'}">
          <div class="message-content">
            <p>{message.content}</p>
            <span class="timestamp">{formatTime(new Date(message.timestamp))}</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Message Input -->
  <div class="message-input">
    <div class="input-container">
      <textarea
        bind:value={newMessage}
        on:keypress={handleKeyPress}
        placeholder="Type a message..."
        rows="1"
        disabled={sending}
      ></textarea>
      <button
        on:click={sendMessage}
        disabled={!newMessage.trim() || sending}
        class="send-button"
      >
        {#if sending}
          <div class="spinner-small"></div>
        {:else}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .chat-window {
    display: flex;
    flex-direction: column;
    height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .chat-header {
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .participant-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
  }

  .participant-details h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .status {
    font-size: 12px;
    opacity: 0.8;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .loading, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
  }

  .date-separator {
    text-align: center;
    margin: 16px 0;
  }

  .date-separator span {
    background: #f0f0f0;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    color: #666;
  }

  .message {
    display: flex;
    margin-bottom: 8px;
  }

  .message.sent {
    justify-content: flex-end;
  }

  .message.received {
    justify-content: flex-start;
  }

  .message-content {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    position: relative;
  }

  .message.sent .message-content {
    background: #007bff;
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message.received .message-content {
    background: #f1f1f1;
    color: #333;
    border-bottom-left-radius: 4px;
  }

  .message-content p {
    margin: 0;
    line-height: 1.4;
  }

  .timestamp {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
    display: block;
  }

  .message-input {
    padding: 16px 20px;
    border-top: 1px solid #eee;
    background: #fafafa;
  }

  .input-container {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }

  textarea {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 12px 16px;
    resize: none;
    font-family: inherit;
    font-size: 14px;
    max-height: 100px;
    min-height: 40px;
  }

  textarea:focus {
    outline: none;
    border-color: #007bff;
  }

  .send-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #007bff;
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .send-button:hover:not(:disabled) {
    background: #0056b3;
  }

  .send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner, .spinner-small {
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner {
    width: 30px;
    height: 30px;
  }

  .spinner-small {
    width: 16px;
    height: 16px;
    border-width: 1px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .chat-window {
      height: 100vh;
      border-radius: 0;
    }
    
    .message-content {
      max-width: 85%;
    }
  }
</style>
