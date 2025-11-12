<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import StepIndicator from '$lib/components/ui/step-indicator.svelte';
  import DocumentUploadStep from './steps/document-upload-step.svelte';
  import ReviewSubmissionStep from './steps/review-submission-step.svelte';
  
  export let listingId: string;
  export let gearTitle: string;
  export let gearValue: number;
  export let category: string;
  export let requirement: any;
  export let showModal = false;

  const dispatch = createEventDispatcher();

  let currentStep = 1;
  let documents: any[] = [];
  let processing = false;
  let error = '';

  $: currentUser = $authStore.user;

  // Step configuration
  const steps = [
    { 
      number: 1, 
      title: 'Upload Documents', 
      description: 'Provide proof of ownership',
      icon: '📄'
    },
    { 
      number: 2, 
      title: 'Review & Submit', 
      description: 'Confirm your submission',
      icon: '✅'
    }
  ];

  $: currentStepData = steps[currentStep - 1];
  $: canProceed = checkCanProceed();

  function checkCanProceed(): boolean {
    switch (currentStep) {
      case 1:
        return documents.length > 0 && validateDocuments().valid;
      case 2:
        return true;
      default:
        return false;
    }
  }

  function validateDocuments() {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (documents.length === 0) {
      errors.push('At least one document is required');
      return { valid: false, errors, warnings };
    }
    
    // Check for required document types based on value
    const submittedTypes = documents.map(doc => doc.type);
    const hasReceipt = submittedTypes.includes('receipt');
    const hasWarranty = submittedTypes.includes('warranty');
    const hasSerial = submittedTypes.includes('serial_number');
    
    if (gearValue >= 500) {
      if (!hasReceipt && !hasWarranty) {
        errors.push('High-value items require either a purchase receipt or warranty documentation');
      }
      
      if (!hasSerial) {
        warnings.push('Serial number photo is highly recommended for high-value items');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  function handleNext() {
    if (canProceed && currentStep < steps.length) {
      currentStep++;
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  function handleStepData(event: any) {
    const { step, data } = event.detail;
    
    if (step === 1) {
      documents = data.documents;
    }
  }

  async function handleSubmit() {
    try {
      processing = true;
      error = '';

      const submissionData = {
        listingId,
        gearTitle,
        gearValue,
        category,
        documents: documents.map(doc => ({
          id: doc.id,
          type: doc.type,
          name: doc.name,
          description: doc.description || '',
          file: doc.file,
          preview: doc.preview
        })),
        metadata: {
          userAgent: navigator.userAgent,
          ipAddress: await getUserIP()
        }
      };

      const response = await fetch('/api/ownership/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit proof of ownership');
      }

      const result = await response.json();
      
      dispatch('ownershipProofSubmitted', {
        proofId: result.proofId,
        status: result.status
      });

      showModal = false;

    } catch (err) {
      console.error('Error submitting ownership proof:', err);
      error = err.message || 'Failed to submit proof of ownership. Please try again.';
    } finally {
      processing = false;
    }
  }

  async function getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  function handleCancel() {
    dispatch('cancelled');
    showModal = false;
  }
</script>

{#if showModal}
  <!-- Modal Overlay -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      
      <!-- Header -->
      <div class="bg-blue-500/20 border-b border-blue-500/30 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
              <span class="text-xl">📋</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-white">Proof of Ownership</h2>
              <p class="text-blue-200 text-sm">
                {gearTitle} • ${gearValue.toLocaleString()}
              </p>
            </div>
          </div>
          <button 
            on:click={handleCancel}
            class="text-white/70 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Requirement Info -->
      <div class="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
        <div class="flex items-start">
          <span class="text-yellow-400 mr-3 mt-0.5">ℹ️</span>
          <div>
            <p class="text-yellow-200 font-medium">{requirement.reason}</p>
            {#if requirement.additionalInfo}
              <p class="text-yellow-300 text-sm mt-1">{requirement.additionalInfo}</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="p-6 border-b border-white/20">
        <StepIndicator {steps} {currentStep} />
      </div>

      <!-- Step Content -->
      <div class="p-6 overflow-y-auto max-h-96">
        <!-- Current Step Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">{currentStepData.icon}</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">{currentStepData.title}</h3>
          <p class="text-gray-300 text-sm">{currentStepData.description}</p>
        </div>

        <!-- Step Components -->
        {#if currentStep === 1}
          <DocumentUploadStep
            {requirement}
            {gearValue}
            {documents}
            on:stepData={handleStepData}
          />
        {:else if currentStep === 2}
          <ReviewSubmissionStep
            {gearTitle}
            {gearValue}
            {documents}
            {requirement}
            {processing}
            {error}
            on:submit={handleSubmit}
          />
        {/if}
      </div>

      <!-- Navigation -->
      {#if currentStep < 2}
        <div class="border-t border-white/20 p-6">
          <div class="flex justify-between">
            <button
              on:click={handleCancel}
              class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            <button
              on:click={handleNext}
              disabled={!canProceed}
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Continue →
            </button>
          </div>
          
          <!-- Validation Messages -->
          {#if documents.length > 0}
            {@const validation = validateDocuments()}
            {#if validation.errors.length > 0}
              <div class="mt-4 space-y-1">
                {#each validation.errors as error}
                  <p class="text-red-300 text-sm">• {error}</p>
                {/each}
              </div>
            {/if}
            {#if validation.warnings.length > 0}
              <div class="mt-2 space-y-1">
                {#each validation.warnings as warning}
                  <p class="text-yellow-300 text-sm">• {warning}</p>
                {/each}
              </div>
            {/if}
          {/if}
          
          <!-- Progress Text -->
          <div class="text-center mt-4">
            <p class="text-gray-400 text-sm">
              Step {currentStep} of {steps.length}
              {#if !canProceed}
                • Complete this step to continue
              {/if}
            </p>
          </div>
        </div>
      {/if}

    </div>
  </div>
{/if}
