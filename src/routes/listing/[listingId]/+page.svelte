<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/scroll-linked-sequential.svelte';
  import AuthGuard from '$lib/components/auth/auth-guard.svelte';
  import { products } from '$lib/data/products';
  import { firestore } from '$lib/firebase/client';
  import { doc, getDoc } from 'firebase/firestore';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { chatService } from '$lib/services/chat';

  // Get the listing ID from the URL
  const listingId = $page.params.listingId;

  // Listing data state
  let listing: any = null;
  let loading = true;
  let error = '';

  // Load listing data from products or fallback to dummy data
  onMount(async () => {
    try {
      loading = true;
      console.log('🔍 Loading listing with ID:', listingId);
      console.log('🔍 Firestore available:', !!firestore);

      // Try to load from Firestore first
      if (firestore) {
        try {
          console.log('🔍 Attempting Firestore query for listing:', listingId);
          const listingRef = doc(firestore, 'listings', listingId);
          const listingSnap = await getDoc(listingRef);

          console.log('🔍 Firestore document exists:', listingSnap.exists());

          if (listingSnap.exists()) {
            const listingData = listingSnap.data();
            console.log('🔍 Raw Firestore data:', listingData);

            listing = {
              id: listingSnap.id,
              ...listingData,
              // Ensure we have all required fields with defaults
              views: listingData.views || 0,
              bookings: listingData.bookings || 0,
              earnings: listingData.earnings || 0,
              averageRating: listingData.averageRating || 4.5,
              totalReviews: listingData.totalReviews || 0,
              reviews: listingData.reviews || [],
              features: listingData.features || [],
              specifications: listingData.specifications || {},
              availabilityCalendar: listingData.availabilityCalendar || {
                unavailableDates: [],
                minimumRental: 1,
                maximumRental: 30
              },
              includesInsurance: listingData.includesInsurance !== false,
              insuranceDetails: listingData.insuranceDetails || 'Basic damage coverage included',
              deliveryOptions: listingData.deliveryOptions || {
                pickup: true,
                dropoff: true,
                shipping: false,
                pickupLocation: `${listingData.location?.city}, ${listingData.location?.state}`,
                dropoffDistance: 25
              }
            };
            console.log('✅ Successfully loaded from Firestore:', listing.title);
            loading = false;
            return;
          } else {
            console.log('❌ Document does not exist in Firestore for ID:', listingId);
          }
        } catch (firestoreError) {
          console.error('❌ Firestore load failed:', firestoreError);
        }
      } else {
        console.log('❌ Firestore not available');
      }

      // Fallback: try to find the listing in the products array
      const productListing = products.find(product => product.id === listingId);

      if (productListing) {
        // Transform product data to match expected listing structure
        listing = {
          id: productListing.id,
          title: productListing.title,
          description: productListing.description,
          category: productListing.category,
          subcategory: productListing.subcategory,
          brand: productListing.brand,
          model: productListing.model,
          condition: productListing.condition,
          ageInYears: productListing.ageInYears,
          dailyPrice: productListing.dailyPrice,
          weeklyPrice: productListing.weeklyPrice,
          monthlyPrice: productListing.monthlyPrice,
          securityDeposit: productListing.securityDeposit,
          location: productListing.location,
          images: productListing.images,
          features: productListing.features,
          specifications: productListing.specifications,
          averageRating: productListing.owner.rating,
          reviewCount: productListing.owner.reviewCount,
          availabilityCalendar: {
            unavailableDates: productListing.availability.unavailableDates
          },
          owner: {
            uid: productListing.owner.id,
            name: productListing.owner.name,
            image: productListing.owner.avatar,
            averageRating: productListing.owner.rating,
            reviews: productListing.owner.reviewCount,
            verified: true,
            responseRate: 95,
            responseTime: 'within hours',
            listings: 5,
            bio: `Outdoor enthusiast sharing quality ${productListing.category} gear.`,
            joinedDate: '2023-01-15',
            languages: ['English'],
            location: `${productListing.location.city}, ${productListing.location.state}`
          },
          reviews: productListing.reviews.map(review => ({
            ...review,
            userImage: 'https://randomuser.me/api/portraits/men/32.jpg',
            comment: review.text
          })),
          status: productListing.status,
          createdAt: { seconds: new Date(productListing.createdAt).getTime() / 1000, nanoseconds: 0 },
          updatedAt: { seconds: new Date(productListing.updatedAt).getTime() / 1000, nanoseconds: 0 },
          includesInsurance: true,
          insuranceDetails: 'Basic damage coverage included',
          deliveryOptions: {
            pickup: true,
            dropoff: true,
            shipping: false,
            pickupLocation: `${productListing.location.city}, ${productListing.location.state}`,
            dropoffDistance: 25
          }
        };
        console.log('Using product listing:', listing.title);
      } else {
        error = 'Listing not found';
      }
    } catch (err) {
      console.error('Error loading listing:', err);
      error = 'Failed to load listing';
    } finally {
      loading = false;
      console.log('Loading complete. Final listing:', listing?.title);
    }
  });

  // No dummy listings - all data should come from the database


  // No fallback listings - all data should come from the database

  // UI state
  let activeImageIndex = 0;
  let activeTab = 'description';
  let showAllReviews = false;

  // Booking state
  let startDate = '';
  let endDate = '';
  let rentalPeriod = 'daily'; // daily, weekly, monthly
  let deliveryMethod = 'pickup';
  let insuranceTier = 'standard';

  // Calculate number of days between start and end dates (minimum 1 day for same-day rentals)
  $: days = startDate && endDate ?
    Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;

  // Calculate base price based on rental period
  $: basePrice = rentalPeriod === 'daily' ? (listing?.dailyPrice || 0) * days :
                 rentalPeriod === 'weekly' ? (listing?.weeklyPrice || 0) * Math.ceil(days / 7) :
                 (listing?.monthlyPrice || 0) * Math.ceil(days / 30);

  // Calculate service fee (10% of rental fee)
  $: serviceFee = Math.round(basePrice * 0.1);

  // Calculate delivery fee
  $: deliveryFee = deliveryMethod === 'pickup' ? 0 :
                   deliveryMethod === 'dropoff' ? (listing?.deliveryOptions?.dropoffDistance || 0) * 2 :
                   15; // Default shipping fee

  // Calculate insurance fee
  $: insuranceFee = insuranceTier === 'none' ? 0 :
                    insuranceTier === 'basic' ? 5 :
                    insuranceTier === 'standard' ? 10 : 15;

  // Calculate total price
  $: totalPrice = basePrice + serviceFee + deliveryFee + insuranceFee;

  // Check if a date is unavailable
  function isDateUnavailable(date: Date): boolean {
    if (!listing?.availabilityCalendar?.unavailableDates) return false;

    const dateString = date.toISOString().split('T')[0];
    return listing.availabilityCalendar.unavailableDates.includes(dateString);
  }

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  function formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  // Similar listings should come from the database
  $: similarListings = [];

  // Handle booking
  function handleBooking() {
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    // Navigate to booking confirmation page with booking details
    const bookingParams = new URLSearchParams({
      listingId: listing.id,
      startDate: startDate,
      endDate: endDate,
      deliveryMethod: deliveryMethod,
      insuranceTier: insuranceTier,
      totalPrice: totalPrice.toString()
    });

    goto(`/book/confirm?${bookingParams.toString()}`);
  }

  // Get auth state
  $: authState = simpleAuth.authState;

  // Handle message owner
  async function handleMessageOwner() {
    if (!$authState.isAuthenticated || !$authState.user) {
      alert('Please sign in to send messages');
      return;
    }

    if (!listing?.owner?.uid && !listing?.owner?.id) {
      alert('Owner information not available');
      return;
    }

    const ownerId = listing.owner.uid || listing.owner.id;
    if (ownerId === $authState.user.uid) {
      alert('You cannot message yourself');
      return;
    }

    try {
      // Create or find existing conversation
      const conversationId = await chatService.getOrCreateConversation(
        $authState.user.uid,
        ownerId,
        undefined, // no booking ID yet
        listing.id,
        listing.title
      );

      // Navigate to messages page with the conversation
      goto(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Unable to start conversation. Please try again.');
    }
  }

  // Handle date picker clicks to show calendar
  function handleStartDateClick(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input && 'showPicker' in input && typeof input.showPicker === 'function') {
      input.showPicker();
    }
  }

  function handleEndDateClick(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input && 'showPicker' in input && typeof input.showPicker === 'function') {
      input.showPicker();
    }
  }

  // Generate star rating display
  function renderStars(rating: number) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return Array(fullStars).fill('★').join('') +
           (halfStar ? '½' : '') +
           Array(emptyStars).fill('☆').join('');
  }
