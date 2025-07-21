<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { 
    getRentalConditionChecks,
    updateConditionCheckStatus,
    type ConditionCheck 
  } from '$lib/services/conditionCheck';
  import PhotoComparisonCard from '$lib/components/verification/PhotoComparisonCard.svelte';
  import { showToast } from '$lib/stores/toast.store';

  // URL parameters
  let rentalId: string | null = null;
  let conditionCheckId: string | null = null;

  // State
  let beforeConditionCheck: ConditionCheck | null = null;
  let afterConditionCheck: ConditionCheck | null = null;
  let isLoading = true;
  let error = '';

  // Comparison state
  let damageReports: Array<{
    index: number;
    beforePhoto: any;
    afterPhoto: any;
    notes: string;
  }> = [];
  let overallConditionStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' = 'excellent';
  let finalNotes = '';
  let isSubmitting = false;

  onMount(async () => {
    // Get URL parameters
    rentalId = $page.url.searchParams.get('rentalId');
    conditionCheckId = $page.url.searchParams.get('conditionCheckId');

    // Validate required parameters
    if (!rentalId) {
      error = 'Missing rental ID';
      isLoading = false;
      return;
    }

    // Check authentication
    if (!$authStore.user) {
      showToast('error', 'Please sign in to continue');
      goto('/auth/signin');
      return;
    }

    await loadConditionChecks();
  });

  const loadConditionChecks = async () => {
    if (!rentalId) return;

    try {
      const conditionChecks = await getRentalConditionChecks(rentalId);
      
      beforeConditionCheck = conditionChecks.find(check => check.type === 'before') || null;
      afterConditionCheck = conditionChecks.find(check => check.type === 'after') || null;

      if (!beforeConditionCheck) {
        error = 'Before photos not found. Please complete the pre-pickup verification first.';
        return;
      }

      if (!afterConditionCheck) {
        error = 'After photos not found. Please complete the return verification first.';
        return;
      }

      // Determine initial condition status based on photo count matching
      if (beforeConditionCheck.photos.length === afterConditionCheck.photos.length) {
        overallConditionStatus = 'excellent';
      } else {
        overallConditionStatus = 'good';
      }

    } catch (err: any) {
      console.error('Error loading condition checks:', err);
      error = err.message || 'Failed to load condition check data';
    } finally {
      isLoading = false;
    }
  };

  const handleDamageFlag = (event: CustomEvent) => {
    const { beforePhoto, afterPhoto, index } = event.detail;
    
    // Add to damage reports if not already present
    const existingReport = damageReports.find(report => report.index === index);
    if (!existingReport) {
      damageReports = [...damageReports, {
        index,
        beforePhoto,
        afterPhoto,
        notes: ''
      }];
      
      // Update overall condition status
      if (overallConditionStatus === 'excellent') {
        overallConditionStatus = 'good';
      } else if (overallConditionStatus === 'good') {
        overallConditionStatus = 'fair';
      }
    }
  };

  const handleViewFullscreen = (event: CustomEvent) => {
    // TODO: Implement fullscreen modal
    console.log('View fullscreen:', event.detail);
  };

  const updateConditionStatus = (status: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged') => {
    overallConditionStatus = status;
  };

  const submitComparison = async () => {
    if (!afterConditionCheck || !$authStore.user) return;

    isSubmitting = true;

    try {
      // Update the after condition check with final status
      await updateConditionCheckStatus(
        afterConditionCheck.id!,
        'completed',
        `Final condition: ${overallConditionStatus}. ${finalNotes.trim()}`
      );

      // TODO: Update rental record with final condition status
      // This would typically involve calling a cloud function or service
      // to update the rental record with the comparison results

      showToast('success', 'Condition comparison completed successfully!');

      // Redirect to rental completion page for review
      goto(`/rentals/${rentalId}/complete`);

    } catch (error: any) {
      console.error('Error submitting comparison:', error);
      showToast('error', error.message || 'Failed to submit condition comparison');
    } finally {
      isSubmitting = false;
    }
  };

  // Create photo pairs for comparison
  $: photoPairs = beforeConditionCheck && afterConditionCheck 
    ? Math.min(beforeConditionCheck.photos.length, afterConditionCheck.photos.length)
    : 0;

  $: canSubmit = !isSubmitting && beforeConditionCheck && afterConditionCheck;
