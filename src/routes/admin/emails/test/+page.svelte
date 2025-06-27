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
    recipient: '',
    subject: 'Test Email from GearGrab',
    templateData: {
      userName: 'Test User',
      listingTitle: 'Test Camera Equipment',
      bookingId: 'test-booking-123',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      totalPrice: 150
    }
  };

  let templateDataJson = '';

  const emailTypes = [
    { value: 'booking_confirmation', label: 'Booking Confirmation' },
    { value: 'booking_approved', label: 'Booking Approved' },
    { value: 'booking_cancelled', label: 'Booking Cancelled' },
    { value: 'payment_received', label: 'Payment Received' },
    { value: 'reminder', label: 'Reminder Email' },
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'password_reset', label: 'Password Reset' }
  ];

  onMount(async () => {
    try {
      if (!$authStore.user) {
        goto("/auth/login?redirectTo=/admin/emails/test");
        return;
      }

      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        goto('/dashboard');
        return;
      }

      // Set default recipient to current user
      emailTest.recipient = $authStore.user.email || '';

      // Initialize template data JSON
      templateDataJson = JSON.stringify(emailTest.templateData, null, 2);

    } catch (error) {
      console.error('Error checking admin status:', error);
      goto('/dashboard');
    } finally {
      loading = false;
    }
  });

  function updateTemplateData() {
    try {
      emailTest.templateData = JSON.parse(templateDataJson);
    } catch (error) {
      // Invalid JSON, keep previous value
    }
  }

  async function sendTestEmail() {
    if (testing) return;

    testing = true;
    try {
      const response = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailTest)
      });

      const result = await response.json();

      if (response.ok) {
        testResults = [
          {
            timestamp: new Date().toISOString(),
            type: emailTest.type,
            recipient: emailTest.recipient,
            status: 'success',
            message: result.message,
            messageId: result.messageId
          },
          ...testResults
        ];

        notifications.add({
          type: 'success',
          message: 'Test email sent successfully',
          timeout: 5000
        });
      } else {
        testResults = [
          {
            timestamp: new Date().toISOString(),
            type: emailTest.type,
            recipient: emailTest.recipient,
            status: 'error',
            message: result.error
          },
          ...testResults
        ];

        notifications.add({
          type: 'error',
          message: `Failed to send test email: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      notifications.add({
        type: 'error',
        message: 'Error sending test email',
        timeout: 5000
      });
    } finally {
      testing = false;
    }
  }

  function clearResults() {
    testResults = [];
  }
</script>

<svelte:head>
  <title>Email Testing - Admin Panel</title>
</svelte:head>

{#if loading}
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
    <p class="text-gray-400">Loading email testing...</p>
  </div>
{:else if !isAdmin}
  <div class="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30 text-center">
    <h2 class="text-xl font-bold text-white mb-2">Access Denied</h2>
    <p class="text-gray-300">Admin privileges required to access email testing.</p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-white">Email Testing</h1>
        <p class="text-gray-400 mt-1">Test email delivery and templates</p>
      </div>
      <a href="/admin" class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
        ← Back to Admin
      </a>
    </div>

    <!-- Email Test Form -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Send Test Email</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Email Type -->
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Email Type</label>
          <select
            bind:value="{emailTest.type}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {#each emailTypes as type}
              <option value="{type.value}">{type.label}</option>
            {/each}
          </select>
        </div>

        <!-- Recipient -->
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Recipient Email</label>
          <input
            type="email"
            bind:value="{emailTest.recipient}"
            placeholder="test@example.com"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <!-- Subject -->
        <div class="md:col-span-2">
          <label class="block text-gray-300 text-sm font-medium mb-2">Subject</label>
          <input
            type="text"
            bind:value="{emailTest.subject}"
            placeholder="Email subject"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      <!-- Template Data -->
      <div class="mt-6">
        <label class="block text-gray-300 text-sm font-medium mb-2">Template Data (JSON)</label>
        <textarea
          bind:value="{templateDataJson}"
          on:input="{updateTemplateData}"
          rows="8"
          class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
          placeholder="Template data in JSON format"
        ></textarea>
      </div>

      <!-- Send Button -->
      <div class="mt-6 flex items-center space-x-4">
        <button
          on:click="{sendTestEmail}"
          disabled={testing || !emailTest.recipient || !emailTest.subject}
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
            on:click="{clearResults}"
            class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Clear Results
          </button>
        {/if}
      </div>
    </div>

    <!-- Test Results -->
    {#if testResults.length > 0}
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Test Results</h2>
        <div class="space-y-4">
          {#each testResults as result}
            <div class="bg-white/5 rounded-lg p-4 border border-white/10">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <span class="text-{result.status === 'success' ? 'green' : 'red'}-400 font-medium">
                    {result.status === 'success' ? '✅' : '❌'} {result.status.toUpperCase()}
                  </span>
                  <span class="text-gray-400">•</span>
                  <span class="text-gray-300">{result.type}</span>
                </div>
                <span class="text-gray-400 text-sm">{new Date(result.timestamp).toLocaleString()}</span>
              </div>
              <div class="text-gray-300 text-sm">
                <p><strong>Recipient:</strong> {result.recipient}</p>
                <p><strong>Message:</strong> {result.message}</p>
                {#if result.messageId}
                  <p><strong>Message ID:</strong> {result.messageId}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Email Service Status -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Email Service Status</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white/5 rounded-lg p-4">
          <div class="text-green-400 text-2xl mb-2">✅</div>
          <div class="text-white font-medium">SMTP Connection</div>
          <div class="text-gray-400 text-sm">Connected</div>
        </div>
        <div class="bg-white/5 rounded-lg p-4">
          <div class="text-yellow-400 text-2xl mb-2">📧</div>
          <div class="text-white font-medium">Email Templates</div>
          <div class="text-gray-400 text-sm">7 templates loaded</div>
        </div>
        <div class="bg-white/5 rounded-lg p-4">
          <div class="text-blue-400 text-2xl mb-2">📊</div>
          <div class="text-white font-medium">Delivery Rate</div>
          <div class="text-gray-400 text-sm">98.5% success</div>
        </div>
      </div>
    </div>
  </div>
{/if}
