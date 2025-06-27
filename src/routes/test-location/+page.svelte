<script lang="ts">
  import { onMount } from 'svelte';
  import { locationSearchService, userLocation, locationPermission, mapLoaded } from '$lib/services/location-search';

  let testResults = {
    apiKeyLoaded: false,
    mapLoaded: false,
    geolocationSupported: false,
    userLocationObtained: false,
    geocodingWorking: false,
    reverseGeocodingWorking: false,
    locationSearchWorking: false
  };

  let testAddress = 'Denver, CO';
  let testLat = 39.7392;
  let testLng = -104.9903;
  let geocodeResult = '';
  let reverseGeocodeResult = '';
  let searchResults = [];
  let currentLocation = null;
  let permissionStatus = 'unknown';

  onMount(async () => {
    await runLocationTests();
  });

  async function runLocationTests() {
    console.log('🧪 Starting location services tests...');

    // Test 1: Check if API key is configured
    testResults.apiKeyLoaded = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && 
                               import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'your-google-maps-api-key';
    
    // Test 2: Check if Google Maps loaded
    mapLoaded.subscribe(loaded => {
      testResults.mapLoaded = loaded;
    });

    // Test 3: Check geolocation support
    testResults.geolocationSupported = 'geolocation' in navigator;

    // Test 4: Check user location
    userLocation.subscribe(location => {
      if (location) {
        testResults.userLocationObtained = true;
        currentLocation = location;
      }
    });

    // Test 5: Check permission status
    locationPermission.subscribe(permission => {
      permissionStatus = permission;
    });

    // Wait a bit for async operations
    setTimeout(async () => {
      await testGeocoding();
      await testReverseGeocoding();
      await testLocationSearch();
    }, 2000);
  }

  async function testGeocoding() {
    try {
      const result = await locationSearchService.geocodeAddress(testAddress);
      if (result) {
        testResults.geocodingWorking = true;
        geocodeResult = `${result.lat}, ${result.lng}`;
      }
    } catch (error) {
      console.error('Geocoding test failed:', error);
      geocodeResult = 'Failed: ' + error.message;
    }
  }

  async function testReverseGeocoding() {
    try {
      const result = await locationSearchService.reverseGeocode(testLat, testLng);
      if (result) {
        testResults.reverseGeocodingWorking = true;
        reverseGeocodeResult = result;
      }
    } catch (error) {
      console.error('Reverse geocoding test failed:', error);
      reverseGeocodeResult = 'Failed: ' + error.message;
    }
  }

  async function testLocationSearch() {
    try {
      const filters = {
        location: { lat: testLat, lng: testLng },
        radius: 50,
        category: '',
        priceMin: 0,
        priceMax: 1000,
        sortBy: 'distance'
      };

      const results = await locationSearchService.searchByLocation(filters);
      if (results && results.results) {
        testResults.locationSearchWorking = true;
        searchResults = results.results.slice(0, 3); // Show first 3 results
      }
    } catch (error) {
      console.error('Location search test failed:', error);
    }
  }

  async function requestLocation() {
    const location = await locationSearchService.requestUserLocation();
    if (location) {
      currentLocation = location;
      testResults.userLocationObtained = true;
    }
  }

  function getStatusIcon(status) {
    return status ? '✅' : '❌';
  }

  function getStatusText(status) {
    return status ? 'Working' : 'Failed';
  }
</script>

<svelte:head>
  <title>Location Services Test - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h1 class="text-3xl font-bold text-white mb-6">Location Services Test</h1>
      
      <!-- Test Results Summary -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="bg-white/5 rounded-lg p-4">
          <h2 class="text-lg font-semibold text-white mb-4">Core Services</h2>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-gray-300">Google Maps API Key</span>
              <span class="text-sm">{getStatusIcon(testResults.apiKeyLoaded)} {getStatusText(testResults.apiKeyLoaded)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-300">Google Maps Loaded</span>
              <span class="text-sm">{getStatusIcon(testResults.mapLoaded)} {getStatusText(testResults.mapLoaded)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-300">Geolocation Support</span>
              <span class="text-sm">{getStatusIcon(testResults.geolocationSupported)} {getStatusText(testResults.geolocationSupported)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-300">User Location</span>
              <span class="text-sm">{getStatusIcon(testResults.userLocationObtained)} {getStatusText(testResults.userLocationObtained)}</span>
            </div>
          </div>
        </div>

        <div class="bg-white/5 rounded-lg p-4">
          <h2 class="text-lg font-semibold text-white mb-4">Advanced Features</h2>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-gray-300">Geocoding</span>
              <span class="text-sm">{getStatusIcon(testResults.geocodingWorking)} {getStatusText(testResults.geocodingWorking)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-300">Reverse Geocoding</span>
              <span class="text-sm">{getStatusIcon(testResults.reverseGeocodingWorking)} {getStatusText(testResults.reverseGeocodingWorking)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-300">Location Search</span>
              <span class="text-sm">{getStatusIcon(testResults.locationSearchWorking)} {getStatusText(testResults.locationSearchWorking)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-300">Permission Status</span>
              <span class="text-sm text-gray-400">{permissionStatus}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Location -->
      {#if currentLocation}
        <div class="bg-white/5 rounded-lg p-4 mb-6">
          <h3 class="text-lg font-semibold text-white mb-2">Current Location</h3>
          <p class="text-gray-300">Latitude: {currentLocation.lat}</p>
          <p class="text-gray-300">Longitude: {currentLocation.lng}</p>
        </div>
      {:else}
        <div class="bg-white/5 rounded-lg p-4 mb-6">
          <h3 class="text-lg font-semibold text-white mb-2">Location Access</h3>
          <p class="text-gray-300 mb-4">Location not available. Click to request access:</p>
          <button
            on:click={requestLocation}
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Request Location Access
          </button>
        </div>
      {/if}

      <!-- Test Results Details -->
      <div class="space-y-6">
        
        <!-- Geocoding Test -->
        <div class="bg-white/5 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-white mb-2">Geocoding Test</h3>
          <p class="text-gray-300 mb-2">Address: {testAddress}</p>
          <p class="text-gray-300">Result: {geocodeResult || 'Testing...'}</p>
        </div>

        <!-- Reverse Geocoding Test -->
        <div class="bg-white/5 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-white mb-2">Reverse Geocoding Test</h3>
          <p class="text-gray-300 mb-2">Coordinates: {testLat}, {testLng}</p>
          <p class="text-gray-300">Result: {reverseGeocodeResult || 'Testing...'}</p>
        </div>

        <!-- Location Search Test -->
        <div class="bg-white/5 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-white mb-2">Location Search Test</h3>
          <p class="text-gray-300 mb-4">Searching within 50km of Denver, CO</p>
          {#if searchResults.length > 0}
            <div class="space-y-2">
              {#each searchResults as result}
                <div class="bg-white/5 rounded p-3">
                  <h4 class="font-medium text-white">{result.title}</h4>
                  <p class="text-sm text-gray-300">${result.dailyPrice}/day • {result.distance}km away</p>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-gray-400">No results found or still testing...</p>
          {/if}
        </div>

      </div>

      <!-- Actions -->
      <div class="mt-8 flex space-x-4">
        <button
          on:click={runLocationTests}
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Re-run Tests
        </button>
        <a
          href="/search/map"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors inline-block"
        >
          Try Map Search
        </a>
      </div>

    </div>
  </div>
</div>
