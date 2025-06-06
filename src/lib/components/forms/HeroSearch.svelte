<script lang="ts">
  import { goto } from '$app/navigation';
  import { createEventDispatcher, onMount } from 'svelte';
  import { searchService, type SearchSuggestion } from '$lib/services/search';

  const dispatch = createEventDispatcher();

  export let query = '';
  export let category = '';
  export let location = '';

  let selectedLocation = location;
  let selectedQuery = query;
  let selectedCategory = category;
  let suggestions: SearchSuggestion[] = [];
  let showSuggestions = false;
  let searchTimeout: NodeJS.Timeout;
  let searchInput: HTMLInputElement;

  onMount(() => {
    loadInitialSuggestions();
  });

  async function loadInitialSuggestions() {
    suggestions = searchService.generateSuggestions();
  }

  async function handleQueryInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      if (selectedQuery.length >= 2) {
        suggestions = searchService.generateSuggestions(selectedQuery);
        showSuggestions = true;
      } else {
        await loadInitialSuggestions();
        showSuggestions = selectedQuery.length === 0;
      }
    }, 300);
  }

  function selectSuggestion(suggestion: SearchSuggestion) {
    if (suggestion.type === 'category') {
      selectedCategory = suggestion.text.toLowerCase().replace(/\s+/g, '_');
      selectedQuery = '';
    } else {
      selectedQuery = suggestion.text;
    }
    showSuggestions = false;
    handleSearch();
  }

  function handleSearch() {
    // Dispatch search event for parent components
    dispatch('search', {
      query: selectedQuery,
      category: selectedCategory,
      location: selectedLocation
    });

    // Navigate to browse page with search parameters
    const params = new URLSearchParams();
    if (selectedQuery) params.set('q', selectedQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedLocation) params.set('location', selectedLocation);

    goto(`/browse?${params.toString()}`);
  }

  function handleFocus() {
    if (suggestions.length > 0) {
      showSuggestions = true;
    }
  }

  function handleBlur() {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      showSuggestions = false;
    }, 200);
  }
</script>

<!-- Enhanced Search Form with Autocomplete -->
<form on:submit|preventDefault={handleSearch} class="w-full">
  <div class="flex flex-col md:flex-row gap-3 items-center md:items-end">
    <!-- Search Input with Autocomplete -->
    <div class="w-full md:flex-1 relative">
      <input
        bind:this={searchInput}
        type="text"
        bind:value={selectedQuery}
        on:input={handleQueryInput}
        on:focus={handleFocus}
        on:blur={handleBlur}
        placeholder="What gear do you need?"
        class="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-300"
        autocomplete="off"
      />

      <!-- Search Suggestions Dropdown -->
      {#if showSuggestions && suggestions.length > 0}
        <div class="absolute top-full left-0 right-0 mt-1 bg-gray-800 backdrop-blur-md border border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {#each suggestions as suggestion}
            <button
              type="button"
              class="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-b-0 flex items-center justify-between"
              on:click={() => selectSuggestion(suggestion)}
            >
              <div class="flex items-center space-x-3">
                <span class="text-gray-400 text-sm">
                  {#if suggestion.type === 'category'}
                    📂
                  {:else if suggestion.type === 'feature'}
                    ⭐
                  {:else if suggestion.type === 'location'}
                    📍
                  {:else}
                    🔍
                  {/if}
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
    </div>

    <!-- Location Input -->
    <div class="w-full md:flex-1">
      <input
        type="text"
        bind:value={selectedLocation}
        placeholder="Where?"
        class="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-300"
      />
    </div>

    <!-- Search Button -->
    <div class="w-full md:w-auto">
      <button
        type="submit"
        class="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition-colors whitespace-nowrap"
      >
        Search Gear
      </button>
    </div>
  </div>
</form>