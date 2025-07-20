<script lang="ts">
  import { toastStore, removeToast } from '$lib/stores/toast.store';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  $: toasts = $toastStore.notifications;
  
  const handleDismiss = (id: string) => {
    removeToast(id);
  };
  
  const getToastStyles = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-primary-500',
          text: 'text-white',
          icon: 'text-white',
          border: 'border-primary-600'
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          icon: 'text-white',
          border: 'border-red-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          text: 'text-white',
          icon: 'text-white',
          border: 'border-blue-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          text: 'text-white',
          icon: 'text-white',
          border: 'border-yellow-600'
        };
      default:
        return {
          bg: 'bg-primary-500',
          text: 'text-white',
          icon: 'text-white',
          border: 'border-primary-600'
        };
    }
  };
</script>

<!-- Toast Container -->
<div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
  {#each toasts as toast (toast.id)}
    {@const styles = getToastStyles(toast.type)}
    <div
      class="rounded-lg border-2 p-4 shadow-lg {styles.bg} {styles.text} {styles.border}"
      in:fly={{ x: 300, duration: 300, easing: quintOut }}
      out:fly={{ x: 300, duration: 200, easing: quintOut }}
      role="alert"
    >
      <div class="flex items-start">
        <!-- Icon -->
        <div class="flex-shrink-0">
          {#if toast.type === 'success'}
            <svg class="w-5 h-5 {styles.icon}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          {:else if toast.type === 'error'}
            <svg class="w-5 h-5 {styles.icon}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          {:else if toast.type === 'warning'}
            <svg class="w-5 h-5 {styles.icon}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="w-5 h-5 {styles.icon}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          {/if}
        </div>
        
        <!-- Message -->
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium">
            {toast.message}
          </p>
        </div>
        
        <!-- Dismiss button -->
        <div class="ml-auto pl-3">
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 {styles.text} hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
            on:click={() => handleDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Progress bar for timed toasts -->
      {#if toast.duration && toast.duration > 0}
        <div class="mt-2 w-full bg-black bg-opacity-20 rounded-full h-1">
          <div 
            class="bg-white h-1 rounded-full transition-all ease-linear"
            style="width: 100%; animation: shrink {toast.duration}ms linear;"
          ></div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
</style>
