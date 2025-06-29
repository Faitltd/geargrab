<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { firestore } from '$lib/firebase/client';
  import { doc, getDoc } from 'firebase/firestore';
  import { goto } from '$app/navigation';

  export let showInDashboard = true;
  export let compact = false;

  let user: any = null;
  let completionScore = 0;
  let completionItems: any[] = [];
  let loading = true;

  // Get auth state
  $: authState = simpleAuth.authState;

  onMount(async () => {
    if ($authState.user) {
      await loadUserProfile();
    }
  });

  async function loadUserProfile() {
    try {
      loading = true;
      
      if (!$authState.user) return;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', $authState.user.uid));
      
      if (userDoc.exists()) {
        user = userDoc.data();
      } else {
        // Use Firebase Auth data as fallback
        user = {
          displayName: $authState.user.displayName || '',
          email: $authState.user.email || '',
          photoURL: $authState.user.photoURL || '',
          phoneNumber: $authState.user.phoneNumber || '',
          location: '',
          bio: '',
          isVerified: false
        };
      }

      calculateCompletion();
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      loading = false;
    }
  }

  function calculateCompletion() {
    if (!user) return;

    completionItems = [
      {
        id: 'name',
        label: 'Add your name',
        completed: !!(user.displayName && user.displayName.trim()),
        points: 15,
        action: () => goto('/dashboard/profile'),
        icon: '👤'
      },
      {
        id: 'photo',
        label: 'Upload profile photo',
        completed: !!(user.photoURL),
        points: 20,
        action: () => goto('/dashboard/profile'),
        icon: '📸'
      },
      {
        id: 'bio',
        label: 'Write a bio',
        completed: !!(user.bio && user.bio.trim()),
        points: 25,
        action: () => goto('/dashboard/profile'),
        icon: '📝'
      },
      {
        id: 'location',
        label: 'Add your location',
        completed: !!(user.location && user.location.trim()),
        points: 15,
        action: () => goto('/dashboard/profile'),
        icon: '📍'
      },
      {
        id: 'phone',
        label: 'Verify phone number',
        completed: !!(user.phoneNumber),
        points: 15,
        action: () => goto('/dashboard/verification'),
        icon: '📱'
      },
      {
        id: 'verification',
        label: 'Complete identity verification',
        completed: !!(user.isVerified),
        points: 30,
        action: () => goto('/dashboard/verification'),
        icon: '✅'
      }
    ];

    const totalPoints = completionItems.reduce((sum, item) => sum + item.points, 0);
    const earnedPoints = completionItems
      .filter(item => item.completed)
      .reduce((sum, item) => sum + item.points, 0);
    
    completionScore = Math.round((earnedPoints / totalPoints) * 100);
  }

  function getCompletionColor(score: number): string {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  }

  function getProgressBarColor(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  $: incompleteItems = completionItems.filter(item => !item.completed);
  $: nextAction = incompleteItems.length > 0 ? incompleteItems[0] : null;
</script>

{#if !loading && user && (completionScore < 100 || !compact)}
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 {compact ? 'mb-4' : 'mb-6'}">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <span class="text-green-400 text-lg">🎯</span>
        </div>
        <div>
          <h3 class="text-white font-semibold">Profile Completion</h3>
          <p class="text-gray-300 text-sm">Complete your profile to build trust</p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold {getCompletionColor(completionScore)}">{completionScore}%</div>
        <div class="text-xs text-gray-400">Complete</div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mb-4">
      <div class="w-full bg-white/10 rounded-full h-2">
        <div 
          class="h-2 rounded-full transition-all duration-500 {getProgressBarColor(completionScore)}"
          style="width: {completionScore}%"
        ></div>
      </div>
    </div>

    {#if !compact}
      <!-- Completion Items -->
      <div class="space-y-2 mb-4">
        {#each completionItems as item}
          <div class="flex items-center justify-between p-2 rounded-lg {item.completed ? 'bg-green-500/10' : 'bg-white/5'}">
            <div class="flex items-center space-x-3">
              <span class="text-lg">{item.icon}</span>
              <span class="text-white text-sm {item.completed ? 'line-through opacity-75' : ''}">{item.label}</span>
              {#if item.completed}
                <span class="text-green-400 text-xs">✓</span>
              {/if}
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-400">+{item.points}pts</span>
              {#if !item.completed}
                <button
                  on:click={item.action}
                  class="text-green-400 hover:text-green-300 text-xs font-medium"
                >
                  Complete
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Next Action -->
    {#if nextAction && completionScore < 100}
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-green-400 text-sm">🎯 Next:</span>
            <span class="text-white text-sm font-medium">{nextAction.label}</span>
          </div>
          <button
            on:click={nextAction.action}
            class="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1 rounded-lg transition-colors"
          >
            Complete
          </button>
        </div>
      </div>
    {:else if completionScore === 100}
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
        <span class="text-green-400 text-sm">🎉 Profile Complete! You're ready to rent and list gear.</span>
      </div>
    {/if}

    <!-- Benefits -->
    {#if !compact && completionScore < 100}
      <div class="mt-4 pt-4 border-t border-white/10">
        <p class="text-xs text-gray-400 mb-2">Complete your profile to:</p>
        <div class="grid grid-cols-2 gap-2 text-xs text-gray-300">
          <div class="flex items-center space-x-1">
            <span class="text-green-400">•</span>
            <span>Build trust with renters</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-green-400">•</span>
            <span>Get more bookings</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-green-400">•</span>
            <span>Access premium features</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-green-400">•</span>
            <span>Increase your visibility</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
