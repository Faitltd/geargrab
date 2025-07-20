<script lang="ts">
  import { goto } from '$app/navigation';
  import { showToast } from '$lib/stores/toast.store';
  
  // Form data
  let formData = {
    title: '',
    description: '',
    category: '',
    price: '',
    location: '',
    condition: 'good',
    brand: ''
  };
  
  // Form state
  let loading = false;
  let errors: Record<string, string> = {};
  let isDraft = false;
  
  const categories = [
    { value: '', label: 'Select Category' },
    { value: 'camping', label: 'Camping' },
    { value: 'sports', label: 'Sports' },
    { value: 'photography', label: 'Photography' },
    { value: 'electronics', label: 'Electronics' }
  ];
  
  const conditions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];
  
  // Validation
  function validateForm() {
    errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = 'Valid price is required';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  // Submit form
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }
    
    try {
      loading = true;
      
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'mock-auth-token'}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('success', 'Listing created successfully!');
        goto('/dashboard/listings');
      } else {
        showToast('error', data.message || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      showToast('error', 'Network error. Please try again.');
    } finally {
      loading = false;
    }
  }
  
  // Save as draft
  async function saveDraft() {
    isDraft = true;
    // In a real app, this would save to localStorage or make an API call
    showToast('info', 'Draft saved automatically');
  }
  
  // Auto-save draft every 30 seconds
  let draftTimer: NodeJS.Timeout;
  $: if (formData.title || formData.description) {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 30000);
  }
</script>

<svelte:head>
  <title>Create New Listing - GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Create New Listing</h1>
      <p class="mt-2 text-gray-600">Share your gear with the community</p>
    </div>
    
    <!-- Form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-8" data-cy="create-listing-form">
      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Title -->
          <div class="md:col-span-2">
            <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
              Title <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              bind:value={formData.title}
              placeholder="e.g., Professional Camera Kit"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              class:border-red-500={errors.title}
              data-cy="title-input"
            />
            {#if errors.title}
              <p class="mt-1 text-sm text-red-600" data-cy="title-error">{errors.title}</p>
            {/if}
          </div>
          
          <!-- Category -->
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
              Category <span class="text-red-500">*</span>
            </label>
            <select
              id="category"
              bind:value={formData.category}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              class:border-red-500={errors.category}
              data-cy="category-select"
            >
              {#each categories as category}
                <option value={category.value}>{category.label}</option>
              {/each}
            </select>
            {#if errors.category}
              <p class="mt-1 text-sm text-red-600" data-cy="category-error">{errors.category}</p>
            {/if}
          </div>
          
          <!-- Price -->
          <div>
            <label for="price" class="block text-sm font-medium text-gray-700 mb-2">
              Daily Rate ($) <span class="text-red-500">*</span>
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              bind:value={formData.price}
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              class:border-red-500={errors.price}
              data-cy="price-input"
            />
            {#if errors.price}
              <p class="mt-1 text-sm text-red-600" data-cy="price-error">{errors.price}</p>
            {/if}
          </div>
          
          <!-- Brand -->
          <div>
            <label for="brand" class="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input
              id="brand"
              type="text"
              bind:value={formData.brand}
              placeholder="e.g., Canon, REI, Nike"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-cy="brand-input"
            />
          </div>
          
          <!-- Condition -->
          <div>
            <label for="condition" class="block text-sm font-medium text-gray-700 mb-2">Condition</label>
            <select
              id="condition"
              bind:value={formData.condition}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-cy="condition-select"
            >
              {#each conditions as condition}
                <option value={condition.value}>{condition.label}</option>
              {/each}
            </select>
          </div>
          
          <!-- Location -->
          <div class="md:col-span-2">
            <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
              Location <span class="text-red-500">*</span>
            </label>
            <input
              id="location"
              type="text"
              bind:value={formData.location}
              placeholder="e.g., San Francisco, CA"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              class:border-red-500={errors.location}
              data-cy="location-input"
            />
            {#if errors.location}
              <p class="mt-1 text-sm text-red-600" data-cy="location-error">{errors.location}</p>
            {/if}
          </div>
          
          <!-- Description -->
          <div class="md:col-span-2">
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows="4"
              bind:value={formData.description}
              placeholder="Describe your item, its features, and any important details..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              class:border-red-500={errors.description}
              data-cy="description-input"
            ></textarea>
            {#if errors.description}
              <p class="mt-1 text-sm text-red-600" data-cy="description-error">{errors.description}</p>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Images Section -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">Images</h2>
        
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center" data-cy="image-upload-area">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-gray-600 mb-2">Upload photos of your item</p>
          <p class="text-sm text-gray-500 mb-4">PNG, JPG up to 10MB each</p>
          <button
            type="button"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            data-cy="upload-images-button"
          >
            Choose Files
          </button>
        </div>
        
        <p class="mt-2 text-sm text-red-600" data-cy="image-error">At least one image is required</p>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            type="button"
            on:click={() => goto('/dashboard/listings')}
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            data-cy="cancel-button"
          >
            Cancel
          </button>
          
          <button
            type="button"
            on:click={saveDraft}
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            data-cy="save-draft-button"
          >
            Save Draft
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          data-cy="create-listing-button"
        >
          {loading ? 'Creating...' : 'Create Listing'}
        </button>
      </div>
      
      {#if isDraft}
        <p class="text-sm text-green-600" data-cy="draft-saved-message">Draft saved automatically</p>
      {/if}
    </form>
  </div>
</div>
