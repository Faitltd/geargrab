<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import PhotoUploader from './photo-uploader.svelte';
  // import DamageReporter from './DamageReporter.svelte';
  import { 
    createConditionReport, 
    updateConditionReport, 
    getConditionReport,
    confirmConditionReport 
  } from '$lib/services/condition-photos';
  import type { GearConditionReport, ConditionPhotoRequirements } from '$lib/types/gear-condition';
  
  export let bookingId: string;
  export let listingId: string;
  export let reportType: 'pickup' | 'return';
  export let userRole: 'owner' | 'renter';
  export let existingReportId: string | null = null;
  
  const dispatch = createEventDispatcher();
  
  let report: GearConditionReport | null = null;
  let loading = true;
  let saving = false;
  let currentStep = 'photos';
  let overallCondition: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  let conditionNotes = '';
  let confirmationSignature = '';
  let confirmationNotes = '';

  const photoRequirements: ConditionPhotoRequirements = {
    overview: {
      required: true,
      minPhotos: 3,
      maxPhotos: 8,
      description: 'Overall condition of the gear from multiple angles'
    },
    damage: {
      required: false,
      minPhotos: 0,
      maxPhotos: 10,
      description: 'Any existing damage, scratches, or wear'
    },
    wear: {
      required: false,
      minPhotos: 0,
      maxPhotos: 5,
      description: 'Normal wear and tear areas'
    },
    serialNumber: {
      required: true,
      minPhotos: 1,
      maxPhotos: 2,
      description: 'Serial numbers, model numbers, or identifying marks'
    },
    accessories: {
      required: false,
      minPhotos: 0,
      maxPhotos: 5,
      description: 'Included accessories, cases, or additional items'
    },
    custom: {
      required: false,
      minPhotos: 0,
      maxPhotos: 5,
      description: 'Additional photos as needed'
    }
  };

  onMount(async () => {
    await loadOrCreateReport();
  });

  async function loadOrCreateReport() {
    try {
      if (existingReportId) {
        report = await getConditionReport(existingReportId);
        if (report) {
          overallCondition = report.overallCondition;
          conditionNotes = report.conditionNotes;
        }
      }

      if (!report && $authStore.user) {
        const reportId = await createConditionReport(
          bookingId,
          listingId,
          reportType,
          $authStore.user.uid
        );
        report = await getConditionReport(reportId);
      }
    } catch (error) {
      console.error('Error loading/creating condition report:', error);
    } finally {
      loading = false;
    }
  }

  async function handlePhotoUploaded(event: CustomEvent, photoType: string) {
    if (!report) return;

    const { photo } = event.detail;
    
    // Add photo to the appropriate category
    const updatedPhotos = {
      ...report.photos,
      [photoType]: [...report.photos[photoType], photo]
    };

    await updateConditionReport(report.id, { photos: updatedPhotos });
    
    // Update local state
    report = { ...report, photos: updatedPhotos };
  }

  async function saveConditionAssessment() {
    if (!report) return;

    saving = true;
    try {
      await updateConditionReport(report.id, {
        overallCondition,
        conditionNotes
      });

      report = { ...report, overallCondition, conditionNotes };
      currentStep = 'review';
    } catch (error) {
      console.error('Error saving condition assessment:', error);
    } finally {
      saving = false;
    }
  }

  async function confirmReport() {
    if (!report) return;

    saving = true;
    try {
      await confirmConditionReport(
        report.id,
        userRole,
        confirmationSignature,
        confirmationNotes
      );

      dispatch('confirmed', { reportId: report.id });
    } catch (error) {
      console.error('Error confirming report:', error);
    } finally {
      saving = false;
    }
  }

  function getPhotoCount(photoType: string): number {
    return report?.photos[photoType]?.length || 0;
  }

  function isPhotoRequirementMet(photoType: string): boolean {
    const requirement = photoRequirements[photoType];
    const count = getPhotoCount(photoType);
    return !requirement.required || count >= requirement.minPhotos;
  }

  function canProceedToAssessment(): boolean {
    return Object.keys(photoRequirements).every(photoType => 
      isPhotoRequirementMet(photoType)
    );
  }

  $: stepTitle = reportType === 'pickup' ? 'Pickup Condition Report' : 'Return Condition Report';
</script>

