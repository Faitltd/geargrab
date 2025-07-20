<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let isOpen = false;
  export let title = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let closable = true;
  export let closeOnBackdrop = true;
  
  const dispatch = createEventDispatcher<{
    close: void;
    open: void;
  }>();
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  let modalElement: HTMLDivElement;
  
  const handleClose = () => {
    if (closable) {
      isOpen = false;
      dispatch('close');
    }
  };
  
  const handleBackdropClick = (event: MouseEvent) => {
    if (closeOnBackdrop && event.target === modalElement) {
      handleClose();
    }
  };
  
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && closable) {
      handleClose();
    }
  };
  
  onMount(() => {
    if (isOpen) {
      dispatch('open');
    }
  });
  
  $: if (isOpen) {
    dispatch('open');
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    bind:this={modalElement}
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
  >
    <div class="relative w-full {sizeClasses[size]} bg-white rounded-lg shadow-xl">
      <!-- Header -->
      {#if title || closable}
        <div class="flex items-center justify-between p-6 border-b border-neutral-200">
          {#if title}
            <h2 id="modal-title" class="text-lg font-semibold text-neutral-900">
              {title}
            </h2>
          {/if}
          
          {#if closable}
            <button
              type="button"
              class="text-neutral-400 hover:text-neutral-600 transition-colors"
              on:click={handleClose}
              aria-label="Close modal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      {/if}
      
      <!-- Content -->
      <div class="p-6">
        <slot />
      </div>
      
      <!-- Footer -->
      <slot name="footer" />
    </div>
  </div>
{/if}
