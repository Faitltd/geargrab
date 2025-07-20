<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore, signOut } from '$lib/stores/auth.store';
  import { getUserProfile, updateUserProfile } from '$lib/services/users.service';
  import { showToast } from '$lib/stores/toast.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import SuccessBanner from '$lib/components/SuccessBanner.svelte';
  import type { UserProfile } from '$lib/services/users.service';

  // State
  let loading = true;
  let saving = false;
  let error = '';
  let successMessage = '';
  let userProfile: UserProfile | null = null;

  // Settings
  let emailNotifications = true;
  let smsNotifications = false;
  let marketingEmails = true;
  let publicProfile = true;

  // Privacy settings
  let showEmail = false;
  let showPhone = false;
  let showLocation = true;

  // Account settings
  let twoFactorEnabled = false;
  let dataDownloadRequested = false;

  $: user = $authStore.data;

  onMount(async () => {
    if (!user) {
      goto('/auth/signin');
      return;
    }
    
    await loadSettings();
  });

  async function loadSettings() {
    try {
      loading = true;
      error = '';

      userProfile = await getUserProfile(user!.uid);
      
      if (!userProfile) {
        error = 'Profile not found';
        return;
      }

      // Load current settings
      emailNotifications = userProfile.preferences?.emailNotifications ?? true;
      smsNotifications = userProfile.preferences?.smsNotifications ?? false;
      marketingEmails = userProfile.preferences?.marketingEmails ?? true;
      publicProfile = userProfile.preferences?.publicProfile ?? true;

    } catch (err: any) {
      error = err.message || 'Failed to load settings';
      console.error('Error loading settings:', err);
    } finally {
      loading = false;
    }
  }

  async function saveNotificationSettings() {
    if (!user) return;

    try {
      saving = true;
      error = '';
      successMessage = '';

      await updateUserProfile(user.uid, {
        preferences: {
          emailNotifications,
          smsNotifications,
          marketingEmails,
          publicProfile
        }
      });

      successMessage = 'Notification settings updated successfully!';
      showToast('success', 'Settings updated successfully!');

    } catch (err: any) {
      error = err.message || 'Failed to update settings';
      console.error('Error updating settings:', err);
    } finally {
      saving = false;
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      goto('/');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('error', 'Failed to sign out');
    }
  }

  async function requestDataDownload() {
    // In a real app, this would trigger a data export process
    dataDownloadRequested = true;
    showToast('info', 'Data download request submitted. You will receive an email with your data within 24 hours.');
  }

  async function deleteAccount() {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, listings, and bookings.'
    );

    if (confirmed) {
      const doubleConfirmed = confirm(
        'This is your final warning. Deleting your account will permanently remove all your data. Type "DELETE" to confirm.'
      );

      if (doubleConfirmed) {
        // In a real app, this would call a delete account API
        showToast('error', 'Account deletion is not yet implemented. Please contact support.');
      }
    }
  }
</script>

<svelte:head>
  <title>Account Settings - GearGrab</title>
  <meta name="description" content="Manage your GearGrab account settings, privacy preferences, and notifications" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  {:else}
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p class="text-gray-600">Manage your account preferences and privacy settings</p>
      </div>

      <!-- Error/Success Messages -->
      {#if error}
        <div class="mb-6">
          <ErrorBanner message={error} />
        </div>
      {/if}

      {#if successMessage}
        <div class="mb-6">
          <SuccessBanner message={successMessage} />
        </div>
      {/if}

      <div class="space-y-8">
        <!-- Notification Settings -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Notification Preferences</h2>
            <button
              on:click={saveNotificationSettings}
              disabled={saving}
              class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {#if saving}
                <LoadingSpinner size="sm" color="white" />
                <span>Saving...</span>
              {:else}
                <span>Save Changes</span>
              {/if}
            </button>
          </div>
          
          <div class="space-y-4">
            <!-- Email Notifications -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Email Notifications</h3>
                <p class="text-sm text-gray-600">Get notified about bookings, messages, and important updates</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={emailNotifications} class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <!-- SMS Notifications -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">SMS Notifications</h3>
                <p class="text-sm text-gray-600">Get text messages for urgent updates and reminders</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={smsNotifications} class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <!-- Marketing Emails -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Marketing Emails</h3>
                <p class="text-sm text-gray-600">Receive tips, featured gear updates, and promotional offers</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={marketingEmails} class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <!-- Public Profile -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Public Profile</h3>
                <p class="text-sm text-gray-600">Allow others to view your profile and contact you</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={publicProfile} class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Privacy Settings -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Show Email Address</h3>
                <p class="text-sm text-gray-600">Allow other users to see your email address</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={showEmail} class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Show Phone Number</h3>
                <p class="text-sm text-gray-600">Allow other users to see your phone number</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={showPhone} class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Show Location</h3>
                <p class="text-sm text-gray-600">Allow other users to see your general location</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={showLocation} class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Account Management -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Account Management</h2>
          
          <div class="space-y-6">
            <!-- Sign Out -->
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Sign Out</h3>
                <p class="text-sm text-gray-600">Sign out of your GearGrab account</p>
              </div>
              <button
                on:click={handleSignOut}
                class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Sign Out
              </button>
            </div>

            <!-- Download Data -->
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Download Your Data</h3>
                <p class="text-sm text-gray-600">Request a copy of all your data stored on GearGrab</p>
              </div>
              <button
                on:click={requestDataDownload}
                disabled={dataDownloadRequested}
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dataDownloadRequested ? 'Requested' : 'Download Data'}
              </button>
            </div>

            <!-- Delete Account -->
            <div class="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
              <div>
                <h3 class="font-medium text-red-900">Delete Account</h3>
                <p class="text-sm text-red-600">Permanently delete your account and all associated data</p>
              </div>
              <button
                on:click={deleteAccount}
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Quick Links</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/profile/edit"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <div>
                <h3 class="font-medium text-gray-900">Edit Profile</h3>
                <p class="text-sm text-gray-600">Update your profile information</p>
              </div>
            </a>

            <a
              href={`/profile/${user?.uid}`}
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <h3 class="font-medium text-gray-900">View Profile</h3>
                <p class="text-sm text-gray-600">See how others view your profile</p>
              </div>
            </a>

            <a
              href="/dashboard"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h3 class="font-medium text-gray-900">Dashboard</h3>
                <p class="text-sm text-gray-600">Manage your listings and bookings</p>
              </div>
            </a>

            <a
              href="/legal/privacy"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 class="font-medium text-gray-900">Privacy Policy</h3>
                <p class="text-sm text-gray-600">Learn how we protect your data</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
