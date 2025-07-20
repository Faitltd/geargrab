<script lang="ts">
  export let message: string;
  export let dismissible: boolean = true;
  export let onDismiss: (() => void) | undefined = undefined;
  export let autoHide: boolean = true;
  export let autoHideDelay: number = 5000;
  
  let visible = true;
  
  const handleDismiss = () => {
    visible = false;
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Auto-hide functionality
  if (autoHide) {
    setTimeout(() => {
      if (visible) {
        handleDismiss();
      }
    }, autoHideDelay);
  }
</script>

{#if visible}
  <div class="rounded-lg border-2 bg-primary-50 border-primary-200 p-4 text-primary-800 animate-slide-down" role="alert">
    <div class="flex items-start">
      <!-- Success Icon -->
      <div class="flex-shrink-0">
        <svg class="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </div>
      
      <!-- Message -->
      <div class="ml-3 flex-1">
        <p class="text-sm font-medium">
          {message}
        </p>
      </div>
      
      <!-- Dismiss button -->
      {#if dismissible}
        <div class="ml-auto pl-3">
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 text-primary-800 hover:text-accent-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            on:click={handleDismiss}
            aria-label="Dismiss"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }
</style>
