<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let placeholder = 'Search FAQ...';
  export let value = '';

  const dispatch = createEventDispatcher();

  let searchInput: HTMLInputElement;
  let focused = false;

  function handleInput() {
    dispatch('search', {
      query: value
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      value = '';
      searchInput.blur();
      handleInput();
    }
  }

  function clearSearch() {
    value = '';
    searchInput.focus();
    handleInput();
  }

  function handleFocus() {
    focused = true;
  }

  function handleBlur() {
    focused = false;
  }
</script>

<div class="relative">
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-200 {focused ? 'ring-2 ring-green-400 border-transparent' : ''}">
    <div class="flex items-center p-4">
      <!-- Search Icon -->
      <div class="flex-shrink-0 mr-3">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>

      <!-- Search Input -->
      <input
        bind:this={searchInput}
        bind:value
        on:input={handleInput}
        on:keydown={handleKeydown}
        on:focus={handleFocus}
        on:blur={handleBlur}
        type="text"
        {placeholder}
        class="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
      />

      <!-- Clear Button -->
      {#if value}
        <button
          on:click={clearSearch}
          class="flex-shrink-0 ml-3 p-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Search Suggestions (if needed in the future) -->
  {#if focused && value.length > 0}
    <div class="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg z-50">
      <!-- Placeholder for search suggestions -->
    </div>
  {/if}
</div>

<style>
  /* Custom styles for search input */
  input::placeholder {
    opacity: 0.7;
  }
  
  input:focus::placeholder {
    opacity: 0.5;
  }
</style>
