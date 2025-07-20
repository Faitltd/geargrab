<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { listingsService } from '$lib/services/listings.service';
  import { bookingsService } from '$lib/services/bookings.service';
  import { showToast } from '$lib/stores/toast.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import DateRangePicker from '$lib/components/booking/DateRangePicker.svelte';
  import PricingCalculator from '$lib/components/booking/PricingCalculator.svelte';
  import type { Listing } from '$lib/types';
  import type { BookingFormData, BookingPricing, DateRange } from '$lib/types/bookings';

  // State
  let loading = true;
  let submitting = false;
  let error = '';
  let listing: Listing | null = null;
  let dateRange: DateRange = { start: null, end: null, totalDays: 0 };
  let pricing: BookingPricing | null = null;

  // Form data
  let formData: BookingFormData = {
    startDate: '',
    endDate: '',
    message: '',
    pickupMethod: 'pickup',
    pickupLocation: '',
    deliveryAddress: '',
    insurance: false,
    agreeToTerms: false
  };

  // Validation
  let fieldErrors: Record<string, string> = {};

  $: listingId = $page.params.listingId;
  $: user = $authStore.data;
  $: canSubmit = validateForm();

  onMount(async () => {
    if (!user) {
      // Store the intended destination and redirect to sign in
      sessionStorage.setItem('auth_redirect', `/book/${listingId}`);
      goto('/auth/signin');
      return;
    }

    await loadListing();
  });

  async function loadListing() {
    try {
      loading = true;
      error = '';

      listing = await listingsService.getListing(listingId);
      
      if (!listing) {
        error = 'Listing not found';
        return;
      }

      // Check if user is trying to book their own listing
      if (listing.owner?.id === user?.uid) {
        error = 'You cannot book your own listing';
        return;
      }

      // Set default pickup location to listing location
      if (listing.location?.address?.city) {
        formData.pickupLocation = listing.location.address.city;
      }

    } catch (err: any) {
      error = err.message || 'Failed to load listing';
      console.error('Error loading listing:', err);
    } finally {
      loading = false;
    }
  }

  function handleDateRangeChange(event: CustomEvent<DateRange>) {
    dateRange = event.detail;
    formData.startDate = dateRange.start?.toISOString().split('T')[0] || '';
    formData.endDate = dateRange.end?.toISOString().split('T')[0] || '';
    
    // Update pricing when dates change
    updatePricing();
  }

  function updatePricing() {
    if (!listing || !dateRange.start || !dateRange.end || dateRange.totalDays === 0) {
      pricing = null;
      return;
    }

    const dailyRate = listing.pricing?.rentalPrice?.daily || 0;
    const deliveryFee = formData.pickupMethod === 'delivery' ? 10 : 0; // $10 delivery fee

    pricing = bookingsService.calculatePricing(
      dailyRate,
      dateRange.totalDays,
      formData.insurance,
      deliveryFee
    );
  }

  function validateForm(): boolean {
    fieldErrors = {};
    let isValid = true;

    if (!formData.startDate) {
      fieldErrors.startDate = 'Start date is required';
      isValid = false;
    }

    if (!formData.endDate) {
      fieldErrors.endDate = 'End date is required';
      isValid = false;
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        fieldErrors.startDate = 'Start date cannot be in the past';
        isValid = false;
      }

      if (end <= start) {
        fieldErrors.endDate = 'End date must be after start date';
        isValid = false;
      }
    }

    if (formData.pickupMethod === 'pickup' && !formData.pickupLocation.trim()) {
      fieldErrors.pickupLocation = 'Pickup location is required';
      isValid = false;
    }

    if (formData.pickupMethod === 'delivery' && !formData.deliveryAddress.trim()) {
      fieldErrors.deliveryAddress = 'Delivery address is required';
      isValid = false;
    }

    if (!formData.agreeToTerms) {
      fieldErrors.agreeToTerms = 'You must agree to the terms and conditions';
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit() {
    if (!user || !listing || !canSubmit || !pricing) return;

    try {
      submitting = true;
      error = '';

      // Check availability one more time
      const availability = await bookingsService.checkAvailability(
        listingId,
        new Date(formData.startDate),
        new Date(formData.endDate)
      );

      if (!availability.available) {
        error = 'These dates are no longer available. Please select different dates.';
        return;
      }

      // Create booking request
      const bookingRequest = {
        listingId,
        renterId: user.uid,
        ownerId: listing.owner!.id,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        totalDays: dateRange.totalDays,
        message: formData.message,
        pickupMethod: formData.pickupMethod,
        pickupLocation: formData.pickupLocation,
        deliveryAddress: formData.deliveryAddress,
        insurance: formData.insurance,
        pricing
      };

      const bookingId = await bookingsService.createBooking(bookingRequest);

      showToast('success', 'Booking request sent! The owner will review and respond soon.');
      
      // Redirect to booking details
      goto(`/bookings/${bookingId}`);

    } catch (err: any) {
      error = err.message || 'Failed to create booking request';
      console.error('Error creating booking:', err);
    } finally {
      submitting = false;
    }
  }

  // Update pricing when form changes
  $: {
    if (formData.insurance !== undefined || formData.pickupMethod) {
      updatePricing();
    }
  }
</script>

<svelte:head>
  <title>Book {listing?.title || 'Listing'} - GearGrab</title>
  <meta name="description" content="Book {listing?.title || 'this item'} for your next adventure" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <div class="max-w-4xl mx-auto px-4 py-8">
      <ErrorBanner message={error} />
      <div class="text-center mt-6">
        <button
          on:click={() => goto('/listings/browse')}
          class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Browse Other Listings
        </button>
      </div>
    </div>
  {:else if listing}
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <button
          on:click={() => window.history.back()}
          class="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to listing
        </button>

        <h1 class="text-3xl font-bold text-gray-900 mb-2">Book this item</h1>
        <p class="text-gray-600">Complete your booking request for {listing.title}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Listing Info -->
        <div class="space-y-6">
          <!-- Listing Summary -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex space-x-4">
              <div class="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {#if listing.images && listing.images.length > 0}
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                {/if}
              </div>

              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-1">{listing.title}</h3>
                <p class="text-sm text-gray-600 mb-2">{listing.description}</p>
                <div class="flex items-center justify-between">
                  <span class="text-lg font-bold text-primary-600">
                    ${listing.pricing?.rentalPrice?.daily || 0}/day
                  </span>
                  <span class="text-sm text-gray-500 capitalize">{listing.category}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Owner Info -->
          {#if listing.owner}
            <div class="bg-white rounded-lg shadow-md p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Hosted by {listing.owner.name}</h3>
              <div class="flex items-center space-x-3">
                {#if listing.owner.photoURL}
                  <img
                    src={listing.owner.photoURL}
                    alt={listing.owner.name}
                    class="w-12 h-12 rounded-full object-cover"
                  />
                {:else}
                  <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                {/if}
                
                <div>
                  <p class="font-medium text-gray-900">{listing.owner.name}</p>
                  {#if listing.owner.rating}
                    <div class="flex items-center">
                      <div class="flex text-yellow-400">
                        {#each Array(5) as _, i}
                          <svg class="w-4 h-4 {i < Math.floor(listing.owner.rating) ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        {/each}
                      </div>
                      <span class="ml-1 text-sm text-gray-600">({listing.owner.rating.toFixed(1)})</span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Right Column: Booking Form -->
        <div class="space-y-6">
          <!-- Date Selection -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Select dates</h3>
            <DateRangePicker
              {listingId}
              on:dateRangeChange={handleDateRangeChange}
            />
            {#if fieldErrors.startDate || fieldErrors.endDate}
              <div class="mt-2 space-y-1">
                {#if fieldErrors.startDate}
                  <p class="text-sm text-red-600">{fieldErrors.startDate}</p>
                {/if}
                {#if fieldErrors.endDate}
                  <p class="text-sm text-red-600">{fieldErrors.endDate}</p>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Pickup/Delivery Options -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Pickup & delivery</h3>
            
            <div class="space-y-4">
              <!-- Pickup Method -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">How would you like to get the item?</label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.pickupMethod}
                      value="pickup"
                      class="mr-3"
                    />
                    <span>I'll pick it up</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.pickupMethod}
                      value="delivery"
                      class="mr-3"
                    />
                    <span>Deliver to me (+$10)</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.pickupMethod}
                      value="meetup"
                      class="mr-3"
                    />
                    <span>Meet somewhere</span>
                  </label>
                </div>
              </div>

              <!-- Location Fields -->
              {#if formData.pickupMethod === 'pickup' || formData.pickupMethod === 'meetup'}
                <div>
                  <label for="pickupLocation" class="block text-sm font-medium text-gray-700 mb-2">
                    {formData.pickupMethod === 'pickup' ? 'Pickup location' : 'Meeting location'}
                  </label>
                  <input
                    id="pickupLocation"
                    type="text"
                    bind:value={formData.pickupLocation}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent {fieldErrors.pickupLocation ? 'border-red-500' : ''}"
                    placeholder="Enter location"
                  />
                  {#if fieldErrors.pickupLocation}
                    <p class="mt-1 text-sm text-red-600">{fieldErrors.pickupLocation}</p>
                  {/if}
                </div>
              {/if}

              {#if formData.pickupMethod === 'delivery'}
                <div>
                  <label for="deliveryAddress" class="block text-sm font-medium text-gray-700 mb-2">
                    Delivery address
                  </label>
                  <textarea
                    id="deliveryAddress"
                    bind:value={formData.deliveryAddress}
                    rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none {fieldErrors.deliveryAddress ? 'border-red-500' : ''}"
                    placeholder="Enter your full delivery address"
                  ></textarea>
                  {#if fieldErrors.deliveryAddress}
                    <p class="mt-1 text-sm text-red-600">{fieldErrors.deliveryAddress}</p>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          <!-- Message -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Message to owner</h3>
            <textarea
              bind:value={formData.message}
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Tell the owner about your plans for the item, experience level, etc."
            ></textarea>
          </div>

          <!-- Insurance -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Damage protection</h3>
                <p class="text-sm text-gray-600">Optional coverage for accidental damage</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={formData.insurance} class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>

          <!-- Pricing -->
          {#if pricing}
            <PricingCalculator {pricing} />
          {/if}

          <!-- Terms and Submit -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="space-y-4">
              <label class="flex items-start">
                <input
                  type="checkbox"
                  bind:checked={formData.agreeToTerms}
                  class="mt-1 mr-3 {fieldErrors.agreeToTerms ? 'border-red-500' : ''}"
                />
                <span class="text-sm text-gray-700">
                  I agree to the 
                  <a href="/legal/terms" target="_blank" class="text-primary-500 hover:text-primary-600 underline">
                    Terms of Service
                  </a>
                  and 
                  <a href="/legal/rental-agreement" target="_blank" class="text-primary-500 hover:text-primary-600 underline">
                    Rental Agreement
                  </a>
                </span>
              </label>
              {#if fieldErrors.agreeToTerms}
                <p class="text-sm text-red-600">{fieldErrors.agreeToTerms}</p>
              {/if}

              <button
                on:click={handleSubmit}
                disabled={!canSubmit || submitting}
                class="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center space-x-2"
              >
                {#if submitting}
                  <LoadingSpinner size="sm" color="white" />
                  <span>Sending request...</span>
                {:else}
                  <span>Request to book</span>
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
