<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';
  import { getRental, type RentalData } from '$lib/services/rentals';
  import { getListing, type ListingData } from '$lib/services/listings';
  import Layout from '$lib/components/Layout.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import ConditionPhotoUpload from '$lib/components/verification/ConditionPhotoUpload.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  // Get rental ID from URL
  $: rentalId = $page.params.id;

  // State
  let rental: RentalData | null = null;
  let listing: ListingData | null = null;
  let loading = true;
  let error = '';
  let showUpload = false;

  // Reactive statements
  $: user = $authStore.data;
  $: isRenter = user && rental && user.uid === rental.renterId;
  $: canUploadPhotos = isRenter && rental?.status === 'confirmed' && !hasBeforePhotos;
  $: hasBeforePhotos = rental?.conditionChecks?.before?.status === 'completed';

  onMount(async () => {
    await loadRentalData();
  });

  async function loadRentalData() {
    try {
      loading = true;
      error = '';

      // Load rental data
      rental = await getRental(rentalId);
      if (!rental) {
        error = 'Rental not found';
        return;
      }

      // Check if user is the renter
      if (!user || user.uid !== rental.renterId) {
        error = 'You are not authorized to view this rental';
        return;
      }

      // Load listing data
      listing = await getListing(rental.listingId);
      if (!listing) {
        error = 'Listing not found';
        return;
      }

    } catch (err) {
      console.error('Error loading rental data:', err);
      error = err instanceof Error ? err.message : 'Failed to load rental data';
    } finally {
      loading = false;
    }
  }

  function handleStartUpload() {
    showUpload = true;
  }

  function handleUploadComplete(event: CustomEvent<{ conditionCheckId: string }>) {
    showToast('success', 'Condition photos uploaded successfully!');
    
    // Refresh rental data to show updated status
    loadRentalData();
    
    // Navigate back to rental details
    setTimeout(() => {
      goto(`/rentals/${rentalId}`);
    }, 2000);
  }

  function handleUploadCancel() {
    showUpload = false;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<Layout title="Before Pickup - Condition Photos">
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {#if loading}
        <div class="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      
      {:else if error}
        <ErrorBanner message={error} />
        <div class="mt-6 text-center">
          <Button href="/dashboard" variant="primary">
            Back to Dashboard
          </Button>
        </div>
      
      {:else if rental && listing}
        
        {#if !showUpload}
          <!-- Rental Information -->
          <div class="bg-white rounded-lg shadow-md mb-6">
            <div class="p-6">
              <div class="flex items-start space-x-4">
                {#if listing.images && listing.images.length > 0}
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    class="w-24 h-24 object-cover rounded-lg"
                  />
                {/if}
                
                <div class="flex-1">
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">
                    Before Pickup - Condition Photos
                  </h1>
                  <h2 class="text-lg font-semibold text-gray-700 mb-2">
                    {listing.title}
                  </h2>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span class="font-medium">Rental Period:</span>
                      {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                    </div>
                    <div>
                      <span class="font-medium">Pickup:</span>
                      {rental.deliveryOption === 'pickup' ? 'Self Pickup' : 'Delivery'}
                    </div>
                    <div>
                      <span class="font-medium">Total Cost:</span>
                      ${rental.totalCost.toFixed(2)}
                    </div>
                    <div>
                      <span class="font-medium">Status:</span>
                      <span class="capitalize font-medium text-green-600">{rental.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Instructions -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">
                  Before You Pick Up the Gear
                </h3>
                <div class="text-blue-800 space-y-2">
                  <p>
                    Please take clear photos of the gear to document its condition before pickup. 
                    This helps protect both you and the owner in case of any disputes.
                  </p>
                  <ul class="list-disc list-inside space-y-1 mt-3">
                    <li>Take at least 3 photos from different angles</li>
                    <li>Ensure good lighting and focus</li>
                    <li>Capture any existing wear, scratches, or damage</li>
                    <li>Include close-ups of important details</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Check -->
          {#if hasBeforePhotos}
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-lg font-semibold text-green-900">
                    Condition Photos Already Uploaded
                  </h3>
                  <p class="text-green-800 mt-1">
                    You have already uploaded condition photos for this rental. 
                    You can now proceed with the pickup.
                  </p>
                </div>
              </div>
            </div>
          {:else if !canUploadPhotos}
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-lg font-semibold text-yellow-900">
                    Cannot Upload Photos
                  </h3>
                  <p class="text-yellow-800 mt-1">
                    {#if !isRenter}
                      You are not authorized to upload photos for this rental.
                    {:else if rental.status !== 'confirmed'}
                      This rental must be confirmed before you can upload condition photos.
                    {:else}
                      Unable to upload photos at this time.
                    {/if}
                  </p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="flex justify-between">
            <Button
              href="/rentals/{rentalId}"
              variant="outline"
            >
              Back to Rental
            </Button>

            {#if canUploadPhotos}
              <Button
                variant="primary"
                on:click={handleStartUpload}
              >
                Start Photo Upload
              </Button>
            {:else if hasBeforePhotos}
              <Button
                href="/rentals/{rentalId}"
                variant="primary"
              >
                View Rental Details
              </Button>
            {/if}
          </div>

        {:else}
          <!-- Photo Upload Component -->
          <ConditionPhotoUpload
            {rentalId}
            title="Before Pickup - Condition Photos"
            instructions="Take clear photos of the gear from multiple angles to document its current condition before pickup."
            minPhotos={3}
            maxPhotos={10}
            on:complete={handleUploadComplete}
            on:cancel={handleUploadCancel}
          />
        {/if}

      {/if}
    </div>
  </div>
</Layout>
