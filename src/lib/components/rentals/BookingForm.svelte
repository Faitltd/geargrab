<script>
  import { createEventDispatcher } from 'svelte';
  import { user, isAuthenticated } from '../../stores/auth.js';
  
  export let gearItem = null;
  export let unavailableDates = [];
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = null;
  let showBookingForm = false;
  
  // Booking form data
  let bookingData = {
    start_date: '',
    end_date: '',
    delivery_method: 'pickup',
    delivery_address: '',
    special_requests: ''
  };
  
  // Calculated values
  let totalDays = 0;
  let subtotal = 0;
  let serviceFee = 0;
  let totalAmount = 0;
  
  // Delivery options
  const deliveryOptions = [
    { value: 'pickup', label: 'Pickup from owner', description: 'Meet the owner to pick up the gear' },
    { value: 'delivery', label: 'Local delivery', description: 'Owner delivers to your location (if available)' },
    { value: 'shipping', label: 'Shipping', description: 'Gear shipped to your address (if available)' },
    { value: 'meetup', label: 'Meet halfway', description: 'Meet at a convenient location' }
  ];
  
  // Get available delivery options for this gear item
  $: availableDeliveryOptions = deliveryOptions.filter(option => {
    if (!gearItem?.delivery_options) return option.value === 'pickup';
    const gearDeliveryOptions = Array.isArray(gearItem.delivery_options) 
      ? gearItem.delivery_options 
      : JSON.parse(gearItem.delivery_options || '["pickup"]');
    return gearDeliveryOptions.includes(option.value);
  });
  
  // Calculate pricing when dates change
  $: {
    if (bookingData.start_date && bookingData.end_date && gearItem) {
      const startDate = new Date(bookingData.start_date);
      const endDate = new Date(bookingData.end_date);
      
      if (endDate > startDate) {
        totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        subtotal = totalDays * gearItem.daily_price;
        serviceFee = subtotal * 0.1; // 10% service fee
        totalAmount = subtotal + serviceFee;
      } else {
        totalDays = 0;
        subtotal = 0;
        serviceFee = 0;
        totalAmount = 0;
      }
    }
  }
  
  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get maximum date (1 year from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];
  
  function toggleBookingForm() {
    if (!$isAuthenticated) {
      dispatch('auth-required');
      return;
    }
    
    showBookingForm = !showBookingForm;
    if (!showBookingForm) {
      resetForm();
    }
  }
  
  function resetForm() {
    bookingData = {
      start_date: '',
      end_date: '',
      delivery_method: 'pickup',
      delivery_address: '',
      special_requests: ''
    };
    error = null;
  }
  
  function validateDates() {
    if (!bookingData.start_date || !bookingData.end_date) {
      return 'Please select both start and end dates';
    }
    
    const startDate = new Date(bookingData.start_date);
    const endDate = new Date(bookingData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return 'Start date cannot be in the past';
    }
    
    if (endDate <= startDate) {
      return 'End date must be after start date';
    }
    
    // Check against unavailable dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (unavailableDates.includes(dateString)) {
        return `Selected dates conflict with unavailable dates`;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return null;
  }
  
  async function submitBooking() {
    const dateError = validateDates();
    if (dateError) {
      error = dateError;
      return;
    }
    
    if (bookingData.delivery_method !== 'pickup' && !bookingData.delivery_address) {
      error = 'Please provide a delivery address';
      return;
    }
    
    loading = true;
    error = null;
    
    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          gear_item_id: gearItem.id,
          start_date: bookingData.start_date,
          end_date: bookingData.end_date,
          delivery_method: bookingData.delivery_method,
          delivery_address: bookingData.delivery_address,
          special_requests: bookingData.special_requests,
          total_days: totalDays,
          subtotal: subtotal,
          service_fee: serviceFee,
          total_amount: totalAmount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      const result = await response.json();
      
      dispatch('booking-created', {
        rental: result.rental,
        instant_book: result.instant_book
      });
      
      showBookingForm = false;
      resetForm();
      
    } catch (err) {
      console.error('Booking error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function formatPrice(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">Book This Gear</h3>
      <p class="text-sm text-gray-600">
        {formatPrice(gearItem?.daily_price || 0)} per day
        {#if gearItem?.instant_book}
          • <span class="text-green-600 font-medium">Instant Book</span>
        {/if}
      </p>
    </div>
    
    <button
      on:click={toggleBookingForm}
      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
      disabled={loading}
    >
      {showBookingForm ? 'Cancel' : 'Book Now'}
    </button>
  </div>
  
  {#if showBookingForm}
    <div class="border-t pt-6">
      {#if error}
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="ml-3">
              <p class="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      {/if}
      
      <form on:submit|preventDefault={submitBooking} class="space-y-6">
        <!-- Date Selection -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="start_date" class="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="start_date"
              bind:value={bookingData.start_date}
              min={today}
              max={maxDateString}
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div>
            <label for="end_date" class="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="end_date"
              bind:value={bookingData.end_date}
              min={bookingData.start_date || today}
              max={maxDateString}
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        
        <!-- Delivery Method -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">Delivery Method</label>
          <div class="space-y-3">
            {#each availableDeliveryOptions as option}
              <label class="flex items-start">
                <input
                  type="radio"
                  bind:group={bookingData.delivery_method}
                  value={option.value}
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 mt-1"
                />
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900">{option.label}</div>
                  <div class="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Delivery Address -->
        {#if bookingData.delivery_method !== 'pickup'}
          <div>
            <label for="delivery_address" class="block text-sm font-medium text-gray-700">
              {bookingData.delivery_method === 'shipping' ? 'Shipping Address' : 'Delivery Address'}
            </label>
            <textarea
              id="delivery_address"
              bind:value={bookingData.delivery_address}
              rows="3"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your full address..."
            ></textarea>
          </div>
        {/if}
        
        <!-- Special Requests -->
        <div>
          <label for="special_requests" class="block text-sm font-medium text-gray-700">Special Requests (Optional)</label>
          <textarea
            id="special_requests"
            bind:value={bookingData.special_requests}
            rows="3"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Any special instructions or questions for the owner..."
          ></textarea>
        </div>
        
        <!-- Pricing Summary -->
        {#if totalDays > 0}
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-3">Booking Summary</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>{formatPrice(gearItem.daily_price)} × {totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div class="flex justify-between">
                <span>Service fee</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <div class="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Submit Button -->
        <button
          type="submit"
          disabled={loading || totalDays === 0}
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Booking...
          {:else if gearItem?.instant_book}
            Book Instantly - {formatPrice(totalAmount)}
          {:else}
            Request to Book - {formatPrice(totalAmount)}
          {/if}
        </button>
        
        {#if !gearItem?.instant_book}
          <p class="text-xs text-gray-500 text-center">
            Your booking request will be sent to the gear owner for approval.
            You won't be charged until the booking is confirmed.
          </p>
        {/if}
      </form>
    </div>
  {/if}
</div>