</script>

<svelte:head>
  <title>Condition Comparison - GearGrab</title>
  <meta name="description" content="Compare before and after photos to assess gear condition" />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-neutral-900 mb-4">
        Condition Comparison
      </h1>
      <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
        Compare the before and after photos to assess any changes in the gear's condition during the rental period.
      </p>
    </div>

    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mr-4"></div>
        <span class="text-lg text-neutral-600">Loading condition check data...</span>
      </div>
      
    {:else if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 class="text-xl font-semibold text-red-900 mb-2">Error Loading Data</h2>
        <p class="text-red-700 mb-4">{error}</p>
        <button
          on:click={() => goto('/dashboard/bookings')}
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Return to Bookings
        </button>
      </div>
      
    {:else if beforeConditionCheck && afterConditionCheck}
      <!-- Comparison Content -->
      <div class="space-y-8">
        <!-- Overall Status -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-neutral-900 mb-4">
            Overall Condition Assessment
          </h2>
          
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {#each [
              { value: 'excellent', label: 'Excellent', color: 'green' },
              { value: 'good', label: 'Good', color: 'blue' },
              { value: 'fair', label: 'Fair', color: 'yellow' },
              { value: 'poor', label: 'Poor', color: 'orange' },
              { value: 'damaged', label: 'Damaged', color: 'red' }
            ] as status}
              <button
                on:click={() => updateConditionStatus(status.value)}
                class="p-3 rounded-lg border-2 transition-all {
                  overallConditionStatus === status.value
                    ? `border-${status.color}-500 bg-${status.color}-50 text-${status.color}-900`
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }"
              >
                <div class="text-sm font-medium">{status.label}</div>
              </button>
            {/each}
          </div>

          <!-- Summary Stats -->
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="bg-neutral-50 rounded-lg p-4">
              <div class="text-2xl font-bold text-neutral-900">{photoPairs}</div>
              <div class="text-sm text-neutral-600">Photo Pairs</div>
            </div>
            <div class="bg-neutral-50 rounded-lg p-4">
              <div class="text-2xl font-bold text-red-600">{damageReports.length}</div>
              <div class="text-sm text-neutral-600">Issues Flagged</div>
            </div>
            <div class="bg-neutral-50 rounded-lg p-4">
              <div class="text-2xl font-bold text-green-600">{photoPairs - damageReports.length}</div>
              <div class="text-sm text-neutral-600">No Issues</div>
            </div>
          </div>
        </div>

        <!-- Photo Comparisons -->
        <div class="space-y-6">
          <h2 class="text-xl font-semibold text-neutral-900">
            Photo-by-Photo Comparison
          </h2>
          
          {#each Array(photoPairs) as _, index}
            {#if beforeConditionCheck.photos[index] && afterConditionCheck.photos[index]}
              <PhotoComparisonCard
                beforePhoto={beforeConditionCheck.photos[index]}
                afterPhoto={afterConditionCheck.photos[index]}
                {index}
                on:flagDamage={handleDamageFlag}
                on:viewFullscreen={handleViewFullscreen}
              />
            {/if}
          {/each}
        </div>

        <!-- Final Notes -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-neutral-900 mb-4">
            Final Assessment Notes
          </h3>
          <textarea
            bind:value={finalNotes}
            disabled={isSubmitting}
            placeholder="Add any final observations about the overall condition, rental experience, or additional notes..."
            class="w-full h-32 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 resize-none"
            maxlength="1000"
          ></textarea>
          <div class="flex justify-between items-center mt-2">
            <span class="text-sm text-neutral-500">
              {finalNotes.length}/1000 characters
            </span>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <button
            on:click={submitComparison}
            disabled={!canSubmit}
            class="w-full py-4 px-6 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {#if isSubmitting}
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Finalizing Assessment...</span>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Complete Assessment & Continue</span>
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
