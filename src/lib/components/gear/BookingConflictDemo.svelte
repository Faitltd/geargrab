<script lang="ts">
  import { onMount } from 'svelte';
  import RentalBookingModal from './RentalBookingModal.svelte';
  import RentalBookingModalContent from './RentalBookingModalContent.svelte';
  import { createBooking, type BookingData } from '$lib/services/bookings';
  import type { ListingData } from '$lib/services/listings';

  // Demo state
  let isModalOpen = false;
  let currentStep: 'dates' | 'confirmation' | 'success' = 'dates';
  let demoBookings: BookingData[] = [];
  
  // Sample listing for demo
  const sampleListing: ListingData = {
    id: 'demo-listing-123',
    title: 'Professional DSLR Camera',
    description: 'High-quality camera perfect for photography projects',
    category: 'Electronics',
    location: 'San Francisco, CA',
    listingType: 'rent',
    rentalPrice: '50',
    rentalPeriod: 'day',
    condition: 'Excellent',
    availabilityDates: [
      '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19',
      '2024-01-20', '2024-01-21', '2024-01-22', '2024-01-23', '2024-01-24',
      '2024-01-25', '2024-01-26', '2024-01-27', '2024-01-28', '2024-01-29'
    ],
    imageUrls: [],
    tags: ['camera', 'photography', 'professional'],
    ownerId: 'owner-123',
    ownerEmail: 'owner@example.com',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    views: 0,
    featured: false
  };

  // Create some demo bookings to simulate conflicts
  onMount(async () => {
    // Simulate existing bookings
    demoBookings = [
      {
        id: 'booking-1',
        listingId: 'demo-listing-123',
        listingTitle: 'Professional DSLR Camera',
        ownerId: 'owner-123',
        renterId: 'renter-1',
        renterEmail: 'renter1@example.com',
        dates: ['2024-01-16', '2024-01-17'],
        startDate: '2024-01-16',
        endDate: '2024-01-17',
        deliveryOption: 'pickup',
        insuranceOption: false,
        totalCost: 108.75,
        breakdown: {
          basePrice: 50,
          days: 2,
          subtotal: 100,
          deliveryFee: 0,
          insuranceFee: 0,
          taxAmount: 8.75,
          total: 108.75
        },
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'booking-2',
        listingId: 'demo-listing-123',
        listingTitle: 'Professional DSLR Camera',
        ownerId: 'owner-123',
        renterId: 'renter-2',
        renterEmail: 'renter2@example.com',
        dates: ['2024-01-20', '2024-01-21', '2024-01-22'],
        startDate: '2024-01-20',
        endDate: '2024-01-22',
        deliveryOption: 'delivery',
        insuranceOption: true,
        totalCost: 188.06,
        breakdown: {
          basePrice: 50,
          days: 3,
          subtotal: 150,
          deliveryFee: 15,
          insuranceFee: 8,
          taxAmount: 15.06,
          total: 188.06
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  const openModal = () => {
    isModalOpen = true;
    currentStep = 'dates';
  };

  const closeModal = () => {
    isModalOpen = false;
    currentStep = 'dates';
  };

  const handleDateSelect = (event: CustomEvent) => {
    console.log('Dates selected:', event.detail);
  };

  const handleConfirm = (event: CustomEvent) => {
    console.log('Booking confirmed:', event.detail);
    // In a real app, you would call createBooking here
  };

  const handleBack = () => {
    if (currentStep === 'confirmation') {
      currentStep = 'dates';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
</script>

<div class="max-w-4xl mx-auto p-6">
  <div class="bg-white rounded-2xl shadow-lg p-8">
    <h1 class="text-3xl font-bold text-neutral-900 mb-6">
      Double-Booking Prevention Demo
    </h1>
    
    <div class="space-y-6">
      <!-- Demo Description -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-blue-900 mb-3">
          How it works:
        </h2>
        <ul class="text-blue-800 space-y-2">
          <li>• When you select dates, the system automatically checks for conflicts</li>
          <li>• If dates overlap with existing bookings, a green alert appears at the top</li>
          <li>• The modal shakes subtly to draw attention to the conflict</li>
          <li>• The "Continue" button is disabled until conflicts are resolved</li>
        </ul>
      </div>

      <!-- Existing Bookings -->
      <div>
        <h2 class="text-xl font-semibold text-neutral-900 mb-4">
          Existing Bookings (Demo Data)
        </h2>
        <div class="grid gap-4">
          {#each demoBookings as booking}
            <div class="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium text-neutral-900">
                    Booking #{booking.id?.slice(-6)}
                  </h3>
                  <p class="text-sm text-neutral-600">
                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                  </p>
                  <p class="text-sm text-neutral-500">
                    Dates: {booking.dates.map(formatDate).join(', ')}
                  </p>
                </div>
                <span class="px-2 py-1 text-xs font-medium rounded-full
                  {booking.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                  }">
                  {booking.status}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Demo Instructions -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-amber-900 mb-3">
          Try it out:
        </h2>
        <p class="text-amber-800 mb-4">
          Click the button below to open the booking modal. Try selecting dates that overlap with the existing bookings above (Jan 16-17 or Jan 20-22) to see the conflict detection in action.
        </p>
        <button
          on:click={openModal}
          class="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Open Booking Modal
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Booking Modal -->
<RentalBookingModal
  bind:isOpen={isModalOpen}
  bind:step={currentStep}
  listing={sampleListing}
  on:close={closeModal}
  on:dateSelect={handleDateSelect}
  on:confirm={handleConfirm}
  on:back={handleBack}
>
  <RentalBookingModalContent
    {currentStep}
    listing={sampleListing}
    slot="default"
    let:step
    let:selectedDates
    let:deliveryOption
    let:insuranceOption
    let:costBreakdown
    let:handleDateSelect
    let:formatCurrency
    let:formatDateRange
  />
</RentalBookingModal>
