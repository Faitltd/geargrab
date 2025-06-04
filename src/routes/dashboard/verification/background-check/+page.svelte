<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { verificationService, type UserVerificationStatus } from '$lib/services/verification';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let verificationStatus: UserVerificationStatus | null = null;
  let loading = true;
  let submitting = false;
  let selectedCheckType: 'basic' | 'standard' | 'comprehensive' = 'standard';
  let consentGiven = false;
  let showConsentModal = false;

  const checkTypes = {
    basic: {
      name: 'Basic Background Check',
      price: 29.99,
      duration: '1-2 business days',
      includes: [
        'Criminal history search',
        'Sex offender registry check',
        'Identity verification'
      ]
    },
    standard: {
      name: 'Standard Background Check',
      price: 49.99,
      duration: '2-3 business days',
      includes: [
        'Everything in Basic',
        'Global watchlist screening',
        'Address history verification',
        'SSN trace'
      ]
    },
    comprehensive: {
      name: 'Comprehensive Background Check',
      price: 79.99,
      duration: '3-5 business days',
      includes: [
        'Everything in Standard',
        'Motor vehicle records',
        'Professional license verification',
        'Education verification',
        'Employment history verification'
      ]
    }
  };

  onMount(async () => {
    if (!$authStore.user) {
      goto('/auth/login');
      return;
    }
    
    await loadVerificationStatus();
  });

  async function loadVerificationStatus() {
    try {
      loading = true;
      verificationStatus = await verificationService.getUserVerificationStatus($authStore.user!.uid);
    } catch (error) {
      console.error('Error loading verification status:', error);
      notifications.add({
        message: 'Error loading verification status',
        type: 'error'
      });
    } finally {
      loading = false;
    }
  }

  async function submitBackgroundCheck() {
    if (!$authStore.user || !consentGiven) return;

    try {
      submitting = true;

      // Create payment intent
      const paymentResponse = await fetch('/api/background-check/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checkType: selectedCheckType,
          provider: 'checkr' // Default provider
        })
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await paymentResponse.json();

      // For demo purposes, simulate successful payment
      // In production, you would integrate with Stripe Elements
      const mockPaymentMethodId = 'pm_card_visa'; // Mock payment method

      // Submit background check with payment
      const response = await fetch('/api/background-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checkType: selectedCheckType,
          provider: 'checkr',
          paymentMethodId: mockPaymentMethodId,
          consentData: {
            personalInfo: {
              firstName: 'Demo',
              lastName: 'User',
              email: $authStore.user.email,
              phone: '555-123-4567',
              dateOfBirth: '1990-01-01',
              ssn: 'XXX-XX-1234',
              address: {
                street: '123 Main St',
                city: 'Salt Lake City',
                state: 'UT',
                zipCode: '84101',
                country: 'US'
              }
            },
            ipAddress: '127.0.0.1',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit background check');
      }

      const result = await response.json();

      notifications.add({
        message: 'Background check request submitted successfully!',
        type: 'success'
      });

      // Refresh verification status
      await loadVerificationStatus();

      // Redirect to verification dashboard
      goto('/dashboard/verification');

    } catch (error) {
      console.error('Error submitting background check:', error);
      notifications.add({
        message: error.message || 'Error submitting background check request',
        type: 'error'
      });
    } finally {
      submitting = false;
    }
  }

  function openConsentModal() {
    showConsentModal = true;
  }

  function closeConsentModal() {
    showConsentModal = false;
  }

  function giveConsent() {
    consentGiven = true;
    closeConsentModal();
  }

  $: canSubmit = consentGiven && !submitting && verificationStatus?.backgroundCheckStatus?.status !== 'pending' && verificationStatus?.backgroundCheckStatus?.status !== 'in_progress';
</script>

<svelte:head>
  <title>Background Check - Verification - GearGrab</title>
