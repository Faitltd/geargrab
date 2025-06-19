<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';

  export let show = false;
  export let title = '';
  export let maxWidth = 'max-w-4xl';
  export let maxHeight = 'max-h-[90vh]';
  export let showCloseButton = true;
  export let closeOnBackdrop = true;
  export let closeOnEscape = true;

  const dispatch = createEventDispatcher();

  let modalElement: HTMLDivElement;

  onMount(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && closeOnEscape && show) {
        close();
      }
    }

    if (closeOnEscape) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  });

  function close() {
    show = false;
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      close();
    }
  }

  // Prevent body scroll when modal is open
  $: if (typeof document !== 'undefined') {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    on:click="{handleBackdropClick}"
    role="dialog"
    aria-modal="true"
    transition:fade={{ duration: 200 }}
    bind:this={modalElement}
  >
    <div
      class="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl w-full {maxWidth} {maxHeight} overflow-hidden flex flex-col"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <!-- Header -->
      {#if title || showCloseButton}
        <div class="flex justify-between items-center p-6 border-b border-white/20">
          {#if title}
            <h2 class="text-xl font-bold text-white">{title}</h2>
          {:else}
            <div></div>
          {/if}
          
          {#if showCloseButton}
            <button
              on:click="{close}"
              class="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
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
      <div class="flex-1 overflow-y-auto">
        <slot />
      </div>

      <!-- Footer -->
      <slot name="footer" />
    </div>
  </div>
{/if}
