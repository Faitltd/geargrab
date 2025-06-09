<script lang="ts">
  import { onMount } from 'svelte';
  import ImageUploader from '$lib/components/ImageUploader.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/ScrollLinkedAnimator.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/ScrollLinkedSequential.svelte';
  import VideoBackground from '$lib/components/layout/VideoBackground.svelte';
  import { authStore } from '$lib/stores/auth';
  import { createListing, getListing, updateListing } from '$lib/firebase/db/listings';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Listing } from '$lib/types/firestore';
  import { toastNotifications } from '$lib/stores/notifications';
  import Modal from '$lib/components/ui/Modal.svelte';

  let heroVisible = false;

  // Edit mode variables
  let isEditMode = false;
  let editingListingId: string | null = null;
  let originalListing: Listing | null = null;
  let isLoadingListing = false;

  // Initialize animations and check for edit mode
  onMount(async () => {
    setTimeout(() => {
      heroVisible = true;
    }, 100);

    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
      await loadListingForEdit(editId);
    }
  });

  // Load listing for editing
  async function loadListingForEdit(listingId: string) {
    try {
      isLoadingListing = true;
      const listing = await getListing(listingId);

      if (!listing) {
        toastNotifications.error('Listing not found');
        goto('/list-gear');
        return;
      }

      // Check if user owns this listing
      if (listing.ownerUid !== $authStore.user?.uid) {
        toastNotifications.error('You can only edit your own listings');
        goto('/list-gear');
        return;
      }

      // Set edit mode
      isEditMode = true;
      editingListingId = listingId;
      originalListing = listing;

      // Populate form with existing data
      populateFormFromListing(listing);

    } catch (error) {
      console.error('Error loading listing for edit:', error);
      toastNotifications.error('Error loading listing. Please try again.');
      goto('/list-gear');
    } finally {
      isLoadingListing = false;
    }
  }

  // Populate form with listing data
  function populateFormFromListing(listing: Listing) {
    formData = {
      // Basic info
      title: listing.title || '',
      category: listing.category || '',
      subcategory: listing.subcategory || '',
      description: listing.description || '',

      // Details
      brand: listing.brand || '',
      model: listing.model || '',
      condition: listing.condition || 'Like New',
      ageInYears: listing.ageInYears || 0,

      // Features and specifications
      features: listing.features && listing.features.length > 0 ? listing.features : ['', '', ''],
      specifications: listing.specifications ?
        Object.entries(listing.specifications).map(([key, value]) => ({ key, value })) :
        [{ key: '', value: '' }, { key: '', value: '' }, { key: '', value: '' }],

      // Images
      images: listing.images || [],

      // Pricing
      dailyPrice: listing.dailyPrice || 0,
      weeklyPrice: listing.weeklyPrice || 0,
      monthlyPrice: listing.monthlyPrice || 0,
      securityDeposit: listing.securityDeposit || 0,

      // Location
      city: listing.location?.city || '',
      state: listing.location?.state || '',
      zipCode: listing.location?.zipCode || '',

      // Delivery options
      pickup: listing.deliveryOptions?.pickup || false,
      dropoff: listing.deliveryOptions?.dropoff || false,
      shipping: listing.deliveryOptions?.shipping || false,
      pickupLocation: listing.deliveryOptions?.pickupLocation || '',
      dropoffDistance: listing.deliveryOptions?.dropoffDistance || 0,
      shippingFee: listing.deliveryOptions?.shippingFee || 0,

      // Availability - convert from availabilityCalendar to unavailableDates
      unavailableDates: listing.availabilityCalendar ?
        Object.entries(listing.availabilityCalendar)
          .filter(([_, isAvailable]) => !isAvailable)
          .map(([date, _]) => date) : [],

      // Insurance
      includesInsurance: listing.includesInsurance || false,
      insuranceDetails: listing.insuranceDetails || ''
    };
  }



  // Define types for form data
  type Specification = {
    key: string;
    value: string;
  };

  type FormData = {
    // Basic info
    title: string;
    category: string;
    subcategory: string;
    description: string;

    // Details
    brand: string;
    model: string;
    condition: string;
    ageInYears: number;

    // Features and specifications
    features: string[];
    specifications: Specification[];

    // Images
    images: string[];

    // Pricing
    dailyPrice: number;
    weeklyPrice: number;
    monthlyPrice: number;
    securityDeposit: number;

    // Location
    city: string;
    state: string;
    zipCode: string;

    // Delivery options
    pickup: boolean;
    dropoff: boolean;
    shipping: boolean;
    pickupLocation: string;
    dropoffDistance: number;
    shippingFee: number;

    // Availability
    unavailableDates: string[];

    // Insurance
    includesInsurance: boolean;
    insuranceDetails: string;
  };

  // Form state
  let currentStep = 1;
  const totalSteps = 5;

  // Initialize form data
  let formData: FormData = {
    // Basic info
    title: '',
    category: '',
    subcategory: '',
    description: '',

    // Details
    brand: '',
    model: '',
    condition: 'Like New',
    ageInYears: 0,

    // Features and specifications
    features: ['', '', ''],
    specifications: [
      { key: '', value: '' },
      { key: '', value: '' },
      { key: '', value: '' }
    ],

    // Images
    images: [],

    // Pricing
    dailyPrice: 0,
    weeklyPrice: 0,
    monthlyPrice: 0,
    securityDeposit: 0,

    // Location
    city: '',
    state: '',
    zipCode: '',

    // Delivery options
    pickup: true,
    dropoff: false,
    shipping: false,
    pickupLocation: '',
    dropoffDistance: 0,
    shippingFee: 0,

    // Availability
    unavailableDates: [],

    // Insurance
    includesInsurance: false,
    insuranceDetails: ''
  };

  // Form validation errors
  type FormErrors = {
    [key: string]: string;
  };

  let errors: FormErrors = {};
  let stepValidationStatus: { [key: number]: boolean } = {};
  let validationSummary = {
    hasErrors: false,
    errorSteps: [],
    totalErrors: 0
  };

  // Track which steps have been attempted (to show errors only after user tries to proceed)
  let attemptedSteps: { [key: number]: boolean } = {};

  // Available categories
  const categories = [
    { id: 'camping', name: 'Camping', subcategories: ['Tents', 'Sleeping Bags', 'Cooking', 'Backpacks'] },
    { id: 'hiking', name: 'Hiking', subcategories: ['Backpacks', 'Footwear', 'Clothing', 'Navigation'] },
    { id: 'skiing', name: 'Skiing', subcategories: ['Skis', 'Boots', 'Poles', 'Clothing'] },
    { id: 'water-sports', name: 'Water Sports', subcategories: ['Kayaks', 'Paddleboards', 'Surfboards', 'Life Vests'] },
    { id: 'climbing', name: 'Climbing', subcategories: ['Ropes', 'Harnesses', 'Shoes', 'Helmets'] },
    { id: 'biking', name: 'Biking', subcategories: ['Mountain Bikes', 'Road Bikes', 'Helmets', 'Accessories'] }
  ];

  const conditions = ['Like New', 'Excellent', 'Good', 'Fair', 'Worn'];

  // Get subcategories for selected category
  $: subcategories = formData.category ?
    categories.find(c => c.id === formData.category)?.subcategories || [] : [];

  // Calculate suggested weekly and monthly prices
  $: {
    if (formData.dailyPrice > 0) {
      formData.weeklyPrice = Math.round(formData.dailyPrice * 6);
      formData.monthlyPrice = Math.round(formData.dailyPrice * 24);
    }
  }

  // Validation function
  function validateStep(step: number): boolean {
    errors = {};

    if (step === 1) {
      // Basic Information
      if (!formData.title.trim()) {
        errors.title = 'Title is required';
      } else if (formData.title.trim().length < 5) {
        errors.title = 'Title must be at least 5 characters long';
      }

      if (!formData.category) {
        errors.category = 'Category is required';
      }

      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      } else if (formData.description.trim().length < 20) {
        errors.description = 'Description must be at least 20 characters long';
      }

    } else if (step === 2) {
      // Details
      if (!formData.brand.trim()) {
        errors.brand = 'Brand is required';
      }

      if (!formData.condition) {
        errors.condition = 'Condition is required';
      }

      const validFeatures = formData.features.filter(f => f.trim() !== '');
      if (validFeatures.length === 0) {
        errors.features = 'At least one feature is required';
      }

      formData.specifications.forEach((spec, index) => {
        if (spec.key.trim() && !spec.value.trim()) {
          errors[`spec_${index}_value`] = `Value required for specification "${spec.key}"`;
        }
        if (spec.value.trim() && !spec.key.trim()) {
          errors[`spec_${index}_key`] = `Key required for specification value "${spec.value}"`;
        }
      });

    } else if (step === 3) {
      // Images
      if (formData.images.length === 0) {
        errors.images = 'At least one image is required';
      }

    } else if (step === 4) {
      // Pricing & Location
      if (formData.dailyPrice <= 0) {
        errors.dailyPrice = 'Daily price must be greater than $0';
      }

      if (formData.securityDeposit < 0) {
        errors.securityDeposit = 'Security deposit cannot be negative';
      }

      if (!formData.city.trim()) {
        errors.city = 'City is required';
      }

      if (!formData.state.trim()) {
        errors.state = 'State is required';
      }

      if (!formData.zipCode.trim()) {
        errors.zipCode = 'ZIP code is required';
      } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
        errors.zipCode = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
      }

      if (formData.pickup && !formData.pickupLocation.trim()) {
        errors.pickupLocation = 'Pickup location is required when pickup is enabled';
      }

      if (formData.dropoff && formData.dropoffDistance <= 0) {
        errors.dropoffDistance = 'Dropoff distance must be greater than 0 when dropoff is enabled';
      }

      if (formData.shipping && formData.shippingFee < 0) {
        errors.shippingFee = 'Shipping fee cannot be negative when shipping is enabled';
      }

      if (!formData.pickup && !formData.dropoff && !formData.shipping) {
        errors.deliveryOptions = 'At least one delivery option must be selected';
      }
    }

    const isValid = Object.keys(errors).length === 0;
    stepValidationStatus[step] = isValid;
    return isValid;
  }

  // Helper functions
  function handleImagesChange(event: CustomEvent): void {
    formData.images = event.detail.images;
    if (currentStep === 3) {
      validateStep(3);
    }
  }

  function addFeatureField(): void {
    formData.features = [...formData.features, ''];
  }

  function removeFeatureField(index: number): void {
    formData.features = formData.features.filter((_, i) => i !== index);
    if (currentStep === 2) {
      validateStep(2);
    }
  }

  function addSpecificationField(): void {
    formData.specifications = [...formData.specifications, { key: '', value: '' }];
  }

  function removeSpecificationField(index: number): void {
    formData.specifications = formData.specifications.filter((_, i) => i !== index);
    if (currentStep === 2) {
      validateStep(2);
    }
  }

  function toggleDateAvailability(event: CustomEvent): void {
    const dateString = event.detail.date;
    if (formData.unavailableDates.includes(dateString)) {
      formData.unavailableDates = formData.unavailableDates.filter(d => d !== dateString);
    } else {
      formData.unavailableDates = [...formData.unavailableDates, dateString];
    }
  }

  function prevStep(): void {
    if (currentStep > 1) {
      currentStep--;
      window.scrollTo(0, 0);
    }
  }

  let isSubmitting = false;

  // Success modal state
  let showSuccessModal = false;
  let successMessage = '';
  let successRedirectUrl = '';

  // Navigation and submission functions
  function getValidationSummary() {
    const stepNames = ['Basic Information', 'Details', 'Images', 'Pricing & Location', 'Preview'];
    const errorSteps = [];
    let totalErrors = 0;

    for (let step = 1; step <= 4; step++) {
      const isValid = validateStep(step);
      if (!isValid) {
        errorSteps.push({
          step: step,
          name: stepNames[step - 1],
          errorCount: Object.keys(errors).length
        });
        totalErrors += Object.keys(errors).length;
      }
    }

    return {
      hasErrors: errorSteps.length > 0,
      errorSteps,
      totalErrors
    };
  }

  function nextStep(): void {
    if (currentStep < totalSteps) {
      // Mark this step as attempted
      attemptedSteps[currentStep] = true;

      const isValid = validateStep(currentStep);

      if (!isValid) {
        const stepNames = ['Basic Information', 'Details', 'Images', 'Pricing & Location', 'Preview'];
        const errorCount = Object.keys(errors).length;
        const errorList = Object.values(errors).join(', ');
        toastNotifications.error(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} in ${stepNames[currentStep - 1]}: ${errorList}`);
        return;
      }

      currentStep++;
      window.scrollTo(0, 0);
    }
  }

  function goToStep(step: number): void {
    validateStep(currentStep);
    currentStep = step;
    window.scrollTo(0, 0);
  }

  async function submitForm(): Promise<void> {
    if (!$authStore.user) {
      toastNotifications.error('Please sign in to list your gear.');
      goto('/auth/signin');
      return;
    }

    validationSummary = getValidationSummary();

    if (validationSummary.hasErrors) {
      const firstErrorStep = validationSummary.errorSteps[0].step;
      currentStep = firstErrorStep;
      window.scrollTo(0, 0);

      const errorDetails = validationSummary.errorSteps.map(stepError =>
        `${stepError.name} (${stepError.errorCount} error${stepError.errorCount > 1 ? 's' : ''})`
      ).join(', ');

      const errorMessage = `Please fix ${validationSummary.totalErrors} validation error${validationSummary.totalErrors > 1 ? 's' : ''} in: ${errorDetails}. You've been taken to the first section with errors.`;

      toastNotifications.error(errorMessage);
      return;
    }

    isSubmitting = true;

    try {
      const listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'> = {
        ownerUid: $authStore.user.uid,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || '',
        brand: formData.brand || '',
        model: formData.model || '',
        condition: formData.condition as 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor',
        ageInYears: formData.ageInYears || 0,
        dailyPrice: formData.dailyPrice,
        weeklyPrice: formData.weeklyPrice || 0,
        monthlyPrice: formData.monthlyPrice || 0,
        securityDeposit: formData.securityDeposit,
        location: {
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        deliveryOptions: {
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          shipping: formData.shipping,
          pickupLocation: formData.pickup ? formData.pickupLocation : '',
          dropoffDistance: formData.dropoff ? formData.dropoffDistance : 0,
          shippingFee: formData.shipping ? formData.shippingFee : 0
        },
        images: formData.images,
        features: formData.features.filter(f => f.trim() !== ''),
        specifications: formData.specifications
          .filter(spec => spec.key.trim() !== '' && spec.value.trim() !== '')
          .reduce((acc, spec) => {
            acc[spec.key] = spec.value;
            return acc;
          }, {} as Record<string, string>),
        includesInsurance: formData.includesInsurance,
        insuranceDetails: formData.includesInsurance ? formData.insuranceDetails : '',
        availabilityCalendar: {},
        status: 'active' as const,
        averageRating: 0,
        reviewCount: 0
      };

      if (isEditMode && editingListingId) {
        // Update existing listing
        await updateListing(editingListingId, listingData);
        console.log('Listing updated successfully with ID:', editingListingId);

        // Show success modal
        successMessage = 'Your listing has been updated successfully!';
        successRedirectUrl = `/listing/${editingListingId}`;
        showSuccessModal = true;
      } else {
        // Create new listing
        const listingId = await createListing(listingData);
        console.log('Listing created successfully with ID:', listingId);

        // Show success modal
        successMessage = 'Your gear has been listed successfully! You can view and manage your listings in your dashboard.';
        successRedirectUrl = `/listing/${listingId}`;
        showSuccessModal = true;
      }

    } catch (error) {
      console.error('Error creating listing:', error);
      toastNotifications.error('There was an error creating your listing. Please try again.');
    } finally {
      isSubmitting = false;
    }
  }

  // Reactive validation - only run if step has been attempted
  $: {
    if (currentStep <= 4 && attemptedSteps[currentStep]) {
      validateStep(currentStep);
    }
  }

  // Handle success modal close and redirect
  function handleSuccessModalClose() {
    showSuccessModal = false;
    if (successRedirectUrl) {
      goto(successRedirectUrl);
    }
  }

</script>

<!-- Full Page Video Background -->
<VideoBackground
  videoSrc="/Milky Way.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity={0.4}
/>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen">
  <!-- Loading State for Edit Mode -->
  {#if isLoadingListing}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-white text-lg">Loading listing for editing...</p>
      </div>
    </div>
  {:else}
    <!-- Hero Content -->
    <div class="relative pt-20 pb-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Hero Section -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0} endOffset={0.4}>
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            {isEditMode ? 'Edit Your Listing' : 'List Your Gear'}
          </h1>
          <p class="text-xl text-gray-200 drop-shadow-lg max-w-2xl mx-auto">
            {isEditMode ? 'Update your gear listing information' : 'Share your outdoor equipment with fellow adventurers and earn money'}
          </p>
        </div>
      </ScrollLinkedAnimator>

      <!-- Progress bar -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.1} endOffset={0.5}>
        <div class="mb-8">
          <div class="flex justify-between mb-2">
            {#each Array(totalSteps) as _, i}
              <div class="flex flex-col items-center relative">
                <button
                  type="button"
                  class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 {i + 1 <= currentStep ? (attemptedSteps[i + 1] && stepValidationStatus[i + 1] === false ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-green-500 text-white') : 'bg-gray-600/70 text-gray-300 border border-gray-500 hover:bg-gray-600/90'}"
                  on:click={() => goToStep(i + 1)}
                  title={stepValidationStatus[i + 1] === false ? 'This step has validation errors - click to review' : `Go to step ${i + 1}`}
                >
                  {#if attemptedSteps[i + 1] && stepValidationStatus[i + 1] === false && i + 1 <= currentStep}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  {:else if attemptedSteps[i + 1] && stepValidationStatus[i + 1] === true && i + 1 < currentStep}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  {:else}
                    {i + 1}
                  {/if}
                </button>
                <div class="text-xs mt-1 text-gray-300 drop-shadow-lg text-center whitespace-pre-line">
                  {i === 0 ? 'Basic Info' : i === 1 ? 'Details' : i === 2 ? 'Images' : i === 3 ? 'Pricing &\nLocation' : 'Preview'}
                  {#if attemptedSteps[i + 1] && stepValidationStatus[i + 1] === false && i + 1 <= currentStep}
                    <div class="text-red-400 text-xs">Has errors</div>
                  {/if}
                </div>
              </div>

              {#if i < totalSteps - 1}
                <div class="flex-1 flex items-center">
                  <div class="h-1 w-full {i + 1 < currentStep ? (attemptedSteps[i + 1] && stepValidationStatus[i + 1] === false ? 'bg-red-400' : 'bg-green-500') : 'bg-gray-600/50'}"></div>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </ScrollLinkedAnimator>

      <!-- Form steps -->
      {#if currentStep === 1}
        <!-- Step 1: Basic Information -->
        <ScrollLinkedAnimator animation="scale-in" startOffset={0.2} endOffset={0.7}>
          <div class="space-y-8">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold text-white drop-shadow-lg">Basic Information</h2>
            </div>

          <!-- Error Summary - Only show if step has been attempted -->
          {#if attemptedSteps[1] && stepValidationStatus[1] === false && Object.keys(errors).length > 0}
            <div class="max-w-md mx-auto mb-6">
              <div class="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-300">
                      Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} in Basic Information:
                    </h3>
                    <ul class="mt-2 text-sm text-red-200 list-disc list-inside">
                      {#each Object.entries(errors) as [field, error]}
                        <li>{error}</li>
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Title Field -->
          <div class="max-w-md mx-auto">
            <label for="title" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Title *</label>
            <input
              type="text"
              id="title"
              bind:value={formData.title}
              class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[1] && errors.title ? 'border-red-500 ring-red-500' : ''}"
              placeholder="e.g., REI Co-op Half Dome 4 Plus Tent"
            />
            {#if attemptedSteps[1] && errors.title}
              <p class="mt-1 text-sm text-red-400">{errors.title}</p>
            {/if}
          </div>

          <!-- Category Field -->
          <div class="max-w-md mx-auto">
            <label for="category" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Category *</label>
            <select
              id="category"
              bind:value={formData.category}
              class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[1] && errors.category ? 'border-red-500 ring-red-500' : ''}"
            >
              <option value="" class="bg-gray-800 text-white">Select a category</option>
              {#each categories as category}
                <option value={category.id} class="bg-gray-800 text-white">{category.name}</option>
              {/each}
            </select>
            {#if attemptedSteps[1] && errors.category}
              <p class="mt-1 text-sm text-red-400">{errors.category}</p>
            {/if}
          </div>

          <!-- Subcategory Field -->
          {#if subcategories.length > 0}
            <div class="max-w-md mx-auto">
              <label for="subcategory" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Subcategory</label>
              <select
                id="subcategory"
                bind:value={formData.subcategory}
                class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white focus:ring-green-500 focus:border-green-500 shadow-lg"
              >
                <option value="" class="bg-gray-800 text-white">Select a subcategory</option>
                {#each subcategories as subcategory}
                  <option value={subcategory} class="bg-gray-800 text-white">{subcategory}</option>
                {/each}
              </select>
            </div>
          {/if}

          <!-- Description Field -->
          <div class="max-w-lg mx-auto">
            <label for="description" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Description *</label>
            <textarea
              id="description"
              bind:value={formData.description}
              class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[1] && errors.description ? 'border-red-500 ring-red-500' : ''}"
              rows="4"
              placeholder="Describe your gear in detail. Include features, benefits, and condition."
            ></textarea>
            {#if attemptedSteps[1] && errors.description}
              <p class="mt-1 text-sm text-red-400">{errors.description}</p>
            {/if}
            <p class="mt-1 text-xs text-gray-400">
              {formData.description.length}/20 characters minimum
            </p>
          </div>
        </div>
        </ScrollLinkedAnimator>
      {/if}
      {#if currentStep === 2}
        <!-- Step 2: Gear Details -->
        <ScrollLinkedAnimator animation="scale-in" startOffset={0.2} endOffset={0.7}>
          <div class="space-y-8">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold text-white drop-shadow-lg">Gear Details</h2>
            </div>

          <!-- Error Summary - Only show if step has been attempted -->
          {#if attemptedSteps[2] && stepValidationStatus[2] === false && Object.keys(errors).length > 0}
            <div class="max-w-md mx-auto mb-6">
              <div class="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-300">
                      Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} in Gear Details:
                    </h3>
                    <ul class="mt-2 text-sm text-red-200 list-disc list-inside">
                      {#each Object.entries(errors) as [field, error]}
                        <li>{error}</li>
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Brand Field -->
          <div class="max-w-md mx-auto">
            <label for="brand" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Brand *</label>
            <input
              type="text"
              id="brand"
              bind:value={formData.brand}
              class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[2] && errors.brand ? 'border-red-500 ring-red-500' : ''}"
              placeholder="e.g., REI Co-op, Patagonia, North Face"
            />
            {#if attemptedSteps[2] && errors.brand}
              <p class="mt-1 text-sm text-red-400">{errors.brand}</p>
            {/if}
          </div>

          <!-- Model Field -->
          <div class="max-w-md mx-auto">
            <label for="model" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Model</label>
            <input
              type="text"
              id="model"
              bind:value={formData.model}
              class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
              placeholder="e.g., Half Dome 4 Plus"
            />
          </div>

          <!-- Condition Field -->
          <div class="max-w-md mx-auto">
            <label for="condition" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Condition *</label>
            <select
              id="condition"
              bind:value={formData.condition}
              class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[2] && errors.condition ? 'border-red-500 ring-red-500' : ''}"
            >
              {#each conditions as condition}
                <option value={condition} class="bg-gray-800 text-white">{condition}</option>
              {/each}
            </select>
            {#if attemptedSteps[2] && errors.condition}
              <p class="mt-1 text-sm text-red-400">{errors.condition}</p>
            {/if}
          </div>

          <!-- Age Field -->
          <div class="max-w-md mx-auto">
            <label for="age" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Age (years)</label>
            <input
              type="number"
              id="age"
              bind:value={formData.ageInYears}
              min="0"
              max="50"
              class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
              placeholder="0"
            />
          </div>

          <!-- Features -->
          <div class="max-w-lg mx-auto">
            <label class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Key Features *</label>
            {#each formData.features as feature, index}
              <div class="flex gap-2 mb-2">
                <input
                  type="text"
                  bind:value={formData.features[index]}
                  class="flex-1 rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
                  placeholder="e.g., Waterproof, Lightweight, Easy setup"
                />
                {#if formData.features.length > 1}
                  <button
                    type="button"
                    on:click={() => removeFeatureField(index)}
                    class="px-3 py-2 bg-red-600/70 hover:bg-red-600/90 text-white rounded-lg transition-all duration-200"
                  >
                    ×
                  </button>
                {/if}
              </div>
            {/each}
            <button
              type="button"
              on:click={addFeatureField}
              class="mt-2 px-4 py-2 bg-green-600/70 hover:bg-green-600/90 text-white rounded-lg transition-all duration-200"
            >
              + Add Feature
            </button>
            {#if attemptedSteps[2] && errors.features}
              <p class="mt-1 text-sm text-red-400">{errors.features}</p>
            {/if}
          </div>
        </div>
        </ScrollLinkedAnimator>
      {/if}

      {#if currentStep === 3}
        <!-- Step 3: Images -->
        <ScrollLinkedAnimator animation="scale-in" startOffset={0.2} endOffset={0.7}>
          <div class="space-y-8">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold text-white drop-shadow-lg">Images</h2>
              <p class="text-gray-200 drop-shadow-lg">Add photos to showcase your gear</p>
            </div>

          <!-- Error Summary - Only show if step has been attempted -->
          {#if attemptedSteps[3] && stepValidationStatus[3] === false && Object.keys(errors).length > 0}
            <div class="max-w-md mx-auto mb-6">
              <div class="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-300">
                      Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} in Images:
                    </h3>
                    <ul class="mt-2 text-sm text-red-200 list-disc list-inside">
                      {#each Object.entries(errors) as [field, error]}
                        <li>{error}</li>
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Image Upload -->
          <div class="max-w-lg mx-auto">
            <ImageUploader
              bind:images={formData.images}
              on:change={handleImagesChange}
              maxImages={10}
            />
            {#if attemptedSteps[3] && errors.images}
              <p class="mt-2 text-sm text-red-400">{errors.images}</p>
            {/if}
            <p class="mt-2 text-xs text-gray-400">
              Upload up to 10 high-quality photos. The first image will be your main photo.
            </p>
          </div>

          <!-- Image Preview -->
          {#if formData.images.length > 0}
            <div class="max-w-4xl mx-auto">
              <h3 class="text-lg font-medium text-white mb-4 text-center">Your Photos ({formData.images.length})</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {#each formData.images as image, index}
                  <div class="relative group">
                    <img
                      src={image}
                      alt="Gear photo {index + 1}"
                      class="w-full h-32 object-cover rounded-lg shadow-lg"
                    />
                    {#if index === 0}
                      <div class="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        Main Photo
                      </div>
                    {/if}
                    <button
                      type="button"
                      on:click={() => {
                        formData.images = formData.images.filter((_, i) => i !== index);
                        if (currentStep === 3) validateStep(3);
                      }}
                      class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        </ScrollLinkedAnimator>
      {/if}

      {#if currentStep === 4}
        <!-- Step 4: Pricing & Location -->
        <ScrollLinkedAnimator animation="scale-in" startOffset={0.2} endOffset={0.7}>
          <div class="space-y-8">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold text-white drop-shadow-lg">Pricing & Location</h2>
              <p class="text-gray-200 drop-shadow-lg">Set your rental rates and location</p>
            </div>

          <!-- Error Summary - Only show if step has been attempted -->
          {#if attemptedSteps[4] && stepValidationStatus[4] === false && Object.keys(errors).length > 0}
            <div class="max-w-md mx-auto mb-6">
              <div class="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-300">
                      Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} in Pricing & Location:
                    </h3>
                    <ul class="mt-2 text-sm text-red-200 list-disc list-inside">
                      {#each Object.entries(errors) as [field, error]}
                        <li>{error}</li>
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Pricing Section -->
          <div class="max-w-lg mx-auto">
            <h3 class="text-xl font-semibold text-white mb-6 text-center">Rental Pricing</h3>

            <!-- Daily Price -->
            <div class="mb-4">
              <label for="dailyPrice" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Daily Rate *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">$</span>
                <input
                  type="number"
                  id="dailyPrice"
                  bind:value={formData.dailyPrice}
                  min="1"
                  step="0.01"
                  class="block w-full pl-8 rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[4] && errors.dailyPrice ? 'border-red-500 ring-red-500' : ''}"
                  placeholder="25.00"
                />
              </div>
              {#if attemptedSteps[4] && errors.dailyPrice}
                <p class="mt-1 text-sm text-red-400">{errors.dailyPrice}</p>
              {/if}
            </div>

            <!-- Weekly Price (auto-calculated) -->
            <div class="mb-4">
              <label for="weeklyPrice" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Weekly Rate (suggested)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">$</span>
                <input
                  type="number"
                  id="weeklyPrice"
                  bind:value={formData.weeklyPrice}
                  min="0"
                  step="0.01"
                  class="block w-full pl-8 rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
                  placeholder="150.00"
                />
              </div>
              <p class="mt-1 text-xs text-gray-400">Suggested: 6x daily rate (1 day free)</p>
            </div>

            <!-- Monthly Price (auto-calculated) -->
            <div class="mb-6">
              <label for="monthlyPrice" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Monthly Rate (suggested)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">$</span>
                <input
                  type="number"
                  id="monthlyPrice"
                  bind:value={formData.monthlyPrice}
                  min="0"
                  step="0.01"
                  class="block w-full pl-8 rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
                  placeholder="600.00"
                />
              </div>
              <p class="mt-1 text-xs text-gray-400">Suggested: 24x daily rate (6 days free)</p>
            </div>

            <!-- Security Deposit -->
            <div class="mb-6">
              <label for="securityDeposit" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Security Deposit *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">$</span>
                <input
                  type="number"
                  id="securityDeposit"
                  bind:value={formData.securityDeposit}
                  min="0"
                  step="0.01"
                  class="block w-full pl-8 rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[4] && errors.securityDeposit ? 'border-red-500 ring-red-500' : ''}"
                  placeholder="100.00"
                />
              </div>
              {#if attemptedSteps[4] && errors.securityDeposit}
                <p class="mt-1 text-sm text-red-400">{errors.securityDeposit}</p>
              {/if}
              <p class="mt-1 text-xs text-gray-400">Refundable deposit to cover potential damages</p>
            </div>
          </div>

          <!-- Location Section -->
          <div class="max-w-lg mx-auto">
            <h3 class="text-xl font-semibold text-white mb-6 text-center">Location</h3>

            <!-- City -->
            <div class="mb-4">
              <label for="city" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">City *</label>
              <input
                type="text"
                id="city"
                bind:value={formData.city}
                class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[4] && errors.city ? 'border-red-500 ring-red-500' : ''}"
                placeholder="e.g., Denver"
              />
              {#if attemptedSteps[4] && errors.city}
                <p class="mt-1 text-sm text-red-400">{errors.city}</p>
              {/if}
            </div>

            <!-- State -->
            <div class="mb-4">
              <label for="state" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">State *</label>
              <input
                type="text"
                id="state"
                bind:value={formData.state}
                class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[4] && errors.state ? 'border-red-500 ring-red-500' : ''}"
                placeholder="e.g., Colorado"
              />
              {#if attemptedSteps[4] && errors.state}
                <p class="mt-1 text-sm text-red-400">{errors.state}</p>
              {/if}
            </div>

            <!-- ZIP Code -->
            <div class="mb-6">
              <label for="zipCode" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">ZIP Code *</label>
              <input
                type="text"
                id="zipCode"
                bind:value={formData.zipCode}
                class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[4] && errors.zipCode ? 'border-red-500 ring-red-500' : ''}"
                placeholder="e.g., 80202"
              />
              {#if attemptedSteps[4] && errors.zipCode}
                <p class="mt-1 text-sm text-red-400">{errors.zipCode}</p>
              {/if}
            </div>
          </div>

          <!-- Delivery Options -->
          <div class="max-w-lg mx-auto">
            <h3 class="text-xl font-semibold text-white mb-6 text-center">Delivery Options</h3>

            <!-- Pickup Option -->
            <div class="mb-4">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.pickup}
                  class="rounded bg-gray-800/70 border-gray-600/50 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                />
                <span class="ml-2 text-white">Pickup available</span>
              </label>
              {#if formData.pickup}
                <div class="mt-2">
                  <input
                    type="text"
                    bind:value={formData.pickupLocation}
                    class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[4] && errors.pickupLocation ? 'border-red-500 ring-red-500' : ''}"
                    placeholder="Pickup location (e.g., Downtown Denver)"
                  />
                  {#if attemptedSteps[4] && errors.pickupLocation}
                    <p class="mt-1 text-sm text-red-400">{errors.pickupLocation}</p>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Dropoff Option -->
            <div class="mb-4">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.dropoff}
                  class="rounded bg-gray-800/70 border-gray-600/50 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                />
                <span class="ml-2 text-white">Dropoff/delivery available</span>
              </label>
              {#if formData.dropoff}
                <div class="mt-2">
                  <input
                    type="number"
                    bind:value={formData.dropoffDistance}
                    min="1"
                    class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[4] && errors.dropoffDistance ? 'border-red-500 ring-red-500' : ''}"
                    placeholder="Maximum delivery distance (miles)"
                  />
                  {#if attemptedSteps[4] && errors.dropoffDistance}
                    <p class="mt-1 text-sm text-red-400">{errors.dropoffDistance}</p>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Shipping Option -->
            <div class="mb-6">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.shipping}
                  class="rounded bg-gray-800/70 border-gray-600/50 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                />
                <span class="ml-2 text-white">Shipping available</span>
              </label>
              {#if formData.shipping}
                <div class="mt-2">
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">$</span>
                    <input
                      type="number"
                      bind:value={formData.shippingFee}
                      min="0"
                      step="0.01"
                      class="block w-full pl-8 rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg {attemptedSteps[4] && errors.shippingFee ? 'border-red-500 ring-red-500' : ''}"
                      placeholder="Shipping fee"
                    />
                  </div>
                  {#if attemptedSteps[4] && errors.shippingFee}
                    <p class="mt-1 text-sm text-red-400">{errors.shippingFee}</p>
                  {/if}
                </div>
              {/if}
            </div>

            {#if attemptedSteps[4] && errors.deliveryOptions}
              <p class="text-sm text-red-400 text-center">{errors.deliveryOptions}</p>
            {/if}
          </div>
        </div>
        </ScrollLinkedAnimator>
      {/if}

      {#if currentStep === 5}
        <!-- Step 5: Preview -->
        <ScrollLinkedAnimator animation="scale-in" startOffset={0.2} endOffset={0.7}>
          <div class="space-y-8">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold text-white drop-shadow-lg">Preview Your Listing</h2>
              <p class="text-gray-200 drop-shadow-lg">Review your listing before publishing</p>
            </div>

          <!-- Validation Summary -->
          {#if validationSummary.hasErrors}
            <div class="max-w-2xl mx-auto mb-8">
              <div class="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg p-6">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-lg font-medium text-red-300 mb-2">
                      Please fix {validationSummary.totalErrors} error{validationSummary.totalErrors > 1 ? 's' : ''} before publishing:
                    </h3>
                    <ul class="space-y-1">
                      {#each validationSummary.errorSteps as errorStep}
                        <li class="flex items-center justify-between">
                          <span class="text-red-200">{errorStep.name}: {errorStep.errorCount} error{errorStep.errorCount > 1 ? 's' : ''}</span>
                          <button
                            type="button"
                            on:click={() => goToStep(errorStep.step)}
                            class="text-red-300 hover:text-red-100 underline text-sm"
                          >
                            Fix →
                          </button>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <div class="max-w-2xl mx-auto mb-8">
              <div class="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-lg p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-green-300">Your listing is ready to publish!</p>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Listing Preview -->
          <div class="max-w-4xl mx-auto">
            <div class="bg-gray-800/70 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-600/50">

              <!-- Header -->
              <div class="mb-6">
                <h3 class="text-2xl font-bold text-white mb-2">{formData.title || 'Your Gear Title'}</h3>
                <div class="flex items-center gap-4 text-gray-300">
                  <span class="bg-green-600/80 text-white px-2 py-1 rounded text-sm">{formData.category || 'Category'}</span>
                  {#if formData.subcategory}
                    <span class="text-sm">{formData.subcategory}</span>
                  {/if}
                  <span class="text-sm">{formData.condition || 'Condition'}</span>
                </div>
              </div>

              <!-- Images Preview -->
              {#if formData.images.length > 0}
                <div class="mb-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each formData.images.slice(0, 6) as image, index}
                      <img
                        src={image}
                        alt="Gear photo {index + 1}"
                        class="w-full h-48 object-cover rounded-lg"
                      />
                    {/each}
                    {#if formData.images.length > 6}
                      <div class="w-full h-48 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <span class="text-gray-300">+{formData.images.length - 6} more</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- Description -->
              <div class="mb-6">
                <h4 class="text-lg font-semibold text-white mb-2">Description</h4>
                <p class="text-gray-300">{formData.description || 'No description provided'}</p>
              </div>

              <!-- Details -->
              <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 class="text-lg font-semibold text-white mb-3">Details</h4>
                  <div class="space-y-2 text-gray-300">
                    {#if formData.brand}
                      <div><span class="font-medium">Brand:</span> {formData.brand}</div>
                    {/if}
                    {#if formData.model}
                      <div><span class="font-medium">Model:</span> {formData.model}</div>
                    {/if}
                    <div><span class="font-medium">Condition:</span> {formData.condition}</div>
                    {#if formData.ageInYears > 0}
                      <div><span class="font-medium">Age:</span> {formData.ageInYears} year{formData.ageInYears > 1 ? 's' : ''}</div>
                    {/if}
                  </div>
                </div>

                <div>
                  <h4 class="text-lg font-semibold text-white mb-3">Pricing</h4>
                  <div class="space-y-2 text-gray-300">
                    <div><span class="font-medium">Daily:</span> ${formData.dailyPrice || 0}/day</div>
                    {#if formData.weeklyPrice > 0}
                      <div><span class="font-medium">Weekly:</span> ${formData.weeklyPrice}/week</div>
                    {/if}
                    {#if formData.monthlyPrice > 0}
                      <div><span class="font-medium">Monthly:</span> ${formData.monthlyPrice}/month</div>
                    {/if}
                    <div><span class="font-medium">Security Deposit:</span> ${formData.securityDeposit || 0}</div>
                  </div>
                </div>
              </div>

              <!-- Features -->
              {#if formData.features.some(f => f.trim() !== '')}
                <div class="mb-6">
                  <h4 class="text-lg font-semibold text-white mb-3">Features</h4>
                  <div class="flex flex-wrap gap-2">
                    {#each formData.features.filter(f => f.trim() !== '') as feature}
                      <span class="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
                        {feature}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Location & Delivery -->
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 class="text-lg font-semibold text-white mb-3">Location</h4>
                  <p class="text-gray-300">
                    {formData.city || 'City'}, {formData.state || 'State'} {formData.zipCode || 'ZIP'}
                  </p>
                </div>

                <div>
                  <h4 class="text-lg font-semibold text-white mb-3">Transfer Options</h4>
                  <div class="space-y-1 text-gray-300">
                    {#if formData.pickup}
                      <div>✓ Pickup available{formData.pickupLocation ? ` at ${formData.pickupLocation}` : ''}</div>
                    {/if}
                    {#if formData.dropoff}
                      <div>✓ Delivery available{formData.dropoffDistance ? ` within ${formData.dropoffDistance} miles` : ''}</div>
                    {/if}
                    {#if formData.shipping}
                      <div>✓ Shipping available{formData.shippingFee ? ` ($${formData.shippingFee})` : ''}</div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollLinkedAnimator>
      {/if}

      <!-- Navigation Buttons -->
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.3} endOffset={0.8}>
        <div class="flex justify-between mt-12">
        {#if currentStep > 1}
          <button
            type="button"
            on:click={prevStep}
            class="bg-gray-600/70 hover:bg-gray-600/90 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-gray-500/50 transition-all duration-200 shadow-lg"
          >
            ← Previous
          </button>
        {:else}
          <div></div>
        {/if}

        {#if currentStep < totalSteps}
          <button
            type="button"
            on:click={nextStep}
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-green-500/50 transition-all duration-200 shadow-lg"
          >
            Next →
          </button>
        {:else}
          <button
            type="button"
            on:click={submitForm}
            disabled={isSubmitting}
            class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg backdrop-blur-sm border border-green-500/50 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isSubmitting}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditMode ? 'Updating Listing...' : 'Creating Listing...'}
            {:else}
              {isEditMode ? 'Update Listing' : 'List My Gear'}
            {/if}
          </button>
        {/if}
        </div>
      </ScrollLinkedAnimator>
    </div>
  </div>
  {/if}
</div>

<!-- Success Modal -->
<Modal
  bind:show={showSuccessModal}
  title="Success!"
  maxWidth="max-w-md"
  on:close={handleSuccessModalClose}
>
  <div class="p-6">
    <div class="flex items-center justify-center mb-4">
      <div class="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-500/30">
        <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
    </div>

    <p class="text-center text-white mb-6">{successMessage}</p>

    <div class="flex justify-center space-x-4">
      <button
        on:click={() => goto('/dashboard')}
        class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Go to Dashboard
      </button>
      <button
        on:click={handleSuccessModalClose}
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        View Listing
      </button>
    </div>
  </div>
</Modal>

<style>
  /* Smooth scrolling for better parallax effect */
  :global(html) {
    scroll-behavior: smooth;
  }

  /* Animation classes */
  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
  }

  .animate-delay-200 {
    animation-delay: 0.2s;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(2rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
