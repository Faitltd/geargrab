<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { showToast } from '$lib/stores/toast.store';
  import {
    updateUserProfile,
    uploadUserAvatar,
    getUserProfile,
    subscribeToUserProfile,
    type UserProfile
  } from '$lib/services/users.service';
  import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
  import ProfileInfoCard from '$lib/components/profile/ProfileInfoCard.svelte';
  import AvatarUploader from '$lib/components/profile/AvatarUploader.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';

  // State
  let userProfile: UserProfile | null = null;
  let isLoading = true;
  let error = '';
  let isSaving = false;
  let profileUnsubscribe: (() => void) | undefined;

  // Form data
  let profileData = {
    displayName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    location: ''
  };

  // Reactive statements
  $: user = $authStore.data;
  $: isAuthenticated = !!user;

  onMount(async () => {
    // Check authentication
    if (!isAuthenticated) {
      showToast('error', 'Please sign in to access your profile');
      goto('/auth/signin');
      return;
    }

    await loadUserProfile();
  });

  onDestroy(() => {
    // Clean up subscription
    if (profileUnsubscribe) {
      profileUnsubscribe();
    }
  });

  async function loadUserProfile() {
    if (!user) return;

    try {
      isLoading = true;
      error = '';

      userProfile = await getUserProfile(user.uid);
      
      // Initialize form data with current profile
      profileData = {
        displayName: userProfile?.displayName || user.displayName || '',
        email: userProfile?.email || user.email || '',
        phoneNumber: userProfile?.phoneNumber || '',
        bio: userProfile?.bio || '',
        location: userProfile?.location || ''
      };

      // Set up real-time subscription for profile updates
      profileUnsubscribe = subscribeToUserProfile(user.uid, (updatedProfile) => {
        if (updatedProfile) {
          userProfile = updatedProfile;

          // Update form data if not currently editing
          profileData = {
            displayName: updatedProfile.displayName || user.displayName || '',
            email: updatedProfile.email || user.email || '',
            phoneNumber: updatedProfile.phoneNumber || '',
            bio: updatedProfile.bio || '',
            location: updatedProfile.location || ''
          };
        }
      });

    } catch (err) {
      console.error('Error loading user profile:', err);
      error = err instanceof Error ? err.message : 'Failed to load profile';
    } finally {
      isLoading = false;
    }
  }

  async function handleProfileUpdate(updatedData: Partial<UserProfile>) {
    if (!user || isSaving) return;

    try {
      isSaving = true;

      await updateUserProfile(user.uid, updatedData);
      
      // Update local state
      if (userProfile) {
        userProfile = { ...userProfile, ...updatedData };
      }

      // Update form data
      profileData = { ...profileData, ...updatedData };

      showToast('success', 'Profile updated successfully');

    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('error', 'Failed to update profile');
    } finally {
      isSaving = false;
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!user) return;

    try {
      const avatarUrl = await uploadUserAvatar(user.uid, file);
      
      // Update profile with new avatar
      await handleProfileUpdate({ photoURL: avatarUrl });
      
      showToast('success', 'Avatar updated successfully');

    } catch (err) {
      console.error('Error uploading avatar:', err);
      showToast('error', 'Failed to upload avatar');
    }
  }
</script>

<svelte:head>
  <title>Profile Settings - GearGrab</title>
  <meta name="description" content="Manage your profile settings and preferences" />
</svelte:head>

<DashboardLayout 
  title="Profile Settings" 
  description="Manage your profile information and preferences"
>
  <div class="max-w-4xl mx-auto space-y-6">
    
    {#if isLoading}
      <div class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

    {:else if error}
      <ErrorBanner message={error} />
      <div class="text-center">
        <button
          on:click={loadUserProfile}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>

    {:else}
      <!-- Avatar Section -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
        <AvatarUploader
          currentAvatar={userProfile?.photoURL || user?.photoURL}
          userName={profileData.displayName || 'User'}
          on:upload={(e) => handleAvatarUpload(e.detail.file)}
        />
      </div>

      <!-- Personal Information -->
      <ProfileInfoCard
        title="Personal Information"
        description="Update your personal details and contact information"
        data={{
          displayName: profileData.displayName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber
        }}
        fields={[
          {
            key: 'displayName',
            label: 'Display Name',
            type: 'text',
            placeholder: 'Enter your display name',
            required: true
          },
          {
            key: 'email',
            label: 'Email Address',
            type: 'email',
            placeholder: 'Enter your email address',
            required: true,
            readonly: true,
            helpText: 'Email cannot be changed here. Use account settings to update your email.'
          },
          {
            key: 'phoneNumber',
            label: 'Phone Number',
            type: 'tel',
            placeholder: 'Enter your phone number'
          }
        ]}
        {isSaving}
        on:save={(e) => handleProfileUpdate(e.detail.data)}
      />

      <!-- About Section -->
      <ProfileInfoCard
        title="About"
        description="Tell others about yourself and your location"
        data={{
          bio: profileData.bio,
          location: profileData.location
        }}
        fields={[
          {
            key: 'bio',
            label: 'Bio',
            type: 'textarea',
            placeholder: 'Tell us about yourself, your outdoor interests, and experience...',
            maxLength: 500
          },
          {
            key: 'location',
            label: 'Location',
            type: 'text',
            placeholder: 'City, State or Region'
          }
        ]}
        {isSaving}
        on:save={(e) => handleProfileUpdate(e.detail.data)}
      />

      <!-- Account Settings -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
        <div class="space-y-4">
          
          <!-- Account Status -->
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h3 class="font-medium text-gray-900">Account Status</h3>
              <p class="text-sm text-gray-600">Your account is active and verified</p>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>

          <!-- Member Since -->
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h3 class="font-medium text-gray-900">Member Since</h3>
              <p class="text-sm text-gray-600">
                {#if userProfile?.createdAt}
                  {new Date(userProfile.createdAt.toDate()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                {:else}
                  Recently joined
                {/if}
              </p>
            </div>
          </div>

          <!-- Privacy Settings -->
          <div class="flex items-center justify-between py-3">
            <div>
              <h3 class="font-medium text-gray-900">Privacy Settings</h3>
              <p class="text-sm text-gray-600">Manage your privacy and data preferences</p>
            </div>
            <button class="text-blue-600 hover:text-blue-800 font-medium text-sm">
              Manage
            </button>
          </div>

        </div>
      </div>

    {/if}
  </div>
</DashboardLayout>
