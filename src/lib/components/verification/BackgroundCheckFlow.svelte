<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { verificationService } from '$lib/services/verification';
  import { backgroundCheckService, type BackgroundCheckProvider } from '$lib/services/backgroundCheck';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  
  export let currentStep: 'consent' | 'provider' | 'payment' | 'processing' | 'complete' = 'consent';
  export let selectedProvider: BackgroundCheckProvider['id'] = 'checkr';
  export let selectedCheckType: 'basic' | 'standard' | 'comprehensive' = 'standard';
  
  const dispatch = createEventDispatcher();
  
  let consentGiven = false;
  let isSubmitting = false;
  let error = '';
  let requestId = '';
  
  $: config = backgroundCheckService.getConfig();
  $: providers = config.providers;
  $: selectedProviderConfig = providers.find(p => p.id === selectedProvider);
  $: estimatedCost = selectedProviderConfig?.pricing[selectedCheckType] || 0;
  $: turnaroundTime = selectedProviderConfig?.turnaroundTime[selectedCheckType] || 'Unknown';
  
  // Handle consent submission
  async function handleConsentSubmit() {
    if (!consentGiven) {
      error = 'You must give consent to proceed with the background check.';
      return;
    }
    
    try {
      isSubmitting = true;
      error = '';
      
      // Record consent
      await backgroundCheckService.recordConsent(
        $authStore.user?.uid || '',
        '127.0.0.1', // In real app, get actual IP
        navigator.userAgent
      );
      
      currentStep = 'provider';
    } catch (err) {
      error = 'Failed to record consent. Please try again.';
      console.error('Consent error:', err);
    } finally {
      isSubmitting = false;
    }
  }
  
  // Handle provider selection
  function handleProviderSelect() {
    currentStep = 'payment';
  }
  
  // Handle payment and background check submission
  async function handleSubmitBackgroundCheck() {
    if (!$authStore.user?.uid) {
      error = 'You must be logged in to submit a background check.';
      return;
    }
    
    try {
      isSubmitting = true;
      error = '';
      
      // Submit background check request
      requestId = await verificationService.submitBackgroundCheck(
        $authStore.user.uid,
        selectedCheckType,
        selectedProvider
      );
      
      currentStep = 'processing';
      
      // Dispatch event to parent component
      dispatch('submitted', { requestId, provider: selectedProvider, checkType: selectedCheckType });
      
    } catch (err) {
      error = 'Failed to submit background check. Please try again.';
      console.error('Background check submission error:', err);
    } finally {
      isSubmitting = false;
    }
  }
  
  // Handle step navigation
  function goBack() {
    switch (currentStep) {
      case 'provider':
        currentStep = 'consent';
        break;
      case 'payment':
        currentStep = 'provider';
        break;
    }
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
  
  <!-- Progress Indicator -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full {currentStep === 'consent' ? 'bg-blue-600' : 'bg-green-600'} flex items-center justify-center text-white text-sm font-medium">
            {currentStep === 'consent' ? '1' : '✓'}
          </div>
          <span class="ml-2 text-white text-sm">Consent</span>
        </div>
        
        <div class="w-8 h-0.5 bg-gray-600"></div>
        
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full {['provider', 'payment', 'processing', 'complete'].includes(currentStep) ? (currentStep === 'provider' ? 'bg-blue-600' : 'bg-green-600') : 'bg-gray-600'} flex items-center justify-center text-white text-sm font-medium">
            {['provider', 'payment', 'processing', 'complete'].includes(currentStep) ? (currentStep === 'provider' ? '2' : '✓') : '2'}
          </div>
          <span class="ml-2 text-white text-sm">Provider</span>
        </div>
        
        <div class="w-8 h-0.5 bg-gray-600"></div>
        
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full {['payment', 'processing', 'complete'].includes(currentStep) ? (currentStep === 'payment' ? 'bg-blue-600' : 'bg-green-600') : 'bg-gray-600'} flex items-center justify-center text-white text-sm font-medium">
            {['payment', 'processing', 'complete'].includes(currentStep) ? (currentStep === 'payment' ? '3' : '✓') : '3'}
          </div>
          <span class="ml-2 text-white text-sm">Payment</span>
        </div>
        
        <div class="w-8 h-0.5 bg-gray-600"></div>
        
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full {['processing', 'complete'].includes(currentStep) ? (currentStep === 'processing' ? 'bg-blue-600' : 'bg-green-600') : 'bg-gray-600'} flex items-center justify-center text-white text-sm font-medium">
            {['processing', 'complete'].includes(currentStep) ? (currentStep === 'processing' ? '4' : '✓') : '4'}
          </div>
          <span class="ml-2 text-white text-sm">Complete</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
      <p class="text-red-200">{error}</p>
    </div>
  {/if}

  <!-- Step Content -->
  {#if currentStep === 'consent'}
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-4">Background Check Consent</h2>
        <p class="text-gray-300 mb-6">
          To maintain the highest level of safety and trust on our platform, we require all users 
          to complete a background check. This helps protect our community and ensures a secure 
          rental experience for everyone.
        </p>
      </div>

      <div class="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 class="text-lg font-semibold text-white mb-3">What we check:</h3>
        <ul class="space-y-2 text-gray-300">
          <li class="flex items-center">
            <svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Criminal history records
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Sex offender registry
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Global watchlist screening
          </li>
          <li class="flex items-center">
            <svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            Identity verification
          </li>
        </ul>
      </div>

      <div class="space-y-4">
        <Checkbox
          bind:checked={consentGiven}
          labelClass="text-gray-300 text-sm"
          wrapperClass="items-start"
        >
          <span class="text-gray-300 text-sm">
            I authorize GearGrab and its designated agents to conduct a comprehensive background check.
            I understand that this information will be used to verify my identity and assess my eligibility
            to participate in the platform. I have read and agree to the background check consent terms.
          </span>
        </Checkbox>
      </div>

      <div class="flex justify-end">
        <button
          on:click={handleConsentSubmit}
          disabled={!consentGiven || isSubmitting}
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Processing...' : 'Continue'}
        </button>
      </div>
    </div>
  {/if}

  {#if currentStep === 'provider'}
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-4">Select Background Check Provider</h2>
        <p class="text-gray-300 mb-6">
          Choose your preferred background check provider and level of screening.
        </p>
      </div>

      <!-- Check Type Selection -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-white">Check Type</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each ['basic', 'standard', 'comprehensive'] as checkType}
            <label class="cursor-pointer">
              <input 
                type="radio" 
                bind:group={selectedCheckType} 
                value={checkType}
                class="sr-only"
              />
              <div class="border-2 {selectedCheckType === checkType ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 bg-white/5'} rounded-lg p-4 transition-all">
                <div class="text-white font-semibold capitalize mb-2">{checkType}</div>
                <div class="text-gray-300 text-sm mb-3">
                  {#if checkType === 'basic'}
                    Criminal history and identity verification
                  {:else if checkType === 'standard'}
                    Criminal history, sex offender registry, identity verification
                  {:else}
                    Comprehensive screening including all checks and motor vehicle records
                  {/if}
                </div>
                <div class="text-green-400 font-semibold">
                  ${selectedProviderConfig?.pricing[checkType] || 0}
                </div>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Provider Selection -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-white">Provider</h3>
        <div class="space-y-3">
          {#each providers as provider}
            <label class="cursor-pointer block">
              <input 
                type="radio" 
                bind:group={selectedProvider} 
                value={provider.id}
                class="sr-only"
              />
              <div class="border-2 {selectedProvider === provider.id ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 bg-white/5'} rounded-lg p-4 transition-all">
                <div class="flex justify-between items-start mb-2">
                  <div class="text-white font-semibold">{provider.name}</div>
                  <div class="text-gray-300 text-sm">{provider.turnaroundTime[selectedCheckType]}</div>
                </div>
                <div class="text-gray-300 text-sm mb-3">{provider.description}</div>
                <div class="text-green-400 font-semibold">${provider.pricing[selectedCheckType]}</div>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <div class="flex justify-between">
        <button
          on:click={goBack}
          class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          on:click={handleProviderSelect}
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  {/if}

  {#if currentStep === 'payment'}
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-4">Payment & Confirmation</h2>
        <p class="text-gray-300 mb-6">
          Review your background check details and complete payment.
        </p>
      </div>

      <!-- Order Summary -->
      <div class="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 class="text-lg font-semibold text-white mb-4">Order Summary</h3>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-300">Provider:</span>
            <span class="text-white">{selectedProviderConfig?.name}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Check Type:</span>
            <span class="text-white capitalize">{selectedCheckType}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-300">Estimated Time:</span>
            <span class="text-white">{turnaroundTime}</span>
          </div>
          <div class="border-t border-white/20 pt-3">
            <div class="flex justify-between">
              <span class="text-white font-semibold">Total:</span>
              <span class="text-green-400 font-semibold">${estimatedCost}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between">
        <button
          on:click={goBack}
          class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          on:click={handleSubmitBackgroundCheck}
          disabled={isSubmitting}
          class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Processing...' : `Pay $${estimatedCost} & Submit`}
        </button>
      </div>
    </div>
  {/if}

  {#if currentStep === 'processing'}
    <div class="text-center space-y-6">
      <div class="w-16 h-16 mx-auto">
        <svg class="animate-spin w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <div>
        <h2 class="text-2xl font-bold text-white mb-4">Background Check Submitted</h2>
        <p class="text-gray-300 mb-4">
          Your background check has been submitted to {selectedProviderConfig?.name}. 
          You will receive an email notification when the results are ready.
        </p>
        <p class="text-gray-400 text-sm">
          Estimated completion time: {turnaroundTime}
        </p>
        <p class="text-gray-400 text-sm">
          Request ID: {requestId}
        </p>
      </div>

      <div class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <p class="text-blue-200 text-sm">
          <strong>What happens next?</strong><br>
          1. Our partner will process your background check<br>
          2. You'll receive email updates on the progress<br>
          3. Once complete, your verification status will be updated<br>
          4. You'll gain access to premium features and reduced security deposits
        </p>
      </div>
    </div>
  {/if}
</div>
