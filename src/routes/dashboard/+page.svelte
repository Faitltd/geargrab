<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { getUserProfile, isProfileComplete, getProfileCompletionPercentage } from '$lib/services/users.service';
  import Layout from '$lib/components/Layout.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let loading = true;
  let userProfile: any = null;
  let profileComplete = false;
  let completionPercentage = 0;

  $: user = $authStore.data;

  onMount(async () => {
    await checkProfileStatus();
  });

  async function checkProfileStatus() {
    try {
      loading = true;

      // Check authentication
      if (!user) {
        goto('/auth/signin');
        return;
      }

      // Get user profile
      userProfile = await getUserProfile(user.uid);

      if (!userProfile) {
        // No profile exists, redirect to onboarding
        goto('/onboarding');
        return;
      }

      profileComplete = isProfileComplete(userProfile);
      completionPercentage = getProfileCompletionPercentage(userProfile);

      if (!profileComplete) {
        // Profile incomplete, redirect to onboarding
        goto('/onboarding');
        return;
      }

      // Profile is complete, redirect to appropriate dashboard
      goto('/dashboard/overview');

    } catch (error) {
      console.error('Error checking profile status:', error);
      // If there's an error, redirect to onboarding to be safe
      goto('/onboarding');
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <LoadingSpinner size="lg" />
      <p class="mt-4 text-gray-600">Checking your profile...</p>
    </div>
  </div>
{:else}
  <Layout
    title="Dashboard - GearGrab"
    heroTitle="Your Dashboard"
    heroSubtitle="Manage your gear listings and sales"
  >
    <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      <!-- Stats Cards -->
      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-primary-100">
            <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Active Listings</p>
            <p class="text-2xl font-bold text-neutral-900">12</p>
          </div>
        </div>
      </div>
      
      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-accent-100">
            <svg class="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Total Sales</p>
            <p class="text-2xl font-bold text-neutral-900">$2,450</p>
          </div>
        </div>
      </div>
      
      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100">
            <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Completed Sales</p>
            <p class="text-2xl font-bold text-neutral-900">8</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-neutral-900 mb-6">Quick Actions</h2>
      <div class="flex flex-wrap gap-4">
        <a href="/listings/new" class="btn-primary">
          List New Gear
        </a>
        <button class="btn-outline">
          View All Listings
        </button>
        <button class="btn-outline">
          Sales History
        </button>
      </div>
    </div>

    <!-- Recent Activity -->
    <div>
      <h2 class="text-2xl font-bold text-neutral-900 mb-6">Recent Activity</h2>
      <div class="card">
        <div class="p-6">
          <p class="text-neutral-600 text-center py-8">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  </div>
</Layout>
{/if}
