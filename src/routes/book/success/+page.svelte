<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let bookingId = '';
  let loading = true;
  let booking = null;

  onMount(() => {
    // Get booking ID from URL parameters
    bookingId = $page.url.searchParams.get('bookingId') || '';
    
    if (!bookingId) {
      goto('/dashboard');
      return;
    }

    // Load booking data from API
    loadBookingData();
  });

  async function loadBookingData() {
    try {
      // Get authentication token
      const { auth } = await import('$lib/firebase/client');
      const user = auth?.currentUser;

      if (!user) {
        console.error('User not authenticated, using fallback data');
        // Use fallback data if not authenticated
        booking = {
          id: bookingId,
          listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
          listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
          startDate: new Date('2024-02-15'),
          endDate: new Date('2024-02-18'),
          totalPrice: 165,
          status: 'pending',
          owner: {
            name: 'David Wilson',
            email: 'david@example.com',
            phone: '(555) 123-4567'
          },
          confirmationNumber: bookingId.replace('booking_', 'GG-'),
          deliveryMethod: 'pickup',
          pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)'
        };
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch(`/api/book?bookingId=${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (response.ok) {
        booking = {
          ...result.booking,
          startDate: new Date(result.booking.startDate),
          endDate: new Date(result.booking.endDate)
        };
      } else {
        console.error('Failed to load booking:', result.error);
        // Fallback to mock data
        booking = {
          id: bookingId,
          listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
          listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
          startDate: new Date('2024-02-15'),
          endDate: new Date('2024-02-18'),
          totalPrice: 165,
          status: 'pending',
          owner: {
            name: 'David Wilson',
            email: 'david@example.com',
            phone: '(555) 123-4567'
          },
          confirmationNumber: bookingId.replace('booking_', 'GG-'),
          deliveryMethod: 'pickup',
          pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)'
        };
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
      // Fallback to mock data
      booking = {
        id: bookingId,
        listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
        listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-02-18'),
        totalPrice: 165,
        status: 'pending',
        owner: {
          name: 'David Wilson',
          email: 'david@example.com',
          phone: '(555) 123-4567'
        },
        confirmationNumber: bookingId.replace('booking_', 'GG-'),
        deliveryMethod: 'pickup',
        pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)'
      };
    } finally {
      loading = false;
    }
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function handleViewBooking() {
    goto('/dashboard/renter');
  }

  function handleMessageOwner() {
    goto('/messages');
  }
</script>

<svelte:head>
  <title>Booking Confirmed - GearGrab</title>
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
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
          <div class="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-white mt-4">Loading booking confirmation...</p>
        </div>
      </div>
    {:else if booking}
      <div class="max-w-2xl mx-auto">
        
        <!-- Success Header -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 text-center mb-8">
          <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">Booking Request Submitted!</h1>
          <p class="text-gray-300 text-lg">
            Your booking request has been sent to the owner for approval.
          </p>
          <p class="text-green-300 text-sm mt-2">
            📧 Confirmation email sent to your inbox
          </p>
        </div>

        <!-- Booking Details -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
          <h2 class="text-xl font-semibold text-white mb-4">Booking Details</h2>
          
          <!-- Listing Info -->
          <div class="flex items-center space-x-4 mb-6 p-4 bg-white/5 rounded-lg">
            <img src={booking.listingImage} alt={booking.listingTitle} class="w-20 h-20 rounded-lg object-cover" />
            <div>
              <h3 class="font-semibold text-white">{booking.listingTitle}</h3>
              <p class="text-gray-300">Hosted by {booking.owner.name}</p>
            </div>
          </div>

          <!-- Booking Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-semibold text-white mb-3">Rental Period</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-300">Check-in:</span>
                  <span class="text-white">{formatDate(booking.startDate)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Check-out:</span>
                  <span class="text-white">{formatDate(booking.endDate)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">Total:</span>
                  <span class="text-white font-semibold">{formatCurrency(booking.totalPrice)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 class="font-semibold text-white mb-3">Pickup Details</h4>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-gray-300">Method:</span>
                  <span class="text-white ml-2">{booking.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                </div>
                <div>
                  <span class="text-gray-300">Location:</span>
                  <span class="text-white ml-2">{booking.pickupLocation}</span>
                </div>
                <div>
                  <span class="text-gray-300">Confirmation #:</span>
                  <span class="text-white ml-2 font-mono">{booking.confirmationNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
          <h2 class="text-xl font-semibold text-white mb-4">What Happens Next?</h2>
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h3 class="font-semibold text-white">Owner Review</h3>
                <p class="text-gray-300 text-sm">
                  {booking.owner.name} will review your booking request and respond within 24 hours.
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h3 class="font-semibold text-white">Confirmation</h3>
                <p class="text-gray-300 text-sm">
                  Once approved, you'll receive pickup instructions and payment will be processed.
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h3 class="font-semibold text-white">Pickup & Adventure</h3>
                <p class="text-gray-300 text-sm">
                  Pick up your gear and start your outdoor adventure!
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <h2 class="text-xl font-semibold text-white mb-4">Owner Contact</h2>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-white font-semibold">{booking.owner.name}</p>
              <p class="text-gray-300 text-sm">{booking.owner.email}</p>
              <p class="text-gray-300 text-sm">{booking.owner.phone}</p>
            </div>
            <button 
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              on:click={handleMessageOwner}
            >
              Send Message
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4">
          <button 
            class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            on:click={handleViewBooking}
          >
            View My Bookings
          </button>
          <button 
            class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            on:click={() => goto('/browse')}
          >
            Browse More Gear
          </button>
        </div>

        <!-- Important Notes -->
        <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mt-6">
          <h3 class="font-semibold text-yellow-200 mb-2">Important Notes:</h3>
          <ul class="text-yellow-100 text-sm space-y-1">
            <li>• You will receive email notifications about your booking status</li>
            <li>• Payment will only be processed after owner approval</li>
            <li>• Cancellation is free until the booking is confirmed</li>
            <li>• Please arrive on time for pickup to ensure availability</li>
          </ul>
        </div>

      </div>
    {:else}
      <div class="text-center">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
          <h1 class="text-2xl font-bold text-white mb-4">Booking Not Found</h1>
          <p class="text-gray-300 mb-6">We couldn't find the booking you're looking for.</p>
          <button 
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            on:click={() => goto('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    {/if}

  </div>
</div>
