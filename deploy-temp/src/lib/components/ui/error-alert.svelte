<script lang="ts">
  export let error: string = '';
  export let title: string = 'Error';
  export let dismissible: boolean = false;
  export let className: string = '';

  let visible = true;

  function dismiss() {
    if (dismissible) {
      visible = false;
    }
  }

  // Reset visibility when error changes
  $: if (error) {
    visible = true;
  }
</script>

{#if error && visible}
  <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 {className}">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <h3 class="text-sm font-medium text-red-200">
          {title}
        </h3>
        <div class="mt-1 text-sm text-red-300">
          {error}
        </div>
      </div>
      {#if dismissible}
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button
              type="button"
              class="inline-flex rounded-md p-1.5 text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              on:click="{dismiss}"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
