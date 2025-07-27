<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import SearchFilters from '../../lib/components/search/SearchFilters.svelte';

  let gearItems = [];
  let loading = false;
  let error = null;
  let totalItems = 0;
  let currentPage = 1;
  let totalPages = 0;
  const itemsPerPage = 20;

  // Initialize filters from URL params
  let filters = {
    query: $page.url.searchParams.get('q') || '',
    category: $page.url.searchParams.get('category') || '',
    subcategory: $page.url.searchParams.get('subcategory') || '',
    city: $page.url.searchParams.get('city') || '',
    state: $page.url.searchParams.get('state') || '',
    min_price: $page.url.searchParams.get('min_price') || '',
    max_price: $page.url.searchParams.get('max_price') || '',
    condition: $page.url.searchParams.get('condition') || '',
    brand: $page.url.searchParams.get('brand') || '',
    delivery_options: $page.url.searchParams.get('delivery_options')?.split(',') || [],
    instant_book: $page.url.searchParams.get('instant_book') === 'true',
    sort_by: $page.url.searchParams.get('sort_by') || 'created_at',
    latitude: $page.url.searchParams.get('latitude') ? parseFloat($page.url.searchParams.get('latitude')) : null,
    longitude: $page.url.searchParams.get('longitude') ? parseFloat($page.url.searchParams.get('longitude')) : null,
    radius: parseInt($page.url.searchParams.get('radius')) || 50
  };

  onMount(() => {
    searchGear();
  });

  async function searchGear(page = 1) {
    loading = true;
    error = null;

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.query) params.set('query', filters.query);
      if (filters.category) params.set('category', filters.category);
      if (filters.subcategory) params.set('subcategory', filters.subcategory);
      if (filters.city) params.set('city', filters.city);
      if (filters.state) params.set('state', filters.state);
      if (filters.min_price) params.set('min_price', filters.min_price);
      if (filters.max_price) params.set('max_price', filters.max_price);
      if (filters.condition) params.set('condition', filters.condition);
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.delivery_options.length > 0) params.set('delivery_options', filters.delivery_options.join(','));
      if (filters.instant_book) params.set('instant_book', 'true');
      if (filters.sort_by) params.set('sort_by', filters.sort_by);
      if (filters.latitude) params.set('latitude', filters.latitude.toString());
      if (filters.longitude) params.set('longitude', filters.longitude.toString());
      if (filters.radius) params.set('radius', filters.radius.toString());

      params.set('page', page.toString());
      params.set('limit', itemsPerPage.toString());

      // Update URL without triggering navigation
      const newUrl = `/browse?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);

      // Make API request
      const response = await fetch(`/api/gear_items?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to search gear');
      }

      const data = await response.json();

      gearItems = data.gear_items || [];
      totalItems = data.total || 0;
      currentPage = page;
      totalPages = Math.ceil(totalItems / itemsPerPage);

    } catch (err) {
      console.error('Search error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleSearch(event) {
    filters = event.detail;
    searchGear(1);
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= totalPages) {
      searchGear(newPage);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  function getImageUrl(images) {
    if (!images) return '/placeholder-gear.jpg';
    const imageArray = Array.isArray(images) ? images : JSON.parse(images || '[]');
    return imageArray.length > 0 ? imageArray[0] : '/placeholder-gear.jpg';
  }
</script>

<svelte:head>
  <title>Browse Gear - GearGrab</title>
  <meta name="description" content="Find and rent outdoor gear from fellow adventurers" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Browse Gear</h1>
      <p class="mt-2 text-lg text-gray-600">
        Find the perfect outdoor gear for your next adventure
      </p>
    </div>

    <!-- Search Filters -->
    <div class="mb-8">
      <SearchFilters {filters} on:search={handleSearch} />
    </div>

    <!-- Results Header -->
    <div class="flex justify-between items-center mb-6">
      <div class="text-sm text-gray-600">
        {#if loading}
          Searching...
        {:else if totalItems > 0}
          Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        {:else}
          No results found
        {/if}
      </div>
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <div class="ml-3">
            <p class="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Loading State -->
    {#if loading}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each Array(8) as _}
          <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div class="h-48 bg-gray-300"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-300 rounded mb-2"></div>
              <div class="h-3 bg-gray-300 rounded mb-2"></div>
              <div class="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if gearItems.length > 0}
      <!-- Gear Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each gearItems as item}
          <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <a href="/gear/{item.id}" class="block">
              <div class="aspect-w-4 aspect-h-3">
                <img
                  src={getImageUrl(item.images)}
                  alt={item.title}
                  class="w-full h-48 object-cover"
                  loading="lazy"
                />
              </div>

              <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                  {item.title}
                </h3>

                <p class="text-sm text-gray-600 mb-2">
                  {item.city}, {item.state}
                  {#if item.distance}
                    • {item.distance.toFixed(1)} mi away
                  {/if}
                </p>

                <div class="flex items-center justify-between">
                  <div class="text-lg font-bold text-green-600">
                    {formatPrice(item.daily_price)}/day
                  </div>

                  <div class="flex items-center text-sm text-gray-500">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    {item.rating || 'New'}
                  </div>
                </div>

                <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span class="capitalize">{item.condition}</span>
                  <span>{item.owner_name}</span>
                </div>
              </div>
            </a>
          </div>
        {/each}
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="mt-8 flex justify-center">
          <nav class="flex items-center space-x-2">
            <button
              on:click={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {#each Array(Math.min(5, totalPages)) as _, i}
              {@const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i}
              <button
                on:click={() => handlePageChange(pageNum)}
                class="px-3 py-2 border rounded-md text-sm font-medium {
                  pageNum === currentPage
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }"
              >
                {pageNum}
              </button>
            {/each}

            <button
              on:click={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      {/if}
    {:else}
      <!-- No Results -->
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">No gear found</h3>
        <p class="mt-1 text-gray-500">Try adjusting your search filters or browse all categories.</p>
        <div class="mt-4">
          <button
            on:click={() => {
              filters = { ...filters, query: '', category: '', subcategory: '', city: '', state: '', min_price: '', max_price: '', condition: '', brand: '', delivery_options: [], instant_book: false };
              searchGear(1);
            }}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Clear Filters
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
