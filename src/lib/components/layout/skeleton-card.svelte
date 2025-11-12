<script lang="ts">
  export let variant: 'gear' | 'user' | 'listing' | 'dashboard' = 'gear';
  export let count = 1;
</script>

{#if variant === 'gear'}
  {#each Array(count) as _}
    <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-hidden">
      <!-- Image skeleton -->
      <div class="skeleton h-48 w-full"></div>
      
      <!-- Content skeleton -->
      <div class="p-4 space-y-3">
        <!-- Title -->
        <div class="skeleton h-5 w-3/4 rounded"></div>
        
        <!-- Description -->
        <div class="skeleton h-4 w-full rounded"></div>
        <div class="skeleton h-4 w-2/3 rounded"></div>
        
        <!-- Price and rating -->
        <div class="flex justify-between items-center mt-4">
          <div class="skeleton h-6 w-20 rounded"></div>
          <div class="skeleton h-4 w-16 rounded"></div>
        </div>
      </div>
    </div>
  {/each}
{:else if variant === 'user'}
  {#each Array(count) as _}
    <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
      <div class="flex items-center space-x-4">
        <!-- Avatar -->
        <div class="skeleton h-12 w-12 rounded-full"></div>
        
        <!-- User info -->
        <div class="flex-1 space-y-2">
          <div class="skeleton h-4 w-32 rounded"></div>
          <div class="skeleton h-3 w-24 rounded"></div>
        </div>
        
        <!-- Actions -->
        <div class="skeleton h-8 w-20 rounded"></div>
      </div>
    </div>
  {/each}
{:else if variant === 'listing'}
  {#each Array(count) as _}
    <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-6">
      <div class="flex items-start space-x-4">
        <!-- Image -->
        <div class="skeleton h-20 w-20 rounded-lg"></div>
        
        <!-- Content -->
        <div class="flex-1 space-y-3">
          <div class="skeleton h-5 w-48 rounded"></div>
          <div class="skeleton h-4 w-full rounded"></div>
          <div class="skeleton h-4 w-3/4 rounded"></div>
          
          <!-- Meta info -->
          <div class="flex space-x-4 mt-4">
            <div class="skeleton h-4 w-16 rounded"></div>
            <div class="skeleton h-4 w-20 rounded"></div>
            <div class="skeleton h-4 w-24 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  {/each}
{:else if variant === 'dashboard'}
  {#each Array(count) as _}
    <div class="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-600/50 p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="skeleton h-4 w-24 rounded"></div>
        <div class="skeleton h-8 w-8 rounded"></div>
      </div>
      
      <!-- Main content -->
      <div class="skeleton h-8 w-16 rounded mb-2"></div>
      <div class="skeleton h-3 w-32 rounded"></div>
    </div>
  {/each}
{/if}
