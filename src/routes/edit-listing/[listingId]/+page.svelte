<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { firestore } from '$lib/firebase/client';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import { toastNotifications } from '$lib/stores/notifications';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import FormContainer from '$lib/components/forms/form-container.svelte';
  import FormField from '$lib/components/forms/form-field.svelte';
  import FormButton from '$lib/components/forms/form-button.svelte';
  import { GEAR_CATEGORIES } from '$lib/constants';

  // Get the auth state store
  $: authState = simpleAuth.authState;
  
  let listingId: string;
  let loading = false;
  let loadingListing = true;
  let errors: Record<string, string> = {};
  let originalListing: any = null;

  // Form data
  let formData = {
    title: '',
    category: '',
    description: '',
    dailyPrice: 0,
    condition: 'Good',
    securityDeposit: 0,
    city: '',
    state: '',
    zipCode: '',
    isActive: true
  };

  onMount(async () => {
    listingId = $page.params.listingId;
    
    if (!$authState.isAuthenticated) {
      toastNotifications.error('Please sign in to edit listings.');
      goto('/auth/login');
      return;
    }

    await loadListing();
  });

  async function loadListing() {
    if (!listingId || !firestore) return;

    try {
      loadingListing = true;
      const listingRef = doc(firestore, 'listings', listingId);
      const listingSnap = await getDoc(listingRef);

      if (!listingSnap.exists()) {
        toastNotifications.error('Listing not found.');
        goto('/dashboard/owner');
        return;
      }

      const listingData = listingSnap.data();
      
      // Check if user owns this listing
      if (listingData.ownerUid !== $authState.user?.uid) {
        toastNotifications.error('You can only edit your own listings.');
        goto('/dashboard/owner');
        return;
      }

      originalListing = listingData;
      
      // Populate form with existing data
      formData = {
        title: listingData.title || '',
        category: listingData.category || '',
        description: listingData.description || '',
        dailyPrice: listingData.dailyPrice || 0,
        condition: listingData.condition || 'Good',
        securityDeposit: listingData.securityDeposit || 0,
        city: listingData.location?.city || '',
        state: listingData.location?.state || '',
        zipCode: listingData.location?.zipCode || '',
        isActive: listingData.isActive !== false
      };

    } catch (error) {
      console.error('Error loading listing:', error);
      toastNotifications.error('Failed to load listing.');
      goto('/dashboard/owner');
    } finally {
      loadingListing = false;
    }
  }

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
      toastNotifications.error('Please sign in to edit listings.');
      goto('/auth/login');
      return;
    }

    loading = true;

    try {
      const listingRef = doc(firestore, 'listings', listingId);
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        dailyPrice: formData.dailyPrice,
        securityDeposit: formData.securityDeposit,
        location: {
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        isActive: formData.isActive,
        updatedAt: new Date()
      };

      await updateDoc(listingRef, updateData);
      
      toastNotifications.success('Listing updated successfully!');
      goto('/dashboard/owner');
      
    } catch (error) {
      console.error('Error updating listing:', error);
      toastNotifications.error('Failed to update listing. Please try again.');
    } finally {
      loading = false;
    }
  }

  function cancelEdit() {
    goto('/dashboard/owner');
  }
</script>

<svelte:head>
  <title>Edit Listing - GearGrab</title>
  <meta name="description" content="Edit your outdoor gear listing on GearGrab" />
</svelte:head>

<!-- Video Background -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
/>

{#if loadingListing}
  <div class="relative min-h-[60vh] flex items-center justify-center px-4 py-12">
    <div class="text-center text-white">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p>Loading listing...</p>
    </div>
  </div>
{:else}
  <div class="relative min-h-[60vh] flex items-center justify-center px-4 py-12">
    <ScrollLinkedAnimator animation="fade-up" startOffset="{0.1}" endOffset="{0.5}">
      <FormContainer
        title="Edit Your Gear"
        subtitle="Update your outdoor equipment listing"
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

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              id="dailyPrice"
              label="Daily Price ($)"
              type="number"
              bind:value="{formData.dailyPrice}"
              placeholder="25.00"
              min="{1}"
              step="{0.01}"
              required
              error="{errors.dailyPrice}"
            />

            <FormField
              id="condition"
              label="Condition"
              type="select"
              bind:value="{formData.condition}"
              options={[
                { value: 'Excellent', label: 'Excellent' },
                { value: 'Good', label: 'Good' },
                { value: 'Fair', label: 'Fair' }
              ]}
              required
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              id="city"
              label="City"
              type="text"
              bind:value="{formData.city}"
              placeholder="Denver"
              required
              error="{errors.city}"
            />

            <FormField
              id="state"
              label="State"
              type="text"
              bind:value="{formData.state}"
              placeholder="CO"
              required
              error="{errors.state}"
            />

            <FormField
              id="zipCode"
              label="ZIP Code"
              type="text"
              bind:value="{formData.zipCode}"
              placeholder="80202"
              required
              error="{errors.zipCode}"
            />
          </div>

          <div class="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              bind:checked="{formData.isActive}"
              class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label for="isActive" class="text-sm font-medium text-gray-700">
              Active (visible to renters)
            </label>
          </div>

          <div class="pt-4 flex space-x-4">
            <FormButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              on:click={cancelEdit}
            >
              Cancel
            </FormButton>
            
            <FormButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              {loading}
              disabled="{loading}"
            >
              {loading ? 'Updating...' : 'Update Listing'}
            </FormButton>
          </div>
        </form>
      </FormContainer>
    </ScrollLinkedAnimator>
  </div>
{/if}
