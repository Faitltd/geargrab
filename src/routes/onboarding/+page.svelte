<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { getUserProfile, isProfileComplete } from '$lib/services/users.service';
  import ProfileSetup from '$lib/components/onboarding/ProfileSetup.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let loading = true;
  let userProfile: any = null;
  let needsOnboarding = false;

  $: user = $authStore.data;

  onMount(async () => {
    await checkOnboardingStatus();
  });

  async function checkOnboardingStatus() {
    try {
      loading = true;

      // Check if user is authenticated
      if (!user) {
        goto('/auth/signin');
        return;
      }

      // Get user profile from Firestore
      userProfile = await getUserProfile(user.uid);

      if (!userProfile) {
        // Profile doesn't exist, needs onboarding
        needsOnboarding = true;
      } else if (!isProfileComplete(userProfile)) {
        // Profile exists but incomplete
        needsOnboarding = true;
      } else {
        // Profile is complete, redirect to dashboard
        goto('/dashboard');
        return;
      }

    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If there's an error, assume they need onboarding
      needsOnboarding = true;
    } finally {
      loading = false;
    }
  }

  function handleOnboardingComplete(event: CustomEvent) {
    // Onboarding completed successfully
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>Welcome to GearGrab - Complete Your Profile</title>
  <meta name="description" content="Complete your GearGrab profile to start renting and sharing outdoor gear with your community." />
</svelte:head>

{#if loading}
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
    <div class="text-center">
      <LoadingSpinner size="lg" />
      <p class="mt-4 text-gray-600">Setting up your account...</p>
    </div>
  </div>
{:else if needsOnboarding}
  <ProfileSetup on:complete={handleOnboardingComplete} />
{:else}
  <!-- This shouldn't normally be reached, but just in case -->
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Welcome back!</h1>
      <p class="text-gray-600 mb-6">Your profile is already complete.</p>
      <button
        on:click={() => goto('/dashboard')}
        class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
      >
        Go to Dashboard
      </button>
    </div>
  </div>
{/if}
