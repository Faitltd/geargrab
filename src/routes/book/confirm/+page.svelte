<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { authStore } from '$lib/stores/auth';
  import { BookingContextManager } from '$lib/utils/booking-context';
  import StripePaymentForm from '$lib/components/payments/stripe-payment-form.svelte';
  import LoginModal from '$lib/components/auth/login-modal.svelte';
  import { firestore } from '$lib/firebase/client';
  import { doc, getDoc } from 'firebase/firestore';

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

  // Login modal state
  let showLoginModal = false;

  // Get auth state from simpleAuth
  $: authState = simpleAuth.authState;

  // Synchronize authStore with simpleAuth to ensure payment components work
  $: if ($authState.user) {
    authStore.set({
      user: {
        uid: $authState.user.uid,
        email: $authState.user.email || '',
        displayName: $authState.user.displayName || undefined,
        photoURL: $authState.user.photoURL || undefined
      },
      loading: $authState.loading,
      error: null
    });
  } else if (!$authState.loading) {
    authStore.set({
      user: null,
      loading: false,
      error: null
    });
  }

  // Reactive statement to populate user info when auth state changes
  $: if ($authState.user && !contactInfo.email && authCheckComplete) {
    populateUserInfo();
  }

  onMount(() => {
    // Get URL parameters
    const urlParams = $page.url.searchParams;
    listingId = urlParams.get('listingId') || '';
    startDate = urlParams.get('startDate') || '';
    endDate = urlParams.get('endDate') || '';
    deliveryMethod = urlParams.get('deliveryMethod') || 'pickup';
    insuranceTier = urlParams.get('insuranceTier') || 'standard';
    totalPrice = parseFloat(urlParams.get('totalPrice') || '0');

    // Load listing data (in a real app, this would fetch from API)
    loadListingData();
  });

  // Track authentication state
  let authCheckComplete = false;
  let authCheckAttempts = 0;
  const MAX_AUTH_ATTEMPTS = 5;

  // Force refresh auth state and check authentication
  onMount(async () => {
    console.log('🔧 Checkout page mounted, checking authentication...');

    // Force refresh the auth state to ensure we have the latest
    await simpleAuth.refreshAuth();

    // Check if we're returning from Google auth and restore context
    if (BookingContextManager.isReturningFromAuth()) {
      console.log('🔄 Returning from Google auth, restoring booking context...');
      restoreBookingContext();
    } else {
      // Normal page load - restore any existing form data
      restoreFormData();
    }

    // Start checking auth state with retries
    checkAuthWithRetry();
  });

  async function checkAuthWithRetry() {
    authCheckAttempts++;
    console.log(`🔧 Auth check attempt ${authCheckAttempts}/${MAX_AUTH_ATTEMPTS}:`, {
      loading: $authState.loading,
      hasUser: !!$authState.user,
      userEmail: $authState.user?.email,
      isAuthenticated: $authState.isAuthenticated
    });

    // If still loading and we haven't exceeded max attempts, wait and retry
    if ($authState.loading && authCheckAttempts < MAX_AUTH_ATTEMPTS) {
      setTimeout(checkAuthWithRetry, 500);
      return;
    }

    // If we have a user, we're authenticated
    if ($authState.user && $authState.isAuthenticated) {
      console.log('✅ User authenticated:', $authState.user.email);
      authCheckComplete = true;
      populateUserInfo();
      return;
    }

    // Authentication check complete - user can proceed with or without auth
    authCheckComplete = true;
    console.log('🔧 Auth check complete - user can proceed');
  }

  function saveBookingContext() {
    const context = {
      listingId,
      startDate,
      endDate,
      deliveryMethod,
      insuranceTier,
      totalPrice,
      contactInfo,
      specialRequests,
      agreeToTerms,
      currentStep: (showPayment ? 'payment' : 'details') as 'details' | 'payment'
    };

    BookingContextManager.saveContext(context);
  }

  function restoreBookingContext() {
    const context = BookingContextManager.restoreContext();
    if (context) {
      // Restore URL parameters
      listingId = context.listingId || listingId;
      startDate = context.startDate || startDate;
      endDate = context.endDate || endDate;
      deliveryMethod = context.deliveryMethod || deliveryMethod;
      insuranceTier = context.insuranceTier || insuranceTier;
      totalPrice = context.totalPrice || totalPrice;

      // Restore form data
      contactInfo = context.contactInfo || contactInfo;
      specialRequests = context.specialRequests || '';
      agreeToTerms = context.agreeToTerms || false;

      // Restore step
      if (context.currentStep === 'payment') {
        showPayment = true;
      }

      console.log('📥 Booking context restored');
    }
  }

  function restoreFormData() {
    // Fallback to old localStorage method for backward compatibility
    try {
      const savedData = localStorage.getItem('geargrab_booking_form_data');
      if (savedData) {
        const formData = JSON.parse(savedData);

        // Only restore if data is less than 1 hour old
        if (Date.now() - formData.timestamp < 60 * 60 * 1000) {
          contactInfo = formData.contactInfo || contactInfo;
          specialRequests = formData.specialRequests || '';
          agreeToTerms = formData.agreeToTerms || false;
          console.log('📥 Legacy form data restored');
        } else {
          // Clear old data
          localStorage.removeItem('geargrab_booking_form_data');
        }
      }
    } catch (error) {
      console.warn('Failed to restore legacy form data:', error);
    }
  }

  function clearBookingContext() {
    BookingContextManager.clearContext();
  }

  async function populateUserInfo() {
    if ($authState.user) {
      const user = $authState.user;

      try {
        // Fetch complete user profile from Firestore
        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Use firstName and lastName from Firestore if available
          if (userData.firstName && userData.lastName) {
            contactInfo.firstName = userData.firstName;
            contactInfo.lastName = userData.lastName;
          } else if (user.displayName) {
            // Fall back to splitting display name
            const nameParts = user.displayName.trim().split(' ');
            contactInfo.firstName = nameParts[0] || '';
            contactInfo.lastName = nameParts.slice(1).join(' ') || '';
          }

          // Set email and phone from user profile
          contactInfo.email = user.email || '';
          contactInfo.phone = userData.phoneNumber || '';

        } else {
          // Fall back to basic auth user data if no Firestore profile
          if (user.displayName) {
            const nameParts = user.displayName.trim().split(' ');
            contactInfo.firstName = nameParts[0] || '';
            contactInfo.lastName = nameParts.slice(1).join(' ') || '';
          }
          contactInfo.email = user.email || '';
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);

        // Fall back to basic auth user data on error
        if (user.displayName) {
          const nameParts = user.displayName.trim().split(' ');
          contactInfo.firstName = nameParts[0] || '';
          contactInfo.lastName = nameParts.slice(1).join(' ') || '';
        }
        contactInfo.email = user.email || '';
      }
    }
  }

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
    Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))) : 1;

  // Two-stage payment calculation with fallback pricing
  $: effectiveDailyPrice = listing?.dailyPrice || 25; // Fallback to $25/day if missing
  $: basePrice = effectiveDailyPrice * days;
  $: serviceFee = Math.round(basePrice * 0.1);
  $: deliveryFee = deliveryMethod === 'pickup' ? 0 : 30;
  $: insuranceFee = insuranceTier === 'none' ? 0 : insuranceTier === 'basic' ? 5 : insuranceTier === 'standard' ? 10 : 15;

  // Full payment: Charge complete booking cost
  $: upfrontFees = serviceFee + insuranceFee;
  $: laterFees = basePrice + deliveryFee;
  $: totalBookingCost = upfrontFees + laterFees;
  $: calculatedTotal = Math.max(0.50, totalBookingCost); // Charge full amount

  // Debug pricing calculation
  $: {
    console.log('🔧 Full Payment Pricing Debug:', {
      listing: listing ? 'loaded' : 'null',
      listingId,
      listingTitle: listing?.title || 'unknown',
      dailyPrice: listing?.dailyPrice || 0,
      days,
      basePrice,
      serviceFee,
      deliveryFee,
      insuranceFee,
      upfrontFees,
      laterFees,
      totalBookingCost,
      calculatedTotal,
      calculatedTotalInCents: Math.round(calculatedTotal * 100),
      isValidAmount: calculatedTotal >= 0.50,
      startDate,
      endDate,
      startDateParsed: new Date(startDate),
      endDateParsed: new Date(endDate),
      timeDiff: new Date(endDate).getTime() - new Date(startDate).getTime(),
      daysCalculated: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    });

    // If dailyPrice is 0 or missing, show a warning
    if (!listing?.dailyPrice || listing.dailyPrice === 0) {
      console.warn('⚠️ PRICING ISSUE: Listing has no daily price!', {
        listingId,
        listing: listing ? 'exists' : 'null',
        dailyPrice: listing?.dailyPrice
      });
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function formatDate(dateString) {
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string') {
        // If it's an ISO string, parse it
        date = new Date(dateString);
      } else if (dateString && typeof dateString === 'object' && dateString.toDate) {
        // If it's a Firestore Timestamp
        date = dateString.toDate();
      } else if (dateString && typeof dateString === 'object' && dateString.seconds) {
        // If it's a Firestore Timestamp object
        date = new Date(dateString.seconds * 1000);
      } else {
        // Assume it's already a Date object
        date = new Date(dateString);
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
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

    // Check if user is authenticated
    if (!$authState.user || !$authState.isAuthenticated) {
      console.log('🔐 User not authenticated, saving context and showing login modal');

      // Save complete booking context before authentication
      saveBookingContext();

      // Show login modal
      showLoginModal = true;
      error = '';
      return;
    }

    // User is authenticated, proceed to payment
    proceedToPayment();
  }

  function proceedToPayment() {
    console.log('✅ Proceeding to payment');
    showPayment = true;
    error = '';

    // Update context to reflect payment step
    saveBookingContext();
  }

  async function handlePaymentSuccess(event) {
    console.log('Payment successful:', event.detail);
    paymentProcessing = true;

    try {
      // Get authentication token
      const { auth } = await import('$lib/firebase/client');
      const user = auth?.currentUser;

      if (!user) {
        throw new Error('You must be signed in to complete booking. Please log in and try again.');
      }

      const token = await user.getIdToken();

      // Create booking via API with payment confirmation
      const bookingData = {
        listingId,
        startDate,
        endDate,
        deliveryMethod,
        insuranceTier,
        totalPrice: calculatedTotal, // Only the upfront amount
        totalBookingCost, // Full booking cost for reference
        priceBreakdown: {
          dailyPrice: listing?.dailyPrice || 0,
          days,
          basePrice,
          serviceFee,
          deliveryFee,
          insuranceFee,
          upfrontFees,
          laterFees
        },
        contactInfo,
        specialRequests,
        paymentIntentId: event.detail.paymentIntentId,
        paymentStage: 'upfront' // Indicates this is the first payment
      };

      console.log('Sending booking data with payment:', bookingData);

      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Clear booking context since booking is complete
      clearBookingContext();

      // Navigate to success page with booking ID
      console.log('Navigating to success page with booking ID:', result.bookingId);
      goto(`/book/success?bookingId="${result.bookingId}`);
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

  // Login modal event handlers
  function handleLoginSuccess() {
    console.log('✅ Login successful, proceeding to payment');
    showLoginModal = false;

    // Populate user info after successful login
    populateUserInfo();

    // Proceed to payment
    proceedToPayment();
  }

  function handleLoginClose() {
    console.log('🔐 Login modal closed');
    showLoginModal = false;
    error = '';
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
      class="w-full h-full object-cover" />
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
          <form on:submit|preventDefault="{handleBookingSubmit}">
            <!-- Contact Information -->
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
            <h2 class="text-lg font-semibold text-white mb-4">Contact Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="first-name" class="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                <input id="first-name" 
                  type="text" 
                  bind:value="{contactInfo.firstName}"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label for="last-name" class="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                <input id="last-name" 
                  type="text" 
                  bind:value="{contactInfo.lastName}"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Doe"
                  required
                />
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input id="email" 
                  type="email" 
                  bind:value="{contactInfo.email}"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                <input id="phone" 
                  type="tel" 
                  bind:value="{contactInfo.phone}"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div>
                <label for="emergency-contact" class="block text-sm font-medium text-gray-300 mb-2">Emergency Contact</label>
                <input id="emergency-contact" 
                  type="text" 
                  bind:value="{contactInfo.emergencyContact}"
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label for="emergency-phone" class="block text-sm font-medium text-gray-300 mb-2">Emergency Phone</label>
                <input id="emergency-phone" 
                  type="tel" 
                  bind:value="{contactInfo.emergencyPhone}"
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
              bind:value="{specialRequests}"
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
                bind:checked="{agreeToTerms}"
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
                  {showPayment ? 'Complete Payment Below' : ($authState.user ? 'Continue to Payment' : 'Sign In to Continue')}
                {/if}
              </button>
            </div>
          </form>

          <!-- Payment Form -->
          {#if showPayment}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mt-6">
              <h2 class="text-lg font-semibold text-white mb-4 text-center">💳 Secure Payment</h2>

              {#if calculatedTotal < 0.50}
                <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                  <p class="text-red-200 text-sm text-center">
                    ⚠️ Invalid payment amount. The minimum payment is $0.50.
                    Please check the listing details and try again.
                  </p>
                </div>
              {:else}
                <div class="flex justify-center">
                  <StripePaymentForm
                    amount="{calculatedTotal}"
                    currency="usd"
                    metadata={{
                      listingId,
                      startDate,
                      endDate,
                      deliveryMethod,
                      insuranceTier
                    }}
                    disabled="{paymentProcessing}"
                    on:success="{handlePaymentSuccess}"
                    on:error="{handlePaymentError}"
                  />
                </div>
              {/if}
            </div>
          {/if}

        </div>

        <!-- Booking Summary Sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 sticky top-8">
            
            <!-- Listing Info -->
            {#if listing}
              <div class="flex items-center space-x-4 mb-6">
                <img src="{listing.images[0]}" alt="{listing.title}" class="w-16 h-16 rounded-lg object-cover" />
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

              <!-- Total Booking Cost -->
              <div class="bg-white/5 rounded-lg p-3 mb-3">
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
                    <span class="text-white">Total Booking Cost</span>
                    <span class="text-white">{formatCurrency(totalBookingCost)}</span>
                  </div>
                </div>
              </div>

              <!-- Payment Schedule -->
              <div class="space-y-2 text-sm">
                <h5 class="font-medium text-white">Payment Schedule:</h5>
                <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div class="flex justify-between items-center">
                    <span class="text-green-300">💳 Pay now (booking request)</span>
                    <span class="text-green-300 font-semibold">{formatCurrency(calculatedTotal)}</span>
                  </div>
                  <p class="text-green-200 text-xs mt-1">Service fee + Insurance</p>
                </div>

                {#if laterFees > 0}
                  <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div class="flex justify-between items-center">
                      <span class="text-blue-300">⏳ Pay after owner approval</span>
                      <span class="text-blue-300 font-semibold">{formatCurrency(laterFees)}</span>
                    </div>
                    <p class="text-blue-200 text-xs mt-1">Rental fee + Delivery fee</p>
                  </div>
                {/if}
              </div>
            </div>

            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p class="text-xs text-yellow-200 text-center">
                ℹ️ You'll only be charged the booking fee now. The rental amount will be charged after the owner confirms your request.
              </p>
            </div>

          </div>
        </div>

      </div>
    {/if}

  </div>
</div>

<!-- Login Modal -->
<LoginModal
  bind:show="{showLoginModal}"
  redirectAfterLogin="{false}"
  on:success="{handleLoginSuccess}"
  on:close="{handleLoginClose}"
/>
