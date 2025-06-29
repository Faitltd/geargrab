<script lang="ts">
  export let listing: any;
  export let startDate: string;
  export let endDate: string;
  export let deliveryMethod: string;
  export let insuranceTier: string;
  export let totalPrice: number;
  export let calculatedTotal: number;

  function formatDate(dateString: string): string {
    try {
      let date: Date;
      
      if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (dateString && typeof dateString === 'object' && 'seconds' in dateString) {
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

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function calculateDays(): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  $: days = calculateDays();
  $: dailyRate = listing?.dailyPrice || 0;
  $: subtotal = dailyRate * days;
  $: serviceFee = Math.max(5, subtotal * 0.1);
  $: deliveryFee = deliveryMethod === 'delivery' ? 15 : 0;
  $: insuranceFee = insuranceTier === 'premium' ? days * 10 : insuranceTier === 'standard' ? days * 5 : 0;
</script>

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
    <h3 class="font-semibold text-white">Booking Details</h3>
    
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
        <span class="text-white">{days} {days === 1 ? 'day' : 'days'}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-300">Delivery:</span>
        <span class="text-white capitalize">{deliveryMethod}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-300">Insurance:</span>
        <span class="text-white capitalize">{insuranceTier}</span>
      </div>
    </div>
  </div>

  <!-- Price Breakdown -->
  <div class="border-t border-white/20 pt-4">
    <h3 class="font-semibold text-white mb-4">Price Breakdown</h3>
    
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-300">{formatCurrency(dailyRate)} × {days} days</span>
        <span class="text-white">{formatCurrency(subtotal)}</span>
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
          <span class="text-gray-300">Insurance ({insuranceTier})</span>
          <span class="text-white">{formatCurrency(insuranceFee)}</span>
        </div>
      {/if}
    </div>
    
    <div class="border-t border-white/20 mt-4 pt-4">
      <div class="flex justify-between font-semibold">
        <span class="text-white">Total</span>
        <span class="text-green-400 text-lg">{formatCurrency(calculatedTotal)}</span>
      </div>
    </div>
  </div>

  <!-- Security Notice -->
  <div class="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
    <div class="flex items-start space-x-2">
      <svg class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
      <div>
        <p class="text-blue-200 text-xs font-medium">Secure Payment</p>
        <p class="text-blue-300 text-xs">Your payment is protected by Stripe's industry-leading security.</p>
      </div>
    </div>
  </div>
</div>
