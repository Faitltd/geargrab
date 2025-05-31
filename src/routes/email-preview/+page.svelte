<script lang="ts">
  import { emailTemplates } from '$lib/services/email';

  // Sample booking data for preview
  const sampleBookingData = {
    bookingId: 'booking_1705123456789',
    confirmationNumber: 'GG-123456',
    listingTitle: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
    listingImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    startDate: 'Friday, February 15, 2024',
    endDate: 'Monday, February 18, 2024',
    totalPrice: 165,
    renterName: 'John Doe',
    renterEmail: 'john.doe@example.com',
    ownerName: 'David Wilson',
    ownerEmail: 'david.wilson@example.com',
    deliveryMethod: 'pickup',
    pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)'
  };

  let selectedEmail = 'renter';

  $: currentTemplate = selectedEmail === 'renter' 
    ? emailTemplates.renterBookingConfirmation(sampleBookingData)
    : emailTemplates.ownerNewBooking(sampleBookingData);
</script>

<svelte:head>
  <title>Email Preview - GearGrab</title>
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
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h1 class="text-2xl font-bold text-white mb-2">📧 Email Preview</h1>
      <p class="text-gray-300">Preview the booking confirmation emails sent to renters and owners</p>
    </div>

    <!-- Email Type Selector -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h2 class="text-lg font-semibold text-white mb-4">Select Email Type</h2>
      <div class="flex space-x-4">
        <button 
          class="px-4 py-2 rounded-lg font-medium transition-colors {selectedEmail === 'renter' ? 'bg-green-600 text-white' : 'bg-white/20 text-gray-300 hover:bg-white/30'}"
          on:click={() => selectedEmail = 'renter'}
        >
          📧 Renter Confirmation
        </button>
        <button 
          class="px-4 py-2 rounded-lg font-medium transition-colors {selectedEmail === 'owner' ? 'bg-blue-600 text-white' : 'bg-white/20 text-gray-300 hover:bg-white/30'}"
          on:click={() => selectedEmail = 'owner'}
        >
          📋 Owner Notification
        </button>
      </div>
    </div>

    <!-- Email Details -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Email Info -->
      <div class="lg:col-span-1">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 sticky top-8">
          <h3 class="text-lg font-semibold text-white mb-4">Email Details</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">To:</label>
              <p class="text-white font-mono text-sm">{currentTemplate.to}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Subject:</label>
              <p class="text-white">{currentTemplate.subject}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Type:</label>
              <p class="text-white">
                {selectedEmail === 'renter' ? 'Booking Confirmation' : 'New Booking Alert'}
              </p>
            </div>
          </div>

          <!-- Sample Data -->
          <div class="mt-6 pt-6 border-t border-white/20">
            <h4 class="text-md font-semibold text-white mb-3">Sample Data</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-300">Booking:</span>
                <span class="text-white">{sampleBookingData.confirmationNumber}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Dates:</span>
                <span class="text-white">Feb 15-18</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Total:</span>
                <span class="text-white">${sampleBookingData.totalPrice}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 pt-6 border-t border-white/20">
            <h4 class="text-md font-semibold text-white mb-3">Actions</h4>
            <div class="space-y-2">
              <button 
                class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                on:click={() => window.open('data:text/html,' + encodeURIComponent(currentTemplate.html), '_blank')}
              >
                🔍 Open in New Tab
              </button>
              <button 
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                on:click={() => navigator.clipboard.writeText(currentTemplate.html)}
              >
                📋 Copy HTML
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Email Preview -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="bg-gray-100 px-4 py-3 border-b">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span class="ml-4 text-gray-600 text-sm font-medium">Email Preview</span>
            </div>
          </div>
          
          <!-- Email Content -->
          <div class="h-[800px] overflow-auto">
            <iframe 
              srcdoc={currentTemplate.html}
              class="w-full h-full border-0"
              title="Email Preview"
            ></iframe>
          </div>
        </div>
      </div>

    </div>

    <!-- Text Version -->
    <div class="mt-8">
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">📝 Plain Text Version</h3>
        <div class="bg-black/20 rounded-lg p-4">
          <pre class="text-gray-300 text-sm whitespace-pre-wrap font-mono">{currentTemplate.text}</pre>
        </div>
      </div>
    </div>

    <!-- Implementation Notes -->
    <div class="mt-8">
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">🔧 Implementation Notes</h3>
        <div class="space-y-3 text-gray-300">
          <p>• <strong>Development Mode:</strong> Emails are logged to console instead of being sent</p>
          <p>• <strong>Production Setup:</strong> Configure email service (Resend, SendGrid, etc.) in <code class="bg-black/20 px-2 py-1 rounded">src/lib/services/email.ts</code></p>
          <p>• <strong>Templates:</strong> Fully responsive HTML emails with fallback text versions</p>
          <p>• <strong>Triggers:</strong> Emails are automatically sent when bookings are created via the API</p>
          <p>• <strong>Customization:</strong> Easy to modify templates and add new email types</p>
        </div>
      </div>
    </div>

  </div>
</div>
