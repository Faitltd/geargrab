<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { locationSearchService, mapLoaded, userLocation } from '$lib/services/location-search';
  import type { SearchResult } from '$lib/services/location-search';
  
  export let searchResults: SearchResult[] = [];
  export let center: { lat: number; lng: number } | null = null;
  export let zoom: number = 12;
  export let onMarkerClick: (result: SearchResult) => void = () => {};
  
  let mapContainer: HTMLElement;
  let map: google.maps.Map | null = null;
  let markers: google.maps.Marker[] = [];
  let infoWindow: google.maps.InfoWindow | null = null;
  let userMarker: google.maps.Marker | null = null;
  
  $: if (map && searchResults) {
    updateMarkers();
  }
  
  $: if (map && center) {
    map.setCenter(center);
  }
  
  onMount(async () => {
    // Wait for Google Maps to load
    if (!$mapLoaded) {
      const unsubscribe = mapLoaded.subscribe((loaded) => {
        if (loaded) {
          initializeMap();
          unsubscribe();
        }
      });
    } else {
      initializeMap();
    }
  });
  
  onDestroy(() => {
    cleanup();
  });
  
  function initializeMap() {
    if (!locationSearchService.isLoaded || !mapContainer) return;
    
    const mapCenter = center || $userLocation || { lat: 39.8283, lng: -98.5795 }; // Center of US
    
    map = new google.maps.Map(mapContainer, {
      center: mapCenter,
      zoom: zoom,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#1f2937' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#ffffff' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#1f2937' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#374151' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#1e40af' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true
    });
    
    // Create info window
    infoWindow = new google.maps.InfoWindow();
    
    // Add user location marker if available
    if ($userLocation) {
      addUserLocationMarker($userLocation);
    }
    
    // Add search result markers
    updateMarkers();
    
    console.log('✅ Interactive map initialized');
  }
  
  function addUserLocationMarker(location: { lat: number; lng: number }) {
    if (!map) return;
    
    // Remove existing user marker
    if (userMarker) {
      userMarker.setMap(null);
    }
    
    userMarker = new google.maps.Marker({
      position: location,
      map: map,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12)
      }
    });
  }
  
  function updateMarkers() {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // Add markers for search results
    searchResults.forEach((result, index) => {
      const marker = new google.maps.Marker({
        position: { lat: result.location.lat, lng: result.location.lng },
        map: map,
        title: result.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2C10.48 2 6 6.48 6 12C6 20 16 30 16 30S26 20 26 12C26 6.48 21.52 2 16 2Z" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
              <circle cx="16" cy="12" r="4" fill="#ffffff"/>
              <text x="16" y="16" text-anchor="middle" fill="#10b981" font-size="8" font-weight="bold">$${result.dailyPrice}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });
      
      // Add click listener
      marker.addListener('click', () => {
        showInfoWindow(marker, result);
        onMarkerClick(result);
      });
      
      markers.push(marker);
    });
    
    // Fit map to show all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      // Include user location in bounds
      if ($userLocation) {
        bounds.extend($userLocation);
      }
      
      // Include all markers
      markers.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      
      map.fitBounds(bounds);
      
      // Don't zoom in too much for single markers
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map!.getZoom()! > 15) {
          map!.setZoom(15);
        }
      });
    }
  }
  
  function showInfoWindow(marker: google.maps.Marker, result: SearchResult) {
    if (!infoWindow) return;
    
    const content = `
      <div class="p-3 max-w-xs">
        <div class="flex items-start space-x-3">
          <img src="${result.images[0] || '/placeholder-gear.jpg'}" 
               alt="${result.title}" 
               class="w-16 h-16 object-cover rounded-lg">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">${result.title}</h3>
            <p class="text-sm text-gray-600 mt-1">$${result.dailyPrice}/day</p>
            <p class="text-xs text-gray-500 mt-1">${result.distance}km away</p>
            <div class="flex items-center mt-2">
              <div class="flex items-center">
                ${'★'.repeat(Math.floor(result.owner.rating))}${'☆'.repeat(5 - Math.floor(result.owner.rating))}
              </div>
              <span class="text-xs text-gray-500 ml-1">(${result.totalReviews})</span>
            </div>
          </div>
        </div>
        <button onclick="window.location.href='/listing/${result.id}'" 
                class="w-full mt-3 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
          View Details
        </button>
      </div>
    `;
    
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
  }
  
  function cleanup() {
    if (markers) {
      markers.forEach(marker => marker.setMap(null));
    }
    if (userMarker) {
      userMarker.setMap(null);
    }
    if (infoWindow) {
      infoWindow.close();
    }
  }
  
  // Public methods
  export function centerOnLocation(location: { lat: number; lng: number }, zoom: number = 12) {
    if (map) {
      map.setCenter(location);
      map.setZoom(zoom);
    }
  }
  
  export function highlightMarker(resultId: string) {
    const index = searchResults.findIndex(r => r.id === resultId);
    if (index >= 0 && markers[index]) {
      // Trigger marker click
      google.maps.event.trigger(markers[index], 'click');
    }
  }
</script>

<div 
  bind:this={mapContainer}
  class="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
>
  {#if !$mapLoaded}
    <div class="w-full h-full bg-gray-800 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
        <p class="text-white">Loading map...</p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Ensure map container has proper dimensions */
  :global(.gm-style) {
    font-family: inherit !important;
  }
  
  :global(.gm-style-iw) {
    border-radius: 8px !important;
  }
  
  :global(.gm-style-iw-d) {
    overflow: hidden !important;
  }
</style>
