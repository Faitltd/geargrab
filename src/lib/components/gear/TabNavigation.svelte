<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let activeTab = 'details';
  export let tabs: Array<{
    id: string;
    label: string;
    count?: number;
    disabled?: boolean;
  }> = [
    { id: 'details', label: 'Details' },
    { id: 'reviews', label: 'Reviews', count: 0 },
    { id: 'related', label: 'Related Items' }
  ];
  export let sticky = true;
  export let showCounts = true;
  
  const dispatch = createEventDispatcher<{
    tabChange: { tabId: string; tab: typeof tabs[0] };
  }>();
  
  let tabsContainer: HTMLElement;
  let isSticky = false;
  
  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.disabled) return;
    
    activeTab = tab.id;
    dispatch('tabChange', { tabId: tab.id, tab });
  };
  
  const handleKeydown = (event: KeyboardEvent, tab: typeof tabs[0]) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(tab);
    }
  };
  
  // Intersection observer for sticky behavior
  let observer: IntersectionObserver;
  
  const setupStickyObserver = () => {
    if (!sticky || !tabsContainer) return;
    
    observer = new IntersectionObserver(
      ([entry]) => {
        isSticky = !entry.isIntersecting;
      },
      {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px'
      }
    );
    
    observer.observe(tabsContainer);
  };
  
  $: if (tabsContainer && sticky) {
    setupStickyObserver();
  }
  
  // Cleanup observer
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
    }
  };
  
  // Reactive cleanup
  $: if (!sticky) {
    cleanup();
  }
</script>

<svelte:window on:beforeunload={cleanup} />

<!-- Tab Navigation -->
<div 
  bind:this={tabsContainer}
  class="bg-white border-b border-neutral-200 {sticky ? 'sticky top-0 z-30' : ''} {isSticky ? 'shadow-sm' : ''}"
>
  <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Tab List -->
    <nav class="flex space-x-8 overflow-x-auto scrollbar-hide" role="tablist">
      {#each tabs as tab}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls="tabpanel-{tab.id}"
          tabindex={activeTab === tab.id ? 0 : -1}
          disabled={tab.disabled}
          class="
            relative py-4 px-1 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none
            {activeTab === tab.id 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : tab.disabled 
                ? 'text-neutral-400 cursor-not-allowed'
                : 'text-neutral-500 hover:text-neutral-700 border-b-2 border-transparent hover:border-neutral-300'
            }
          "
          on:click={() => handleTabClick(tab)}
          on:keydown={(e) => handleKeydown(e, tab)}
        >
          <span class="flex items-center space-x-2">
            <span>{tab.label}</span>
            
            {#if showCounts && tab.count !== undefined}
              <span class="
                inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
                {activeTab === tab.id 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'bg-neutral-100 text-neutral-600'
                }
              ">
                {tab.count}
              </span>
            {/if}
          </span>
          
          <!-- Active indicator -->
          {#if activeTab === tab.id}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></div>
          {/if}
        </button>
      {/each}
    </nav>
  </div>
</div>

<!-- Tab Panels Container -->
<div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#each tabs as tab}
    <div
      id="tabpanel-{tab.id}"
      role="tabpanel"
      aria-labelledby="tab-{tab.id}"
      class="{activeTab === tab.id ? 'block' : 'hidden'}"
      tabindex="0"
    >
      <slot name={tab.id} {tab}>
        <!-- Default content if no slot provided -->
        <div class="text-center py-12">
          <h3 class="text-lg font-medium text-neutral-900 mb-2">
            {tab.label}
          </h3>
          <p class="text-neutral-600">
            Content for {tab.label.toLowerCase()} will be displayed here.
          </p>
        </div>
      </slot>
    </div>
  {/each}
</div>

<style>
  /* Hide scrollbar for tab navigation */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Smooth transitions for sticky state */
  .sticky {
    transition: box-shadow 0.2s ease-in-out;
  }
</style>
