<script lang="ts">
  import ReviewsList from '$lib/components/reviews/ReviewsList.svelte';
  import ReviewStats from '$lib/components/reviews/ReviewStats.svelte';

  export let listingId: string;
  export let compact: boolean = false;
  export let showStats: boolean = true;
  export let maxReviews: number = 3;

  // State
  let activeTab: 'reviews' | 'stats' = 'reviews';

  function switchTab(tab: 'reviews' | 'stats') {
    activeTab = tab;
  }
</script>


<div class="space-y-6">
  <!-- Tab Navigation (if stats are enabled) -->
  {#if showStats}
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          on:click={() => switchTab('reviews')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'reviews'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Reviews
        </button>
        <button
          on:click={() => switchTab('stats')}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'stats'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Statistics
        </button>
      </nav>
    </div>
  {/if}

  <!-- Content -->
  {#if activeTab === 'reviews'}
    <ReviewsList
      {listingId}
      {compact}
      {maxReviews}
      showTitle={!showStats}
      showViewAllButton={true}
    />
  {:else if activeTab === 'stats'}
    <ReviewStats
      {listingId}
      {compact}
      showDistribution={true}
      showTopTags={true}
    />
  {/if}
</div>
