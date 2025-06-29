<script lang="ts">
  import type { Listing } from '$lib/services/listing';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';

  export let listing: Listing;
</script>

<ScrollLinkedAnimator animation="fade-up" startOffset="{0.05}" endOffset="{0.6}">
  <div class="text-center mb-8">
    <h1 class="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
      {listing.title}
    </h1>
    <div class="text-xl text-white/90 font-medium">
      {listing.category}
      {#if listing}
        , Title={listing.title?.substring(0, 30)}...
      {/if}
    </div>

    <div class="flex flex-wrap items-center justify-center mb-4">
      <div class="flex items-center mr-4">
        <div class="text-yellow-400 mr-1">
          {#each Array(5) as _, i}
            <span class="text-lg">{i < Math.floor(listing.averageRating) ? '★' : i < Math.ceil(listing.averageRating) ? '★' : '☆'}</span>
          {/each}
        </div>
        <span class="font-medium text-white">{listing.averageRating}</span>
        {#if listing.reviewCount}
          <span class="text-white/70 ml-1">({listing.reviewCount} reviews)</span>
        {/if}
      </div>
      <div class="text-white/70 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{listing.location.city}, {listing.location.state}</span>
      </div>
    </div>
  </div>
</ScrollLinkedAnimator>