{#if loading}
  <div class="flex items-center justify-center p-8">
    <div class="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
    <span class="ml-3 text-gray-300">Loading condition report...</span>
  </div>
{:else if report}
  <div class="condition-report">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">{stepTitle}</h2>
      <p class="text-gray-300">
        Document the gear condition {reportType === 'pickup' ? 'before rental' : 'after return'}
      </p>
    </div>

    <!-- Progress Steps -->
    <div class="flex items-center justify-center mb-8">
      <div class="flex items-center space-x-4">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full {currentStep === 'photos' ? 'bg-green-500' : 'bg-green-500'} flex items-center justify-center">
            <span class="text-white text-sm font-medium">1</span>
          </div>
          <span class="ml-2 text-sm {currentStep === 'photos' ? 'text-white' : 'text-gray-300'}">Photos</span>
        </div>
        
        <div class="w-8 h-0.5 {currentStep === 'assessment' || currentStep === 'review' ? 'bg-green-500' : 'bg-gray-600'}"></div>
        
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full {currentStep === 'assessment' ? 'bg-green-500' : currentStep === 'review' ? 'bg-green-500' : 'bg-gray-600'} flex items-center justify-center">
            <span class="text-white text-sm font-medium">2</span>
          </div>
          <span class="ml-2 text-sm {currentStep === 'assessment' || currentStep === 'review' ? 'text-white' : 'text-gray-300'}">Assessment</span>
        </div>

        <div class="w-8 h-0.5 {currentStep === 'review' ? 'bg-green-500' : 'bg-gray-600'}"></div>
        
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full {currentStep === 'review' ? 'bg-green-500' : 'bg-gray-600'} flex items-center justify-center">
            <span class="text-white text-sm font-medium">3</span>
          </div>
          <span class="ml-2 text-sm {currentStep === 'review' ? 'text-white' : 'text-gray-300'}">Review</span>
        </div>
      </div>
    </div>

    {#if currentStep === 'photos'}
      <!-- Photo Upload Step -->
      <div class="space-y-6">
        {#each Object.entries(photoRequirements) as [photoType, requirement]}
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-white capitalize">
                  {photoType.replace(/([A-Z])/g, ' $1').trim()} Photos
                  {#if requirement.required}
                    <span class="text-red-400">*</span>
                  {/if}
                </h3>
                <p class="text-gray-300 text-sm">{requirement.description}</p>
                <p class="text-gray-400 text-xs mt-1">
                  {requirement.minPhotos}-{requirement.maxPhotos} photos
                  ({getPhotoCount(photoType)} uploaded)
                </p>
              </div>
              <div class="flex items-center">
                {#if isPhotoRequirementMet(photoType)}
                  <span class="text-green-400">✅</span>
                {:else}
                  <span class="text-yellow-400">⚠️</span>
                {/if}
              </div>
            </div>

            <PhotoUploader
              {bookingId}
              {photoType}
              uploadedBy={$authStore.user?.uid || ''}
              {userRole}
              maxFiles={requirement.maxPhotos}
              on:uploaded={(e) => handlePhotoUploaded(e, photoType)}
              on:error={(e) => console.error('Upload error:', e.detail)}
            />
          </div>
        {/each}

        <!-- Next Button -->
        <div class="flex justify-end">
          <button
            type="button"
            on:click={() => currentStep = 'assessment'}
            disabled={!canProceedToAssessment()}
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Continue to Assessment
          </button>
        </div>
      </div>

    {:else if currentStep === 'assessment'}
      <!-- Condition Assessment Step -->
      <div class="space-y-6">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Overall Condition</h3>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {#each ['excellent', 'good', 'fair', 'poor'] as condition}
              <label class="condition-option">
                <input
                  type="radio"
                  bind:group={overallCondition}
                  value={condition}
                  class="sr-only"
                />
                <div class="condition-card {overallCondition === condition ? 'selected' : ''}">
                  <span class="condition-label">{condition.charAt(0).toUpperCase() + condition.slice(1)}</span>
                </div>
              </label>
            {/each}
          </div>

          <div>
            <label for="condition-notes" class="block text-sm font-medium text-gray-300 mb-2">
              Condition Notes
            </label>
            <textarea
              id="condition-notes"
              bind:value={conditionNotes}
              rows="4"
              placeholder="Describe the overall condition, any notable wear, or specific observations..."
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            ></textarea>
          </div>
        </div>

        <!-- Damage Reporter -->
        <!-- <DamageReporter
          reportId={report.id}
          on:damageAdded={() => loadOrCreateReport()}
        /> -->

        <!-- Navigation -->
        <div class="flex justify-between">
          <button
            type="button"
            on:click={() => currentStep = 'photos'}
            class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Back to Photos
          </button>
          
          <button
            type="button"
            on:click={saveConditionAssessment}
            disabled={saving}
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {#if saving}
              Saving...
            {:else}
              Continue to Review
            {/if}
          </button>
        </div>
      </div>

    {:else if currentStep === 'review'}
      <!-- Review and Confirmation Step -->
      <div class="space-y-6">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Review & Confirmation</h3>
          
          <div class="space-y-4">
            <div>
              <span class="text-gray-300">Overall Condition:</span>
              <span class="text-white font-medium ml-2 capitalize">{overallCondition}</span>
            </div>
            
            {#if conditionNotes}
              <div>
                <span class="text-gray-300">Notes:</span>
                <p class="text-white mt-1">{conditionNotes}</p>
              </div>
            {/if}

            <div>
              <span class="text-gray-300">Photos Uploaded:</span>
              <div class="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {#each Object.entries(report.photos) as [photoType, photos]}
                  {#if photos.length > 0}
                    <div class="text-white">
                      {photoType}: {photos.length}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Confirmation -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h4 class="text-lg font-semibold text-white mb-4">Confirmation</h4>
          
          <div class="space-y-4">
            <div>
              <label for="signature" class="block text-sm font-medium text-gray-300 mb-2">
                Digital Signature (Type your full name)
              </label>
              <input
                id="signature"
                type="text"
                bind:value={confirmationSignature}
                placeholder="Your full name"
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label for="confirmation-notes" class="block text-sm font-medium text-gray-300 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="confirmation-notes"
                bind:value={confirmationNotes}
                rows="3"
                placeholder="Any additional comments or concerns..."
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Final Actions -->
        <div class="flex justify-between">
          <button
            type="button"
            on:click={() => currentStep = 'assessment'}
            class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Back to Assessment
          </button>
          
          <button
            type="button"
            on:click={confirmReport}
            disabled={saving || !confirmationSignature}
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {#if saving}
              Confirming...
            {:else}
              Confirm Report
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="text-center p-8">
    <p class="text-red-400">Failed to load condition report</p>
  </div>
{/if}

<style>
  .condition-option {
    cursor: pointer;
  }

  .condition-card {
    padding: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    text-align: center;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.05);
  }

  .condition-card:hover {
    border-color: rgba(16, 185, 129, 0.5);
    background: rgba(16, 185, 129, 0.1);
  }

  .condition-card.selected {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.2);
  }

  .condition-label {
    font-weight: 500;
    color: #ffffff;
  }
</style>
