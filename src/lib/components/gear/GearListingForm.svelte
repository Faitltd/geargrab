<script>
  import { createEventDispatcher } from 'svelte';
  import { base44 } from '../../../api/base44Client.js';
  
  export let gearItem = null; // For editing existing items
  export let isEditing = false;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = null;
  let currentStep = 1;
  const totalSteps = 4;
  
  // Form data
  let formData = {
    title: '',
    description: '',
    category: '',
    subcategory: '',
    daily_price: '',
    weekly_price: '',
    monthly_price: '',
    deposit_amount: '',
    images: [],
    condition: 'good',
    brand: '',
    model: '',
    year: '',
    size: '',
    weight: '',
    dimensions: '',
    features: [],
    included_accessories: [],
    delivery_options: [],
    pickup_location: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: null,
    longitude: null,
    availability_type: 'manual',
    min_rental_days: 1,
    max_rental_days: 30,
    advance_notice_days: 1,
    instant_book: false
  };
  
  // Categories and subcategories
  const categories = {
    'camping': ['Tents', 'Sleeping Bags', 'Backpacks', 'Cooking Gear', 'Lighting'],
    'climbing': ['Ropes', 'Harnesses', 'Helmets', 'Shoes', 'Protection'],
    'water-sports': ['Kayaks', 'Paddleboards', 'Wetsuits', 'Life Jackets', 'Paddles'],
    'winter-sports': ['Skis', 'Snowboards', 'Boots', 'Poles', 'Helmets'],
    'cycling': ['Mountain Bikes', 'Road Bikes', 'Helmets', 'Accessories', 'Tools'],
    'hiking': ['Backpacks', 'Boots', 'Trekking Poles', 'Navigation', 'Clothing']
  };
  
  const conditions = [
    { value: 'excellent', label: 'Excellent - Like new' },
    { value: 'very_good', label: 'Very Good - Minor wear' },
    { value: 'good', label: 'Good - Normal wear' },
    { value: 'fair', label: 'Fair - Noticeable wear' }
  ];
  
  const deliveryOptions = [
    { value: 'pickup', label: 'Pickup Only' },
    { value: 'delivery', label: 'Local Delivery' },
    { value: 'shipping', label: 'Shipping Available' },
    { value: 'meetup', label: 'Meet Halfway' }
  ];
  
  // Initialize form data if editing
  if (isEditing && gearItem) {
    formData = {
      ...formData,
      ...gearItem,
      images: Array.isArray(gearItem.images) ? gearItem.images : JSON.parse(gearItem.images || '[]'),
      features: Array.isArray(gearItem.features) ? gearItem.features : JSON.parse(gearItem.features || '[]'),
      included_accessories: Array.isArray(gearItem.included_accessories) ? gearItem.included_accessories : JSON.parse(gearItem.included_accessories || '[]'),
      delivery_options: Array.isArray(gearItem.delivery_options) ? gearItem.delivery_options : JSON.parse(gearItem.delivery_options || '[]')
    };
  }
  
  function nextStep() {
    if (currentStep < totalSteps) {
      currentStep++;
    }
  }
  
  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }
  
  function addFeature() {
    formData.features = [...formData.features, ''];
  }
  
  function removeFeature(index) {
    formData.features = formData.features.filter((_, i) => i !== index);
  }
  
  function addAccessory() {
    formData.included_accessories = [...formData.included_accessories, ''];
  }
  
  function removeAccessory(index) {
    formData.included_accessories = formData.included_accessories.filter((_, i) => i !== index);
  }
  
  function handleDeliveryOptionChange(option, checked) {
    if (checked) {
      formData.delivery_options = [...formData.delivery_options, option];
    } else {
      formData.delivery_options = formData.delivery_options.filter(opt => opt !== option);
    }
  }
  
  async function handleSubmit() {
    loading = true;
    error = null;
    
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.category || !formData.daily_price) {
        throw new Error('Please fill in all required fields');
      }
      
      if (formData.images.length === 0) {
        throw new Error('Please add at least one image');
      }
      
      // Clean up form data
      const submitData = {
        ...formData,
        features: formData.features.filter(f => f.trim()),
        included_accessories: formData.included_accessories.filter(a => a.trim()),
        daily_price: parseFloat(formData.daily_price),
        weekly_price: formData.weekly_price ? parseFloat(formData.weekly_price) : null,
        monthly_price: formData.monthly_price ? parseFloat(formData.monthly_price) : null,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
        year: formData.year ? parseInt(formData.year) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        min_rental_days: parseInt(formData.min_rental_days),
        max_rental_days: parseInt(formData.max_rental_days),
        advance_notice_days: parseInt(formData.advance_notice_days)
      };
      
      let result;
      if (isEditing) {
        result = await base44.entities.GearItem.update(gearItem.id, submitData);
      } else {
        result = await base44.entities.GearItem.create(submitData);
      }
      
      dispatch('success', {
        gearItem: result.gear_item,
        isEditing
      });
      
    } catch (err) {
      console.error('Form submission error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
  <!-- Progress Bar -->
  <div class="px-6 py-4 border-b border-gray-200">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-xl font-semibold text-gray-900">
        {isEditing ? 'Edit' : 'List'} Your Gear
      </h2>
      <span class="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
    </div>
    
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div 
        class="bg-green-600 h-2 rounded-full transition-all duration-300"
        style="width: {(currentStep / totalSteps) * 100}%"
      ></div>
    </div>
  </div>
  
  {#if error}
    <div class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div class="ml-3">
          <p class="text-sm text-red-800">{error}</p>
        </div>
      </div>
    </div>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit} class="p-6">
    <!-- Step 1: Basic Information -->
    {#if currentStep === 1}
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            id="title"
            bind:value={formData.title}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., REI Co-op Half Dome 2 Plus Tent"
          />
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description *</label>
          <textarea
            id="description"
            bind:value={formData.description}
            required
            rows="4"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Describe your gear, its condition, and any special features..."
          ></textarea>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700">Category *</label>
            <select
              id="category"
              bind:value={formData.category}
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select category...</option>
              {#each Object.keys(categories) as category}
                <option value={category}>{category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label for="subcategory" class="block text-sm font-medium text-gray-700">Subcategory</label>
            <select
              id="subcategory"
              bind:value={formData.subcategory}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              disabled={!formData.category}
            >
              <option value="">Select subcategory...</option>
              {#if formData.category && categories[formData.category]}
                {#each categories[formData.category] as subcategory}
                  <option value={subcategory}>{subcategory}</option>
                {/each}
              {/if}
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label for="brand" class="block text-sm font-medium text-gray-700">Brand</label>
            <input
              type="text"
              id="brand"
              bind:value={formData.brand}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., REI Co-op"
            />
          </div>
          
          <div>
            <label for="model" class="block text-sm font-medium text-gray-700">Model</label>
            <input
              type="text"
              id="model"
              bind:value={formData.model}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Half Dome 2 Plus"
            />
          </div>
          
          <div>
            <label for="year" class="block text-sm font-medium text-gray-700">Year</label>
            <input
              type="number"
              id="year"
              bind:value={formData.year}
              min="1990"
              max={new Date().getFullYear()}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="2023"
            />
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Navigation Buttons -->
    <div class="flex justify-between pt-6 border-t border-gray-200 mt-8">
      <button
        type="button"
        on:click={prevStep}
        disabled={currentStep === 1}
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      {#if currentStep === totalSteps}
        <button
          type="submit"
          disabled={loading}
          class="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isEditing ? 'Updating...' : 'Creating...'}
          {:else}
            {isEditing ? 'Update Listing' : 'Create Listing'}
          {/if}
        </button>
      {:else}
        <button
          type="button"
          on:click={nextStep}
          class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Next
        </button>
      {/if}
    </div>
  </form>
</div>
