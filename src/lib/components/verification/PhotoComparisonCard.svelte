<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale, slide } from 'svelte/transition';
  import type { ConditionCheckPhoto } from '$lib/services/conditionCheck';

  export let beforePhoto: ConditionCheckPhoto;
  export let afterPhoto: ConditionCheckPhoto;
  export let index: number;
  export let showDamageIndicators: boolean = true;
  export let comparisonMode: 'side-by-side' | 'overlay' | 'slider' = 'side-by-side';

  const dispatch = createEventDispatcher<{
    flagDamage: { beforePhoto: ConditionCheckPhoto; afterPhoto: ConditionCheckPhoto; index: number };
    viewFullscreen: { beforePhoto: ConditionCheckPhoto; afterPhoto: ConditionCheckPhoto; index: number };
  }>();

  let isDamageDetected = false;
  let damageNotes = '';
  let showDamageForm = false;
  let sliderPosition = 50; // For slider comparison mode

  // Simulate damage detection (in a real app, this could use AI/ML)
  const detectDamage = () => {
    // This is a placeholder - in production you might use:
    // - Image comparison algorithms
    // - AI-based damage detection
    // - Manual user flagging
    // For now, we'll allow manual flagging
    return false;
  };

  const handleFlagDamage = () => {
    showDamageForm = true;
  };

  const submitDamageReport = () => {
    isDamageDetected = true;
    dispatch('flagDamage', { 
      beforePhoto, 
      afterPhoto, 
      index 
    });
    showDamageForm = false;
  };

  const cancelDamageReport = () => {
    showDamageForm = false;
    damageNotes = '';
  };

  const viewFullscreen = () => {
    dispatch('viewFullscreen', { beforePhoto, afterPhoto, index });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
</script>

<div class="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
  <!-- Header -->
  <div class="p-4 border-b border-neutral-200 bg-neutral-50">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-neutral-900">
        Photo Comparison #{index + 1}
      </h3>
      
      <div class="flex items-center space-x-2">
        <!-- Damage indicator -->
        {#if isDamageDetected}
          <span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Damage Detected
          </span>
        {:else}
          <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            No Issues
          </span>
        {/if}
        
        <!-- View mode selector -->
        <select 
          bind:value={comparisonMode}
          class="text-sm border border-neutral-300 rounded px-2 py-1"
        >
          <option value="side-by-side">Side by Side</option>
          <option value="overlay">Overlay</option>
          <option value="slider">Slider</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Photo Comparison -->
  <div class="relative">
    {#if comparisonMode === 'side-by-side'}
      <!-- Side by Side View -->
      <div class="grid grid-cols-2 gap-0">
        <!-- Before Photo -->
        <div class="relative aspect-square bg-neutral-100">
          <img
            src={beforePhoto.url}
            alt="Before photo {index + 1}"
            class="w-full h-full object-cover cursor-pointer"
            on:click={viewFullscreen}
            loading="lazy"
          />
          <div class="absolute top-2 left-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
            BEFORE
          </div>
          <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatTimestamp(beforePhoto.uploadedAt)}
          </div>
        </div>
        
        <!-- After Photo -->
        <div class="relative aspect-square bg-neutral-100 border-l border-neutral-200">
          <img
            src={afterPhoto.url}
            alt="After photo {index + 1}"
            class="w-full h-full object-cover cursor-pointer"
            on:click={viewFullscreen}
            loading="lazy"
          />
          <div class="absolute top-2 left-2 bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded">
            AFTER
          </div>
          <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatTimestamp(afterPhoto.uploadedAt)}
          </div>
        </div>
      </div>
      
    {:else if comparisonMode === 'overlay'}
      <!-- Overlay View -->
      <div class="relative aspect-square bg-neutral-100">
        <!-- Before photo (background) -->
        <img
          src={beforePhoto.url}
          alt="Before photo {index + 1}"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        
        <!-- After photo (overlay with opacity) -->
        <img
          src={afterPhoto.url}
          alt="After photo {index + 1}"
          class="absolute inset-0 w-full h-full object-cover opacity-50 hover:opacity-75 transition-opacity cursor-pointer"
          on:click={viewFullscreen}
          loading="lazy"
        />
        
        <div class="absolute top-2 left-2 bg-purple-500 text-white text-xs font-medium px-2 py-1 rounded">
          OVERLAY
        </div>
      </div>
      
    {:else if comparisonMode === 'slider'}
      <!-- Slider View -->
      <div class="relative aspect-square bg-neutral-100 overflow-hidden">
        <!-- Before photo (full) -->
        <img
          src={beforePhoto.url}
          alt="Before photo {index + 1}"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        
        <!-- After photo (clipped) -->
        <div 
          class="absolute inset-0 overflow-hidden"
          style="clip-path: inset(0 {100 - sliderPosition}% 0 0)"
        >
          <img
            src={afterPhoto.url}
            alt="After photo {index + 1}"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        <!-- Slider control -->
        <div class="absolute inset-0 flex items-center">
          <div 
            class="w-1 bg-white shadow-lg cursor-ew-resize"
            style="left: {sliderPosition}%; height: 100%; position: absolute;"
          >
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>
        </div>
        
        <!-- Slider input -->
        <input
          type="range"
          min="0"
          max="100"
          bind:value={sliderPosition}
          class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        />
        
        <div class="absolute top-2 left-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
          SLIDER
        </div>
      </div>
    {/if}
  </div>

  <!-- Action Buttons -->
  <div class="p-4 border-t border-neutral-200 bg-neutral-50">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        {#if !isDamageDetected && !showDamageForm}
          <button
            on:click={handleFlagDamage}
            class="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Flag Damage
          </button>
        {/if}
        
        <button
          on:click={viewFullscreen}
          class="px-3 py-1.5 text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors"
        >
          View Fullscreen
        </button>
      </div>
      
      <div class="text-xs text-neutral-500">
        Click photos to view fullscreen
      </div>
    </div>
  </div>

  <!-- Damage Report Form -->
  {#if showDamageForm}
    <div class="p-4 border-t border-red-200 bg-red-50" transition:slide>
      <h4 class="text-sm font-semibold text-red-900 mb-3">
        Report Damage or Discrepancy
      </h4>
      
      <textarea
        bind:value={damageNotes}
        placeholder="Describe the damage or changes you notice between the before and after photos..."
        class="w-full h-20 px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
        maxlength="300"
      ></textarea>
      
      <div class="flex items-center justify-between mt-3">
        <span class="text-xs text-red-600">
          {damageNotes.length}/300 characters
        </span>
        
        <div class="flex items-center space-x-2">
          <button
            on:click={cancelDamageReport}
            class="px-3 py-1.5 text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            on:click={submitDamageReport}
            disabled={!damageNotes.trim()}
            class="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Damage Details (if flagged) -->
  {#if isDamageDetected && damageNotes}
    <div class="p-4 border-t border-red-200 bg-red-50">
      <h4 class="text-sm font-semibold text-red-900 mb-2">
        Reported Issue
      </h4>
      <p class="text-sm text-red-800">
        {damageNotes}
      </p>
    </div>
  {/if}
</div>

<style>
  /* Custom slider styling */
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 0;
    height: 0;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 0;
    height: 0;
    border: none;
    background: transparent;
  }
</style>
