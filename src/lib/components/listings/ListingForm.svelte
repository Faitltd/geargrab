<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import SuccessBanner from '$lib/components/SuccessBanner.svelte';
  import AvailabilityCalendar from './AvailabilityCalendar.svelte';
  import ImageUploader from './ImageUploader.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';
  import { createListing, type ListingData } from '$lib/services/listings';
  
  const dispatch = createEventDispatcher<{
    success: { listingId: string };
    cancel: void;
  }>();
  
  // Form state
  let isSubmitting = false;
  let error = '';
  let successMessage = '';
  
  // Form data
  let formData = {
    title: '',
    description: '',
    category: '',
    location: '',
    listingType: 'sale' as 'sale' | 'rent',
    price: '',
    rentalPrice: '',
    rentalPeriod: 'day' as 'day' | 'week' | 'month',
    condition: '',
    brand: '',
    size: '',
    weight: '',
    availabilityDates: [] as string[],
    images: [] as File[],
    tags: [] as string[]
  };
  
  $: ({ user } = $authStore);
  $: isRental = formData.listingType === 'rent';
  
  const categories = [
    'Backpacks & Bags',
    'Tents & Shelters',
    'Sleeping Bags & Pads',
    'Hiking & Camping',
    'Climbing Gear',
    'Water Sports',
    'Winter Sports',
    'Cycling',
    'Footwear',
    'Clothing',
    'Electronics',
    'Cooking & Hydration',
    'Safety & Navigation',
    'Other'
  ];
  
  const conditions = [
    'New',
    'Excellent',
    'Very Good',
    'Good',
    'Fair',
    'Poor'
  ];
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!user) {
      error = 'You must be signed in to create a listing';
      return;
    }
    
    // Validation
    if (!formData.title.trim()) {
      error = 'Title is required';
      return;
    }
    
    if (!formData.description.trim()) {
      error = 'Description is required';
      return;
    }
    
    if (!formData.category) {
      error = 'Category is required';
      return;
    }
    
    if (!formData.price && !isRental) {
      error = 'Price is required for sale items';
      return;
    }
    
    if (!formData.rentalPrice && isRental) {
      error = 'Rental price is required for rental items';
      return;
    }
    
    isSubmitting = true;
    error = '';

    try {
      // Prepare listing data
      const listingData: Omit<ListingData, 'id' | 'imageUrls' | 'createdAt' | 'updatedAt' | 'views' | 'featured'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        listingType: formData.listingType,
        condition: formData.condition,
        brand: formData.brand.trim() || undefined,
        size: formData.size.trim() || undefined,
        weight: formData.weight.trim() || undefined,
        availabilityDates: formData.availabilityDates,
        tags: formData.tags,
        ownerId: user.uid,
        ownerEmail: user.email || '',
        status: 'active'
      };

      // Add pricing based on listing type
      if (formData.listingType === 'sale') {
        listingData.price = formData.price;
      } else {
        listingData.rentalPrice = formData.rentalPrice;
        listingData.rentalPeriod = formData.rentalPeriod;
      }

      // Create listing in Firestore
      const listingId = await createListing(listingData, formData.images);

      successMessage = 'Listing created successfully!';
      showToast('success', 'Your gear listing has been created!');

      // Dispatch success event
      setTimeout(() => {
        dispatch('success', { listingId });
      }, 1500);

    } catch (err: any) {
      error = err.message || 'Failed to create listing';
      showToast('error', 'Failed to create listing. Please try again.');
    } finally {
      isSubmitting = false;
    }
  };
  
  const handleCancel = () => {
    dispatch('cancel');
  };
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Form Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-neutral-900 mb-2">List Your Gear</h1>
    <p class="text-neutral-600">
      Share your outdoor equipment with the GearGrab community
    </p>
  </div>
  
  <!-- Success Message -->
  {#if successMessage}
    <div class="mb-6">
      <SuccessBanner message={successMessage} dismissible={false} autoHide={false} />
    </div>
  {/if}
  
  <!-- Error Message -->
  {#if error}
    <div class="mb-6">
      <ErrorBanner message={error} onDismiss={() => error = ''} />
    </div>
  {/if}
  
  <form on:submit={handleSubmit} class="space-y-8">
    <!-- Basic Information Card -->
    <div class="bg-white rounded-2xl shadow-lg p-8">
      <h2 class="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-6">
        Basic Information
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Title -->
        <div class="md:col-span-2">
          <label for="title" class="block text-sm font-medium text-neutral-700 mb-2">
            Item Title *
          </label>
          <input
            type="text"
            id="title"
            bind:value={formData.title}
            disabled={isSubmitting}
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            placeholder="e.g., Patagonia Down Sweater Jacket - Size M"
            required
          />
        </div>
        
        <!-- Category -->
        <div>
          <label for="category" class="block text-sm font-medium text-neutral-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            bind:value={formData.category}
            disabled={isSubmitting}
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            required
          >
            <option value="">Select a category</option>
            {#each categories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </div>
        
        <!-- Condition -->
        <div>
          <label for="condition" class="block text-sm font-medium text-neutral-700 mb-2">
            Condition *
          </label>
          <select
            id="condition"
            bind:value={formData.condition}
            disabled={isSubmitting}
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            required
          >
            <option value="">Select condition</option>
            {#each conditions as condition}
              <option value={condition}>{condition}</option>
            {/each}
          </select>
        </div>
        
        <!-- Brand -->
        <div>
          <label for="brand" class="block text-sm font-medium text-neutral-700 mb-2">
            Brand
          </label>
          <input
            type="text"
            id="brand"
            bind:value={formData.brand}
            disabled={isSubmitting}
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            placeholder="e.g., Patagonia"
          />
        </div>
        
        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-neutral-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            id="location"
            bind:value={formData.location}
            disabled={isSubmitting}
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            placeholder="City, State"
            required
          />
        </div>
      </div>
      
      <!-- Description -->
      <div class="mt-6">
        <label for="description" class="block text-sm font-medium text-neutral-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          bind:value={formData.description}
          disabled={isSubmitting}
          rows="6"
          class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
          placeholder="Describe your item's condition, features, and any relevant details..."
          required
        ></textarea>
      </div>
    </div>

    <!-- Listing Type & Pricing Card -->
    <div class="bg-white rounded-2xl shadow-lg p-8">
      <h2 class="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-6">
        Listing Type & Pricing
      </h2>

      <!-- Listing Type Toggle -->
      <div class="mb-6">
        <fieldset>
          <legend class="block text-sm font-medium text-neutral-700 mb-4">
            Listing Type *
          </legend>
        <div class="flex space-x-4">
          <label class="flex items-center">
            <input
              type="radio"
              bind:group={formData.listingType}
              value="sale"
              disabled={isSubmitting}
              class="w-4 h-4 text-primary-500 border-neutral-300 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm font-medium text-neutral-700">For Sale</span>
          </label>
          <label class="flex items-center">
            <input
              type="radio"
              bind:group={formData.listingType}
              value="rent"
              disabled={isSubmitting}
              class="w-4 h-4 text-primary-500 border-neutral-300 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm font-medium text-neutral-700">For Rent</span>
          </label>
        </div>
        </fieldset>
      </div>

      <!-- Pricing Fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#if !isRental}
          <!-- Sale Price -->
          <div>
            <label for="price" class="block text-sm font-medium text-neutral-700 mb-2">
              Sale Price *
            </label>
            <div class="relative">
              <span class="absolute left-3 top-3 text-neutral-500">$</span>
              <input
                type="number"
                id="price"
                bind:value={formData.price}
                disabled={isSubmitting}
                class="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                placeholder="0.00"
                step="0.01"
                min="0"
                required={!isRental}
              />
            </div>
          </div>
        {:else}
          <!-- Rental Price -->
          <div>
            <label for="rentalPrice" class="block text-sm font-medium text-neutral-700 mb-2">
              Rental Price *
            </label>
            <div class="relative">
              <span class="absolute left-3 top-3 text-neutral-500">$</span>
              <input
                type="number"
                id="rentalPrice"
                bind:value={formData.rentalPrice}
                disabled={isSubmitting}
                class="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
                placeholder="0.00"
                step="0.01"
                min="0"
                required={isRental}
              />
            </div>
          </div>

          <!-- Rental Period -->
          <div>
            <label for="rentalPeriod" class="block text-sm font-medium text-neutral-700 mb-2">
              Per
            </label>
            <select
              id="rentalPeriod"
              bind:value={formData.rentalPeriod}
              disabled={isSubmitting}
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        {/if}
      </div>
    </div>

    <!-- Additional Details Card -->
    <div class="bg-white rounded-2xl shadow-lg p-8">
      <h2 class="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-6">
        Additional Details
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Size -->
        <div>
          <label for="size" class="block text-sm font-medium text-neutral-700 mb-2">
            Size
          </label>
          <input
            type="text"
            id="size"
            bind:value={formData.size}
            disabled={isSubmitting}
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            placeholder="e.g., Medium, 65L"
          />
        </div>

        <!-- Weight -->
        <div>
          <label for="weight" class="block text-sm font-medium text-neutral-700 mb-2">
            Weight
          </label>
          <input
            type="text"
            id="weight"
            bind:value={formData.weight}
            disabled={isSubmitting}
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            placeholder="e.g., 2.5 lbs"
          />
        </div>

        <!-- Tags -->
        <div>
          <label for="tags" class="block text-sm font-medium text-neutral-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            disabled={isSubmitting}
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100"
            placeholder="hiking, waterproof, lightweight"
          />
        </div>
      </div>
    </div>

    <!-- Images Card -->
    <div class="bg-white rounded-2xl shadow-lg p-8">
      <h2 class="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-6">
        Photos
      </h2>

      <ImageUploader
        bind:images={formData.images}
        disabled={isSubmitting}
        on:imagesChange={(e) => formData.images = e.detail.images}
      />
    </div>

    <!-- Availability Card (for rentals) -->
    {#if isRental}
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h2 class="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-6">
          Availability
        </h2>

        <div class="space-y-4">
          <p class="text-sm text-neutral-600">
            Select the dates when your item is available for rent. You can select multiple dates or date ranges.
          </p>

          <AvailabilityCalendar
            bind:selectedDates={formData.availabilityDates}
            disabled={isSubmitting}
            on:datesChange={(e) => formData.availabilityDates = e.detail.dates}
          />
        </div>
      </div>
    {/if}

    <!-- Form Actions -->
    <div class="flex justify-end space-x-4">
      <button
        type="button"
        on:click={handleCancel}
        disabled={isSubmitting}
        class="px-6 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Cancel
      </button>
      
      <button
        type="submit"
        disabled={isSubmitting}
        class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
      >
        {#if isSubmitting}
          <LoadingSpinner size="sm" color="white" />
          <span class="ml-2">Creating Listing...</span>
        {:else}
          Create Listing
        {/if}
      </button>
    </div>
  </form>
</div>
