<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import PillToggle from '$lib/components/ui/PillToggle.svelte';
  import { getCurrentLocation, formatDistance, type Coordinates } from '$lib/utils/geolocation';
  
  export let enabled = false;
  export let radiusMiles = 25;
  export let loading = false;
  export let userLocation: Coordinates | null = null;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const dispatch = createEventDispatcher<{
    change: { enabled: boolean; location: Coordinates | null; radius: number };
    locationError: { error: string };
  }>();
  
  let locationLoading = false;
  let locationError = '';
  
  // Radius options
  const radiusOptions = [
    { value: 5, label: '5 mi' },
    { value: 10, label: '10 mi' },
    { value: 25, label: '25 mi' },
    { value: 50, label: '50 mi' },
    { value: 100, label: '100 mi' }
  ];
  
  // Location icon SVG
  const locationIcon = `
    <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  `;
  
  const handleToggleChange = async (event: CustomEvent) => {
    const { checked } = event.detail;
    
    if (checked && !userLocation) {
      // Need to get user location first
      await requestLocation();
    } else {
      enabled = checked;
      dispatchChange();
    }
  };
  
  const requestLocation = async () => {
    locationLoading = true;
    locationError = '';
    
    try {
      userLocation = await getCurrentLocation();
      enabled = true;
      dispatchChange();
    } catch (error: any) {
      locationError = error.message;
      enabled = false;
      dispatch('locationError', { error: error.message });
    } finally {
      locationLoading = false;
    }
  };
  
  const handleRadiusChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    radiusMiles = parseInt(target.value);
    
    if (enabled) {
      dispatchChange();
    }
  };
  
  const dispatchChange = () => {
    dispatch('change', {
      enabled,
      location: userLocation,
      radius: radiusMiles
    });
  };
  
  // Get display text for the toggle
  $: toggleText = enabled && userLocation 
    ? `Nearby (${formatDistance(radiusMiles)})`
    : 'Nearby';
</script>

<div class="flex items-center space-x-3">
  <!-- Proximity Toggle -->
  <PillToggle
    checked={enabled}
    {loading}
    {size}
    variant="primary"
    icon={locationIcon}
    on:change={handleToggleChange}
  >
    {toggleText}
  </PillToggle>
  
  <!-- Radius Selector (when enabled) -->
  {#if enabled}
    <div class="relative">
      <label class="sr-only" for="radius-select">Search radius</label>
      <select
        id="radius-select"
        bind:value={radiusMiles}
        on:change={handleRadiusChange}
        disabled={loading || locationLoading}
        class="
          px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white 
          hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
          disabled:bg-neutral-100 disabled:cursor-not-allowed transition-colors
          appearance-none cursor-pointer pr-8
        "
        style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 5%22%3E%3Cpath fill=%22%2523666%22 d=%22M2 0L0 2h4zm0 5L0 3h4z%22/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 8px center; background-size: 12px;"
      >
        {#each radiusOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
  {/if}
  
  <!-- Location Status -->
  {#if locationLoading}
    <div class="flex items-center space-x-2 text-sm text-neutral-600">
      <div class="w-4 h-4 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin"></div>
      <span>Getting location...</span>
    </div>
  {:else if locationError}
    <div class="flex items-center space-x-2 text-sm text-red-600">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>Location unavailable</span>
    </div>
  {:else if enabled && userLocation}
    <div class="flex items-center space-x-2 text-sm text-green-600">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>Location found</span>
    </div>
  {/if}
</div>

<!-- Location Permission Help -->
{#if locationError}
  <div class="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
    <div class="flex items-start space-x-2">
      <svg class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="text-sm">
        <p class="font-medium text-amber-800 mb-1">Location access needed</p>
        <p class="text-amber-700">
          To find gear near you, please allow location access in your browser settings and try again.
        </p>
        <button
          on:click={requestLocation}
          class="mt-2 text-primary-600 hover:text-primary-700 font-medium underline"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
{/if}
