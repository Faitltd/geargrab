<script lang="ts">
  import { toastNotifications } from '$lib/stores/notifications';
  import { fly } from 'svelte/transition';

  function getToastIcon(type) {
    switch (type) {
      case 'success':
        return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`;
      case 'error':
        return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>`;
      case 'warning':
        return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`;
      case 'info':
      default:
        return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`;
    }
  }

  function getToastClasses(type) {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 border-green-400 text-white';
      case 'error':
        return 'bg-red-500/90 border-red-400 text-white';
      case 'warning':
        return 'bg-yellow-500/90 border-yellow-400 text-white';
      case 'info':
      default:
        return 'bg-blue-500/90 border-blue-400 text-white';
    }
  }
</script>

<!-- Toast Container -->
<div class="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
  {#each $toastNotifications as notification (notification.id)}
    <div
      class="flex items-center p-4 rounded-lg border backdrop-blur-sm shadow-lg {getToastClasses(notification.type)}"
      transition:fly={{ x: 300, duration: 300 }}
    >
      <div class="flex-shrink-0 mr-3">
        {@html getToastIcon(notification.type)}
      </div>
      
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium break-words">
          {notification.message}
        </p>
      </div>
      
      <button
        on:click={() => toastNotifications.remove(notification.id)}
        class="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  {/each}
</div>
