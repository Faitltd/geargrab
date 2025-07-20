<script lang="ts">
  import RentalDatePicker from './RentalDatePicker.svelte';
  import type { ListingData } from '$lib/services/listings';
  
  export let step: 'dates' | 'confirmation' | 'success';
  export let listing: ListingData;
  export let selectedDates: string[] = [];
  export let deliveryOption: 'pickup' | 'delivery' = 'pickup';
  export let insuranceOption = false;
  export let costBreakdown: any;
  export let handleDateSelect: (event: CustomEvent) => void;
  export let formatCurrency: (amount: number) => string;
  export let formatDateRange: (dates: string[]) => string;
  
  // Constants
  const deliveryFee = 15;
  const insuranceFee = 8;
  
  const handleDeliveryChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    deliveryOption = target.checked ? 'delivery' : 'pickup';
  };
  
  const handleInsuranceChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    insuranceOption = target.checked;
  };
</script>

{#if step === 'dates'}
  <!-- Date Selection Step -->
  <div class="p-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Date Picker -->
      <div>
        <h3 class="text-lg font-semibold text-neutral-900 mb-6">
          Choose Your Rental Dates
        </h3>
        
        <RentalDatePicker
          {selectedDates}
          availableDates={listing.availabilityDates || []}
          on:dateSelect={handleDateSelect}
          showAvailabilityOnly={true}
        />
      </div>
      
      <!-- Rental Options -->
      <div class="space-y-6">
        <h3 class="text-lg font-semibold text-neutral-900">
          Rental Options
        </h3>
        
        <!-- Delivery Option -->
        <div class="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
          <label class="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={deliveryOption === 'delivery'}
              on:change={handleDeliveryChange}
              class="w-5 h-5 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 mt-1"
            />
            <div class="ml-4 flex-1">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-neutral-900">Delivery Service</h4>
                <span class="font-semibold text-neutral-700">
                  {formatCurrency(deliveryFee)}
                </span>
              </div>
              <p class="text-sm text-neutral-600 mt-1">
                Have the item delivered to your location. Available within 25 miles of {listing.location}.
              </p>
              <div class="mt-3 text-xs text-neutral-500">
                <p>• Same-day delivery available</p>
                <p>• Professional handling and setup</p>
                <p>• Return pickup included</p>
              </div>
            </div>
          </label>
        </div>
        
        <!-- Insurance Option -->
        <div class="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
          <label class="flex items-start cursor-pointer">
            <input
              type="checkbox"
              bind:checked={insuranceOption}
              on:change={handleInsuranceChange}
              class="w-5 h-5 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 mt-1"
            />
            <div class="ml-4 flex-1">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-neutral-900">Damage Protection</h4>
                <span class="font-semibold text-neutral-700">
                  {formatCurrency(insuranceFee)}
                </span>
              </div>
              <p class="text-sm text-neutral-600 mt-1">
                Comprehensive coverage for accidental damage during your rental period.
              </p>
              <div class="mt-3 text-xs text-neutral-500">
                <p>• Up to $2,000 coverage</p>
                <p>• No deductible for covered claims</p>
                <p>• 24/7 claim support</p>
              </div>
            </div>
          </label>
        </div>
        
        <!-- Quick Summary -->
        {#if selectedDates.length > 0}
          <div class="bg-primary-50 rounded-xl p-6 border border-primary-200">
            <h4 class="font-semibold text-primary-800 mb-3">Rental Summary</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-primary-700">Dates:</span>
                <span class="text-primary-800 font-medium">
                  {formatDateRange(selectedDates)}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-primary-700">Duration:</span>
                <span class="text-primary-800 font-medium">
                  {selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-primary-700">Base Rate:</span>
                <span class="text-primary-800 font-medium">
                  {formatCurrency(costBreakdown.basePrice)} / day
                </span>
              </div>
              <div class="border-t border-primary-200 pt-2 mt-3">
                <div class="flex justify-between">
                  <span class="text-primary-800 font-semibold">Estimated Total:</span>
                  <span class="text-primary-800 font-bold text-lg">
                    {formatCurrency(costBreakdown.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

{:else if step === 'confirmation'}
  <!-- Confirmation Step -->
  <div class="p-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Booking Details -->
      <div class="space-y-6">
        <h3 class="text-lg font-semibold text-neutral-900">
          Booking Details
        </h3>
        
        <!-- Item Info -->
        <div class="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <div class="flex items-start space-x-4">
            {#if listing.imageUrls && listing.imageUrls.length > 0}
              <img
                src={listing.imageUrls[0]}
                alt={listing.title}
                class="w-20 h-20 object-cover rounded-lg"
              />
            {:else}
              <div class="w-20 h-20 bg-neutral-200 rounded-lg flex items-center justify-center">
                <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            {/if}
            
            <div class="flex-1">
              <h4 class="font-semibold text-neutral-900">{listing.title}</h4>
              <p class="text-sm text-neutral-600 mt-1">{listing.category} • {listing.condition}</p>
              <p class="text-sm text-neutral-500 mt-1">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Rental Dates -->
        <div class="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <h4 class="font-semibold text-neutral-900 mb-3">Rental Period</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-neutral-600">Dates:</span>
              <span class="font-medium text-neutral-900">
                {formatDateRange(selectedDates)}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-600">Duration:</span>
              <span class="font-medium text-neutral-900">
                {selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Selected Options -->
        <div class="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <h4 class="font-semibold text-neutral-900 mb-3">Selected Options</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-neutral-600">Pickup/Delivery:</span>
              <span class="font-medium text-neutral-900 capitalize">
                {deliveryOption}
                {#if deliveryOption === 'delivery'}
                  <span class="text-sm text-neutral-500">({formatCurrency(deliveryFee)})</span>
                {/if}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-600">Damage Protection:</span>
              <span class="font-medium text-neutral-900">
                {insuranceOption ? 'Yes' : 'No'}
                {#if insuranceOption}
                  <span class="text-sm text-neutral-500">({formatCurrency(insuranceFee)})</span>
                {/if}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Cost Breakdown -->
      <div class="space-y-6">
        <h3 class="text-lg font-semibold text-neutral-900">
          Cost Breakdown
        </h3>
        
        <div class="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <div class="space-y-3">
            <!-- Base Cost -->
            <div class="flex justify-between">
              <span class="text-neutral-600">
                {formatCurrency(costBreakdown.basePrice)} × {costBreakdown.days} {costBreakdown.days === 1 ? 'day' : 'days'}
              </span>
              <span class="font-medium text-neutral-900">
                {formatCurrency(costBreakdown.subtotal)}
              </span>
            </div>
            
            <!-- Delivery Fee -->
            {#if costBreakdown.deliveryFee > 0}
              <div class="flex justify-between">
                <span class="text-neutral-600">Delivery fee</span>
                <span class="font-medium text-neutral-900">
                  {formatCurrency(costBreakdown.deliveryFee)}
                </span>
              </div>
            {/if}
            
            <!-- Insurance Fee -->
            {#if costBreakdown.insuranceFee > 0}
              <div class="flex justify-between">
                <span class="text-neutral-600">Damage protection</span>
                <span class="font-medium text-neutral-900">
                  {formatCurrency(costBreakdown.insuranceFee)}
                </span>
              </div>
            {/if}
            
            <!-- Tax -->
            <div class="flex justify-between">
              <span class="text-neutral-600">Tax (8.75%)</span>
              <span class="font-medium text-neutral-900">
                {formatCurrency(costBreakdown.taxAmount)}
              </span>
            </div>
            
            <!-- Total -->
            <div class="border-t border-neutral-200 pt-3">
              <div class="flex justify-between items-center">
                <span class="text-lg font-semibold text-neutral-900">Total</span>
                <span class="text-2xl font-bold text-primary-500">
                  {formatCurrency(costBreakdown.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Terms and Conditions -->
        <div class="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
          <h4 class="font-semibold text-neutral-900 mb-3">Terms & Conditions</h4>
          <div class="space-y-2 text-sm text-neutral-600">
            <label class="flex items-start">
              <input
                type="checkbox"
                required
                class="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 mt-0.5"
              />
              <span class="ml-2">
                I agree to the <a href="/terms" class="text-primary-500 hover:text-primary-600 underline">rental terms and conditions</a>
              </span>
            </label>
            <label class="flex items-start">
              <input
                type="checkbox"
                required
                class="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 mt-0.5"
              />
              <span class="ml-2">
                I understand the <a href="/cancellation" class="text-primary-500 hover:text-primary-600 underline">cancellation policy</a>
              </span>
            </label>
            <label class="flex items-start">
              <input
                type="checkbox"
                class="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 mt-0.5"
              />
              <span class="ml-2">
                Send me updates about this rental via email
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>

{:else if step === 'success'}
  <!-- Success Step -->
  <div class="p-8 text-center">
    <div class="max-w-md mx-auto">
      <!-- Success Icon -->
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h3 class="text-2xl font-bold text-neutral-900 mb-4">
        Booking Confirmed!
      </h3>
      
      <p class="text-neutral-600 mb-6">
        Your rental has been successfully booked. You'll receive a confirmation email shortly with all the details.
      </p>
      
      <!-- Booking Reference -->
      <div class="bg-neutral-50 rounded-xl p-6 border border-neutral-200 mb-6">
        <div class="text-sm text-neutral-600 mb-1">Booking Reference</div>
        <div class="text-lg font-mono font-semibold text-neutral-900">
          GG-{Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div>
      </div>
      
      <!-- Next Steps -->
      <div class="text-left bg-primary-50 rounded-xl p-6 border border-primary-200">
        <h4 class="font-semibold text-primary-800 mb-3">What's Next?</h4>
        <ul class="space-y-2 text-sm text-primary-700">
          <li class="flex items-start">
            <svg class="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Check your email for confirmation details
          </li>
          <li class="flex items-start">
            <svg class="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            The owner will contact you within 24 hours
          </li>
          <li class="flex items-start">
            <svg class="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            {deliveryOption === 'delivery' ? 'Arrange delivery details' : 'Coordinate pickup location and time'}
          </li>
        </ul>
      </div>
    </div>
  </div>
{/if}
