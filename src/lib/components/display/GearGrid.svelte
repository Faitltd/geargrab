<script lang="ts">
  import UniverseCard from '$lib/components/cards/UniverseCard.svelte';

  export let listings = [];
  export let loading = false;
  export let emptyMessage = "No gear items found";

  function handleCardClick(listing: any) {
    // Navigate to listing detail page
    window.location.href = `/listing/${listing.id}`;
  }
</script>

<div data-cy="gear-grid" class="p-8">
  <h2 class="text-white text-2xl mb-4">Listings: {listings.length}</h2>

  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="text-white">Loading amazing gear...</p>
    </div>
  {:else if !listings || listings.length === 0}
    <div class="empty-container">
      <p class="text-white text-xl">{emptyMessage}</p>
      <p class="text-white/60 mt-2">Try adjusting your search filters</p>
    </div>
  {:else}
    <div class="cards">
      {#each listings as listing}
        <UniverseCard {listing} onClick={() => handleCardClick(listing)} />
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Card Grid Container */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2rem;
    padding: 1rem;
    justify-items: center;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .cards {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .cards {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
  }

  /* Loading and Empty States */
  .loading-container,
  .empty-container {
    text-align: center;
    padding: 3rem 1rem;
  }

  .loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>