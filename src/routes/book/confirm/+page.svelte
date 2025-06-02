<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import StripePaymentForm from '$lib/components/payments/StripePaymentForm.svelte';

  // Get booking details from URL parameters
  let listingId = '';
  let startDate = '';
  let endDate = '';
  let deliveryMethod = 'pickup';
  let insuranceTier = 'standard';
  let totalPrice = 0;

  // Booking state
  let loading = true;
  let processing = false;
  let error = '';
  let listing = null;

  // Form data
  let contactInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: ''
  };

  let specialRequests = '';
  let agreeToTerms = false;

  onMount(() => {
    // Get URL parameters
    const urlParams = $page.url.searchParams;
    listingId = urlParams.get('listingId') || '';
    startDate = urlParams.get('startDate') || '';
    endDate = urlParams.get('endDate') || '';
    deliveryMethod = urlParams.get('deliveryMethod') || 'pickup';
    insuranceTier = urlParams.get('insuranceTier') || 'standard';
    totalPrice = parseFloat(urlParams.get('totalPrice') || '0');

    // Check if user is logged in
    if (!$authStore.user) {
      goto(`/auth/login?redirect=${encodeURIComponent($page.url.pathname + $page.url.search)}`);
      return;
    }

    // Load listing data (in a real app, this would fetch from API)
    loadListingData();
  });

  function loadListingData() {
    // Simulate API call - in real app, fetch listing by ID
    setTimeout(() => {
      listing = {
        id: listingId,
        title: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
        images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'],
        dailyPrice: 45,
        owner: {
          name: 'David Wilson',
          image: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        location: {
          city: 'Salt Lake City',
          state: 'UT'
        }
      };
      loading = false;
    }, 500);
  }

  // Calculate booking details
  $: days = startDate && endDate ? 
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  $: basePrice = listing ? listing.dailyPrice * days : 0;
  $: serviceFee = Math.round(basePrice * 0.1);
  $: deliveryFee = deliveryMethod === 'pickup' ? 0 : 30;
  $: insuranceFee = insuranceTier === 'none' ? 0 : insuranceTier === 'basic' ? 5 : insuranceTier === 'standard' ? 10 : 15;
  $: calculatedTotal = basePrice + serviceFee + deliveryFee + insuranceFee;

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Payment state
  let showPayment = false;
  let paymentProcessing = false;

  async function handleBookingSubmit() {
    console.log('handleBookingSubmit called');

    if (!agreeToTerms) {
      error = 'Please agree to the terms and conditions';
      return;
    }

    if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email || !contactInfo.phone) {
      error = 'Please fill in all required contact information';
      return;
    }

    // Show payment form
    showPayment = true;
    error = '';
  }

  async function handlePaymentSuccess(event) {
    console.log('Payment successful:', event.detail);
    paymentProcessing = true;

    try {
      // Create booking via API with payment confirmation
      const bookingData = {
        listingId,
        startDate,
        endDate,
        deliveryMethod,
        insuranceTier,
        totalPrice: calculatedTotal,
        contactInfo,
        specialRequests,
        paymentIntentId: event.detail.paymentIntentId
      };

      console.log('Sending booking data with payment:', bookingData);

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Navigate to success page with booking ID
      console.log('Navigating to success page with booking ID:', result.bookingId);
      goto(`/book/success?bookingId=${result.bookingId}`);
    } catch (err) {
      console.error('Booking error:', err);
      error = err.message || 'Failed to create booking. Please try again.';
      paymentProcessing = false;
    }
  }

  function handlePaymentError(event) {
    console.error('Payment error:', event.detail);
    error = event.detail.error || 'Payment failed. Please try again.';
    paymentProcessing = false;
  }
</script>

