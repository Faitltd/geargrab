<script lang="ts">
  import HoverCard from '$lib/components/HoverCard.svelte';
  import { goto } from '$app/navigation';
  import SkeletonCard from '$lib/components/layout/SkeletonCard.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/ScrollLinkedSequential.svelte';

  export let listings = [];
  export let loading = false;
  export let emptyMessage = "No gear items found";
</script>

<div data-cy="gear-grid">
  {#if loading}
    <div data-cy="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 justify-items-center">
      <SkeletonCard variant="gear" count={8} />
    </div>
  {:else if !listings || listings.length === 0}
    <div class="py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-white/70 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
      <p class="text-white/80 text-lg drop-shadow-lg">{emptyMessage}</p>
      <p class="text-white/60 text-sm mt-2 drop-shadow-lg">Try adjusting your search criteria or browse all categories</p>
    </div>
  {:else}
    <ScrollLinkedSequential
      animation="fade-up"
      baseDelay={0}
      incrementDelay={0.02}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 justify-items-center"
      startOffset={0.1}
      endOffset={0.9}
      smoothness={0.15}
    >
      {#each listings as listing}
        <HoverCard 
          {listing} 
          onClick={() => goto(`/listing/${listing.id}`)} 
        />
      {/each}
    </ScrollLinkedSequential>
  {/if}
</div>