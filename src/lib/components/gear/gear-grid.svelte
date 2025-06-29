<script lang="ts">
  import GearCard from './gear-card.svelte';
  
  export let listings: any[] = [];
  export let loading = false;
  export let showOwner = false;
  export let compact = false;
  export let emptyMessage = 'No gear found';
  export let emptyDescription = 'Try adjusting your search filters or browse different categories.';
</script>

{#if loading}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {#each Array(8) as _}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden animate-pulse">
        <div class="aspect-video bg-gray-700"></div>
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-700 rounded w-3/4"></div>
          <div class="h-3 bg-gray-700 rounded w-1/2"></div>
          <div class="h-6 bg-gray-700 rounded w-1/3"></div>
          <div class="h-3 bg-gray-700 rounded w-2/3"></div>
          <div class="h-8 bg-gray-700 rounded"></div>
        </div>
      </div>
    {/each}
  </div>
{:else if listings.length === 0}
  <div class="text-center py-12">
    <div class="text-6xl mb-4">🔍</div>
    <h3 class="text-xl font-semibold text-white mb-2">{emptyMessage}</h3>
    <p class="text-gray-400 max-w-md mx-auto">{emptyDescription}</p>
    
    <div class="mt-6 space-y-2">
      <button 
        on:click={() => window.location.reload()}
        class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
      >
        Refresh Results
      </button>
      <div class="text-sm text-gray-400">
        or <a href="/search" class="text-green-400 hover:text-green-300">try a new search</a>
      </div>
    </div>
  </div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {#each listings as listing (listing.id)}
      <GearCard {listing} {showOwner} {compact} />
    {/each}
  </div>
  
  <!-- Load More Button (if needed) -->
  {#if listings.length > 0 && listings.length % 12 === 0}
    <div class="text-center mt-8">
      <button 
        class="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg border border-white/20 transition-colors"
        on:click={() => {
          // Dispatch load more event
          const event = new CustomEvent('loadMore');
          document.dispatchEvent(event);
        }}
      >
        Load More Gear
      </button>
    </div>
  {/if}
{/if}