<svelte:head>
  <title>Confirm Booking - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8 pt-24">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
          <div class="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-white mt-4">Loading booking details...</p>
        </div>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Main Booking Form -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Header -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h1 class="text-2xl font-bold text-white mb-2">Confirm Your Booking</h1>
            <p class="text-gray-300">Review your details and complete your reservation</p>
          </div>

          <!-- Booking Form -->
          <form on:submit|preventDefault={handleBookingSubmit}>
            <!-- Contact Information -->
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
            <h2 class="text-lg font-semibold text-white mb-4">Contact Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                <input 
                  type="text" 
                  bind:value={contactInfo.firstName}
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                <input 
                  type="text" 
                  bind:value={contactInfo.lastName}
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Doe"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input 
                  type="email" 
                  bind:value={contactInfo.email}
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                <input 
                  type="tel" 
                  bind:value={contactInfo.phone}
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Emergency Contact</label>
                <input 
                  type="text" 
                  bind:value={contactInfo.emergencyContact}
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Emergency Phone</label>
                <input 
                  type="tel" 
                  bind:value={contactInfo.emergencyPhone}
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>
          </div>

          <!-- Special Requests -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 class="text-lg font-semibold text-white mb-4">Special Requests</h2>
            <textarea 
              bind:value={specialRequests}
              rows="4"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Any special requests or questions for the owner..."
            ></textarea>
          </div>

          <!-- Terms and Conditions -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <label class="flex items-start space-x-3">
              <input 
                type="checkbox" 
                bind:checked={agreeToTerms}
                class="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span class="text-sm text-gray-300">
                I agree to the <a href="/terms" class="text-green-400 hover:text-green-300 underline">Terms of Service</a> 
                and <a href="/privacy" class="text-green-400 hover:text-green-300 underline">Privacy Policy</a>. 
                I understand the cancellation policy and rental terms.
              </span>
            </label>
          </div>

            {#if error}
              <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p class="text-red-200">{error}</p>
              </div>
            {/if}

            <!-- Submit Button -->
            <div class="mt-6">
              <button
                type="submit"
                class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                disabled={processing || !agreeToTerms || showPayment}
              >
                {#if processing}
                  <div class="flex items-center justify-center">
                    <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </div>
                {:else}
                  {showPayment ? 'Complete Payment Below' : 'Continue to Payment'}
                {/if}
              </button>
            </div>
          </form>

          <!-- Payment Form -->
          {#if showPayment}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mt-6">
              <h2 class="text-lg font-semibold text-white mb-4">💳 Secure Payment</h2>
              <StripePaymentForm
                amount={calculatedTotal}
                currency="usd"
                metadata={{
                  listingId,
                  startDate,
                  endDate,
                  deliveryMethod,
                  insuranceTier
                }}
                disabled={paymentProcessing}
                on:success={handlePaymentSuccess}
                on:error={handlePaymentError}
              />
            </div>
          {/if}

        </div>

        <!-- Booking Summary Sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 sticky top-8">
            
            <!-- Listing Info -->
            {#if listing}
              <div class="flex items-center space-x-4 mb-6">
                <img src={listing.images[0]} alt={listing.title} class="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h3 class="font-semibold text-white text-sm">{listing.title}</h3>
                  <p class="text-gray-300 text-sm">{listing.location.city}, {listing.location.state}</p>
                  <p class="text-gray-300 text-sm">Hosted by {listing.owner.name}</p>
                </div>
              </div>
            {/if}

            <!-- Booking Details -->
            <div class="space-y-4 mb-6">
              <div>
                <h4 class="font-semibold text-white mb-2">Booking Details</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-300">Check-in:</span>
                    <span class="text-white">{formatDate(startDate)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Check-out:</span>
                    <span class="text-white">{formatDate(endDate)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Duration:</span>
                    <span class="text-white">{days} day{days !== 1 ? 's' : ''}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Delivery:</span>
                    <span class="text-white">{deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Insurance:</span>
                    <span class="text-white">{insuranceTier.charAt(0).toUpperCase() + insuranceTier.slice(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Price Breakdown -->
            <div class="space-y-3 mb-6">
              <h4 class="font-semibold text-white">Price Breakdown</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-300">{formatCurrency(listing?.dailyPrice || 0)} × {days} days</span>
                  <span class="text-white">{formatCurrency(basePrice)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Service fee</span>
                  <span class="text-white">{formatCurrency(serviceFee)}</span>
                </div>
                {#if deliveryFee > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-300">Delivery fee</span>
                    <span class="text-white">{formatCurrency(deliveryFee)}</span>
                  </div>
                {/if}
                {#if insuranceFee > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-300">Insurance</span>
                    <span class="text-white">{formatCurrency(insuranceFee)}</span>
                  </div>
                {/if}
                <hr class="border-white/20" />
                <div class="flex justify-between font-semibold">
                  <span class="text-white">Total</span>
                  <span class="text-white">{formatCurrency(calculatedTotal)}</span>
                </div>
              </div>
            </div>

            <p class="text-xs text-gray-400 mt-3 text-center">
              You won't be charged until your booking is confirmed by the owner.
            </p>

          </div>
        </div>

      </div>
    {/if}

  </div>
</div>
