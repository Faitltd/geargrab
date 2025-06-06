<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { isCurrentUserAdmin } from '$lib/firebase/auth';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let loading = true;
  let isAdmin = false;
  let testing = false;
  let testResults: any[] = [];

  // Email test form data
  let emailTest = {
    type: 'booking_confirmation',
    recipientEmail: '',
    recipientName: 'Test User',
    data: {
      // Booking data
      bookingId: 'test_booking_123',
      confirmationNumber: 'GG-2024-001',
      listingTitle: 'Professional DSLR Camera',
      listingImage: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
      startDate: '2024-02-15',
      endDate: '2024-02-18',
      totalPrice: 150,
      renterName: 'Test User',
      renterEmail: '',
      ownerName: 'Camera Owner',
      ownerEmail: 'owner@example.com',
      deliveryMethod: 'pickup',
      pickupLocation: '123 Main St, Salt Lake City, UT',
      
      // Payment data
      amount: 150,
      currency: 'usd',
      paymentIntentId: 'pi_test_123456',
      service: 'booking',
      
      // Background check data
      requestId: 'req_test_123',
      checkType: 'standard',
      provider: 'checkr',
      status: 'completed',
      externalId: 'checkr_test_456',
      
      // Verification data
      verificationType: 'identity'
    }
  };

  const emailTypes = [
    { value: 'booking_confirmation', label: 'Booking Confirmation (Renter)' },
    { value: 'booking_owner_notification', label: 'New Booking (Owner)' },
    { value: 'payment_confirmation', label: 'Payment Confirmation' },
    { value: 'payment_failed', label: 'Payment Failed' },
    { value: 'background_check_initiated', label: 'Background Check Initiated' },
    { value: 'background_check_completed', label: 'Background Check Completed' },
    { value: 'identity_verified', label: 'Identity Verified' },
    { value: 'phone_verified', label: 'Phone Verified' }
  ];

  onMount(async () => {
    try {
      if (!$authStore.user) {
        goto('/auth/login?redirectTo=/admin/emails/test');
        return;
      }

      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        goto('/dashboard');
        return;
      }

      // Set default recipient email
      emailTest.recipientEmail = $authStore.user.email || 'test@example.com';
      emailTest.data.renterEmail = $authStore.user.email || 'test@example.com';
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      goto('/dashboard');
    } finally {
      loading = false;
    }
  });

  async function testEmail() {
    if (testing) return;

    testing = true;
    try {
      const response = await fetch('/api/emails/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: emailTest.type,
          recipientEmail: emailTest.recipientEmail,
          recipientName: emailTest.recipientName,
          data: emailTest.data
        })
      });

      const result = await response.json();

      if (response.ok) {
        testResults = [
          {
            timestamp: new Date().toISOString(),
            type: emailTest.type,
            recipient: emailTest.recipientEmail,
            status: 'success',
            message: result.message,
            emailId: result.emailId
          },
          ...testResults
        ];

        notifications.add({
          type: 'success',
          message: 'Email test completed successfully',
          timeout: 5000
        });
      } else {
        testResults = [
          {
            timestamp: new Date().toISOString(),
            type: emailTest.type,
            recipient: emailTest.recipientEmail,
            status: 'error',
            message: result.error
          },
          ...testResults
        ];

        notifications.add({
          type: 'error',
          message: `Email test failed: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Email test error:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to send email test',
        timeout: 5000
      });
    } finally {
      testing = false;
    }
  }

  function clearResults() {
    testResults = [];
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  function getEmailTypeLabel(type: string) {
    const emailType = emailTypes.find(t => t.value === type);
    return emailType ? emailType.label : type;
  }

  // Update data fields based on email type
  $: {
    if (emailTest.type) {
      emailTest.data.renterEmail = emailTest.recipientEmail;
    }
  }
</script>

<svelte:head>
  <title>Email Testing | Admin | GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 pt-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    {#if loading}
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    {:else}
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Email Testing</h1>
        <p class="text-gray-300">Test email templates and delivery system</p>
      </div>

      <!-- Email Test Form -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <h2 class="text-xl font-bold text-white mb-4">Send Test Email</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Email Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email Type</label>
            <select
              bind:value={emailTest.type}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {#each emailTypes as emailType}
                <option value={emailType.value}>{emailType.label}</option>
              {/each}
            </select>
          </div>

          <!-- Recipient Email -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Recipient Email</label>
            <input
              type="email"
              bind:value={emailTest.recipientEmail}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="test@example.com"
            />
          </div>

          <!-- Recipient Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Recipient Name</label>
            <input
              type="text"
              bind:value={emailTest.recipientName}
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Test User"
            />
          </div>

          <!-- Amount (for payment emails) -->
          {#if emailTest.type.includes('payment')}
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
              <input
                type="number"
                bind:value={emailTest.data.amount}
                min="1"
                step="0.01"
                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="150.00"
              />
            </div>
          {/if}

          <!-- Listing Title (for booking emails) -->
          {#if emailTest.type.includes('booking')}
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Listing Title</label>
              <input
                type="text"
                bind:value={emailTest.data.listingTitle}
                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Professional DSLR Camera"
              />
            </div>
          {/if}

          <!-- Check Type (for background check emails) -->
          {#if emailTest.type.includes('background_check')}
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Check Type</label>
              <select
                bind:value={emailTest.data.checkType}
                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
          {/if}
        </div>

        <!-- Test Button -->
        <div class="mt-6 flex items-center space-x-4">
          <button
            on:click={testEmail}
            disabled={testing || !emailTest.recipientEmail}
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
          >
            {#if testing}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Sending...
            {:else}
              📧 Send Test Email
            {/if}
          </button>

          {#if testResults.length > 0}
            <button
              on:click={clearResults}
              class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Clear Results
            </button>
          {/if}

          <a
            href="/email-preview"
            target="_blank"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            👀 Preview Templates
          </a>
        </div>
      </div>

      <!-- Test Results -->
      {#if testResults.length > 0}
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h2 class="text-xl font-bold text-white mb-4">Test Results</h2>
          
          <div class="space-y-4">
            {#each testResults as result}
              <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-3">
                    <span class="px-2 py-1 rounded-full text-xs border {getStatusBadgeClass(result.status)}">
                      {result.status.toUpperCase()}
                    </span>
                    <span class="text-white font-medium">{getEmailTypeLabel(result.type)}</span>
                  </div>
                  <span class="text-gray-400 text-sm">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-400">Recipient:</span>
                    <span class="text-white ml-2">{result.recipient}</span>
                  </div>
                  {#if result.emailId}
                    <div>
                      <span class="text-gray-400">Email ID:</span>
                      <span class="text-white ml-2 font-mono">{result.emailId}</span>
                    </div>
                  {/if}
                </div>
                
                <div class="mt-2">
                  <span class="text-gray-400">Message:</span>
                  <span class="text-white ml-2">{result.message}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Email System Information -->
      <div class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-bold text-white mb-4">Email System Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="font-semibold text-white mb-2">Available Templates</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Booking confirmations</li>
              <li>• Payment notifications</li>
              <li>• Background check updates</li>
              <li>• Verification confirmations</li>
              <li>• System notifications</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-semibold text-white mb-2">Email Provider</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Resend (Primary)</li>
              <li>• Fallback to console in dev</li>
              <li>• HTML + Text formats</li>
              <li>• Delivery tracking</li>
              <li>• Bounce handling</li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold text-white mb-2">Automation</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Webhook triggered</li>
              <li>• Event-based sending</li>
              <li>• Retry logic</li>
              <li>• Error handling</li>
              <li>• Rate limiting</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
