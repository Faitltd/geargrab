<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let min = 0;
  export let max = 500;
  export let period: 'day' | 'week' | 'month' = 'day';
  export let maxValue = 500;
  export let step = 5;
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    change: { min; max: number; period };
  }>();

  let minSlider: HTMLInputElement;
  let maxSlider: HTMLInputElement;

  // Ensure min is never greater than max
  $: if (min > max) {
    min = max;
  }

  // Ensure max is never less than min
  $: if (max < min) {
    max = min;
  }

  function handleMinChange() {
    if (min > max) {
      min = max;
    }
    dispatchChange();
  }

  function handleMaxChange() {
    if (max < min) {
      max = min;
    }
    dispatchChange();
  }

  function handlePeriodChange() {
    dispatchChange();
  }

  function dispatchChange() {
    dispatch('change', { min, max, period });
  }

  function formatPrice(value) {
    return `$${value}`;
  }

  function resetToDefaults() {
    min = 0;
    max = maxValue;
    period = 'day';
    dispatchChange();
  }

  // Calculate slider track fill
  $: minPercent = (min / maxValue) * 100;
  $: maxPercent = (max / maxValue) * 100;
  $: trackFillStyle = `left: ${minPercent}%; width: ${maxPercent - minPercent}%;`;

  $: hasCustomRange = min > 0 || max < maxValue;
</script>

<div class="price-range-slider" class:disabled>
  <!-- Price Display -->
  <div class="price-display">
    <div class="price-values">
      <span class="price-value">
        {formatPrice(min)} - {formatPrice(max)}
      </span>
      <span class="price-period">per {period}</span>
    </div>
    {#if hasCustomRange}
      <button
        type="button"
        on:click={resetToDefaults}
        class="reset-button"
        title="Reset to default range"
      >
        Reset
      </button>
    {/if}
  </div>

  <!-- Dual Range Slider -->
  <div class="slider-container">
    <div class="slider-track">
      <div class="slider-track-fill" style={trackFillStyle}></div>
    </div>
    
    <!-- Min slider -->
    <input
      bind:this={minSlider}
      type="range"
      bind:value={min}
      on:input={handleMinChange}
      min="0"
      max={maxValue}
      {step}
      {disabled}
      class="slider slider-min"
      aria-label="Minimum price"
    />
    
    <!-- Max slider -->
    <input
      bind:this={maxSlider}
      type="range"
      bind:value={max}
      on:input={handleMaxChange}
      min="0"
      max={maxValue}
      {step}
      {disabled}
      class="slider slider-max"
      aria-label="Maximum price"
    />
  </div>

  <!-- Period Selection -->
  <div class="period-selection">
    <label class="period-label">Rental Period:</label>
    <div class="period-buttons">
      <button
        type="button"
        on:click={() => { period = 'day'; handlePeriodChange(); }}
        class="period-button {period === 'day' ? 'active' : ''}"
        {disabled}
      >
        Daily
      </button>
      <button
        type="button"
        on:click={() => { period = 'week'; handlePeriodChange(); }}
        class="period-button {period === 'week' ? 'active' : ''}"
        {disabled}
      >
        Weekly
      </button>
      <button
        type="button"
        on:click={() => { period = 'month'; handlePeriodChange(); }}
        class="period-button {period === 'month' ? 'active' : ''}"
        {disabled}
      >
        Monthly
      </button>
    </div>
  </div>

  <!-- Quick Presets -->
  <div class="price-presets">
    <button
      type="button"
      on:click={() => { min = 0; max = 50; dispatchChange(); }}
      class="preset-button"
      {disabled}
    >
      Under $50
    </button>
    <button
      type="button"
      on:click={() => { min = 50; max = 100; dispatchChange(); }}
      class="preset-button"
      {disabled}
    >
      $50 - $100
    </button>
    <button
      type="button"
      on:click={() => { min = 100; max = 200; dispatchChange(); }}
      class="preset-button"
      {disabled}
    >
      $100 - $200
    </button>
    <button
      type="button"
      on:click={() => { min = 200; max = maxValue; dispatchChange(); }}
      class="preset-button"
      {disabled}
    >
      $200+
    </button>
  </div>
</div>

<style>
  .price-range-slider {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .price-range-slider.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .price-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .price-values {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .price-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: white;
  }

  .price-period {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .reset-button {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    border-radius: 4px;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-button:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .slider-container {
    position: relative;
    height: 2rem;
    margin: 0.5rem 0;
  }

  .slider-track {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    transform: translateY(-50%);
  }

  .slider-track-fill {
    position: absolute;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
    appearance: none;
    outline: none;
    pointer-events: none;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    pointer-events: all;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .slider::-webkit-slider-thumb:active {
    transform: scale(1.2);
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    pointer-events: all;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }

  .slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .slider-max {
    z-index: 2;
  }

  .slider-min {
    z-index: 1;
  }

  .period-selection {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .period-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }

  .period-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .period-button {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .period-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .period-button.active {
    background: rgba(16, 185, 129, 0.3);
    border-color: #10b981;
    color: #10b981;
  }

  .period-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .price-presets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.5rem;
  }

  .preset-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .preset-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .preset-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .price-range-slider {
      padding: 0.75rem;
    }

    .price-display {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .period-buttons {
      flex-direction: column;
    }

    .price-presets {
      grid-template-columns: repeat(2, 1fr);
    }

    .slider::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
    }

    .slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
    }
  }

  /* Focus styles for accessibility */
  .slider:focus::-webkit-slider-thumb {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }

  .slider:focus::-moz-range-thumb {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }
</style>
