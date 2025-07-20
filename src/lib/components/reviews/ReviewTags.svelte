<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { REVIEW_TAGS, type ReviewTagId } from '$lib/types/reviews';

  // Props
  export let selectedTags: string[] = [];
  export let reviewType: 'listing' | 'user' = 'listing';
  export let interactive: boolean = false;
  export let maxTags: number = 5;
  export let size: 'sm' | 'md' = 'md';
  export let showCount: boolean = false;

  // Events
  const dispatch = createEventDispatcher<{
    tagToggle: { tagId: string; selected: boolean };
    tagsChange: { tags: string[] };
  }>();

  // Get available tags based on review type
  $: availableTags = reviewType === 'listing' ? REVIEW_TAGS.listing : REVIEW_TAGS.user;
  
  // Size classes
  const sizeClasses = {
    sm: {
      tag: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      tag: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4'
    }
  };

  // Color classes for tags
  const colorClasses = {
    green: {
      selected: 'bg-green-100 text-green-800 border-green-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
    },
    blue: {
      selected: 'bg-blue-100 text-blue-800 border-blue-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
    },
    purple: {
      selected: 'bg-purple-100 text-purple-800 border-purple-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
    },
    yellow: {
      selected: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200'
    },
    red: {
      selected: 'bg-red-100 text-red-800 border-red-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
    },
    indigo: {
      selected: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
    },
    teal: {
      selected: 'bg-teal-100 text-teal-800 border-teal-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
    },
    cyan: {
      selected: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200'
    },
    orange: {
      selected: 'bg-orange-100 text-orange-800 border-orange-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200'
    },
    emerald: {
      selected: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
    },
    sky: {
      selected: 'bg-sky-100 text-sky-800 border-sky-200',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200'
    },
    gray: {
      selected: 'bg-gray-200 text-gray-800 border-gray-300',
      unselected: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:text-gray-800 hover:border-gray-300'
    }
  };

  function toggleTag(tagId: string) {
    if (!interactive) return;

    const isSelected = selectedTags.includes(tagId);
    let newTags: string[];

    if (isSelected) {
      // Remove tag
      newTags = selectedTags.filter(id => id !== tagId);
    } else {
      // Add tag (respect max limit)
      if (selectedTags.length >= maxTags) {
        return; // Don't add if at max
      }
      newTags = [...selectedTags, tagId];
    }

    dispatch('tagToggle', { tagId, selected: !isSelected });
    dispatch('tagsChange', { tags: newTags });
  }

  function getTagClasses(tag: typeof availableTags[0], isSelected: boolean): string {
    const baseClasses = `inline-flex items-center border rounded-full font-medium transition-all duration-200 ${sizeClasses[size].tag}`;
    const colorClass = colorClasses[tag.color as keyof typeof colorClasses];
    const stateClass = isSelected ? colorClass.selected : colorClass.unselected;
    const interactiveClass = interactive ? 'cursor-pointer' : '';
    
    return `${baseClasses} ${stateClass} ${interactiveClass}`;
  }

  function getCategoryIcon(category: 'positive' | 'negative' | 'neutral'): string {
    switch (category) {
      case 'positive':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Check circle
      case 'negative':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'; // X circle
      case 'neutral':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Info circle
      default:
        return '';
    }
  }

  // Filter tags to show only selected ones if not interactive
  $: displayTags = interactive ? availableTags : availableTags.filter(tag => selectedTags.includes(tag.id));
  $: selectedCount = selectedTags.length;
  $: canAddMore = selectedCount < maxTags;
</script>

{#if displayTags.length > 0}
  <div class="space-y-2">
    {#if interactive && showCount}
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">
          Select tags that describe your experience ({selectedCount}/{maxTags})
        </span>
        {#if selectedCount >= maxTags}
          <span class="text-xs text-amber-600">Maximum tags selected</span>
        {/if}
      </div>
    {/if}

    <div class="flex flex-wrap gap-2">
      {#each displayTags as tag (tag.id)}
        {@const isSelected = selectedTags.includes(tag.id)}
        {@const isDisabled = interactive && !isSelected && !canAddMore}
        
        <button
          type="button"
          class={getTagClasses(tag, isSelected)}
          class:opacity-50={isDisabled}
          class:cursor-not-allowed={isDisabled}
          disabled={isDisabled}
          on:click={() => toggleTag(tag.id)}
          title={interactive ? (isSelected ? `Remove "${tag.name}" tag` : `Add "${tag.name}" tag`) : tag.name}
        >
          <!-- Category icon -->
          <svg 
            class="{sizeClasses[size].icon} mr-1.5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d={getCategoryIcon(tag.category)}
            />
          </svg>
          
          <!-- Tag name -->
          <span>{tag.name}</span>
          
          <!-- Selected indicator -->
          {#if interactive && isSelected}
            <svg class="{sizeClasses[size].icon} ml-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>

    {#if interactive && selectedCount === 0}
      <p class="text-xs text-gray-500 italic">
        Select tags that best describe your experience (optional)
      </p>
    {/if}
  </div>
{/if}
