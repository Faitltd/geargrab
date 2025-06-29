<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { isCurrentUserAdmin } from '$lib/auth/admin';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let loading = true;
  let isAdmin = false;
  let saving = false;
  let settings = {
    platform: {
      siteName: 'GearGrab',
      siteDescription: 'Rent outdoor gear from locals',
      maintenanceMode: false,
      allowNewRegistrations: true,
      requireEmailVerification: true
    },
    payments: {
      stripePublishableKey: '',
      platformFeePercentage: 10,
      minimumBookingAmount: 25,
      maximumBookingAmount: 5000,
      currency: 'USD'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminEmailAlerts: true
    },
    security: {
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      allowPasswordReset: true
    },
    features: {
      enableChat: true,
      enableReviews: true,
      enableInsurance: true,
      enableBackgroundChecks: false,
      enableGeolocation: true
    }
  };

  onMount(async () => {
    try {
      // Wait for auth to be ready
      await simpleAuth.waitForAuthReady();

      if (!simpleAuth.user) {
        goto("/admin/login?redirectTo=/admin/settings");
        return;
      }

      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        notifications.add({
          type: 'error',
          message: 'Access denied. Admin privileges required.',
          timeout: 5000
        });
        goto('/dashboard');
        return;
      }

      await loadSettings();

    } catch (error) {
      console.error('Error checking admin status:', error);
      notifications.add({
        type: 'error',
        message: 'Error loading admin settings',
        timeout: 5000
      });
      goto('/dashboard');
    } finally {
      loading = false;
    }
  });

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      const result = await response.json();

      if (response.ok) {
        settings = { ...settings, ...result.settings };
      } else {
        console.warn('Failed to load settings, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      notifications.add({
        type: 'warning',
        message: 'Failed to load settings, using defaults',
        timeout: 5000
      });
    }
  }

  async function saveSettings() {
    if (saving) return;

    saving = true;
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      const result = await response.json();

      if (response.ok) {
        notifications.add({
          type: 'success',
          message: 'Settings saved successfully',
          timeout: 5000
        });
      } else {
        notifications.add({
          type: 'error',
          message: `Failed to save settings: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      notifications.add({
        type: 'error',
        message: 'Error saving settings',
        timeout: 5000
      });
    } finally {
      saving = false;
    }
  }

  function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      settings = {
        platform: {
          siteName: 'GearGrab',
          siteDescription: 'Rent outdoor gear from locals',
          maintenanceMode: false,
          allowNewRegistrations: true,
          requireEmailVerification: true
        },
        payments: {
          stripePublishableKey: '',
          platformFeePercentage: 10,
          minimumBookingAmount: 25,
          maximumBookingAmount: 5000,
          currency: 'USD'
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          adminEmailAlerts: true
        },
        security: {
          sessionTimeout: 24,
          maxLoginAttempts: 5,
          requireTwoFactor: false,
          allowPasswordReset: true
        },
        features: {
          enableChat: true,
          enableReviews: true,
          enableInsurance: true,
          enableBackgroundChecks: false,
          enableGeolocation: true
        }
      };
    }
  }
</script>

<svelte:head>
  <title>System Settings - Admin Panel</title>
</svelte:head>

{#if loading}
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
    <p class="text-gray-400">Loading system settings...</p>
  </div>
{:else if !isAdmin}
  <div class="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30 text-center">
    <h2 class="text-xl font-bold text-white mb-2">Access Denied</h2>
    <p class="text-gray-300">Admin privileges required to access system settings.</p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-white">System Settings</h1>
        <p class="text-gray-400 mt-1">Configure platform settings and features</p>
      </div>
      <div class="flex space-x-3">
        <button
          on:click="{resetToDefaults}"
          class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Reset to Defaults
        </button>
        <a href="/admin" class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          ← Back to Admin
        </a>
      </div>
    </div>

    <!-- Platform Settings -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Platform Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Site Name</label>
          <input
            type="text"
            bind:value="{settings.platform.siteName}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Site Description</label>
          <input
            type="text"
            bind:value="{settings.platform.siteDescription}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div class="md:col-span-2">
          <div class="space-y-3">
            <label class="flex items-center space-x-3">
              <input
                type="checkbox"
                bind:checked="{settings.platform.maintenanceMode}"
                class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
              />
              <span class="text-white">Maintenance Mode</span>
            </label>
            <label class="flex items-center space-x-3">
              <input
                type="checkbox"
                bind:checked="{settings.platform.allowNewRegistrations}"
                class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
              />
              <span class="text-white">Allow New Registrations</span>
            </label>
            <label class="flex items-center space-x-3">
              <input
                type="checkbox"
                bind:checked="{settings.platform.requireEmailVerification}"
                class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
              />
              <span class="text-white">Require Email Verification</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Settings -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Payment Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Platform Fee (%)</label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.1"
            bind:value="{settings.payments.platformFeePercentage}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Currency</label>
          <select
            bind:value="{settings.payments.currency}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
          </select>
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Minimum Booking Amount ($)</label>
          <input
            type="number"
            min="1"
            bind:value="{settings.payments.minimumBookingAmount}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Maximum Booking Amount ($)</label>
          <input
            type="number"
            min="100"
            bind:value="{settings.payments.maximumBookingAmount}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>
    </div>

    <!-- Feature Settings -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Feature Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            bind:checked="{settings.features.enableChat}"
            class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
          />
          <span class="text-white">Enable Chat System</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            bind:checked="{settings.features.enableReviews}"
            class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
          />
          <span class="text-white">Enable Reviews</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            bind:checked="{settings.features.enableInsurance}"
            class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
          />
          <span class="text-white">Enable Insurance</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            bind:checked="{settings.features.enableBackgroundChecks}"
            class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
          />
          <span class="text-white">Enable Background Checks</span>
        </label>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            bind:checked="{settings.features.enableGeolocation}"
            class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
          />
          <span class="text-white">Enable Geolocation</span>
        </label>
      </div>
    </div>

    <!-- Security Settings -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Security Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Session Timeout (hours)</label>
          <input
            type="number"
            min="1"
            max="168"
            bind:value="{settings.security.sessionTimeout}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2">Max Login Attempts</label>
          <input
            type="number"
            min="3"
            max="10"
            bind:value="{settings.security.maxLoginAttempts}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div class="md:col-span-2">
          <div class="space-y-3">
            <label class="flex items-center space-x-3">
              <input
                type="checkbox"
                bind:checked="{settings.security.requireTwoFactor}"
                class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
              />
              <span class="text-white">Require Two-Factor Authentication</span>
            </label>
            <label class="flex items-center space-x-3">
              <input
                type="checkbox"
                bind:checked="{settings.security.allowPasswordReset}"
                class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 rounded focus:ring-yellow-500"
              />
              <span class="text-white">Allow Password Reset</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        on:click="{saveSettings}"
        disabled={saving}
        class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center"
      >
        {#if saving}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Saving...
        {:else}
          💾 Save Settings
        {/if}
      </button>
    </div>
  </div>
{/if}
