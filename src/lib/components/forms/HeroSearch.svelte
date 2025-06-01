<script lang="ts">
  import { goto } from '$app/navigation';

  let selectedLocation = '';
  let selectedQuery = '';

  function handleSearch() {
    // Navigate to browse page with search parameters
    const params = new URLSearchParams();
    if (selectedQuery) params.set('q', selectedQuery);
    if (selectedLocation) params.set('location', selectedLocation);

    goto(`/browse?${params.toString()}`);
  }
</script>

<!-- Simple Search Form for Hero Section -->
<form on:submit|preventDefault={handleSearch} class="w-full">
  <div class="flex flex-col md:flex-row gap-3 items-center md:items-end">
    <!-- Search Input -->
    <div class="w-full md:flex-1">
      <input
        type="text"
        bind:value={selectedQuery}
        placeholder="What gear do you need?"
        class="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-300"
      />
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