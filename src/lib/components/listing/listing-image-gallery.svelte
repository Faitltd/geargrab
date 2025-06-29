<script lang="ts">
  import type { Listing } from '$lib/services/listing';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';

  export let listing: Listing;
  export let activeImageIndex: number = 0;
</script>

<ScrollLinkedAnimator animation="scale-in" startOffset="{0.1}" endOffset="{0.7}">
  <div class="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 p-8 shadow-2xl max-w-4xl mx-auto hover:bg-white/25 transition-all duration-300">
    <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden mb-4">
      <img
        src="{listing.images[activeImageIndex]}"
        alt="{listing.title}"
        class="object-cover w-full h-full"
      />
    </div>

    {#if listing.images.length > 1}
      <div class="flex space-x-2 overflow-x-auto pb-2">
        {#each listing.images as image, i}
          <button
            class="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden {i === activeImageIndex ? 'ring-2 ring-green-400' : 'ring-1 ring-white/30'}"
            on:click={() => activeImageIndex = i}
          >
            <img src={image} alt={`${listing.title} - Image ${i+1}`} class="w-full h-full object-cover" />
          </button>
        {/each}
      </div>
    {/if}
  </div>
</ScrollLinkedAnimator>
