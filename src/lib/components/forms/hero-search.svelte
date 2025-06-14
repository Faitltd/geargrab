<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import SearchForm from './search-form.svelte';

  const dispatch = createEventDispatcher();

  export let query = '';
  export let category = '';
  export let location = '';

  function handleSearch(event: CustomEvent) {
    // Forward the search event to parent components
    dispatch('search', event.detail);
  }
</script>

<!-- Enhanced Search Form with Autocomplete -->
<SearchForm
  {query}
  {category}
  {location}
  on:search={handleSearch}
/>