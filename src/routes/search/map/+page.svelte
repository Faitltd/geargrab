<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { locationSearchService, userLocation, mapLoaded, type SearchFilters, type SearchResult } from '$lib/services/location-search';
  import InteractiveMap from '$lib/components/search/interactive-map.svelte';
  import AdvancedSearch from '$lib/components/search/advanced-search.svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import UniverseCard from '$lib/components/cards/universe-card.svelte';

  let searchResults: SearchResult[] = [];
  let loading = false;
  let showFilters = true;
  let showList = true;
  let mapCenter: { lat: number; lng: number } | null = null;
  let selectedResult: SearchResult | null = null;
  let totalCount = 0;

  // Search state
  let currentFilters: SearchFilters = {
    location: null,
    radius: 25,
    category: '',
    priceMin: 0,
    priceMax: 500,
    availableFrom: '',
    availableTo: '',
    sortBy: 'distance'
  };

  onMount(async () => {
    // Get initial search parameters from URL
    const urlParams = $page.url.searchParams;
    const lat = parseFloat(urlParams.get('lat') || '0');
    const lng = parseFloat(urlParams.get('lng') || '0');
    const radius = parseFloat(urlParams.get('radius') || '25');
    const category = urlParams.get('category') || '';

    if (lat && lng) {
      currentFilters.location = { lat, lng };
      currentFilters.radius = radius;
      currentFilters.category = category;
      mapCenter = { lat, lng };
      await performLocationSearch();
    } else {
      // Try to get user's current location
      await requestUserLocation();
    }
  });

  async function requestUserLocation() {
    const location = await locationSearchService.requestUserLocation();
    if (location) {
      currentFilters.location = location;
      mapCenter = location;
      await performLocationSearch();
    }
  }

  async function performLocationSearch() {
    if (!currentFilters.location) {
      console.warn('No location set for search');
      return;
    }

    loading = true;
    try {
      const results = await locationSearchService.searchByLocation(currentFilters);
      searchResults = results.results;
      totalCount = results.total;

      // Update URL with search parameters
      updateURL();
      
      console.log(`✅ Found ${searchResults.length} results`);
    } catch (error) {
      console.error('Location search error:', error);
      searchResults = [];
      totalCount = 0;
    } finally {
      loading = false;
    }
  }

  function updateURL() {
    if (!currentFilters.location) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('lat', currentFilters.location.lat.toString());
    url.searchParams.set('lng', currentFilters.location.lng.toString());
    url.searchParams.set('radius', currentFilters.radius?.toString() || '25');
    
    if (currentFilters.category) {
      url.searchParams.set('category', currentFilters.category);
    } else {
      url.searchParams.delete('category');
    }
    
    goto(url.pathname + url.search, { replaceState: true });
  }

  function handleSearch(event: CustomEvent<SearchFilters>) {
    currentFilters = { ...event.detail };
    performLocationSearch();
  }

  function handleLocationChange(event: CustomEvent<{ lat: number; lng: number; name: string }>) {
    const { lat, lng } = event.detail;
    mapCenter = { lat, lng };
    currentFilters.location = { lat, lng };
    performLocationSearch();
  }

  function handleMarkerClick(result: SearchResult) {
    selectedResult = result;
    // Scroll to the result in the list if it's visible
    if (showList) {
      const element = document.getElementById(`result-${result.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function handleCardClick(result: SearchResult) {
    goto(`/listing/${result.id}`);
  }

  function toggleView(view: 'map' | 'list' | 'both') {
    switch (view) {
      case 'map':
        showList = false;
        break;
      case 'list':
        showList = true;
        break;
      case 'both':
        showList = true;
        break;
    }
  }
</script>

<svelte:head>
  <title>Map Search - GearGrab</title>
  <meta name="description" content="Search for outdoor gear rentals on an interactive map. Find camping, hiking, and adventure equipment near you." />
</svelte:head>

<!-- Background -->
<VideoBackground
  videoSrc="/857136-hd_1280_720_24fps.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity={0.3}
/>

<!-- Main Content -->
<div class="relative z-10 min-h-screen">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-white">Map Search</h1>
          <p class="text-gray-300 mt-1">
            {loading ? 'Searching...' : `${totalCount} items found`}
            {currentFilters.location && ` within ${currentFilters.radius}km`}
          </p>
        </div>
        
        <!-- View Toggle -->
        <div class="flex bg-white/10 rounded-lg p-1">
          <button
            on:click={() => toggleView('map')}
            class="px-3 py-2 rounded text-sm font-medium transition-colors {!showList ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}"
          >
            Map Only
          </button>
          <button
            on:click={() => toggleView('both')}
            class="px-3 py-2 rounded text-sm font-medium transition-colors {showList ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}"
          >
            Map + List
          </button>
        </div>
      </div>

      <!-- Filters Toggle -->
      <button
        on:click={() => showFilters = !showFilters}
        class="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white transition-colors flex items-center space-x-2"
      >
        <span>Search Filters</span>
        <svg class="w-4 h-4 transform {showFilters ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>

    <!-- Search Filters -->
    {#if showFilters}
      <div class="mb-6">
        <AdvancedSearch
          on:search={handleSearch}
          on:locationChange={handleLocationChange}
        />
      </div>
    {/if}

    <!-- Main Content Area -->
    <div class="grid {showList ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6 h-[calc(100vh-300px)]">
      
      <!-- Map -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        <InteractiveMap
          {searchResults}
          center={mapCenter}
          zoom={12}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      <!-- Results List -->
      {#if showList}
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
          <div class="p-4 border-b border-white/20">
            <h2 class="text-lg font-semibold text-white">Search Results</h2>
          </div>
          
          <div class="overflow-y-auto h-full p-4 space-y-4">
            {#if loading}
              <div class="flex items-center justify-center py-8">
                <div class="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
              </div>
            {:else if searchResults.length === 0}
              <div class="text-center py-8">
                <div class="text-gray-400 mb-2">🔍</div>
                <h3 class="text-lg font-medium text-white">No gear found</h3>
                <p class="text-gray-300">Try adjusting your search location or filters</p>
              </div>
            {:else}
              {#each searchResults as result}
                <div
                  id="result-{result.id}"
                  class="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer {selectedResult?.id === result.id ? 'ring-2 ring-green-500' : ''}"
                  on:click={() => handleCardClick(result)}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && handleCardClick(result)}
                >
                  <div class="flex space-x-4">
                    <img
                      src={result.images[0] || '/placeholder-gear.jpg'}
                      alt={result.title}
                      class="w-20 h-20 object-cover rounded-lg"
                    />
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-white truncate">{result.title}</h3>
                      <p class="text-sm text-gray-300 mt-1">${result.dailyPrice}/day</p>
                      <p class="text-xs text-gray-400 mt-1">{result.distance}km away</p>
                      <div class="flex items-center mt-2">
                        <div class="flex items-center">
                          {'★'.repeat(Math.floor(result.owner.rating))}{'☆'.repeat(5 - Math.floor(result.owner.rating))}
                        </div>
                        <span class="text-xs text-gray-400 ml-1">({result.totalReviews})</span>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>

  </div>
</div>
