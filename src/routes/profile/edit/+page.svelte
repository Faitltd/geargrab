<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { getUserProfile, updateUserProfile } from '$lib/services/users.service';
  import { showToast } from '$lib/stores/toast.store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import SuccessBanner from '$lib/components/SuccessBanner.svelte';
  import PhotoUpload from '$lib/components/profile/PhotoUpload.svelte';
  import type { UserProfile } from '$lib/services/users.service';

  // State
  let loading = true;
  let saving = false;
  let error = '';
  let successMessage = '';
  let userProfile: UserProfile | null = null;

  // Form data
  let displayName = '';
  let bio = '';
  let location = '';
  let phoneNumber = '';
  let website = '';
  
  // Social links
  let instagram = '';
  let facebook = '';
  let twitter = '';

  // Preferences
  let emailNotifications = true;
  let smsNotifications = false;
  let marketingEmails = true;
  let publicProfile = true;

  // Validation
  let fieldErrors: Record<string, string> = {};

  $: user = $authStore.data;

  onMount(async () => {
    if (!user) {
      goto('/auth/signin');
      return;
    }
    
    await loadProfile();
  });

  async function loadProfile() {
    try {
      loading = true;
      error = '';

      userProfile = await getUserProfile(user!.uid);
      
      if (!userProfile) {
        error = 'Profile not found';
        return;
      }

      // Populate form fields
      displayName = userProfile.displayName || '';
      bio = userProfile.bio || '';
      location = userProfile.location || '';
      phoneNumber = userProfile.phoneNumber || '';
      website = userProfile.website || '';
      
      // Social links
      instagram = userProfile.socialLinks?.instagram || '';
      facebook = userProfile.socialLinks?.facebook || '';
      twitter = userProfile.socialLinks?.twitter || '';

      // Preferences
      emailNotifications = userProfile.preferences?.emailNotifications ?? true;
      smsNotifications = userProfile.preferences?.smsNotifications ?? false;
      marketingEmails = userProfile.preferences?.marketingEmails ?? true;
      publicProfile = userProfile.preferences?.publicProfile ?? true;

    } catch (err: any) {
      error = err.message || 'Failed to load profile';
      console.error('Error loading profile:', err);
    } finally {
      loading = false;
    }
  }

  function validateForm(): boolean {
    fieldErrors = {};
    let isValid = true;

    if (!displayName.trim()) {
      fieldErrors.displayName = 'Display name is required';
      isValid = false;
    } else if (displayName.trim().length < 2) {
      fieldErrors.displayName = 'Display name must be at least 2 characters';
      isValid = false;
    }

    if (!location.trim()) {
      fieldErrors.location = 'Location is required';
      isValid = false;
    }

    if (bio.trim().length > 500) {
      fieldErrors.bio = 'Bio must be 500 characters or less';
      isValid = false;
    }

    if (website && !isValidUrl(website)) {
      fieldErrors.website = 'Please enter a valid website URL';
      isValid = false;
    }

    if (instagram && !isValidSocialHandle(instagram)) {
      fieldErrors.instagram = 'Please enter a valid Instagram handle';
      isValid = false;
    }

    if (facebook && !isValidSocialHandle(facebook)) {
      fieldErrors.facebook = 'Please enter a valid Facebook handle';
      isValid = false;
    }

    if (twitter && !isValidSocialHandle(twitter)) {
      fieldErrors.twitter = 'Please enter a valid Twitter handle';
      isValid = false;
    }

    return isValid;
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  function isValidSocialHandle(handle: string): boolean {
    // Remove @ if present and check if it's a valid handle
    const cleanHandle = handle.replace('@', '');
    return /^[a-zA-Z0-9._]{1,30}$/.test(cleanHandle);
  }

  async function handleSubmit() {
    if (!user || !validateForm()) {
      return;
    }

    try {
      saving = true;
      error = '';
      successMessage = '';

      const updateData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        phoneNumber: phoneNumber.trim(),
        website: website.trim(),
        socialLinks: {
          instagram: instagram.replace('@', '').trim(),
          facebook: facebook.replace('@', '').trim(),
          twitter: twitter.replace('@', '').trim()
        },
        preferences: {
          emailNotifications,
          smsNotifications,
          marketingEmails,
          publicProfile
        }
      };

      await updateUserProfile(user.uid, updateData);
      
      successMessage = 'Profile updated successfully!';
      showToast('success', 'Profile updated successfully!');

      // Refresh profile data
      await loadProfile();

    } catch (err: any) {
      error = err.message || 'Failed to update profile';
      console.error('Error updating profile:', err);
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    goto(`/profile/${user?.uid}`);
  }
</script>

<svelte:head>
  <title>Edit Profile - GearGrab</title>
  <meta name="description" content="Edit your GearGrab profile settings and preferences" />
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
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
        <p class="text-gray-600">Update your profile information and preferences</p>
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

      <form on:submit|preventDefault={handleSubmit} class="space-y-8">
        <!-- Profile Photo -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Profile Photo</h2>

          <div class="flex items-center space-x-6">
            <PhotoUpload
              currentPhotoURL={userProfile?.photoURL || null}
              userId={user?.uid || ''}
              size="lg"
              on:photoUpdated={(event) => {
                if (userProfile) {
                  userProfile.photoURL = event.detail.photoURL || undefined;
                }
              }}
            />

            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Update your photo</h3>
              <p class="text-sm text-gray-600 mb-4">
                A good profile photo helps build trust with other users.
                Make sure it clearly shows your face.
              </p>
            </div>
          </div>
        </div>

        <!-- Basic Information -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Display Name -->
            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                id="displayName"
                type="text"
                bind:value={displayName}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent {fieldErrors.displayName ? 'border-red-500' : ''}"
                placeholder="Your display name"
                required
              />
              {#if fieldErrors.displayName}
                <p class="mt-1 text-sm text-red-600">{fieldErrors.displayName}</p>
              {/if}
            </div>

            <!-- Location -->
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                id="location"
                type="text"
                bind:value={location}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent {fieldErrors.location ? 'border-red-500' : ''}"
                placeholder="City, State"
                required
              />
              {#if fieldErrors.location}
                <p class="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
              {/if}
            </div>

            <!-- Phone Number -->
            <div>
              <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                bind:value={phoneNumber}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <!-- Website -->
            <div>
              <label for="website" class="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                id="website"
                type="url"
                bind:value={website}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent {fieldErrors.website ? 'border-red-500' : ''}"
                placeholder="https://yourwebsite.com"
              />
              {#if fieldErrors.website}
                <p class="mt-1 text-sm text-red-600">{fieldErrors.website}</p>
              {/if}
            </div>
          </div>

          <!-- Bio -->
          <div class="mt-6">
            <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              bind:value={bio}
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none {fieldErrors.bio ? 'border-red-500' : ''}"
              placeholder="Tell others about yourself and your interests..."
            ></textarea>
            <div class="mt-1 flex justify-between">
              {#if fieldErrors.bio}
                <p class="text-sm text-red-600">{fieldErrors.bio}</p>
              {:else}
                <div></div>
              {/if}
              <p class="text-sm text-gray-500">{bio.length}/500 characters</p>
            </div>
          </div>
        </div>

        <!-- Social Links -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Social Links</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Instagram -->
            <div>
              <label for="instagram" class="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 text-sm">@</span>
                </div>
                <input
                  id="instagram"
                  type="text"
                  bind:value={instagram}
                  class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent {fieldErrors.instagram ? 'border-red-500' : ''}"
                  placeholder="username"
                />
              </div>
              {#if fieldErrors.instagram}
                <p class="mt-1 text-sm text-red-600">{fieldErrors.instagram}</p>
              {/if}
            </div>

            <!-- Facebook -->
            <div>
              <label for="facebook" class="block text-sm font-medium text-gray-700 mb-2">
                Facebook
              </label>
              <input
                id="facebook"
                type="text"
                bind:value={facebook}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent {fieldErrors.facebook ? 'border-red-500' : ''}"
                placeholder="username"
              />
              {#if fieldErrors.facebook}
                <p class="mt-1 text-sm text-red-600">{fieldErrors.facebook}</p>
              {/if}
            </div>

            <!-- Twitter -->
            <div>
              <label for="twitter" class="block text-sm font-medium text-gray-700 mb-2">
                Twitter
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 text-sm">@</span>
                </div>
                <input
                  id="twitter"
                  type="text"
                  bind:value={twitter}
                  class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent {fieldErrors.twitter ? 'border-red-500' : ''}"
                  placeholder="username"
                />
              </div>
              {#if fieldErrors.twitter}
                <p class="mt-1 text-sm text-red-600">{fieldErrors.twitter}</p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Preferences</h2>
          
          <div class="space-y-4">
            <!-- Email Notifications -->
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

            <!-- SMS Notifications -->
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

            <!-- Marketing Emails -->
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

            <!-- Public Profile -->
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

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            on:click={handleCancel}
            class="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            class="px-8 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {#if saving}
              <LoadingSpinner size="sm" color="white" />
              <span>Saving...</span>
            {:else}
              <span>Save Changes</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
