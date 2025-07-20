<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, slide } from 'svelte/transition';

  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let message: string = '';
  export let dismissible: boolean = false;
  export let icon: boolean = true;
  export let visible: boolean = true;

  const dispatch = createEventDispatcher<{
    dismiss: void;
  }>();

  const handleDismiss = () => {
    visible = false;
    dispatch('dismiss');
  };

  // Type-specific styling
  $: alertClasses = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
    info: 'bg-blue-500 text-white border-blue-600'
  }[type];

  // Icons for different alert types
  const icons = {
    success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>`,
    error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>`,
    warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>`,
    info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`
  };
</script>

{#if visible}
  <div
    class="flex items-center justify-between px-4 py-3 rounded-lg border shadow-sm {alertClasses}"
    transition:slide={{ duration: 200 }}
    role="alert"
    aria-live="polite"
  >
    <div class="flex items-center space-x-3">
      {#if icon}
        <div class="flex-shrink-0">
          {@html icons[type]}
        </div>
      {/if}
      
      <div class="flex-1">
        <p class="text-sm font-medium">
          {message}
        </p>
        
        <!-- Slot for additional content -->
        <slot />
      </div>
    </div>

    {#if dismissible}
      <button
        on:click={handleDismiss}
        class="flex-shrink-0 ml-4 p-1 rounded-md hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
        aria-label="Dismiss alert"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>
{/if}

<style>
  /* Additional custom styles if needed */
  :global(.inline-alert-enter) {
    animation: slideDown 0.2s ease-out;
  }

  :global(.inline-alert-exit) {
    animation: slideUp 0.2s ease-in;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
</style>
