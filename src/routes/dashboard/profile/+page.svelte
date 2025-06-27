<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { notifications } from '$lib/stores/notifications';
  import ProfilePhotoUploader from '$lib/components/profile-photo-uploader.svelte';
  import { firestore } from '$lib/firebase/client';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';

  // User data
  let user = {
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: '',
    verified: false,
    memberSince: ''
  };

  let editing = false;
  let loading = true;
  let saving = false;

  onMount(async () => {
    await loadUserProfile();
  });

  async function loadUserProfile() {
    try {
      loading = true;

      // Wait for auth to be ready
      await simpleAuth.waitForAuthReady();

      if (!simpleAuth.user) {
        notifications.add({
          type: 'error',
          message: 'Please log in to view your profile',
          timeout: 5000
        });
        return;
      }

      // Get user data from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', simpleAuth.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        user = {
          name: userData.displayName || simpleAuth.user.displayName || '',
          email: userData.email || simpleAuth.user.email || '',
          phone: userData.phoneNumber || simpleAuth.user.phoneNumber || '',
          location: userData.location || '',
          bio: userData.bio || '',
          avatar: userData.photoURL || simpleAuth.user.photoURL || '',
          verified: userData.isVerified || false,
          memberSince: userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'
        };
      } else {
        // Use Firebase Auth data as fallback
        user = {
          name: simpleAuth.user.displayName || '',
          email: simpleAuth.user.email || '',
          phone: simpleAuth.user.phoneNumber || '',
          location: '',
          bio: '',
          avatar: simpleAuth.user.photoURL || '',
          verified: simpleAuth.user.emailVerified || false,
          memberSince: 'Recently'
        };
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load profile data',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  async function saveProfile() {
    if (!simpleAuth.user) return;

    try {
      saving = true;

      // Update Firestore document
      await updateDoc(doc(firestore, 'users', simpleAuth.user.uid), {
        displayName: user.name,
        phoneNumber: user.phone,
        location: user.location,
        bio: user.bio,
        updatedAt: new Date()
      });

      notifications.add({
        type: 'success',
        message: 'Profile updated successfully!',
        timeout: 3000
      });

      editing = false;
    } catch (error) {
      console.error('Error saving profile:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to save profile changes',
        timeout: 5000
      });
    } finally {
      saving = false;
    }
  }

  function handlePhotoUploaded(event) {
    user.avatar = event.detail.photoURL;
    // Trigger reactivity
    user = { ...user };
  }

  function handlePhotoDeleted() {
    user.avatar = '';
    // Trigger reactivity
    user = { ...user };
  }
</script>

<svelte:head>
  <title>Profile - GearGrab</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Profile Settings</h1>
        <p class="text-gray-300 mt-1">Manage your account information and preferences</p>
      </div>
      {#if editing}
        <div class="flex space-x-3">
          <button
            class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            on:click={() => editing = false}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            on:click={saveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      {:else}
        <button
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          on:click={() => editing = true}
        >
          Edit Profile
        </button>
      {/if}
    </div>
  </div>

  <!-- Profile Overview -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
        <span class="ml-3 text-gray-300">Loading profile...</span>
      </div>
    {:else}
      <div class="flex items-center space-x-6">
        <div class="flex-shrink-0">
          <ProfilePhotoUploader
            currentPhotoURL={user.avatar}
            userName={user.name}
            size="large"
            on:uploaded={handlePhotoUploaded}
            on:deleted={handlePhotoDeleted}
          />
        </div>
      <div class="flex-1">
        <div class="flex items-center space-x-2">
          <h2 class="text-2xl font-bold text-white">{user.name}</h2>
          {#if user.verified}
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <span class="text-green-400 text-sm font-medium ml-1">Verified</span>
            </div>
          {/if}
        </div>
        <p class="text-gray-300">{user.email}</p>
        <p class="text-gray-400 text-sm">Member since {user.memberSince}</p>
      </div>
    </div>
    {/if}
  </div>

  <!-- Profile Details -->
  {#if !loading}
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
      <div class="px-6 py-4 border-b border-white/20">
        <h2 class="text-lg font-medium text-white">Personal Information</h2>
      </div>
    <div class="p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="full-name" class="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          {#if editing}
            <input id="full-name"
              type="text"
              bind:value="{user.name}"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <p class="text-white">{user.name}</p>
          {/if}
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">Email</label>
          {#if editing}
            <input id="email"
              type="email"
              bind:value="{user.email}"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <p class="text-white">{user.email}</p>
          {/if}
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-300 mb-2">Phone</label>
          {#if editing}
            <input id="phone"
              type="tel"
              bind:value="{user.phone}"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <p class="text-white">{user.phone || 'Not provided'}</p>
          {/if}
        </div>

        <div>
          <label for="location" class="block text-sm font-medium text-gray-300 mb-2">Location</label>
          {#if editing}
            <input id="location"
              type="text"
              bind:value="{user.location}"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <p class="text-white">{user.location || 'Not provided'}</p>
          {/if}
        </div>
      </div>

      <div>
        <label for="bio" class="block text-sm font-medium text-gray-300 mb-2">Bio</label>
        {#if editing}
          <textarea id="bio"
            bind:value="{user.bio}"
            rows="4"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          ></textarea>
        {:else}
          <p class="text-white">{user.bio}</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Account Settings -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
    <div class="px-6 py-4 border-b border-white/20">
      <h2 class="text-lg font-medium text-white">Account Settings</h2>
    </div>
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-white font-medium">Email Notifications</h3>
          <p class="text-gray-300 text-sm">Receive notifications about bookings and messages</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-white font-medium">SMS Notifications</h3>
          <p class="text-gray-300 text-sm">Receive text messages for urgent updates</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>
    </div>
  </div>
  {/if}
</div>