</script>

<svelte:head>
  <title>{listing ? `${listing.title} - GearGrab` : 'Listing Not Found - GearGrab'}</title>
  {#if listing}
    <meta name="description" content={listing.description.substring(0, 160)} />
  {/if}
</svelte:head>

{#if loading}
  <!-- Loading State -->
  <div class="relative min-h-screen pt-16">
    <!-- Background -->
    <VideoBackground
      videoSrc="/857136-hd_1280_720_24fps.mp4"
      imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
      overlayOpacity="{0.4}"
    />

    <div class="relative z-10 min-h-screen pt-24 pb-16">
      <div class="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16 w-full">
        <div class="flex items-center justify-center min-h-[400px]">
          <div class="text-center text-white">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p class="text-lg">Loading listing...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else if !listing}
  <!-- Not Found with Outdoor Theme -->
  <div class="relative min-h-screen pt-16">
    <div
      class="absolute inset-0 bg-cover bg-center"
      style="background-image: url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80');"
    ></div>
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="relative min-h-screen flex items-center justify-center px-4">
      <div class="text-center text-white">
        <h1 class="text-3xl font-bold mb-4">Listing Not Found</h1>
        <p class="text-lg mb-6">The listing you're looking for doesn't exist or has been removed.</p>
        <a href="/browse" class="btn bg-white text-green-600 hover:bg-gray-100 px-8 py-3">Browse Other Listings</a>
      </div>
    </div>
  </div>
{:else}
  <!-- Background -->
  <VideoBackground
    videoSrc="/857136-hd_1280_720_24fps.mp4"
    imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
    overlayOpacity="{0.4}"
  />

  <!-- Listing Page Content -->
  <div class="relative z-10 min-h-screen pt-24 pb-16">
    <div class="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 w-full">
      <div class="space-y-12">
        <!-- Main Content: Images and Details -->
        <div class="space-y-16 w-full">
          <!-- Listing Title & Info - Floating Blur Box -->
          <ScrollLinkedAnimator animation="fade-up" startOffset="{0}" endOffset="{0.6}">
            <div class="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 p-8 shadow-2xl max-w-4xl mx-auto hover:bg-white/25 transition-all duration-300 text-center">
            <h1 class="text-3xl font-bold mb-4 text-white drop-shadow-lg">
              {#if listing}
                {listing.title}
                {#if listing.id === '3' && listing.title?.includes('REI')}
                  <span class="text-green-400 text-sm ml-2">✅ REAL DATA FROM FIRESTORE</span>
                {:else}
                  <span class="text-yellow-400 text-sm ml-2">⚠️ DUMMY DATA (ID: {listing.id})</span>
                {/if}
              {:else if loading}
                <span class="text-blue-400">⏳ Loading from Firestore...</span>
              {:else if error}
                <span class="text-red-400">❌ Error: {error}</span>
              {:else}
                <span class="text-gray-400">❓ No data available</span>
              {/if}
            </h1>

            <!-- Debug Info -->
            <div class="text-xs text-white/50 mb-4">
              Debug: Loading="{loading}," Error="{error}," ListingID="{listingId}," HasListing="{!!listing}"
              {#if listing}
                , Title={listing.title?.substring(0, 30)}...
              {/if}
            </div>

            <div class="flex flex-wrap items-center justify-center mb-4">
              <div class="flex items-center mr-4">
                <div class="text-yellow-400 mr-1">
                  {#each Array(5) as _, i}
                    <span class="text-lg">{i < Math.floor(listing.averageRating) ? '★' : i < Math.ceil(listing.averageRating) ? '★' : '☆'}</span>
                  {/each}
                </div>
                <span class="font-medium text-white">{listing.averageRating}</span>
                {#if listing.reviewCount}
                  <span class="text-white/70 ml-1">({listing.reviewCount} reviews)</span>
                {/if}
              </div>
              <div class="text-white/70 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{listing.location.city}, {listing.location.state}</span>
              </div>
            </div>
          </ScrollLinkedAnimator>

          <!-- Image Gallery - Floating Blur Box -->
          <ScrollLinkedAnimator animation="scale-in" startOffset="{0.1}" endOffset="{0.7}">
            <div class="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 p-8 shadow-2xl max-w-4xl mx-auto hover:bg-white/25 transition-all duration-300">
            <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden mb-4">
              <img
                src="{listing.images[activeImageIndex]}"
                alt="{listing.title}"
                class="object-cover w-full h-full"
              />
            </div>

            {#if listing.images.length > 1}
              <div class="flex space-x-2 overflow-x-auto pb-2">
                {#each listing.images as image, i}
                  <button
                    class="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden {i === activeImageIndex ? 'ring-2 ring-green-400' : 'ring-1 ring-white/30'}"
                    on:click={() => activeImageIndex = i}
                  >
                    <img src={image} alt={`${listing.title} - Image ${i+1}`} class="w-full h-full object-cover" />
                  </button>
                {/each}
              </div>
            {/if}
          </ScrollLinkedAnimator>

          <!-- Tabs - Floating Blur Box -->
          <ScrollLinkedAnimator animation="fade-left" startOffset="{0.2}" endOffset="{0.8}" className="mt-16">
            <div class="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 p-8 shadow-2xl max-w-4xl mx-auto hover:bg-white/25 transition-all duration-300">
            <div class="border-b border-white/20">
              <nav class="flex -mb-px space-x-8 justify-center">
                <button
                  class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'description' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
                  on:click={() => activeTab = 'description'}
                >
                  Description
                </button>
                <button
                  class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'features' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
                  on:click={() => activeTab = 'features'}
                >
                  Features & Specs
                </button>
                <button
                  class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
                  on:click={() => activeTab = 'reviews'}
                >
                  Reviews ({listing.reviewCount})
                </button>
                <button
                  class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'owner' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
                  on:click={() => activeTab = 'owner'}
                >
                  Owner
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="py-6">
              {#if activeTab === 'description'}
                <div class="prose max-w-none text-white">
                  <p class="text-white/90 leading-relaxed">{listing.description}</p>

                  <div class="mt-6">
                    <h3 class="text-lg font-medium mb-4 text-white">Transfer Options</h3>
                    <ul class="space-y-3">
                      {#if listing.deliveryOptions.pickup}
                        <li class="flex items-start">
                          <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <div>
                            <span class="font-medium text-white">Pickup</span>
                            {#if listing.deliveryOptions.pickupLocation}
                              <p class="text-white/70 text-sm mt-1">Location: {listing.deliveryOptions.pickupLocation}</p>
                            {/if}
                          </div>
                        </li>
                      {/if}

                      {#if listing.deliveryOptions.dropoff}
                        <li class="flex items-start">
                          <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <div>
                            <span class="font-medium text-white">Dropoff</span>
                            {#if listing.deliveryOptions.dropoffDistance}
                              <p class="text-white/70 text-sm mt-1">Within {listing.deliveryOptions.dropoffDistance} miles</p>
                            {/if}
                          </div>
                        </li>
                      {/if}

                      {#if listing.deliveryOptions.shipping}
                        <li class="flex items-start">
                          <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <div>
                            <span class="font-medium text-white">Shipping</span>
                            <p class="text-white/70 text-sm mt-1">Fee: {formatCurrency(15)}</p>
                          </div>
                        </li>
                      {/if}
                    </ul>
                  </div>

                  {#if listing.includesInsurance}
                    <div class="mt-6">
                      <h3 class="text-lg font-medium mb-4 text-white">Insurance</h3>
                      <div class="flex items-start">
                        <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        <div>
                          <span class="font-medium text-white">Insurance Included</span>
                          {#if listing.insuranceDetails}
                            <p class="text-white/70 text-sm mt-1">{listing.insuranceDetails}</p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              {:else if activeTab === 'features'}
                <div>
                  <!-- Features -->
                  <div class="mb-8">
                    <h3 class="text-lg font-medium mb-4 text-white">Features</h3>
                    <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {#each listing.features as feature}
                        <li class="flex items-center">
                          <svg class="h-5 w-5 text-green-400 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <span class="text-white/90">{feature}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>

                  <!-- Specifications -->
                  {#if listing.specifications}
                    <div class="mb-8">
                      <h3 class="text-lg font-medium mb-4 text-white">Specifications</h3>
                      <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                          {#each Object.entries(listing.specifications) as [key, value]}
                            <div class="sm:col-span-1">
                              <dt class="text-sm font-medium text-white/70">{key}</dt>
                              <dd class="mt-1 text-sm text-white">{value}</dd>
                            </div>
                          {/each}
                        </dl>
                      </div>
                    </div>
                  {/if}

                  <!-- Additional Info -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div>
                      <h3 class="text-sm text-white/70">Brand</h3>
                      <p class="font-medium text-white">{listing.brand || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 class="text-sm text-white/70">Model</h3>
                      <p class="font-medium text-white">{listing.model || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 class="text-sm text-white/70">Condition</h3>
                      <p class="font-medium text-white">{listing.condition}</p>
                    </div>
                    <div>
                      <h3 class="text-sm text-white/70">Age</h3>
                      <p class="font-medium text-white">{listing.ageInYears} {listing.ageInYears === 1 ? 'year' : 'years'}</p>
                    </div>
                  </div>
                </div>
              {:else if activeTab === 'reviews'}
                <div>
                  {#if listing.reviews && listing.reviews.length > 0}
                    <div class="mb-6">
                      <h3 class="text-lg font-medium mb-4 text-white">Customer Reviews</h3>

                      <div class="space-y-6">
                        {#each (showAllReviews ? listing.reviews : listing.reviews.slice(0, 3)) as review}
                          <div class="border-b border-white/20 pb-6 last:border-b-0 last:pb-0">
                            <div class="flex items-start">
                              <img src="{review.userImage}" alt="{review.userName}" class="h-10 w-10 rounded-full mr-4" />
                              <div>
                                <div class="flex items-center">
                                  <h4 class="font-medium text-white">{review.userName}</h4>
                                  <span class="mx-2 text-white/50">•</span>
                                  <span class="text-white/70 text-sm">{review.date}</span>
                                </div>
                                <div class="text-yellow-400 mt-1">
                                  {#each Array(5) as _, i}
                                    <span>{i < review.rating ? '★' : '☆'}</span>
                                  {/each}
                                </div>
                                <p class="mt-2 text-white/90">{review.comment}</p>
                              </div>
                            </div>
                          </div>
                        {/each}
                      </div>

                      {#if listing.reviews.length > 3 && !showAllReviews}
                        <button
                          class="mt-4 text-green-400 font-medium hover:text-green-300"
                          on:click={() => showAllReviews = true}
                        >
                          Show all {listing.reviews.length} reviews
                        </button>
                      {/if}
                    </div>
                  {:else}
                    <p class="text-white/70">No reviews yet.</p>
                  {/if}
                </div>
              {:else if activeTab === 'owner'}
                <div>
                  {#if listing.owner}
                    <div class="flex items-start">
                      <img src="{listing.owner.image}" alt="{listing.owner.name}" class="h-16 w-16 rounded-full mr-4" />
                      <div>
                        <h3 class="text-lg font-medium text-white">{listing.owner.name}</h3>
                        <p class="text-white/70 text-sm">Member since {listing.owner.joinedDate}</p>

                        <div class="mt-2 flex items-center">
                          <div class="text-yellow-400 mr-1">
                            {#each Array(5) as _, i}
                              <span>{i < Math.floor(listing.owner.averageRating) ? '★' : i < Math.ceil(listing.owner.averageRating) ? '★' : '☆'}</span>
                            {/each}
                          </div>
                          <span class="font-medium text-white">{listing.owner.averageRating}</span>
                          <span class="text-white/70 ml-1">({listing.owner.reviews} reviews)</span>
                        </div>

                        <div class="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p class="text-sm text-white/70">Response rate</p>
                            <p class="font-medium text-white">{listing.owner.responseRate}%</p>
                          </div>
                          <div>
                            <p class="text-sm text-white/70">Response time</p>
                            <p class="font-medium text-white">{listing.owner.responseTime}</p>
                          </div>
                          <div>
                            <p class="text-sm text-white/70">Listings</p>
                            <p class="font-medium text-white">{listing.owner.listings}</p>
                          </div>
                        </div>

                        <button
                          class="mt-4 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-md border border-white/20 transition-colors"
                          on:click="{handleMessageOwner}"
                        >
                          Message {listing.owner.name}
                        </button>
                      </div>
                    </div>
                  {:else}
                    <p class="text-white/70">Owner information not available.</p>
                  {/if}
                </div>
                {/if}
              </div>
            </div>
          </ScrollLinkedAnimator>

        <!-- Booking Form -->
        <ScrollLinkedAnimator animation="fade-right" startOffset="{0.3}" endOffset="{0.9}">
          <div class="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-w-2xl mx-auto hover:bg-white/25 transition-all duration-300">
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <div class="text-2xl font-bold text-green-400">{formatCurrency(listing.dailyPrice)}<span class="text-white/70 text-base font-normal">/day</span></div>
                  {#if listing.weeklyPrice}
                    <div class="text-sm text-white/70">
                      {formatCurrency(listing.weeklyPrice)}/week · {formatCurrency(listing.monthlyPrice)}/month
                    </div>
                  {/if}
                </div>
                {#if listing.securityDeposit > 0}
                  <div class="text-sm text-white/70 text-right">
                    {formatCurrency(listing.securityDeposit)} <br />security deposit
                  </div>
                {/if}
              </div>

              <!-- Booking Form -->
              <form class="space-y-4">
                <!-- Rental Period -->
                <fieldset>
                  <legend class="block text-sm font-medium text-white mb-2">Rental Period</legend>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'daily' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
                      on:click={() => rentalPeriod = 'daily'}
                      aria-pressed={rentalPeriod === 'daily'}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'weekly' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
                      on:click={() => rentalPeriod = 'weekly'}
                      aria-pressed={rentalPeriod === 'weekly'}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'monthly' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
                      on:click={() => rentalPeriod = 'monthly'}
                      aria-pressed={rentalPeriod === 'monthly'}
                    >
                      Monthly
                    </button>
                  </div>
                </fieldset>

                <!-- Dates -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="start-date" class="block text-sm font-medium text-white mb-2">Start Date</label>
                    <input
                      type="date"
                      id="start-date"
                      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent cursor-pointer"
                      bind:value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      on:click={handleStartDateClick}
                    />
                  </div>
                  <div>
                    <label for="end-date" class="block text-sm font-medium text-white mb-2">End Date</label>
                    <input
                      type="date"
                      id="end-date"
                      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent cursor-pointer"
                      bind:value={endDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      on:click={handleEndDateClick}
                    />
                  </div>
                </div>

                <!-- Transfer Method -->
                <fieldset>
                  <legend class="block text-sm font-medium text-white mb-2">Transfer Method</legend>
                  <div class="space-y-3">
                    {#if listing.deliveryOptions.pickup}
                      <div class="flex items-center">
                        <input
                          type="radio"
                          id="pickup"
                          name="delivery"
                          value="pickup"
                          class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                          bind:group="{deliveryMethod}"
                        />
                        <label for="pickup" class="ml-3 block text-sm text-white">Pickup ({listing.deliveryOptions.pickupLocation})</label>
                      </div>
                    {/if}

                    {#if listing.deliveryOptions.dropoff}
                      <div class="flex items-center">
                        <input
                          type="radio"
                          id="dropoff"
                          name="delivery"
                          value="dropoff"
                          class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                          bind:group="{deliveryMethod}"
                        />
                        <label for="dropoff" class="ml-3 block text-sm text-white">Delivery (within {listing.deliveryOptions.dropoffDistance} miles)</label>
                      </div>
                    {/if}

                    {#if listing.deliveryOptions.shipping}
                      <div class="flex items-center">
                        <input
                          type="radio"
                          id="shipping"
                          name="delivery"
                          value="shipping"
                          class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                          bind:group="{deliveryMethod}"
                        />
                        <label for="shipping" class="ml-3 block text-sm text-white">Shipping</label>
                      </div>
                    {/if}
                  </div>
                </fieldset>

                <!-- Insurance -->
                <fieldset>
                  <legend class="block text-sm font-medium text-white mb-2">Insurance</legend>
                  <div class="space-y-3">
                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="insurance-none"
                        name="insurance"
                        value="none"
                        class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                        bind:group="{insuranceTier}"
                      />
                      <label for="insurance-none" class="ml-3 block text-sm text-white">No additional insurance</label>
                    </div>

                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="insurance-basic"
                        name="insurance"
                        value="basic"
                        class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                        bind:group="{insuranceTier}"
                      />
                      <label for="insurance-basic" class="ml-3 block text-sm text-white">Basic ($5/day)</label>
                    </div>

                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="insurance-standard"
                        name="insurance"
                        value="standard"
                        class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                        bind:group="{insuranceTier}"
                      />
                      <label for="insurance-standard" class="ml-3 block text-sm text-white">Standard ($10/day)</label>
                    </div>

                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="insurance-premium"
                        name="insurance"
                        value="premium"
                        class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                        bind:group="{insuranceTier}"
                      />
                      <label for="insurance-premium" class="ml-3 block text-sm text-white">Premium ($15/day)</label>
                    </div>
                  </div>
                </fieldset>

                {#if days > 0}
                  <div class="border-t border-white/20 pt-4 mt-4">
                    <div class="space-y-2 text-white">
                      {#if rentalPeriod === 'daily'}
                        <div class="flex justify-between">
                          <span>{formatCurrency(listing.dailyPrice)} × {days} days</span>
                          <span>{formatCurrency(listing.dailyPrice * days)}</span>
                        </div>
                      {:else if rentalPeriod === 'weekly'}
                        <div class="flex justify-between">
                          <span>{formatCurrency(listing.weeklyPrice)} × {Math.ceil(days / 7)} weeks</span>
                          <span>{formatCurrency(listing.weeklyPrice * Math.ceil(days / 7))}</span>
                        </div>
                      {:else}
                        <div class="flex justify-between">
                          <span>{formatCurrency(listing.monthlyPrice)} × {Math.ceil(days / 30)} months</span>
                          <span>{formatCurrency(listing.monthlyPrice * Math.ceil(days / 30))}</span>
                        </div>
                      {/if}

                      <div class="flex justify-between">
                        <span>Service fee</span>
                        <span>{formatCurrency(serviceFee)}</span>
                      </div>

                      {#if deliveryFee > 0}
                        <div class="flex justify-between">
                          <span>{deliveryMethod === 'dropoff' ? 'Delivery fee' : 'Shipping fee'}</span>
                          <span>{formatCurrency(deliveryFee)}</span>
                        </div>
                      {/if}

                      {#if insuranceFee > 0}
                        <div class="flex justify-between">
                          <span>Insurance ({insuranceTier})</span>
                          <span>{formatCurrency(insuranceFee)}</span>
                        </div>
                      {/if}

                      <div class="flex justify-between font-bold pt-2 border-t border-white/20 text-green-400">
                        <span>Total</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                {/if}

                <AuthGuard message="You must be signed in to rent gear. Create an account to book this item and enjoy secure rentals with verified owners.">
                  <button
                    type="button"
                    class="w-full bg-green-400 hover:bg-green-500 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    on:click={handleBooking}
                    disabled={!startDate || !endDate}
                  >
                    Book Now
                  </button>
                </AuthGuard>
              </form>
            </div>
          </div>
        </ScrollLinkedAnimator>
      </div>

    </div>

    <!-- Similar Products -->
    {#if similarListings && similarListings.length > 0}
      <div class="mt-16 text-center max-w-6xl mx-auto px-8 sm:px-12 lg:px-16">
        <ScrollLinkedAnimator animation="fade-up" startOffset="{0.4}" endOffset="{1.0}">
          <h2 class="text-2xl font-bold mb-6 text-white drop-shadow-lg">Similar Products</h2>
        </ScrollLinkedAnimator>

        <ScrollLinkedSequential animation="scale-in" startOffset="{0.5}" endOffset="{1.0}" incrementDelay="{0.1}">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center max-w-4xl mx-auto">
            {#each similarListings as item}
              <a href="/listing/{item.id}" class="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg overflow-hidden hover:bg-white/20 transition-all">
                <div class="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img src="{item.images[0]}" alt="{item.title}" class="object-cover w-full h-48" />
                </div>
                <div class="p-4">
                  <h3 class="font-medium text-lg mb-1 text-white">{item.title}</h3>
                  <p class="text-white/70 text-sm mb-2">{item.location.city}, {item.location.state}</p>
                  <div class="flex justify-between items-center">
                    <p class="font-bold text-green-400">{formatCurrency(item.dailyPrice)}/day</p>
                    <div class="flex items-center">
                      <span class="text-yellow-400 mr-1">★</span>
                      <span class="text-white">{item.averageRating || 'New'}</span>
                      {#if item.reviewCount}
                        <span class="text-white/70 ml-1">({item.reviewCount})</span>
                      {/if}
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </ScrollLinkedSequential>
      </div>
    {/if}
    </div>
  </div>
{/if}
<!-- End of temporarily disabled complex rendering -->
