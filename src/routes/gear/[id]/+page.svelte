<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { getListing } from '$lib/services/listings.service';
  import { getUserProfile } from '$lib/services/users.service';
  import { getListingReviews, getListingReviewStats } from '$lib/services/reviews.service';
  import { showToast } from '$lib/stores/toast.store';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import StarRating from '$lib/components/reviews/StarRating.svelte';
  import ReviewsList from '$lib/components/reviews/ReviewsList.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { ListingData } from '$lib/types';
  import type { UserProfile } from '$lib/services/users.service';
  import type { ReviewStats } from '$lib/types/reviews';

  // State
  let loading = true;
  let error = '';
  let listing: ListingData | null = null;
  let owner: UserProfile | null = null;
  let reviewStats: ReviewStats | null = null;
  let currentImageIndex = 0;

  // Get listing ID from URL
  $: listingId = $page.params.id;

  onMount(async () => {
    if (!listingId) {
      error = 'Invalid listing ID';
      loading = false;
      return;
    }

    await loadListingData();
  });

  async function loadListingData() {
    try {
      loading = true;
      error = '';

      // Fetch from our API endpoint
      const response = await fetch(`/api/listings/${listingId}`);

      if (!response.ok) {
        if (response.status === 404) {
          error = 'Listing not found';
        } else {
          error = 'Failed to load listing';
        }
        return;
      }

      const data = await response.json();

      if (!data.success || !data.listing) {
        error = 'Invalid listing data';
        return;
      }

      listing = data.listing;

      // Create sample owner and review stats based on the listing data
      owner = {
        uid: data.listing.owner.id,
        displayName: data.listing.owner.name,
        email: `${data.listing.owner.name.toLowerCase().replace(' ', '.')}@example.com`,
        photoURL: data.listing.owner.avatar,
        location: data.listing.location,
        verified: data.listing.owner.verified,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };

      reviewStats = {
        averageRating: data.listing.rating,
        totalReviews: data.listing.reviewCount,
        ratingDistribution: {
          5: Math.floor(data.listing.reviewCount * 0.6),
          4: Math.floor(data.listing.reviewCount * 0.3),
          3: Math.floor(data.listing.reviewCount * 0.1),
          2: 0,
          1: 0
        }
      };

    } catch (err: any) {
      console.error('Error loading listing:', err);
      error = err.message || 'Failed to load listing';
    } finally {
      loading = false;
    }
  }

  function createSampleListing(id: string): ListingData {
    const sampleListings: Record<string, any> = {
      // Camping & Hiking
      '1': {
        id: '1',
        title: 'REI Co-op Half Dome 2 Plus Tent',
        description: 'Perfect 2-person tent for backpacking and car camping. Easy to set up, spacious interior, and excellent weather protection. Great for weekend adventures!',
        category: 'Camping & Hiking',
        brand: 'REI Co-op',
        condition: 'Excellent' as const,
        location: 'San Francisco, CA',
        pricing: {
          rentalPrice: {
            daily: 25,
            weekly: 150,
            monthly: 500
          }
        },
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=800&h=600&fit=crop'
        ],
        owner: {
          id: 'sample-owner-1',
          name: 'Alex Johnson',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          rating: 4.8,
          reviewCount: 23
        },
        status: 'active' as const,
        views: 45,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Climbing
      '2': {
        id: '2',
        title: 'Black Diamond Solution Climbing Harness',
        description: 'Professional climbing harness with 4 gear loops and belay loop. Comfortable for all-day climbing sessions. Perfect for sport and trad climbing.',
        category: 'Climbing',
        brand: 'Black Diamond',
        condition: 'Excellent' as const,
        location: 'Boulder, CO',
        pricing: {
          rentalPrice: {
            daily: 15,
            weekly: 90,
            monthly: 300
          }
        },
        images: [
          'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop'
        ],
        owner: {
          id: 'sample-owner-2',
          name: 'Mike Rodriguez',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          rating: 4.9,
          reviewCount: 31
        },
        status: 'active' as const,
        views: 67,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Cycling
      '3': {
        id: '3',
        title: 'Trek Fuel EX 8 Mountain Bike',
        description: 'Full suspension mountain bike perfect for trail riding. 29" wheels, 130mm travel, and reliable Shimano components. Great for intermediate to advanced riders.',
        category: 'Cycling',
        brand: 'Trek',
        condition: 'Very Good' as const,
        location: 'Moab, UT',
        pricing: {
          rentalPrice: {
            daily: 65,
            weekly: 390,
            monthly: 1300
          }
        },
        images: [
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop'
        ],
        owner: {
          id: 'sample-owner-3',
          name: 'Emma Wilson',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          rating: 4.7,
          reviewCount: 18
        },
        status: 'active' as const,
        views: 89,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Water Sports
      '4': {
        id: '4',
        title: 'BOTE Flood Aero Inflatable SUP',
        description: 'Premium inflatable stand-up paddleboard. 11\'6" length, ultra-stable design perfect for beginners and experienced paddlers. Includes pump, paddle, and carry bag.',
        category: 'Water Sports',
        brand: 'BOTE',
        condition: 'Excellent' as const,
        location: 'San Diego, CA',
        pricing: {
          rentalPrice: {
            daily: 35,
            weekly: 210,
            monthly: 700
          }
        },
        images: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop'
        ],
        owner: {
          id: 'sample-owner-4',
          name: 'Jake Martinez',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
          rating: 4.8,
          reviewCount: 27
        },
        status: 'active' as const,
        views: 52,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Winter Sports
      '5': {
        id: '5',
        title: 'Rossignol Experience 88 Ti Skis',
        description: 'All-mountain skis perfect for groomed runs and off-piste adventures. 172cm length, titanium construction for stability and performance. Bindings included.',
        category: 'Winter Sports',
        brand: 'Rossignol',
        condition: 'Good' as const,
        location: 'Park City, UT',
        pricing: {
          rentalPrice: {
            daily: 45,
            weekly: 270,
            monthly: 900
          }
        },
        images: [
          'https://images.unsplash.com/photo-1551524164-6cf2ac2d8c9c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
        ],
        owner: {
          id: 'sample-owner-5',
          name: 'Sophie Anderson',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
          rating: 4.6,
          reviewCount: 14
        },
        status: 'active' as const,
        views: 73,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },

      // Travel
      '6': {
        id: '6',
        title: 'Patagonia Black Hole Duffel 70L',
        description: 'Durable travel duffel bag perfect for adventure travel. Weather-resistant fabric, multiple carry options, and spacious main compartment. Great for expeditions.',
        category: 'Travel',
        brand: 'Patagonia',
        condition: 'Very Good' as const,
        location: 'Seattle, WA',
        pricing: {
          rentalPrice: {
            daily: 12,
            weekly: 72,
            monthly: 240
          }
        },
        images: [
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop'
        ],
        owner: {
          id: 'sample-owner-6',
          name: 'David Kim',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          rating: 4.9,
          reviewCount: 22
        },
        status: 'active' as const,
        views: 38,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    return (sampleListings[id] || sampleListings['1']) as ListingData;
  }

  function createSampleOwner(id: string): any {
    return {
      uid: `sample-owner-${id}`,
      displayName: 'Alex Johnson',
      email: 'alex@example.com',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      location: 'San Francisco, CA',
      bio: 'Outdoor enthusiast who loves sharing gear with the community.',
      memberSince: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      verified: true
    };
  }

  function createSampleReviewStats(): any {
    return {
      averageRating: 4.8,
      totalReviews: 23,
      ratingDistribution: {
        1: 0,
        2: 1,
        3: 2,
        4: 5,
        5: 15
      }
    };
  }

  function handleBookNow() {
    if (!$authStore.data) {
      showToast('info', 'Please sign in to book this item');
      goto('/auth/signin');
      return;
    }

    goto(`/book/${listingId}`);
  }

  function handleContactOwner() {
    if (!$authStore.data) {
      showToast('info', 'Please sign in to contact the owner');
      goto('/auth/signin');
      return;
    }

    // Navigate to messages with owner
    goto(`/dashboard/messages?user=${listing?.owner.id}`);
  }

  function nextImage() {
    if (listing?.images && listing.images.length > 1) {
      currentImageIndex = (currentImageIndex + 1) % listing.images.length;
    }
  }

  function prevImage() {
    if (listing?.images && listing.images.length > 1) {
      currentImageIndex = currentImageIndex === 0 ? listing.images.length - 1 : currentImageIndex - 1;
    }
  }

  function selectImage(index: number) {
    currentImageIndex = index;
  }

  $: hasMultipleImages = listing?.images && listing.images.length > 1;
  $: currentImage = listing?.images?.[currentImageIndex];
  $: averageRating = reviewStats?.averageRating || 0;
  $: totalReviews = reviewStats?.totalReviews || 0;
</script>

<svelte:head>
  <title>{listing?.title || 'Gear'} - GearGrab</title>
  <meta name="description" content={listing?.description || 'Rent quality gear from trusted owners'} />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50">
  {#if loading}
    <div class="flex justify-center items-center min-h-[400px]">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 class="text-lg font-medium text-red-800">Error</h3>
            <p class="text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div class="mt-4">
          <Button variant="secondary" on:click={() => goto('/listings')}>
            Browse All Listings
          </Button>
        </div>
      </div>
    </div>
  {:else if listing}
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <a href="/" class="hover:text-primary-600">Home</a>
        <span>/</span>
        <a href="/listings" class="hover:text-primary-600">Listings</a>
        <span>/</span>
        <a href={`/categories/${listing.category.toLowerCase().replace(/\s+/g, '-')}`} class="hover:text-primary-600">
          {listing.category}
        </a>
        <span>/</span>
        <span class="text-gray-900">{listing.title}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Image Gallery -->
        <div class="space-y-4">
          <!-- Main Image -->
          <div class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {#if currentImage}
              <img
                src={currentImage}
                alt={listing.title}
                class="w-full h-full object-cover"
              />
              
              {#if hasMultipleImages}
                <!-- Navigation Arrows -->
                <button
                  on:click={prevImage}
                  class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                >
                  <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  on:click={nextImage}
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                >
                  <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <!-- Image Counter -->
                <div class="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {listing.images.length}
                </div>
              {/if}
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-gray-200">
                <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            {/if}
          </div>

          <!-- Thumbnail Gallery -->
          {#if hasMultipleImages}
            <div class="grid grid-cols-4 gap-2">
              {#each listing.images as image, index}
                <button
                  on:click={() => selectImage(index)}
                  class="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all"
                  class:border-primary-500={index === currentImageIndex}
                  class:border-gray-200={index !== currentImageIndex}
                >
                  <img
                    src={image}
                    alt={`${listing.title} ${index + 1}`}
                    class="w-full h-full object-cover"
                  />
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Listing Details -->
        <div class="space-y-6">
          <!-- Title and Rating -->
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            
            {#if totalReviews > 0}
              <div class="flex items-center space-x-2">
                <StarRating rating={averageRating} readonly size="sm" />
                <span class="text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({totalReviews} review{totalReviews === 1 ? '' : 's'})
                </span>
              </div>
            {:else}
              <p class="text-sm text-gray-600">No reviews yet</p>
            {/if}
          </div>

          <!-- Price and Availability -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="text-3xl font-bold text-gray-900">${listing.pricing?.rentalPrice?.daily || 25}</span>
                <span class="text-gray-600 ml-1">per day</span>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-600">Condition</div>
                <div class="font-medium text-gray-900">{listing.condition}</div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="w-full">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth={true}
                  on:click={handleBookNow}
                >
                  Book Now
                </Button>
              </div>

              <div class="w-full">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth={true}
                  on:click={handleContactOwner}
                >
                  Contact Owner
                </Button>
              </div>
            </div>
          </div>

          <!-- Owner Info -->
          {#if owner}
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 class="font-semibold text-gray-900 mb-3">Owner</h3>
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  {#if owner.photoURL}
                    <img src={owner.photoURL} alt={owner.displayName} class="w-full h-full object-cover" />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 font-semibold">
                      {owner.displayName?.charAt(0) || 'U'}
                    </div>
                  {/if}
                </div>
                <div>
                  <div class="font-medium text-gray-900">{owner.displayName}</div>
                  <div class="text-sm text-gray-600">{owner.location || 'Location not specified'}</div>
                  {#if owner?.memberSince}
                    <div class="text-xs text-gray-500">
                      Member since {new Date(owner.memberSince).getFullYear()}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}

          <!-- Listing Details -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h3 class="font-semibold text-gray-900 mb-3">Details</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Category:</span>
                <span class="ml-2 font-medium">{listing.category}</span>
              </div>
              <div>
                <span class="text-gray-600">Brand:</span>
                <span class="ml-2 font-medium">{listing.brand || 'Not specified'}</span>
              </div>
              <div>
                <span class="text-gray-600">Location:</span>
                <span class="ml-2 font-medium">{listing.location}</span>
              </div>
              <div>
                <span class="text-gray-600">Available:</span>
                <span class="ml-2 font-medium text-green-600">Yes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="font-semibold text-gray-900 mb-3">Description</h3>
        <p class="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </div>

      <!-- Reviews Section -->
      {#if listingId}
        <div class="mt-8">
          <ReviewsList {listingId} showTitle={true} maxReviews={10} showViewAllButton={false} />
        </div>
      {/if}
    </div>
  {/if}
</main>

<Footer />
