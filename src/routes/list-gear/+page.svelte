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

        <div class="relative">
          <FormField
            id="dailyPrice"
            label="Daily Price"
            type="number"
            bind:value="{formData.dailyPrice}"
            placeholder="25.00"
            min="{1}"
            step="{0.01}"
            required
            error="{errors.dailyPrice}"
            className="pl-8"
          />
          <!-- Dollar sign overlay for price field -->
          <span class="absolute left-4 top-[2.75rem] text-gray-300 pointer-events-none text-base">$</span>
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
