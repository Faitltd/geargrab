<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { toastNotifications } from '$lib/stores/notifications';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import FormContainer from '$lib/components/forms/form-container.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';

  // Get the auth state store
  $: authState = simpleAuth.authState;

  // Import constants dynamically to avoid SSR issues
  let GEAR_CATEGORIES: any[] = [];
  let SUCCESS_MESSAGES: any = {};

  onMount(async () => {
    if (browser) {
      const constants = await import('$lib/constants');
      GEAR_CATEGORIES = [...constants.GEAR_CATEGORIES];
      SUCCESS_MESSAGES = {...constants.SUCCESS_MESSAGES};
    }
  });

  let loading = false;
  let errors: Record<string, string> = {};

  // Form data for sale listing
  let formData = {
    title: '',
    category: '',
    description: '',
    price: 0,
    originalPrice: 0,
    condition: '',
    brand: '',
    model: '',
    city: '',
    state: '',
    zipCode: '',
    pickup: true,
    shipping: false,
    localDelivery: false,
    shippingFee: 0,
    localDeliveryFee: 0
  };

  // Check authentication on mount
  onMount(() => {
    if (!$authState.isAuthenticated && !$authState.loading) {
      goto('/auth/login?redirect=/sell-gear');
    }
  });

  // Reactive check for authentication
  $: {
    if (!$authState.loading && !$authState.isAuthenticated) {
      goto('/auth/login?redirect=/sell-gear');
    }
  }

  function validateForm(): boolean {
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

    if (formData.price <= 0) {
      errors.price = 'Price must be greater than $0';
      isValid = false;
    }

    if (!formData.condition) {
      errors.condition = 'Condition is required';
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

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    if (!$authState.user) {
      toastNotifications.error('You must be logged in to sell gear');
      return;
    }

    if (!browser) {
      toastNotifications.error('This feature is not available on the server');
      return;
    }

    loading = true;

    try {
      // Dynamic import to avoid SSR issues
      const { createSale } = await import('$lib/firebase/db/sales');
      const saleData = {
        sellerId: $authState.user.uid,
        sellerUid: $authState.user.uid,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        price: formData.price,
        originalPrice: formData.originalPrice || undefined,
        location: {
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        deliveryOptions: {
          pickup: formData.pickup,
          shipping: formData.shipping,
          localDelivery: formData.localDelivery,
          shippingFee: formData.shipping ? formData.shippingFee : undefined,
          localDeliveryFee: formData.localDelivery ? formData.localDeliveryFee : undefined
        },
        images: [],
        features: [],
        isActive: true,
        isSold: false,
        status: 'active' as const
      };

      await createSale(saleData);
      
      toastNotifications.success(SUCCESS_MESSAGES.SALE_CREATED);
      
      // Reset form
      formData = {
        title: '',
        category: '',
        description: '',
        price: 0,
        originalPrice: 0,
        condition: '',
        brand: '',
        model: '',
        city: '',
        state: '',
        zipCode: '',
        pickup: true,
        shipping: false,
        localDelivery: false,
        shippingFee: 0,
        localDeliveryFee: 0
      };
      
      goto('/dashboard');
    } catch (error) {
      console.error('Error creating sale:', error);
      toastNotifications.error('Failed to create sale listing. Please try again.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sell Your Gear - GearGrab</title>
  <meta name="description" content="Sell your outdoor gear on GearGrab" />
</svelte:head>

<!-- Video Background -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
/>

<!-- Hero Section -->
<ScrollLinkedAnimator>
  <section class="relative min-h-[50vh] flex items-center justify-center text-center text-white">
    <div class="relative z-10 max-w-4xl mx-auto px-4">
      <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
        Sell Your <span class="text-green-400">Outdoor Gear</span>
      </h1>
      <p class="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
        Turn your unused gear into cash. List your outdoor equipment for sale and connect with buyers in your area.
      </p>
    </div>
  </section>
</ScrollLinkedAnimator>

<!-- Form Section -->
<section class="relative py-16 min-h-screen">
  <div class="max-w-2xl mx-auto px-4">
    <FormContainer>
      <h2 class="text-2xl font-bold text-white mb-8 text-center">List Your Gear for Sale</h2>
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Title -->
        <FormField
          label="Item Title"
          type="text"
          bind:value={formData.title}
          placeholder="e.g., REI Co-op Dome 2 Tent"
          error={errors.title}
          required
        />

        <!-- Category -->
        <FormField
          label="Category"
          type="select"
          bind:value={formData.category}
          error={errors.category}
          required
        >
          <option value="">Select a category</option>
          {#each GEAR_CATEGORIES as category}
            <option value={category.id}>{category.icon} {category.name}</option>
          {/each}
        </FormField>

        <!-- Description -->
        <FormField
          label="Description"
          type="textarea"
          bind:value={formData.description}
          placeholder="Describe your item's condition, features, and any included accessories..."
          error={errors.description}
          required
        />

        <!-- Price and Original Price -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Sale Price ($)"
            type="number"
            bind:value={formData.price}
            placeholder="0"
            error={errors.price}
            required
          />
          <FormField
            label="Original Price ($)"
            type="number"
            bind:value={formData.originalPrice}
            placeholder="Optional"
          />
        </div>

        <!-- Condition -->
        <FormField
          label="Condition"
          type="select"
          bind:value={formData.condition}
          error={errors.condition}
          required
        >
          <option value="">Select condition</option>
          <option value="New">New - Never used</option>
          <option value="Like New">Like New - Excellent condition</option>
          <option value="Good">Good - Normal wear</option>
          <option value="Fair">Fair - Shows wear</option>
          <option value="Poor">Poor - Significant wear</option>
        </FormField>

        <!-- Brand and Model -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Brand"
            type="text"
            bind:value={formData.brand}
            placeholder="e.g., REI, Patagonia"
          />
          <FormField
            label="Model"
            type="text"
            bind:value={formData.model}
            placeholder="e.g., Dome 2, Houdini Jacket"
          />
        </div>

        <!-- Location -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="City"
            type="text"
            bind:value={formData.city}
            placeholder="Denver"
            error={errors.city}
            required
          />
          <FormField
            label="State"
            type="text"
            bind:value={formData.state}
            placeholder="CO"
            error={errors.state}
            required
          />
          <FormField
            label="ZIP Code"
            type="text"
            bind:value={formData.zipCode}
            placeholder="80202"
            error={errors.zipCode}
            required
          />
        </div>

        <!-- Delivery Options -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Delivery Options</h3>
          
          <label class="flex items-center space-x-3 text-white">
            <input
              type="checkbox"
              bind:checked={formData.pickup}
              class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <span>Pickup available</span>
          </label>

          <label class="flex items-center space-x-3 text-white">
            <input
              type="checkbox"
              bind:checked={formData.shipping}
              class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <span>Shipping available</span>
          </label>
          
          {#if formData.shipping}
            <FormField
              label="Shipping Fee ($)"
              type="number"
              bind:value={formData.shippingFee}
              placeholder="0"
            />
          {/if}

          <label class="flex items-center space-x-3 text-white">
            <input
              type="checkbox"
              bind:checked={formData.localDelivery}
              class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <span>Local delivery available</span>
          </label>
          
          {#if formData.localDelivery}
            <FormField
              label="Local Delivery Fee ($)"
              type="number"
              bind:value={formData.localDeliveryFee}
              placeholder="0"
            />
          {/if}
        </div>

        <!-- Submit Button -->
        <FormButton
          type="submit"
          {loading}
          disabled={loading}
          class="w-full"
        >
          {loading ? 'Creating Sale...' : 'List Item for Sale'}
        </FormButton>
      </form>
    </FormContainer>
  </div>
</section>
