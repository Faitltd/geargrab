<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { searchService, type SearchSuggestion } from '$lib/services/search';
  import SearchInput from './search-input.svelte';
  import SearchSuggestions from './search-suggestions.svelte';

  export let query: string = '';
  export let category: string = '';
  export let location: string = '';

  const dispatch = createEventDispatcher();

  let selectedQuery = query;
  let selectedCategory = category;
  let selectedLocation = location;
  let suggestions: SearchSuggestion[] = [];
  let showSuggestions = false;

  onMount(() => {
    loadInitialSuggestions();
  });

  async function loadInitialSuggestions() {
    suggestions = searchService.generateSuggestions();
  }

  async function handleQueryInput(event: CustomEvent) {
    selectedQuery = event.detail.value;
    
    if (selectedQuery.length >= 2) {
      suggestions = searchService.generateSuggestions(selectedQuery);
      showSuggestions = true;
    } else {
      await loadInitialSuggestions();
      showSuggestions = selectedQuery.length === 0;
    }
  }

  function handleQueryFocus() {
    if (suggestions.length > 0) {
      showSuggestions = true;
    }
  }

  function handleQueryBlur() {
    showSuggestions = false;
  }

  function handleSuggestionSelect(event: CustomEvent) {
    const suggestion = event.detail;
    
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
    const searchData = {
      query: selectedQuery,
      category: selectedCategory,
      location: selectedLocation
    };

    // Dispatch search event for parent components
    dispatch('search', searchData);

    // Navigate to browse page with search parameters
    navigateToResults(searchData);
  }

  function navigateToResults(searchData: { query: string; category: string; location: string }) {
    const params = new URLSearchParams();
    if (searchData.query) params.set('q', searchData.query);
    if (searchData.category) params.set('category', searchData.category);
    if (searchData.location) params.set('location', searchData.location);

    goto(`/browse?${params.toString()}`);
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    handleSearch();
  }
</script>

<form on:submit="{handleSubmit}" class="w-full">
  <div class="flex flex-col gap-3 items-center">
    <!-- Search Input with Autocomplete -->
    <div class="w-full relative z-[100]">
      <SearchInput
        bind:value="{selectedQuery}"
        placeholder="What gear do you need?"
        on:input="{handleQueryInput}"
        on:focus="{handleQueryFocus}"
        on:blur="{handleQueryBlur}"
      />

      <SearchSuggestions
        {suggestions}
        show="{showSuggestions}"
        on:select="{handleSuggestionSelect}"
      />
    </div>

    <!-- Location Input -->
    <div class="w-full">
      <input
        type="text"
        bind:value="{selectedLocation}"
        placeholder="Where?"
        class="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-300 text-sm md:text-base transition-colors duration-200"
        style="background-color: rgba(31, 41, 55, 0.7) !important; border-color: rgb(75, 85, 99) !important; color: white !important;"
      />
    </div>

    <!-- Search Button -->
    <div class="w-full">
      <button
        type="submit"
        class="w-full bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
      >
        Search Gear
      </button>
    </div>
  </div>
</form>
