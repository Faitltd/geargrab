<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { locationSearchService } from '$lib/services/location-search';

  export let value = '';
  export let placeholder = 'Enter location...';
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    select: { name; lat; lng: number };
    input;
  }>();

  let inputElement: HTMLInputElement;
  let suggestions: Array<{ name; lat; lng: number }> = [];
  let showSuggestions = false;
  let selectedIndex = -1;
  let loading = false;
  let debounceTimer;

  onMount(() => {
    // Initialize location service if needed
    if (!locationSearchService.isLoaded) {
      locationSearchService.initialize?.();
    }
  });

  onDestroy(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  async function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    
    dispatch('input', value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Reset suggestions if input is empty
    if (!value.trim()) {
      suggestions = [];
      showSuggestions = false;
      return;
    }

    // Debounce the search
    debounceTimer = setTimeout(async () => {
      await searchLocations(value);
    }, 300);
  }

  async function searchLocations(query) {
    if (!query.trim() || query.length < 2) {
      suggestions = [];
      showSuggestions = false;
      return;
    }

    loading = true;
    try {
      // Use the location search service to get suggestions
      const results = await locationSearchService.getLocationSuggestions(query);
      suggestions = results;
      showSuggestions = suggestions.length > 0;
      selectedIndex = -1;
    } catch (error) {
      console.error('Error searching locations:', error);
      suggestions = [];
      showSuggestions = false;
    } finally {
      loading = false;
    }
  }

  function selectSuggestion(suggestion: { name; lat; lng: number }) {
    value = suggestion.name;
    suggestions = [];
    showSuggestions = false;
    selectedIndex = -1;
    
    dispatch('select', suggestion);
    
    // Blur the input to hide mobile keyboard
    if (inputElement) {
      inputElement.blur();
    }
  }

  function handleKeydown(event) {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        suggestions = [];
        showSuggestions = false;
        selectedIndex = -1;
        inputElement?.blur();
        break;
    }
  }

  function handleBlur() {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      showSuggestions = false;
      selectedIndex = -1;
    }, 150);
  }

  function handleFocus() {
    if (suggestions.length > 0) {
      showSuggestions = true;
    }
  }

  async function getCurrentLocation() {
    try {
      loading = true;
      const location = await locationSearchService.requestUserLocation();
      
      if (location) {
        // Reverse geocode to get address
        const address = await locationSearchService.reverseGeocode(location.lat, location.lng);
        if (address) {
          value = address;
          dispatch('select', {
            name: address,
            lat: location.lat,
            lng: location.lng
          });
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      loading = false;
    }
  }
</script>

<div class="location-autocomplete">
  <div class="input-container">
    <input
      bind:this={inputElement}
      bind:value={value}
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:blur={handleBlur}
      on:focus={handleFocus}
      {placeholder}
      {disabled}
      class="location-input"
      autocomplete="off"
      spellcheck="false"
    />
    
    <!-- Loading indicator -->
    {#if loading}
      <div class="loading-indicator">
        <div class="spinner"></div>
      </div>
    {:else}
      <!-- Current location button -->
      <button
        type="button"
        on:click={getCurrentLocation}
        class="location-button"
        title="Use current location"
        {disabled}
      >
        <svg class="location-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    {/if}
  </div>

  <!-- Suggestions dropdown -->
  {#if showSuggestions && suggestions.length > 0}
    <div class="suggestions-dropdown">
      {#each suggestions as suggestion, index}
        <button
          type="button"
          class="suggestion-item {index === selectedIndex ? 'selected' : ''}"
          on:click={() => selectSuggestion(suggestion)}
        >
          <div class="suggestion-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div class="suggestion-content">
            <div class="suggestion-name">{suggestion.name}</div>
          </div>
        </button>
      {/each}
    </div>
  {/if}

  <!-- No results message -->
  {#if showSuggestions && suggestions.length === 0 && !loading && value.length >= 2}
    <div class="no-results">
      <div class="no-results-icon">📍</div>
      <div class="no-results-text">No locations found</div>
    </div>
  {/if}
</div>

<style>
  .location-autocomplete {
    position: relative;
    width: 100%;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .location-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.75rem 3rem 0.75rem 1rem;
    color: white;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .location-input:focus {
    outline: none;
    border-color: #10b981;
    background: rgba(255, 255, 255, 0.15);
  }

  .location-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .location-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-indicator {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .location-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 0.375rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .location-button:hover:not(:disabled) {
    color: #10b981;
    background: rgba(255, 255, 255, 0.1);
  }

  .location-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .location-icon {
    width: 1rem;
    height: 1rem;
  }

  .suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    margin-top: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
    z-index: 50;
    backdrop-filter: blur(10px);
  }

  .suggestion-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    color: white;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .suggestion-item:last-child {
    border-bottom: none;
  }

  .suggestion-item:hover,
  .suggestion-item.selected {
    background: rgba(16, 185, 129, 0.2);
  }

  .suggestion-icon {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .suggestion-content {
    flex: 1;
    min-width: 0;
  }

  .suggestion-name {
    font-size: 0.875rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .no-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    margin-top: 0.25rem;
    padding: 1rem;
    text-align: center;
    z-index: 50;
    backdrop-filter: blur(10px);
  }

  .no-results-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .no-results-text {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Scrollbar styling for suggestions */
  .suggestions-dropdown::-webkit-scrollbar {
    width: 6px;
  }

  .suggestions-dropdown::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .suggestions-dropdown::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  .suggestions-dropdown::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .suggestions-dropdown {
      max-height: 150px;
    }

    .suggestion-item {
      padding: 1rem;
    }

    .location-input {
      font-size: 1rem; /* Prevent zoom on iOS */
    }
  }
</style>
