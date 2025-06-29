<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';


  import ListingHeader from '$lib/components/listing/listing-header.svelte';
  import ListingImageGallery from '$lib/components/listing/listing-image-gallery.svelte';
  import ListingTabs from '$lib/components/listing/listing-tabs.svelte';
  import ListingBookingCard from '$lib/components/listing/listing-booking-card.svelte';
  import { listingService } from '$lib/services/listing';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { chatService } from '$lib/services/chat';

  // Get the listing ID from the URL
  const listingId = $page.params.listingId;

  // Listing data state
  let listing: any = null;
  let loading = true;
  let error = '';

  // Load listing data
  onMount(async () => {
    try {
      loading = true;
      listing = await listingService.loadListing(listingId);
      if (!listing) {
        error = 'Listing not found';
      }
    } catch (err) {
      console.error('Error loading listing:', err);
      error = 'Failed to load listing';
    } finally {
      loading = false;
    }
  });

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
{:else if error || !listing}
  <!-- Not Found -->
  <div class="relative min-h-screen pt-16">
    <VideoBackground
      videoSrc="/857136-hd_1280_720_24fps.mp4"
      imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
      overlayOpacity="{0.6}"
    />
    <div class="relative min-h-screen flex items-center justify-center px-4">
      <div class="text-center text-white">
        <h1 class="text-3xl font-bold mb-4">Listing Not Found</h1>
        <p class="text-lg mb-6">{error || "The listing you're looking for doesn't exist or has been removed."}</p>
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
        <!-- Main Content -->
        <div class="space-y-16 w-full">
          <!-- Listing Header -->
          <ListingHeader {listing} />

          <!-- Image Gallery -->
          <ListingImageGallery {listing} bind:activeImageIndex />

          <!-- Tabs -->
          <ListingTabs {listing} bind:activeTab bind:showAllReviews {handleMessageOwner} />



        <!-- Booking Form -->
        <ListingBookingCard
          {listing}
          bind:startDate
          bind:endDate
          bind:deliveryMethod
          bind:insuranceTier
          bind:rentalPeriod
          {handleBooking}
          {handleStartDateClick}
          {handleEndDateClick}
        />


      </div>

    </div>


    </div>
  </div>
{/if}
<!-- End of temporarily disabled complex rendering -->
