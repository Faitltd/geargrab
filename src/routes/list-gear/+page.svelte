<script lang="ts">
  // import ImageUploader from '$lib/components/ImageUploader.svelte';

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
  const totalSteps = 5; // Added a preview step

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
    features: ['', '', ''], // Start with 3 empty feature fields
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

  // Available categories
  const categories = [
    { id: 'camping', name: 'Camping', subcategories: ['Tents', 'Sleeping Bags', 'Cooking', 'Backpacks'] },
    { id: 'hiking', name: 'Hiking', subcategories: ['Backpacks', 'Footwear', 'Clothing', 'Navigation'] },
    { id: 'skiing', name: 'Skiing', subcategories: ['Skis', 'Boots', 'Poles', 'Clothing'] },
    { id: 'water-sports', name: 'Water Sports', subcategories: ['Kayaks', 'Paddleboards', 'Surfboards', 'Life Vests'] },
    { id: 'climbing', name: 'Climbing', subcategories: ['Ropes', 'Harnesses', 'Shoes', 'Helmets'] },
    { id: 'biking', name: 'Biking', subcategories: ['Mountain Bikes', 'Road Bikes', 'Helmets', 'Accessories'] }
  ];

  // Available conditions
  const conditions = ['Like New', 'Excellent', 'Good', 'Fair', 'Worn'];

  // Get subcategories for selected category
  $: subcategories = formData.category ?
    categories.find(c => c.id === formData.category)?.subcategories || [] : [];

  // Calculate suggested weekly and monthly prices
  $: {
    if (formData.dailyPrice > 0) {
      formData.weeklyPrice = Math.round(formData.dailyPrice * 6); // 1 day free for weekly
      formData.monthlyPrice = Math.round(formData.dailyPrice * 24); // 6 days free for monthly
    }
  }

  // Handle image change from ImageUploader component
  function handleImagesChange(event: CustomEvent): void {
    formData.images = event.detail.images;
  }

  // Add feature field
  function addFeatureField(): void {
    formData.features = [...formData.features, ''];
  }

  // Remove feature field
  function removeFeatureField(index: number): void {
    formData.features = formData.features.filter((_, i) => i !== index);
  }

  // Add specification field
  function addSpecificationField(): void {
    formData.specifications = [...formData.specifications, { key: '', value: '' }];
  }

  // Remove specification field
  function removeSpecificationField(index: number): void {
    formData.specifications = formData.specifications.filter((_, i) => i !== index);
  }

  // Handle date selection for availability
  function toggleDateAvailability(event: CustomEvent): void {
    const dateString = event.detail.date;

    if (formData.unavailableDates.includes(dateString)) {
      formData.unavailableDates = formData.unavailableDates.filter(d => d !== dateString);
    } else {
      formData.unavailableDates = [...formData.unavailableDates, dateString];
    }
  }

  // Navigate to previous step
  function prevStep(): void {
    if (currentStep > 1) {
      currentStep--;
      window.scrollTo(0, 0);
    }
  }

  // Submit form
  function submitForm(): void {
    // In a real app, we would send this to the server
    alert('Your gear has been listed successfully! In a real app, this would be saved to the database.');
    console.log('Form data:', formData);

    // Reset form
    formData = {
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

    // Reset errors
    errors = {};

    // Reset step
    currentStep = 1;
  }

  // Validate form data and update errors
  function validateStep(step: number): boolean {
    errors = {};

    if (step === 1) {
      // Validate basic info
      if (!formData.title) errors.title = 'Title is required';
      if (!formData.category) errors.category = 'Category is required';
      if (!formData.description) errors.description = 'Description is required';
      else if (formData.description.length < 20) errors.description = 'Description should be at least 20 characters';

      return Object.keys(errors).length === 0;
    }
    else if (step === 2) {
      // Validate details, features, and specifications
      if (!formData.brand) errors.brand = 'Brand is required';
      if (!formData.condition) errors.condition = 'Condition is required';

      // Validate features (at least one non-empty feature)
      const validFeatures = formData.features.filter(f => f.trim() !== '');
      if (validFeatures.length === 0) errors.features = 'At least one feature is required';

      // Validate specifications (key and value must both be filled if either is filled)
      formData.specifications.forEach((spec, index) => {
        if ((spec.key && !spec.value) || (!spec.key && spec.value)) {
          errors[`specification_${index}`] = 'Both key and value must be provided';
        }
      });

      return Object.keys(errors).length === 0;
    }
    else if (step === 3) {
      // Validate images
      if (formData.images.length === 0) errors.images = 'At least one image is required';

      return Object.keys(errors).length === 0;
    }
    else if (step === 4) {
      // Validate pricing and location
      if (formData.dailyPrice <= 0) errors.dailyPrice = 'Daily price must be greater than 0';
      if (!formData.city) errors.city = 'City is required';
      if (!formData.state) errors.state = 'State is required';
      if (!formData.zipCode) errors.zipCode = 'Zip code is required';

      // Validate delivery options
      if (formData.pickup && !formData.pickupLocation) errors.pickupLocation = 'Pickup location is required';
      if (formData.dropoff && formData.dropoffDistance <= 0) errors.dropoffDistance = 'Dropoff distance must be greater than 0';
      if (formData.shipping && formData.shippingFee <= 0) errors.shippingFee = 'Shipping fee must be greater than 0';

      return Object.keys(errors).length === 0;
    }
    else if (step === 5) {
      // Preview step - no validation needed
      return true;
    }

    return false;
  }

  // Check if current step is valid (for disabling/enabling buttons)
  function isStepValid(): boolean {
    // Make the Next button always enabled to allow users to navigate through the form
    // They'll see validation errors when they try to proceed
    return true;
  }

  // Navigate to next step with validation
  function nextStep(): void {
    if (currentStep < totalSteps) {
      // Still validate to show errors, but proceed anyway
      validateStep(currentStep);
      currentStep++;
      window.scrollTo(0, 0);
    }
  }
</script>

<svelte:head>
  <title>List Your Gear - GearGrab</title>
</svelte:head>

<div class="min-h-screen">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-white drop-shadow-lg mb-6">List Your Gear</h1>

    <!-- Progress bar -->
    <div class="mb-8">
      <div class="flex justify-between mb-2">
        {#each Array(totalSteps) as _, i}
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center {i + 1 <= currentStep ? 'bg-green-500/90 backdrop-blur-sm text-white shadow-lg' : 'bg-white/80 backdrop-blur-sm text-gray-600 shadow-md border border-white/30'}">
              {i + 1}
            </div>
            <div class="text-xs mt-1 text-white drop-shadow-md">
              {i === 0 ? 'Basic Info' : i === 1 ? 'Details' : i === 2 ? 'Images' : i === 3 ? 'Pricing & Location' : 'Preview'}
            </div>
          </div>

          {#if i < totalSteps - 1}
            <div class="flex-1 flex items-center">
              <div class="h-1 w-full rounded-xl {i + 1 < currentStep ? 'bg-green-500/80 backdrop-blur-sm shadow-sm' : 'bg-white/60 backdrop-blur-sm shadow-sm'}"></div>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Form steps -->
    <div class="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
      <!-- Step 1: Basic Info -->
      {#if currentStep === 1}
        <div>
          <h2 class="text-xl font-semibold mb-4">Basic Information</h2>

          <div class="space-y-4">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                id="title"
                class="form-input block w-full rounded-md"
                placeholder="e.g. Premium Camping Tent (4-Person)"
                bind:value={formData.title}
              />
              {#if errors.title}
                <p class="text-red-500 text-sm mt-1">{errors.title}</p>
              {/if}
            </div>

            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                id="category"
                class="form-select block w-full rounded-md"
                bind:value={formData.category}
              >
                <option value="">Select a category</option>
                {#each categories as category}
                  <option value={category.id}>{category.name}</option>
                {/each}
              </select>
              {#if errors.category}
                <p class="text-red-500 text-sm mt-1">{errors.category}</p>
              {/if}
            </div>

            {#if subcategories.length > 0}
              <div>
                <label for="subcategory" class="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                <select
                  id="subcategory"
                  class="form-select block w-full rounded-md"
                  bind:value={formData.subcategory}
                >
                  <option value="">Select a subcategory</option>
                  {#each subcategories as subcategory}
                    <option value={subcategory}>{subcategory}</option>
                  {/each}
                </select>
              </div>
            {/if}

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                id="description"
                class="form-textarea block w-full rounded-md"
                rows="4"
                placeholder="Describe your gear in detail. Include features, benefits, and condition."
                bind:value={formData.description}
              ></textarea>
              {#if errors.description}
                <p class="text-red-500 text-sm mt-1">{errors.description}</p>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Step 2: Details, Features, and Specifications -->
      {#if currentStep === 2}
        <div>
          <h2 class="text-xl font-semibold mb-4">Gear Details</h2>

          <div class="space-y-6">
            <!-- Basic Details -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium">Basic Details</h3>

              <div>
                <label for="brand" class="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                <input
                  type="text"
                  id="brand"
                  class="form-input block w-full rounded-md"
                  placeholder="e.g. North Face"
                  bind:value={formData.brand}
                />
                {#if errors.brand}
                  <p class="text-red-500 text-sm mt-1">{errors.brand}</p>
                {/if}
              </div>

              <div>
                <label for="model" class="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  id="model"
                  class="form-input block w-full rounded-md"
                  placeholder="e.g. Wawona 4"
                  bind:value={formData.model}
                />
              </div>

              <div>
                <label for="condition" class="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
                <select
                  id="condition"
                  class="form-select block w-full rounded-md"
                  bind:value={formData.condition}
                >
                  {#each conditions as condition}
                    <option value={condition}>{condition}</option>
                  {/each}
                </select>
                {#if errors.condition}
                  <p class="text-red-500 text-sm mt-1">{errors.condition}</p>
                {/if}
              </div>

              <div>
                <label for="age" class="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                <input
                  type="number"
                  id="age"
                  class="form-input block w-full rounded-md"
                  min="0"
                  bind:value={formData.ageInYears}
                />
              </div>
            </div>

            <!-- Features -->
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium">Features *</h3>
                <button
                  type="button"
                  class="text-sm text-green-600 hover:text-green-700 font-medium"
                  on:click={addFeatureField}
                >
                  + Add Feature
                </button>
              </div>

              <p class="text-sm text-gray-500">List the key features of your gear. Add at least one feature.</p>

              {#if errors.features}
                <p class="text-red-500 text-sm">{errors.features}</p>
              {/if}

              {#each formData.features as _, i}
                <div class="flex items-center space-x-2">
                  <input
                    type="text"
                    id={`feature-${i}`}
                    class="form-input block w-full rounded-md"
                    placeholder={`Feature ${i+1} (e.g. Waterproof, Easy setup)`}
                    bind:value={formData.features[i]}
                  />
                  {#if formData.features.length > 1}
                    <button
                      type="button"
                      class="text-red-500 hover:text-red-700"
                      on:click={() => removeFeatureField(i)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  {/if}
                </div>
              {/each}
            </div>

            <!-- Specifications -->
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium">Specifications</h3>
                <button
                  type="button"
                  class="text-sm text-green-600 hover:text-green-700 font-medium"
                  on:click={addSpecificationField}
                >
                  + Add Specification
                </button>
              </div>

              <p class="text-sm text-gray-500">Add specifications like dimensions, weight, material, etc.</p>

              {#each formData.specifications as _, i}
                <div class="flex items-start space-x-2">
                  <div class="flex-1">
                    <input
                      type="text"
                      id={`spec-key-${i}`}
                      class="form-input block w-full rounded-md"
                      placeholder="Key (e.g. Weight, Dimensions)"
                      bind:value={formData.specifications[i].key}
                    />
                    {#if errors[`specification_${i}`]}
                      <p class="text-red-500 text-sm mt-1">{errors[`specification_${i}`]}</p>
                    {/if}
                  </div>
                  <div class="flex-1">
                    <input
                      type="text"
                      id={`spec-value-${i}`}
                      class="form-input block w-full rounded-md"
                      placeholder="Value (e.g. 5 lbs, 10' x 8')"
                      bind:value={formData.specifications[i].value}
                    />
                  </div>
                  {#if formData.specifications.length > 1}
                    <button
                      type="button"
                      class="text-red-500 hover:text-red-700 mt-2"
                      on:click={() => removeSpecificationField(i)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  {/if}
                </div>
              {/each}
            </div>

            <!-- Insurance -->
            <div class="space-y-2">
              <h3 class="text-lg font-medium">Insurance</h3>

              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="includesInsurance"
                    class="form-checkbox h-4 w-4 text-green-600"
                    bind:checked={formData.includesInsurance}
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for="includesInsurance" class="font-medium text-gray-700">Includes Insurance</label>
                  <p class="text-gray-500">Check this if you provide insurance coverage with your gear.</p>
                </div>
              </div>

              {#if formData.includesInsurance}
                <div class="ml-7 mt-2">
                  <label for="insuranceDetails" class="block text-sm font-medium text-gray-700 mb-1">Insurance Details</label>
                  <textarea
                    id="insuranceDetails"
                    class="form-textarea block w-full rounded-md"
                    rows="2"
                    placeholder="Describe the insurance coverage you provide."
                    bind:value={formData.insuranceDetails}
                  ></textarea>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Step 3: Images -->
      {#if currentStep === 3}
        <div>
          <h2 class="text-xl font-semibold mb-4">Images</h2>

          <div class="space-y-4">
            <div>
              <p class="block text-sm font-medium text-gray-700 mb-1">Upload Images *</p>
              <p class="text-sm text-gray-500 mb-2">Add up to 5 high-quality images of your gear. The first image will be the main image.</p>

              {#if errors.images}
                <p class="text-red-500 text-sm mb-2">{errors.images}</p>
              {/if}

              <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p class="text-gray-500">Image upload functionality will be available soon</p>
                <button type="button" class="mt-2 btn btn-secondary">Choose Images</button>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Step 4: Pricing & Location -->
      {#if currentStep === 4}
        <div>
          <h2 class="text-xl font-semibold mb-4">Pricing & Location</h2>

          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium mb-2">Pricing</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="dailyPrice" class="block text-sm font-medium text-gray-700 mb-1">Daily Price ($) *</label>
                  <input
                    type="number"
                    id="dailyPrice"
                    class="form-input block w-full rounded-md"
                    min="0"
                    bind:value={formData.dailyPrice}
                  />
                  {#if errors.dailyPrice}
                    <p class="text-red-500 text-sm mt-1">{errors.dailyPrice}</p>
                  {/if}
                </div>

                <div>
                  <label for="weeklyPrice" class="block text-sm font-medium text-gray-700 mb-1">Weekly Price ($)</label>
                  <input
                    type="number"
                    id="weeklyPrice"
                    class="form-input block w-full rounded-md"
                    min="0"
                    bind:value={formData.weeklyPrice}
                  />
                  <p class="text-xs text-gray-500 mt-1">Suggested: ${formData.dailyPrice * 6} (1 day free)</p>
                </div>

                <div>
                  <label for="monthlyPrice" class="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    id="monthlyPrice"
                    class="form-input block w-full rounded-md"
                    min="0"
                    bind:value={formData.monthlyPrice}
                  />
                  <p class="text-xs text-gray-500 mt-1">Suggested: ${formData.dailyPrice * 24} (6 days free)</p>
                </div>

                <div>
                  <label for="securityDeposit" class="block text-sm font-medium text-gray-700 mb-1">Security Deposit ($)</label>
                  <input
                    type="number"
                    id="securityDeposit"
                    class="form-input block w-full rounded-md"
                    min="0"
                    bind:value={formData.securityDeposit}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-medium mb-2">Location</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    id="city"
                    class="form-input block w-full rounded-md"
                    bind:value={formData.city}
                  />
                  {#if errors.city}
                    <p class="text-red-500 text-sm mt-1">{errors.city}</p>
                  {/if}
                </div>

                <div>
                  <label for="state" class="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    id="state"
                    class="form-input block w-full rounded-md"
                    bind:value={formData.state}
                  />
                  {#if errors.state}
                    <p class="text-red-500 text-sm mt-1">{errors.state}</p>
                  {/if}
                </div>

                <div>
                  <label for="zipCode" class="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                  <input
                    type="text"
                    id="zipCode"
                    class="form-input block w-full rounded-md"
                    bind:value={formData.zipCode}
                  />
                  {#if errors.zipCode}
                    <p class="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                  {/if}
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-medium mb-2">Delivery Options</h3>
              <p class="text-sm text-gray-500 mb-2">Select at least one delivery option.</p>

              <div class="space-y-2">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="pickup"
                    class="form-checkbox h-4 w-4 text-green-600"
                    bind:checked={formData.pickup}
                  />
                  <label for="pickup" class="ml-2 block text-sm text-gray-700">Pickup</label>
                </div>

                {#if formData.pickup}
                  <div class="ml-6">
                    <label for="pickupLocation" class="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                    <input
                      type="text"
                      id="pickupLocation"
                      class="form-input block w-full rounded-md"
                      placeholder="e.g. Downtown Denver"
                      bind:value={formData.pickupLocation}
                    />
                    {#if errors.pickupLocation}
                      <p class="text-red-500 text-sm mt-1">{errors.pickupLocation}</p>
                    {/if}
                  </div>
                {/if}

                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="dropoff"
                    class="form-checkbox h-4 w-4 text-green-600"
                    bind:checked={formData.dropoff}
                  />
                  <label for="dropoff" class="ml-2 block text-sm text-gray-700">Dropoff</label>
                </div>

                {#if formData.dropoff}
                  <div class="ml-6">
                    <label for="dropoffDistance" class="block text-sm font-medium text-gray-700 mb-1">Maximum Dropoff Distance (miles)</label>
                    <input
                      type="number"
                      id="dropoffDistance"
                      class="form-input block w-full rounded-md"
                      min="0"
                      bind:value={formData.dropoffDistance}
                    />
                    {#if errors.dropoffDistance}
                      <p class="text-red-500 text-sm mt-1">{errors.dropoffDistance}</p>
                    {/if}
                  </div>
                {/if}

                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="shipping"
                    class="form-checkbox h-4 w-4 text-green-600"
                    bind:checked={formData.shipping}
                  />
                  <label for="shipping" class="ml-2 block text-sm text-gray-700">Shipping</label>
                </div>

                {#if formData.shipping}
                  <div class="ml-6">
                    <label for="shippingFee" class="block text-sm font-medium text-gray-700 mb-1">Shipping Fee ($)</label>
                    <input
                      type="number"
                      id="shippingFee"
                      class="form-input block w-full rounded-md"
                      min="0"
                      bind:value={formData.shippingFee}
                    />
                    {#if errors.shippingFee}
                      <p class="text-red-500 text-sm mt-1">{errors.shippingFee}</p>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>

            <div>
              <h3 class="text-lg font-medium mb-2">Availability</h3>
              <p class="text-sm text-gray-500 mb-2">Mark any dates when your gear will not be available for rent.</p>

              <div class="bg-white/90 backdrop-blur-sm border border-white/30 rounded-2xl p-4 shadow-md">
                <div class="text-center py-8">
                  <p class="text-gray-500 mb-4">Calendar functionality will be available soon</p>
                  <p class="text-sm text-gray-400">You'll be able to mark unavailable dates here</p>
                </div>
              </div>

                {#if formData.unavailableDates.length > 0}
                  <div class="mt-4">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Unavailable Dates:</h4>
                    <div class="flex flex-wrap gap-2">
                      {#each formData.unavailableDates.sort() as date}
                        <div class="bg-red-100/80 backdrop-blur-sm text-red-800 text-xs px-2 py-1 rounded-xl flex items-center shadow-sm border border-red-200/50">
                          {new Date(date).toLocaleDateString()}
                          <button
                            type="button"
                            class="ml-1 text-red-600 hover:text-red-800"
                            on:click={() => {
                              formData.unavailableDates = formData.unavailableDates.filter(d => d !== date);
                            }}
                            aria-label={`Remove ${new Date(date).toLocaleDateString()}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Step 5: Preview -->
      {#if currentStep === 5}
        <div>
          <h2 class="text-xl font-semibold mb-4">Preview Your Listing</h2>
          <p class="text-gray-500 mb-6">Review your listing details before submitting.</p>

          <div class="space-y-8">
            <!-- Basic Info Preview -->
            <div>
              <h3 class="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Basic Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p class="text-sm text-gray-500">Title</p>
                  <p class="font-medium">{formData.title}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Category</p>
                  <p class="font-medium">
                    {categories.find(c => c.id === formData.category)?.name || ''}
                    {#if formData.subcategory}
                      &nbsp;› {formData.subcategory}
                    {/if}
                  </p>
                </div>
                <div class="col-span-1 md:col-span-2">
                  <p class="text-sm text-gray-500">Description</p>
                  <p>{formData.description}</p>
                </div>
              </div>
            </div>

            <!-- Details Preview -->
            <div>
              <h3 class="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Gear Details</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
                <div>
                  <p class="text-sm text-gray-500">Brand</p>
                  <p class="font-medium">{formData.brand}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Model</p>
                  <p class="font-medium">{formData.model || 'Not specified'}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Condition</p>
                  <p class="font-medium">{formData.condition}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Age</p>
                  <p class="font-medium">{formData.ageInYears} {formData.ageInYears === 1 ? 'year' : 'years'}</p>
                </div>
                {#if formData.includesInsurance}
                  <div class="col-span-1 md:col-span-2">
                    <p class="text-sm text-gray-500">Insurance</p>
                    <p class="font-medium">Included - {formData.insuranceDetails || 'No details provided'}</p>
                  </div>
                {/if}
              </div>

              <!-- Features Preview -->
              <div class="mt-4">
                <p class="text-sm text-gray-500 mb-2">Features</p>
                <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                  {#each formData.features.filter(f => f.trim() !== '') as feature}
                    <li class="flex items-center">
                      <svg class="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  {/each}
                </ul>
              </div>

              <!-- Specifications Preview -->
              {#if formData.specifications.some(s => s.key && s.value)}
                <div class="mt-4">
                  <p class="text-sm text-gray-500 mb-2">Specifications</p>
                  <div class="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50">
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      {#each formData.specifications.filter(s => s.key && s.value) as spec}
                        <div class="sm:col-span-1">
                          <dt class="text-sm font-medium text-gray-500">{spec.key}</dt>
                          <dd class="mt-1 text-sm text-gray-900">{spec.value}</dd>
                        </div>
                      {/each}
                    </dl>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Images Preview -->
            {#if formData.images.length > 0}
              <div>
                <h3 class="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Images</h3>

                <!-- Main image -->
                <div class="mb-4">
                  <p class="text-sm text-gray-500 mb-2">Main Image</p>
                  <div class="relative rounded-lg overflow-hidden" style="max-width: 400px;">
                    <img src={formData.images[0]} alt="Product main view" class="w-full h-auto object-cover" />
                    <div class="absolute bottom-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-xl shadow-lg border border-green-400/30">
                      Main Image
                    </div>
                  </div>
                </div>

                <!-- Additional images -->
                {#if formData.images.length > 1}
                  <div>
                    <p class="text-sm text-gray-500 mb-2">Additional Images</p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {#each formData.images.slice(1) as image, i}
                        <div class="relative">
                          <img src={image} alt={`Additional image ${i+1}`} class="h-24 w-full object-cover rounded-md" />
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Pricing Preview -->
            <div>
              <h3 class="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Pricing</h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-3">
                <div>
                  <p class="text-sm text-gray-500">Daily Price</p>
                  <p class="font-medium text-green-600">${formData.dailyPrice}</p>
                </div>
                {#if formData.weeklyPrice > 0}
                  <div>
                    <p class="text-sm text-gray-500">Weekly Price</p>
                    <p class="font-medium">${formData.weeklyPrice}</p>
                  </div>
                {/if}
                {#if formData.monthlyPrice > 0}
                  <div>
                    <p class="text-sm text-gray-500">Monthly Price</p>
                    <p class="font-medium">${formData.monthlyPrice}</p>
                  </div>
                {/if}
                {#if formData.securityDeposit > 0}
                  <div>
                    <p class="text-sm text-gray-500">Security Deposit</p>
                    <p class="font-medium">${formData.securityDeposit}</p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Location & Delivery Preview -->
            <div>
              <h3 class="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Location & Delivery</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 mb-4">
                <div>
                  <p class="text-sm text-gray-500">City</p>
                  <p class="font-medium">{formData.city}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">State</p>
                  <p class="font-medium">{formData.state}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Zip Code</p>
                  <p class="font-medium">{formData.zipCode}</p>
                </div>
              </div>

              <p class="text-sm text-gray-500 mb-2">Delivery Options</p>
              <ul class="space-y-1">
                {#if formData.pickup}
                  <li class="flex items-start">
                    <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <div>
                      <span class="font-medium">Pickup</span>
                      {#if formData.pickupLocation}
                        <p class="text-gray-600 text-sm">Location: {formData.pickupLocation}</p>
                      {/if}
                    </div>
                  </li>
                {/if}

                {#if formData.dropoff}
                  <li class="flex items-start">
                    <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <div>
                      <span class="font-medium">Dropoff</span>
                      {#if formData.dropoffDistance}
                        <p class="text-gray-600 text-sm">Within {formData.dropoffDistance} miles</p>
                      {/if}
                    </div>
                  </li>
                {/if}

                {#if formData.shipping}
                  <li class="flex items-start">
                    <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <div>
                      <span class="font-medium">Shipping</span>
                      {#if formData.shippingFee}
                        <p class="text-gray-600 text-sm">Fee: ${formData.shippingFee}</p>
                      {/if}
                    </div>
                  </li>
                {/if}
              </ul>

              <!-- Availability Preview -->
              {#if formData.unavailableDates.length > 0}
                <div class="mt-4">
                  <p class="text-sm text-gray-500 mb-2">Unavailable Dates</p>
                  <div class="flex flex-wrap gap-2">
                    {#each formData.unavailableDates.sort() as date}
                      <div class="bg-red-100/80 backdrop-blur-sm text-red-800 text-xs px-2 py-1 rounded-xl shadow-sm border border-red-200/50">
                        {new Date(date).toLocaleDateString()}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Navigation buttons -->
      <div class="mt-8 flex justify-between">
        {#if currentStep > 1}
          <button
            type="button"
            class="btn btn-secondary"
            on:click={prevStep}
          >
            Previous
          </button>
        {:else}
          <div></div>
        {/if}

        {#if currentStep < totalSteps}
          <button
            type="button"
            class="btn btn-primary"
            on:click={nextStep}
            disabled={!isStepValid()}
          >
            Next
          </button>
        {:else}
          <button
            type="button"
            class="btn btn-primary"
            on:click={submitForm}
            disabled={!isStepValid()}
          >
            List My Gear
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>
