<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SearchFilters } from '$lib/services/search';
  
  export let filters: SearchFilters = {};
  export let isOpen = false;
  
  const dispatch = createEventDispatcher<{
    filtersChanged: SearchFilters;
    close: void;
  }>();
  
  // Local filter state
  let localFilters: SearchFilters = { ...filters };
  
  // Categories
  const categories = [
    { value: 'camping', label: 'Camping & Hiking' },
    { value: 'biking', label: 'Biking' },
    { value: 'water-sports', label: 'Water Sports' },
    { value: 'winter-sports', label: 'Winter Sports' },
    { value: 'climbing', label: 'Climbing' },
    { value: 'photography', label: 'Photography' },
    { value: 'outdoor-gear', label: 'General Outdoor' }
  ];
  
  // Conditions
  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];
  
  // Delivery options
  const deliveryOptions = [
    { value: 'pickup', label: 'Pickup' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'shipping', label: 'Shipping' }
  ];
  
  function applyFilters() {
    dispatch('filtersChanged', localFilters);
    dispatch('close');
  }
  
  function clearFilters() {
    localFilters = {};
    dispatch('filtersChanged', {});
    dispatch('close');
  }
  
  function handleCategoryChange(category: string, checked: boolean) {
    if (checked) {
      localFilters.category = category;
    } else if (localFilters.category === category) {
      delete localFilters.category;
    }
    localFilters = { ...localFilters };
  }
  
  function handleConditionChange(condition: string, checked: boolean) {
    if (!localFilters.condition) {
      localFilters.condition = [];
    }
    
    if (checked) {
      localFilters.condition = [...localFilters.condition, condition as any];
    } else {
      localFilters.condition = localFilters.condition.filter(c => c !== condition);
    }
    
    if (localFilters.condition.length === 0) {
      delete localFilters.condition;
    }
    
    localFilters = { ...localFilters };
  }
  
  function handleDeliveryChange(option: string, checked: boolean) {
    if (!localFilters.deliveryOptions) {
      localFilters.deliveryOptions = [];
    }
    
    if (checked) {
      localFilters.deliveryOptions = [...localFilters.deliveryOptions, option as any];
    } else {
      localFilters.deliveryOptions = localFilters.deliveryOptions.filter(o => o !== option);
    }
    
    if (localFilters.deliveryOptions.length === 0) {
      delete localFilters.deliveryOptions;
    }
    
    localFilters = { ...localFilters };
  }
  
  function handlePriceChange() {
    if (localFilters.priceRange?.min || localFilters.priceRange?.max) {
      if (!localFilters.priceRange) {
        localFilters.priceRange = { min: 0, max: 1000, period: 'day' };
      }
    } else {
      delete localFilters.priceRange;
    }
    localFilters = { ...localFilters };
  }
</script>

{#if isOpen}
  <div class="filters-overlay" on:click={() => dispatch('close')}>
    <div class="filters-panel" on:click|stopPropagation>
      <div class="filters-header">
        <h3>Advanced Filters</h3>
        <button class="close-btn" on:click={() => dispatch('close')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="filters-content">
        
        <!-- Category Filter -->
        <div class="filter-section">
          <h4>Category</h4>
          <div class="filter-options">
            {#each categories as category}
              <label class="checkbox-option">
                <input 
                  type="radio" 
                  name="category"
                  value={category.value}
                  checked={localFilters.category === category.value}
                  on:change={(e) => handleCategoryChange(category.value, e.target.checked)}
                />
                <span class="checkmark"></span>
                {category.label}
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Price Range Filter -->
        <div class="filter-section">
          <h4>Price Range</h4>
          <div class="price-inputs">
            <div class="price-input">
              <label>Min Price</label>
              <input 
                type="number" 
                placeholder="$0"
                bind:value={localFilters.priceRange?.min}
                on:input={handlePriceChange}
              />
            </div>
            <div class="price-input">
              <label>Max Price</label>
              <input 
                type="number" 
                placeholder="$1000"
                bind:value={localFilters.priceRange?.max}
                on:input={handlePriceChange}
              />
            </div>
          </div>
          <div class="price-period">
            <label>Per:</label>
            <select bind:value={localFilters.priceRange.period}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
        
        <!-- Condition Filter -->
        <div class="filter-section">
          <h4>Condition</h4>
          <div class="filter-options">
            {#each conditions as condition}
              <label class="checkbox-option">
                <input 
                  type="checkbox" 
                  checked={localFilters.condition?.includes(condition.value)}
                  on:change={(e) => handleConditionChange(condition.value, e.target.checked)}
                />
                <span class="checkmark"></span>
                {condition.label}
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Delivery Options Filter -->
        <div class="filter-section">
          <h4>Transfer Method</h4>
          <div class="filter-options">
            {#each deliveryOptions as option}
              <label class="checkbox-option">
                <input 
                  type="checkbox" 
                  checked={localFilters.deliveryOptions?.includes(option.value)}
                  on:change={(e) => handleDeliveryChange(option.value, e.target.checked)}
                />
                <span class="checkmark"></span>
                {option.label}
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Additional Options -->
        <div class="filter-section">
          <h4>Additional Options</h4>
          <div class="filter-options">
            <label class="checkbox-option">
              <input 
                type="checkbox" 
                bind:checked={localFilters.instantBook}
              />
              <span class="checkmark"></span>
              Instant Book Available
            </label>
            <label class="checkbox-option">
              <input 
                type="checkbox" 
                bind:checked={localFilters.verifiedOwners}
              />
              <span class="checkmark"></span>
              Verified Owners Only
            </label>
          </div>
        </div>
        
      </div>
      
      <div class="filters-footer">
        <button class="clear-btn" on:click={clearFilters}>
          Clear All
        </button>
        <button class="apply-btn" on:click={applyFilters}>
          Apply Filters
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .filters-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .filters-panel {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
  }

  .filters-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .close-btn:hover {
    background: #f0f0f0;
  }

  .filters-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .filter-section {
    margin-bottom: 32px;
  }

  .filter-section h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .filter-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .checkbox-option {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
  }

  .checkbox-option input {
    display: none;
  }

  .checkmark {
    width: 20px;
    height: 20px;
    border: 2px solid #ddd;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .checkbox-option input:checked + .checkmark {
    background: #007bff;
    border-color: #007bff;
  }

  .checkbox-option input:checked + .checkmark::after {
    content: '✓';
    color: white;
    font-size: 12px;
    font-weight: bold;
  }

  .checkbox-option input[type="radio"] + .checkmark {
    border-radius: 50%;
  }

  .price-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .price-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .price-input label {
    font-size: 14px;
    font-weight: 500;
    color: #666;
  }

  .price-input input {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }

  .price-input input:focus {
    outline: none;
    border-color: #007bff;
  }

  .price-period {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .price-period label {
    font-size: 14px;
    font-weight: 500;
    color: #666;
  }

  .price-period select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: white;
  }

  .filters-footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #eee;
  }

  .clear-btn, .apply-btn {
    flex: 1;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-btn {
    background: #f8f9fa;
    color: #666;
    border: 1px solid #ddd;
  }

  .clear-btn:hover {
    background: #e9ecef;
  }

  .apply-btn {
    background: #007bff;
    color: white;
    border: 1px solid #007bff;
  }

  .apply-btn:hover {
    background: #0056b3;
  }

  @media (max-width: 768px) {
    .filters-overlay {
      padding: 0;
    }
    
    .filters-panel {
      border-radius: 0;
      height: 100vh;
      max-height: none;
    }
    
    .price-inputs {
      grid-template-columns: 1fr;
    }
  }
</style>
