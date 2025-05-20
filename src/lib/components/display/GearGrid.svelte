<script lang="ts">
  export let listings = [];
  export let loading = false;
  export let emptyMessage = "No gear items found";
  
  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {#if loading}
    {#each Array(8) as _}
      <div class="animate-pulse rounded-lg shadow bg-white overflow-hidden">
        <div class="bg-gray-200 h-48 w-full"></div>
        <div class="p-4 space-y-2">
          <div class="h-5 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="flex justify-between items-center mt-2">
            <div class="h-5 bg-gray-200 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        </div>
      </div>
    {/each}
  {:else if listings.length === 0}
    <div class="col-span-full py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
      <p class="text-gray-500 text-lg">{emptyMessage}</p>
    </div>
  {:else}
    {#each listings as listing (listing.id)}
      <a href={`/gear/${listing.id}`} class="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        <!-- Image -->
        <div class="relative aspect-[4/3] overflow-hidden">
          <img 
            src={listing.images[0]} 
            alt={listing.title}
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p class="text-white font-medium">{formatCurrency(listing.dailyPrice)}/day</p>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-4">
          <h3 class="font-medium text-gray-900 group-hover:text-green-600 transition-colors">{listing.title}</h3>
          <p class="text-sm text-gray-500 mt-1">{listing.location.city}, {listing.location.state}</p>
          
          <!-- Rating -->
          <div class="flex items-center mt-2">
            <div class="flex items-center">
              {#each Array(5) as _, i}
                <svg class="w-4 h-4 {i < Math.floor(listing.averageRating) ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              {/each}
            </div>
            <span class="text-xs text-gray-500 ml-1">({listing.reviewCount})</span>
          </div>
        </div>
      </a>
    {/each}
  {/if}
</div>

<style>
  /* Add line-clamp utility if not using the Tailwind plugin */
  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
</style>