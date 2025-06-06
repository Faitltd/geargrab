<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let currentPage = 1;
  export let totalPages = 1;
  export let totalResults = 0;
  export let resultsPerPage = 20;
  export let hasMore = false;
  export let loading = false;
  
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      dispatch('page-change', { page });
    }
  }
  
  function loadMore() {
    if (hasMore && !loading) {
      dispatch('load-more');
    }
  }
  
  // Calculate visible page numbers
  $: visiblePages = (() => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  })();
  
  $: startResult = (currentPage - 1) * resultsPerPage + 1;
  $: endResult = Math.min(currentPage * resultsPerPage, totalResults);
</script>

{#if totalResults > 0}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <!-- Results Summary -->
    <div class="flex flex-col sm:flex-row justify-between items-center mb-6">
      <div class="text-white mb-4 sm:mb-0">
        <span class="text-sm">
          Showing {startResult}-{endResult} of {totalResults} results
        </span>
      </div>
      
      <!-- Load More Button (for infinite scroll style) -->
      {#if hasMore}
        <button
          on:click={loadMore}
          disabled={loading}
          class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
        >
          {#if loading}
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Loading...</span>
          {:else}
            <span>Load More</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          {/if}
        </button>
      {/if}
    </div>
    
    <!-- Traditional Pagination -->
    {#if totalPages > 1}
      <div class="flex flex-col sm:flex-row justify-between items-center">
        <!-- Previous Button -->
        <button
          on:click={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          class="mb-4 sm:mb-0 flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span>Previous</span>
        </button>
        
        <!-- Page Numbers -->
        <div class="flex items-center space-x-1 mb-4 sm:mb-0">
          {#if visiblePages[0] > 1}
            <button
              on:click={() => goToPage(1)}
              class="px-3 py-2 text-sm font-medium text-white bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-600/50 transition-colors"
            >
              1
            </button>
            {#if visiblePages[0] > 2}
              <span class="px-2 text-gray-400">...</span>
            {/if}
          {/if}
          
          {#each visiblePages as page}
            <button
              on:click={() => goToPage(page)}
              class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {
                page === currentPage
                  ? 'bg-green-600 text-white border border-green-500'
                  : 'text-white bg-gray-700/50 border border-gray-600 hover:bg-gray-600/50'
              }"
            >
              {page}
            </button>
          {/each}
          
          {#if visiblePages[visiblePages.length - 1] < totalPages}
            {#if visiblePages[visiblePages.length - 1] < totalPages - 1}
              <span class="px-2 text-gray-400">...</span>
            {/if}
            <button
              on:click={() => goToPage(totalPages)}
              class="px-3 py-2 text-sm font-medium text-white bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-600/50 transition-colors"
            >
              {totalPages}
            </button>
          {/if}
        </div>
        
        <!-- Next Button -->
        <button
          on:click={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    {/if}
  </div>
{/if}
