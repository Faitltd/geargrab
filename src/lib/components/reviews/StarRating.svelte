<script lang="ts">
  // Props
  export let rating: number = 0;
  export let maxRating: number = 5;
  export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let showValue: boolean = false;
  export let showCount: boolean = false;
  export let reviewCount: number = 0;
  export let interactive: boolean = false;
  export let readonly: boolean = true;
  export let precision: 'full' | 'half' | 'quarter' = 'half';
  export let color: 'yellow' | 'blue' | 'red' | 'green' = 'yellow';

  // Events
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{
    rate: { rating: number };
    hover: { rating: number };
  }>();

  // State
  let hoveredRating = 0;

  // Reactive statements
  $: displayRating = interactive && hoveredRating > 0 ? hoveredRating : rating;
  $: clampedRating = Math.max(0, Math.min(maxRating, displayRating));
  $: stars = generateStars(clampedRating, maxRating, precision);

  // Size classes
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  // Color classes
  const colorClasses = {
    yellow: {
      filled: 'text-yellow-400',
      empty: 'text-gray-300'
    },
    blue: {
      filled: 'text-blue-400',
      empty: 'text-gray-300'
    },
    red: {
      filled: 'text-red-400',
      empty: 'text-gray-300'
    },
    green: {
      filled: 'text-green-400',
      empty: 'text-gray-300'
    }
  };

  // Text size classes for rating value
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  function generateStars(rating: number, maxRating: number, precision: string) {
    const stars = [];
    
    for (let i = 1; i <= maxRating; i++) {
      const difference = rating - i + 1;
      let fillPercentage = 0;

      if (difference >= 1) {
        fillPercentage = 100;
      } else if (difference > 0) {
        if (precision === 'full') {
          fillPercentage = 100;
        } else if (precision === 'half') {
          fillPercentage = difference >= 0.5 ? 100 : 50;
        } else if (precision === 'quarter') {
          if (difference >= 0.75) fillPercentage = 100;
          else if (difference >= 0.5) fillPercentage = 75;
          else if (difference >= 0.25) fillPercentage = 50;
          else fillPercentage = 25;
        }
      }

      stars.push({
        index: i,
        fillPercentage,
        filled: fillPercentage > 0
      });
    }

    return stars;
  }

  function handleStarClick(starIndex: number) {
    if (!interactive || readonly) return;
    
    const newRating = starIndex;
    dispatch('rate', { rating: newRating });
  }

  function handleStarHover(starIndex: number) {
    if (!interactive || readonly) return;
    
    hoveredRating = starIndex;
    dispatch('hover', { rating: starIndex });
  }

  function handleMouseLeave() {
    if (!interactive || readonly) return;
    hoveredRating = 0;
  }

  function formatRating(rating: number): string {
    return rating % 1 === 0 ? rating.toString() : rating.toFixed(1);
  }
</script>

<div class="flex items-center space-x-1">
  <!-- Stars -->
  <div 
    class="flex items-center space-x-0.5"
    class:cursor-pointer={interactive && !readonly}
    on:mouseleave={handleMouseLeave}
    role={interactive ? 'radiogroup' : 'img'}
    aria-label={interactive ? 'Rate this item' : `Rating: ${formatRating(rating)} out of ${maxRating} stars`}
  >
    {#each stars as star (star.index)}
      <div
        class="relative {sizeClasses[size]}"
        on:click={() => handleStarClick(star.index)}
        on:mouseenter={() => handleStarHover(star.index)}
        role={interactive ? 'radio' : 'presentation'}
        aria-checked={interactive ? star.index <= displayRating : undefined}
        tabindex={interactive && !readonly ? 0 : -1}
        on:keydown={(e) => {
          if (interactive && !readonly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleStarClick(star.index);
          }
        }}
      >
        <!-- Empty star background -->
        <svg
          class="absolute inset-0 {sizeClasses[size]} {colorClasses[color].empty}"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>

        <!-- Filled star with clip path for partial fills -->
        {#if star.fillPercentage > 0}
          <div
            class="absolute inset-0 overflow-hidden"
            style="clip-path: inset(0 {100 - star.fillPercentage}% 0 0)"
          >
            <svg
              class="{sizeClasses[size]} {colorClasses[color].filled}"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Rating value -->
  {#if showValue}
    <span class="font-medium text-gray-700 {textSizeClasses[size]}">
      {formatRating(displayRating)}
    </span>
  {/if}

  <!-- Review count -->
  {#if showCount && reviewCount > 0}
    <span class="text-gray-500 {textSizeClasses[size]}">
      ({reviewCount.toLocaleString()})
    </span>
  {/if}
</div>

<style>
  /* Ensure smooth transitions for interactive stars */
  .cursor-pointer svg {
    transition: color 0.15s ease-in-out;
  }

  /* Focus styles for accessibility */
  [role="radio"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 2px;
  }
</style>
