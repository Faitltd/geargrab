<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { createListing } from '$lib/firebase/db/listings';
  import { toastNotifications } from '$lib/stores/notifications';

  // Get the auth state store
  $: authState = simpleAuth.authState;
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import FormContainer from '$lib/components/forms/form-container.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';
  import { GEAR_CATEGORIES, SUCCESS_MESSAGES } from '$lib/constants';

  let heroVisible = false;
  let loading = false;
  let errors: Record<string, string> = {};

  // Simplified form data - only essential fields
  let formData = {
    title: '',
    category: '',
    description: '',
    dailyPrice: 0,
    city: '',
    state: '',
    zipCode: ''
  };



  onMount(() => {
    setTimeout(() => {
      heroVisible = true;
    }, 100);
  });

  // Simple validation
  function validateForm() {
    errors = {};
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.category) {
      errors.category = 'Category is required';
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    }

    if (formData.dailyPrice <= 0) {
      errors.dailyPrice = 'Daily price must be greater than $0';
      isValid = false;
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
      isValid = false;
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
      isValid = false;
    }

    if (!formData.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
      isValid = false;
    }

    return isValid;
  }

  // Submit form
  async function handleSubmit() {
    if (!validateForm()) return;

    if (!$authState.isAuthenticated || !$authState.user) {
      toastNotifications.error('Please sign in to list your gear.');
      goto('/auth/login');
      return;
    }

    loading = true;

    try {
      const listingData = {
        ownerUid: $authState.user.uid,
        ownerId: $authState.user.uid,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        dailyPrice: formData.dailyPrice,
        location: {
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        images: [],
        features: [],
        specifications: {},
        deliveryOptions: {
          dropoffDistance: 0,
          shippingFee: 0
        },
        availabilityCalendar: {},
        status: 'active' as const,
        condition: 'Good' as const,
        securityDeposit: 0,
        weeklyPrice: 0,
        monthlyPrice: 0,
        includesInsurance: false,
        insuranceDetails: '',
        unavailableDates: [],
        isActive: true
      };

      await createListing(listingData);
      
      toastNotifications.success(SUCCESS_MESSAGES.LISTING_CREATED);
      
      // Reset form
      formData = {
        title: '',
        category: '',
        description: '',
        dailyPrice: 0,
        city: '',
        state: '',
        zipCode: ''
      };
      
      goto('/dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      toastNotifications.error('Failed to create listing. Please try again.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>List Your Gear - GearGrab</title>
  <meta name="description" content="List your outdoor gear for rent on GearGrab" />
</svelte:head>

<!-- Video Background -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
/>

<div class="relative min-h-[60vh] flex items-center justify-center px-4 py-12">
  <ScrollLinkedAnimator animation="fade-up" startOffset="{0.1}" endOffset="{0.5}">
    <FormContainer
      title="List Your Gear"
      subtitle="Share your outdoor equipment and earn money"
      maxWidth="2xl"
    >
      <form on:submit|preventDefault="{handleSubmit}">
        <FormField
          id="title"
          label="Gear Title"
          type="text"
          bind:value="{formData.title}"
          placeholder="e.g., 4-Person Camping Tent"
          required
          error="{errors.title}"
        />

        <FormField
          id="category"
          label="Category"
          type="select"
          bind:value="{formData.category}"
          placeholder="Select a category"
          options={GEAR_CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }))}
          required
          error="{errors.category}"
        />

        <FormField
          id="description"
          label="Description"
          type="textarea"
          bind:value="{formData.description}"
          placeholder="Describe your gear, its condition, and any special features..."
          rows="{4}"
          required
          error="{errors.description}"
        />

        <!-- Custom Price Input with Proper Dollar Sign -->
        <div class="form-field mb-6">
          <label for="dailyPrice" class="block text-sm font-medium text-white mb-2">
            Daily Price
            <span class="text-red-400 ml-1" aria-label="required">*</span>
          </label>

          <div class="price-input-container">
            <!-- Dollar sign prefix -->
            <div class="price-prefix">
              $
            </div>

            <!-- Price input -->
            <input
              id="dailyPrice"
              type="number"
              bind:value="{formData.dailyPrice}"
              placeholder="25.00"
              min="1"
              step="0.01"
              required
              class="price-input w-full pr-4 py-3 bg-gray-800/70 border border-gray-600 text-white placeholder-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 {errors.dailyPrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
              aria-label="Daily Price"
              aria-invalid="{errors.dailyPrice ? 'true' : 'false'}"
            />
          </div>

          {#if errors.dailyPrice}
            <p class="mt-1 text-sm text-red-400" role="alert" aria-live="polite">{errors.dailyPrice}</p>
          {/if}
        </div>

        <!-- Location Fields -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-1">
            <FormField
              id="city"
              label="City"
              type="text"
              bind:value="{formData.city}"
              placeholder="Denver"
              required
              error="{errors.city}"
            />
          </div>

          <div>
            <FormField
              id="state"
              label="State"
              type="text"
              bind:value="{formData.state}"
              placeholder="CO"
              maxlength="{2}"
              required
              error="{errors.state}"
            />
          </div>

          <div>
            <FormField
              id="zipCode"
              label="ZIP Code"
              type="text"
              bind:value="{formData.zipCode}"
              placeholder="80202"
              maxlength="{10}"
              required
              error="{errors.zipCode}"
            />
          </div>
        </div>

        <div class="pt-4">
          <FormButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            {loading}
            disabled="{loading}"
          >
            {loading ? 'Creating Listing...' : 'List My Gear'}
          </FormButton>
        </div>
      </form>
    </FormContainer>
  </ScrollLinkedAnimator>
</div>

<style>
  /* Custom price input styling for perfect dollar sign positioning */
  .price-input-container {
    position: relative;
    display: flex;
    align-items: stretch;
  }

  .price-prefix {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.5rem;
    background-color: rgba(31, 41, 55, 0.7);
    border: 1px solid rgb(75, 85, 99);
    border-right: none;
    border-radius: 0.5rem 0 0 0.5rem;
    color: rgb(209, 213, 219);
    font-weight: 500;
    font-size: 1rem;
    user-select: none;
    pointer-events: none;
  }

  .price-input {
    flex: 1;
    padding-left: 0.5rem !important;
    border-radius: 0 0.5rem 0.5rem 0 !important;
    border-left: none !important;
  }

  /* Mobile responsive adjustments */
  @media (max-width: 640px) {
    .price-prefix {
      min-width: 2.25rem;
      font-size: 0.9rem;
    }

    .price-input {
      padding-left: 0.375rem !important;
    }
  }

  /* Focus state for the entire input group */
  .price-input:focus + .price-prefix,
  .price-input:focus {
    border-color: rgb(34, 197, 94);
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }
</style>
