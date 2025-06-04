<script lang="ts">
  import { onMount } from 'svelte';
  import { notifications } from '$lib/stores/notifications';

  let loading = false;
  let settings = {
    platform: {
      siteName: 'GearGrab',
      siteDescription: 'Rent outdoor gear from trusted locals',
      maintenanceMode: false,
      allowNewRegistrations: true,
      requireEmailVerification: true
    },
    payments: {
      platformFeePercentage: 10,
      minimumBookingAmount: 25,
      maximumBookingAmount: 5000,
      paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
      autoPayoutEnabled: true,
      payoutSchedule: 'weekly'
    },
    security: {
      requireBackgroundChecks: false,
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      twoFactorRequired: false,
      passwordMinLength: 8
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminAlerts: true,
      userWelcomeEmails: true
    },
    content: {
      maxListingImages: 10,
      maxListingDescriptionLength: 2000,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 10, // MB
      moderationEnabled: true
    }
  };

  const paymentMethodOptions = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'apple_pay', label: 'Apple Pay' },
    { value: 'google_pay', label: 'Google Pay' }
  ];

  const payoutScheduleOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  onMount(async () => {
    await loadSettings();
  });

  async function loadSettings() {
    try {
      loading = true;
      // In a real app, this would load from your backend/database
      // settings = await fetchSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load settings',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    try {
      loading = true;
      
      // In a real app, this would save to your backend/database
      // await updateSettings(settings);
      
      notifications.add({
        type: 'success',
        message: 'Settings saved successfully',
        timeout: 3000
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to save settings',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  function togglePaymentMethod(method: string) {
    const index = settings.payments.paymentMethods.indexOf(method);
    if (index > -1) {
      settings.payments.paymentMethods = settings.payments.paymentMethods.filter(m => m !== method);
    } else {
      settings.payments.paymentMethods = [...settings.payments.paymentMethods, method];
    }
  }
</script>

<svelte:head>
  <title>System Settings - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">System Settings</h1>
      <p class="text-gray-400 mt-1">Configure platform settings and preferences</p>
    </div>
    <button
      on:click={saveSettings}
      disabled={loading}
      class="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium py-2 px-6 rounded-lg transition-colors"
    >
      {loading ? 'Saving...' : 'Save Settings'}
    </button>
  </div>

  <!-- Platform Settings -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
    <h2 class="text-xl font-bold text-white mb-4">Platform Settings</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
        <input
          type="text"
          bind:value={settings.platform.siteName}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
        <input
          type="text"
          bind:value={settings.platform.siteDescription}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
    </div>
    
    <div class="mt-6 space-y-4">
      <label class="flex items-center">
        <input
          type="checkbox"
          bind:checked={settings.platform.maintenanceMode}
          class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
        />
        <span class="ml-2 text-white">Maintenance Mode</span>
        <span class="ml-2 text-gray-400 text-sm">(Disables public access)</span>
      </label>
      
      <label class="flex items-center">
        <input
          type="checkbox"
          bind:checked={settings.platform.allowNewRegistrations}
          class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
        />
        <span class="ml-2 text-white">Allow New Registrations</span>
      </label>
      
      <label class="flex items-center">
        <input
          type="checkbox"
          bind:checked={settings.platform.requireEmailVerification}
          class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
        />
        <span class="ml-2 text-white">Require Email Verification</span>
      </label>
    </div>
  </div>

  <!-- Payment Settings -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
    <h2 class="text-xl font-bold text-white mb-4">Payment Settings</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Platform Fee (%)</label>
        <input
          type="number"
          min="0"
          max="50"
          step="0.1"
          bind:value={settings.payments.platformFeePercentage}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Min Booking Amount ($)</label>
        <input
          type="number"
          min="1"
          bind:value={settings.payments.minimumBookingAmount}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Max Booking Amount ($)</label>
        <input
          type="number"
          min="100"
          bind:value={settings.payments.maximumBookingAmount}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
    </div>
    
    <div class="mt-6">
      <label class="block text-sm font-medium text-gray-300 mb-2">Payment Methods</label>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        {#each paymentMethodOptions as method}
          <label class="flex items-center">
            <input
              type="checkbox"
              checked={settings.payments.paymentMethods.includes(method.value)}
              on:change={() => togglePaymentMethod(method.value)}
              class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
            />
            <span class="ml-2 text-white">{method.label}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <label class="flex items-center">
        <input
          type="checkbox"
          bind:checked={settings.payments.autoPayoutEnabled}
          class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
        />
        <span class="ml-2 text-white">Auto Payout Enabled</span>
      </label>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Payout Schedule</label>
        <select
          bind:value={settings.payments.payoutSchedule}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          {#each payoutScheduleOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Security Settings -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
    <h2 class="text-xl font-bold text-white mb-4">Security Settings</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Max Login Attempts</label>
        <input
          type="number"
          min="3"
          max="10"
          bind:value={settings.security.maxLoginAttempts}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
        <input
          type="number"
          min="15"
          max="480"
          bind:value={settings.security.sessionTimeout}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Min Password Length</label>
        <input
          type="number"
          min="6"
          max="20"
          bind:value={settings.security.passwordMinLength}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
    </div>
    
    <div class="mt-6 space-y-4">
      <label class="flex items-center">
        <input
          type="checkbox"
          bind:checked={settings.security.requireBackgroundChecks}
          class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
        />
        <span class="ml-2 text-white">Require Background Checks</span>
      </label>
      
      <label class="flex items-center">
        <input
          type="checkbox"
          bind:checked={settings.security.twoFactorRequired}
          class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
        />
        <span class="ml-2 text-white">Require Two-Factor Authentication</span>
      </label>
    </div>
  </div>

  <!-- Notification Settings -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
    <h2 class="text-xl font-bold text-white mb-4">Notification Settings</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={settings.notifications.emailNotifications}
            class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
          />
          <span class="ml-2 text-white">Email Notifications</span>
        </label>
        
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={settings.notifications.smsNotifications}
            class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
          />
          <span class="ml-2 text-white">SMS Notifications</span>
        </label>
        
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={settings.notifications.pushNotifications}
            class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
          />
          <span class="ml-2 text-white">Push Notifications</span>
        </label>
      </div>
      
      <div class="space-y-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={settings.notifications.adminAlerts}
            class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
          />
          <span class="ml-2 text-white">Admin Alerts</span>
        </label>
        
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={settings.notifications.userWelcomeEmails}
            class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
          />
          <span class="ml-2 text-white">User Welcome Emails</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Content Settings -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
    <h2 class="text-xl font-bold text-white mb-4">Content Settings</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Max Listing Images</label>
        <input
          type="number"
          min="1"
          max="20"
          bind:value={settings.content.maxListingImages}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Max Description Length</label>
        <input
          type="number"
          min="100"
          max="5000"
          bind:value={settings.content.maxListingDescriptionLength}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Max File Size (MB)</label>
        <input
          type="number"
          min="1"
          max="50"
          bind:value={settings.content.maxFileSize}
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
    </div>
    
    <div class="mt-6">
      <label class="block text-sm font-medium text-gray-300 mb-2">Allowed File Types</label>
      <input
        type="text"
        bind:value={settings.content.allowedFileTypes}
        placeholder="jpg, jpeg, png, pdf"
        class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
      <p class="text-gray-400 text-sm mt-1">Comma-separated list of allowed file extensions</p>
    </div>
    
    <div class="mt-6">
      <label class="flex items-center">
        <input
          type="checkbox"
          bind:checked={settings.content.moderationEnabled}
          class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
        />
        <span class="ml-2 text-white">Content Moderation Enabled</span>
      </label>
    </div>
  </div>

  <!-- Save Button -->
  <div class="flex justify-end">
    <button
      on:click={saveSettings}
      disabled={loading}
      class="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium py-3 px-8 rounded-lg transition-colors"
    >
      {loading ? 'Saving Settings...' : 'Save All Settings'}
    </button>
  </div>
</div>
