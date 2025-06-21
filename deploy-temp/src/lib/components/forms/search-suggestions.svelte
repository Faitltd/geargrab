<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SearchSuggestionsProps, SearchSuggestion } from '$lib/types/components';

  // Props with TypeScript interface
  export let suggestions: SearchSuggestionsProps['suggestions'] = [];
  export let show: SearchSuggestionsProps['show'] = false;
  export let maxHeight: SearchSuggestionsProps['maxHeight'] = '16rem';
  export let className: SearchSuggestionsProps['className'] = '';

  const dispatch = createEventDispatcher<{
    select: SearchSuggestion;
  }>();

  function selectSuggestion(suggestion: SearchSuggestion) {
    dispatch('select', suggestion);
  }

  function getSuggestionIcon(type: string): string {
    switch (type) {
      case 'category': return '📂';
      case 'feature': return '⭐';
      case 'location': return '📍';
      case 'brand': return '🏷️';
      default: return '🔍';
    }
  }
</script>

{#if show && suggestions.length > 0}
  <div
    class="absolute top-full left-0 right-0 mt-1 bg-gray-800 backdrop-blur-md border border-gray-600 rounded-lg shadow-xl overflow-y-auto z-50 {className}"
    style="max-height: {maxHeight};"
  >
    {#each suggestions as suggestion}
      <button
        type="button"
        class="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-b-0 flex items-center justify-between"
        on:click={() => selectSuggestion(suggestion)}
      >
        <div class="flex items-center space-x-3">
          <span class="text-gray-400 text-sm">
            {getSuggestionIcon(suggestion.type)}
          </span>
          <span class="text-white">{suggestion.text}</span>
        </div>
        {#if suggestion.count}
          <span class="text-gray-400 text-sm">{suggestion.count} items</span>
        {/if}
      </button>
    {/each}
  </div>
{/if}
