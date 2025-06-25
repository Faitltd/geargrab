<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    pushNotificationService, 
    notificationPermission, 
    pushSupported,
    enableNotifications,
    disableNotifications
  } from '$lib/services/push-notifications';
  import { simpleAuth } from '$lib/auth/simple-auth';
  
  let loading = false;
  let subscribed = false;
  
  $: authState = simpleAuth.authState;
  $: canEnable = $pushSupported && $notificationPermission !== 'denied';
  $: isEnabled = $notificationPermission === 'granted' && subscribed;
  
  onMount(async () => {
    // Check if user is already subscribed
    if ($authState.user && $notificationPermission === 'granted') {
      // You could check subscription status from server here
      subscribed = true;
    }
  });
  
  async function toggleNotifications() {
    if (!$authState.user) return;
    
    loading = true;
    
    try {
      if (isEnabled) {
        // Disable notifications
        const success = await disableNotifications($authState.user.uid);
        if (success) {
          subscribed = false;
          console.log('✅ Notifications disabled');
        }
      } else {
        // Enable notifications
        const success = await enableNotifications($authState.user.uid);
        if (success) {
          subscribed = true;
          console.log('✅ Notifications enabled');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      loading = false;
    }
  }
  
  function getStatusText(): string {
    if (!$pushSupported) return 'Not supported in this browser';
    if ($notificationPermission === 'denied') return 'Blocked by browser';
    if ($notificationPermission === 'default') return 'Not requested';
    if (isEnabled) return 'Enabled';
    return 'Disabled';
  }
  
  function getStatusColor(): string {
    if (!$pushSupported || $notificationPermission === 'denied') return 'text-red-400';
    if (isEnabled) return 'text-green-400';
    return 'text-yellow-400';
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium text-white">Push Notifications</h3>
      <p class="text-sm text-gray-300 mt-1">
        Get notified when you receive new messages
      </p>
      <div class="flex items-center space-x-2 mt-2">
        <span class="text-sm text-gray-400">Status:</span>
        <span class="text-sm font-medium {getStatusColor()}">
          {getStatusText()}
        </span>
      </div>
    </div>
    
    <div class="flex items-center space-x-4">
      {#if $pushSupported}
        <button
          on:click={toggleNotifications}
          disabled={loading || !canEnable || !$authState.user}
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed {
            isEnabled ? 'bg-green-600' : 'bg-gray-600'
          }"
        >
          <span class="sr-only">Toggle notifications</span>
          <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          }"></span>
        </button>
      {:else}
        <span class="text-sm text-red-400">Not supported</span>
      {/if}
      
      {#if loading}
        <div class="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div>
      {/if}
    </div>
  </div>
  
  {#if $notificationPermission === 'denied'}
    <div class="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
      <p class="text-sm text-red-300">
        <strong>Notifications blocked:</strong> To enable notifications, please allow them in your browser settings and refresh the page.
      </p>
    </div>
  {:else if !$pushSupported}
    <div class="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
      <p class="text-sm text-yellow-300">
        <strong>Not supported:</strong> Push notifications are not supported in this browser. Try using Chrome, Firefox, or Safari.
      </p>
    </div>
  {:else if isEnabled}
    <div class="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
      <p class="text-sm text-green-300">
        <strong>Notifications enabled:</strong> You'll receive push notifications for new messages even when GearGrab is closed.
      </p>
    </div>
  {/if}
  
  <!-- Test notification button (development only) -->
  {#if import.meta.env.DEV && isEnabled}
    <div class="mt-4 pt-4 border-t border-white/20">
      <button
        on:click={() => pushNotificationService.showLocalNotification(
          'Test Notification',
          { body: 'This is a test notification from GearGrab!' }
        )}
        class="text-sm text-blue-400 hover:text-blue-300 underline"
      >
        Send test notification
      </button>
    </div>
  {/if}
</div>
