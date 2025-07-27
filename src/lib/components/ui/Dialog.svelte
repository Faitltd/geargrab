<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { cn } from '$lib/utils.js';

  export let open = false;
  export let className = '';

  const dispatch = createEventDispatcher();

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      open = false;
      dispatch('openChange', false);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      open = false;
      dispatch('openChange', false);
    }
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-black/80"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
  >
    <!-- Dialog Content -->
    <div
      class={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
        className
      )}
      {...$$restProps}
    >
      <slot />
    </div>
  </div>
{/if}