</svelte:head>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
      <p class="text-white">Loading verification status...</p>
    </div>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Background Check Verification</h1>
          <p class="text-gray-300 mt-1">Enhance your trust level with a comprehensive background check</p>
        </div>
        <div class="text-right">
          {#if verificationStatus?.backgroundCheckStatus?.status === 'completed'}
            <div class="text-green-400 font-bold">✓ Verified</div>
            <div class="text-sm text-gray-300">Expires: {verificationStatus.backgroundCheckStatus.expiresAt ? new Date(verificationStatus.backgroundCheckStatus.expiresAt).toLocaleDateString() : 'Never'}</div>
          {:else if verificationStatus?.backgroundCheckStatus?.status === 'pending'}
            <div class="text-yellow-400 font-bold">⏳ Pending</div>
            <div class="text-sm text-gray-300">Review in progress</div>
          {:else if verificationStatus?.backgroundCheckStatus?.status === 'in_progress'}
            <div class="text-blue-400 font-bold">🔄 In Progress</div>
            <div class="text-sm text-gray-300">Processing...</div>
          {:else}
            <div class="text-gray-400 font-bold">Not Started</div>
            <div class="text-sm text-gray-300">Enhance your profile</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Current Status -->
    {#if verificationStatus?.backgroundCheckStatus?.status === 'completed'}
      <div class="bg-green-500/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
        <div class="flex items-center space-x-3">
          <div class="text-3xl">✅</div>
          <div>
            <h2 class="text-xl font-bold text-white">Background Check Complete</h2>
            <p class="text-green-200">Your background check has been completed and approved.</p>
            <div class="mt-2 text-sm text-green-300">
              Risk Level: <span class="font-medium">{verificationStatus.backgroundCheckStatus.riskLevel || 'Low'}</span> |
              Check Type: <span class="font-medium">{verificationStatus.backgroundCheckStatus.checkType || 'Standard'}</span>
            </div>
          </div>
        </div>
      </div>
    {:else if verificationStatus?.backgroundCheckStatus?.status === 'pending' || verificationStatus?.backgroundCheckStatus?.status === 'in_progress'}
      <div class="bg-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
        <div class="flex items-center space-x-3">
          <div class="text-3xl">⏳</div>
          <div>
            <h2 class="text-xl font-bold text-white">Background Check in Progress</h2>
            <p class="text-blue-200">Your background check request is being processed.</p>
            <div class="mt-2 text-sm text-blue-300">
              Check Type: <span class="font-medium">{verificationStatus.backgroundCheckStatus.checkType || 'Standard'}</span> |
              Expected completion: 2-5 business days
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Check Type Selection -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Choose Your Background Check Level</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each Object.entries(checkTypes) as [type, details]}
            <div 
              class="border-2 rounded-lg p-4 cursor-pointer transition-all {selectedCheckType === type ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5 hover:border-white/40'}"
              on:click={() => {
                if (type === 'basic' || type === 'standard' || type === 'comprehensive') {
                  selectedCheckType = type;
                }
              }}
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-bold text-white">{details.name}</h3>
                <input type="radio" bind:group={selectedCheckType} value={type} class="text-green-500" />
              </div>
              <div class="text-2xl font-bold text-green-400 mb-2">${details.price}</div>
              <div class="text-sm text-gray-300 mb-3">{details.duration}</div>
              <ul class="text-sm text-gray-300 space-y-1">
                {#each details.includes as item}
                  <li class="flex items-center">
                    <span class="text-green-400 mr-2">✓</span>
                    {item}
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </div>

      <!-- Benefits -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Why Complete a Background Check?</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="text-green-400 text-xl">🛡️</div>
              <div>
                <h3 class="font-medium text-white">Increased Trust</h3>
                <p class="text-gray-300 text-sm">Build confidence with other users and increase your booking success rate</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="text-green-400 text-xl">💰</div>
              <div>
                <h3 class="font-medium text-white">Reduced Deposits</h3>
                <p class="text-gray-300 text-sm">Lower security deposits required for high-value gear rentals</p>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="text-green-400 text-xl">⭐</div>
              <div>
                <h3 class="font-medium text-white">Priority Access</h3>
                <p class="text-gray-300 text-sm">Get priority booking access to premium gear and exclusive items</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="text-green-400 text-xl">🏆</div>
              <div>
                <h3 class="font-medium text-white">Verification Badge</h3>
                <p class="text-gray-300 text-sm">Display a verified badge on your profile to stand out</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Consent and Submit -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 class="text-xl font-bold text-white mb-4">Consent and Authorization</h2>
        
        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <input 
              type="checkbox" 
              bind:checked={consentGiven}
              class="mt-1 h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300 rounded"
            />
            <div class="text-sm text-gray-300">
              <p>I authorize GearGrab and its third-party background check providers to conduct a background check on me. I understand that this may include criminal history, identity verification, and other relevant checks as selected above.</p>
              <button 
                class="text-green-400 hover:text-green-300 underline mt-2"
                on:click={openConsentModal}
              >
                Read full consent agreement
              </button>
            </div>
          </div>

          <button
            class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
            disabled={!canSubmit}
            on:click={submitBackgroundCheck}
          >
            {#if submitting}
              <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting Request...
              </div>
            {:else}
              Submit Background Check Request - ${checkTypes[selectedCheckType].price}
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Consent Modal -->
  {#if showConsentModal}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-white">Background Check Consent Agreement</h2>
          <button 
            class="text-gray-400 hover:text-white"
            on:click={closeConsentModal}
          >
            ✕
          </button>
        </div>
        
        <div class="space-y-4 text-sm text-gray-300">
          <p><strong class="text-white">Authorization for Background Check</strong></p>
          <p>By checking the consent box and submitting this request, you authorize GearGrab, Inc. and its designated third-party background check providers to conduct a comprehensive background check on you.</p>
          
          <p><strong class="text-white">Information That May Be Obtained:</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li>Criminal history records</li>
            <li>Sex offender registry searches</li>
            <li>Global watchlist screening</li>
            <li>Identity verification</li>
            <li>Address history</li>
            <li>Motor vehicle records (if applicable)</li>
            <li>Professional license verification (if applicable)</li>
          </ul>

          <p><strong class="text-white">Your Rights:</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li>You have the right to receive a copy of your background check report</li>
            <li>You have the right to dispute any inaccurate information</li>
            <li>You will be notified if any adverse action is taken based on the results</li>
          </ul>

          <p><strong class="text-white">Data Security:</strong></p>
          <p>All background check information is securely stored and handled in compliance with applicable privacy laws and regulations.</p>
        </div>

        <div class="flex space-x-3 mt-6">
          <button
            class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            on:click={giveConsent}
          >
            I Agree and Give Consent
          </button>
          <button
            class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            on:click={closeConsentModal}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}
