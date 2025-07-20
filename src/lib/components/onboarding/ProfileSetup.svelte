<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';
  import { completeProfileSetup } from '$lib/services/users.service';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';

  const dispatch = createEventDispatcher<{
    complete: { profile: any };
  }>();

  // Form data
  let displayName = '';
  let location = '';
  let bio = '';
  let phoneNumber = '';
  
  // Preferences
  let emailNotifications = true;
  let smsNotifications = false;
  let marketingEmails = true;
  let publicProfile = true;

  // State
  let loading = false;
  let error = '';
  let currentStep = 1;
  const totalSteps = 3;

  $: user = $authStore.data;
  $: canProceed = validateCurrentStep();

  // Initialize with Google data if available
  $: if (user && !displayName) {
    displayName = user.displayName || '';
  }

  function validateCurrentStep(): boolean {
    switch (currentStep) {
      case 1:
        return displayName.trim().length >= 2;
      case 2:
        return location.trim().length >= 2 && bio.trim().length >= 10;
      case 3:
        return true; // Preferences are optional
      default:
        return false;
    }
  }

  function nextStep() {
    if (canProceed && currentStep < totalSteps) {
      currentStep++;
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  async function completeSetup() {
    if (!user) {
      error = 'User not authenticated';
      return;
    }

    try {
      loading = true;
      error = '';

      await completeProfileSetup(user.uid, {
        displayName: displayName.trim(),
        location: location.trim(),
        bio: bio.trim(),
        phoneNumber: phoneNumber.trim(),
        preferences: {
          emailNotifications,
          smsNotifications,
          marketingEmails,
          publicProfile
        }
      });

      showToast('success', 'Welcome to GearGrab! Your profile is now complete.');
      
      dispatch('complete', { 
        profile: { displayName, location, bio, phoneNumber } 
      });

      // Redirect to dashboard
      goto('/dashboard');

    } catch (err: any) {
      error = err.message || 'Failed to complete profile setup';
      console.error('Profile setup error:', err);
    } finally {
      loading = false;
    }
  }

  function skipStep() {
    if (currentStep < totalSteps) {
      nextStep();
    } else {
      completeSetup();
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
  <div class="w-full max-w-2xl">
    <!-- Progress Bar -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
        <span class="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-primary-500 h-2 rounded-full transition-all duration-300"
          style="width: {(currentStep / totalSteps) * 100}%"
        ></div>
      </div>
    </div>

    <!-- Main Card -->
    <div class="bg-white rounded-xl shadow-lg p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Complete Your Profile
        </h1>
        <p class="text-gray-600">
          Help us personalize your GearGrab experience
        </p>
      </div>

      <!-- Error Display -->
      {#if error}
        <div class="mb-6">
          <ErrorBanner message={error} />
        </div>
      {/if}

      <!-- Step Content -->
      <div class="space-y-6">
        {#if currentStep === 1}
          <!-- Step 1: Basic Info -->
          <div class="space-y-6">
            <div class="text-center">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Tell us about yourself</h2>
              <p class="text-gray-600">This information will be visible on your public profile</p>
            </div>

            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                id="displayName"
                type="text"
                bind:value={displayName}
                placeholder="How should others see your name?"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p class="mt-1 text-sm text-gray-500">
                This is how your name will appear to other users
              </p>
            </div>

            {#if user?.photoURL}
              <div class="flex items-center space-x-4">
                <img
                  src={user.photoURL}
                  alt="Profile"
                  class="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900">Profile Photo</p>
                  <p class="text-sm text-gray-500">Imported from Google</p>
                </div>
              </div>
            {/if}
          </div>

        {:else if currentStep === 2}
          <!-- Step 2: Location & Bio -->
          <div class="space-y-6">
            <div class="text-center">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Where are you located?</h2>
              <p class="text-gray-600">This helps others find gear near them</p>
            </div>

            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                id="location"
                type="text"
                bind:value={location}
                placeholder="City, State (e.g., San Francisco, CA)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
                Bio *
              </label>
              <textarea
                id="bio"
                bind:value={bio}
                placeholder="Tell others about yourself and your interests in outdoor gear..."
                rows="4"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                required
              ></textarea>
              <p class="mt-1 text-sm text-gray-500">
                {bio.length}/500 characters (minimum 10)
              </p>
            </div>

            <div>
              <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                id="phoneNumber"
                type="tel"
                bind:value={phoneNumber}
                placeholder="+1 (555) 123-4567"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p class="mt-1 text-sm text-gray-500">
                For rental coordination (kept private)
              </p>
            </div>
          </div>

        {:else if currentStep === 3}
          <!-- Step 3: Preferences -->
          <div class="space-y-6">
            <div class="text-center">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Set your preferences</h2>
              <p class="text-gray-600">You can change these anytime in settings</p>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 class="font-medium text-gray-900">Email Notifications</h3>
                  <p class="text-sm text-gray-600">Get notified about bookings and messages</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" bind:checked={emailNotifications} class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 class="font-medium text-gray-900">SMS Notifications</h3>
                  <p class="text-sm text-gray-600">Get text messages for urgent updates</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" bind:checked={smsNotifications} class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 class="font-medium text-gray-900">Marketing Emails</h3>
                  <p class="text-sm text-gray-600">Receive tips and featured gear updates</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" bind:checked={marketingEmails} class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 class="font-medium text-gray-900">Public Profile</h3>
                  <p class="text-sm text-gray-600">Allow others to view your profile and listings</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" bind:checked={publicProfile} class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          on:click={prevStep}
          disabled={currentStep === 1}
          class="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div class="flex space-x-3">
          {#if currentStep < totalSteps}
            <button
              on:click={skipStep}
              class="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip
            </button>
          {/if}

          <button
            on:click={currentStep === totalSteps ? completeSetup : nextStep}
            disabled={!canProceed || loading}
            class="px-8 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {#if loading}
              <LoadingSpinner size="sm" color="white" />
              <span>Setting up...</span>
            {:else}
              <span>{currentStep === totalSteps ? 'Complete Setup' : 'Continue'}</span>
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center mt-6">
      <p class="text-sm text-gray-500">
        By completing your profile, you agree to our 
        <a href="/legal/terms" class="text-primary-500 hover:text-primary-600 underline">Terms of Service</a>
        and 
        <a href="/legal/privacy" class="text-primary-500 hover:text-primary-600 underline">Privacy Policy</a>
      </p>
    </div>
  </div>
</div>
