<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  
  export let booking: any;
  export let required = true;
  export let showModal = false;

  const dispatch = createEventDispatcher();

  let waiverAccepted = false;
  let digitalSignature = '';
  let fullName = '';
  let agreementDate = new Date().toISOString().split('T')[0];
  let ipAddress = '';
  let error = '';
  let submitting = false;

  // Get user info
  $: currentUser = $authStore.user;
  $: if (currentUser) {
    fullName = currentUser.displayName || currentUser.email || '';
  }

  // Waiver text content
  const waiverContent = `
DIGITAL LIABILITY WAIVER AND RELEASE OF CLAIMS

READ CAREFULLY BEFORE SIGNING. THIS IS A LEGAL DOCUMENT THAT AFFECTS YOUR LEGAL RIGHTS.

ASSUMPTION OF RISK AND RELEASE OF LIABILITY

I, the undersigned participant, acknowledge that I am voluntarily participating in outdoor recreational activities through the rental of equipment via GearGrab ("the Platform"). I understand and acknowledge that:

1. INHERENT RISKS: Outdoor activities involve inherent risks including but not limited to:
   - Physical injury, illness, or death
   - Equipment failure or malfunction
   - Weather-related hazards
   - Terrain and environmental dangers
   - Actions of other participants or third parties

2. ASSUMPTION OF RISK: I voluntarily assume all risks associated with my participation in these activities, whether known or unknown, foreseen or unforeseen.

3. RELEASE OF LIABILITY: I hereby release, waive, discharge, and covenant not to sue GearGrab, its owners, operators, employees, agents, and affiliates from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury that may be sustained by me or my property while participating in activities using rented equipment.

4. EQUIPMENT RESPONSIBILITY: I acknowledge that:
   - I am responsible for inspecting all equipment before use
   - I will use equipment only for its intended purpose
   - I will follow all manufacturer guidelines and safety instructions
   - I will not use equipment beyond my skill level

5. INDEMNIFICATION: I agree to indemnify and hold harmless GearGrab from any loss or liability incurred as a result of my actions or negligence.

6. MEDICAL TREATMENT: I authorize GearGrab representatives to obtain emergency medical treatment for me if necessary.

7. BINDING AGREEMENT: This waiver is binding upon my heirs, executors, administrators, and assigns.

I HAVE READ THIS WAIVER CAREFULLY AND UNDERSTAND ITS CONTENTS. I AM AWARE THAT THIS IS A RELEASE OF LIABILITY AND A CONTRACT AND I SIGN IT OF MY OWN FREE WILL.
  `.trim();

  async function handleSubmit() {
    if (!validateForm()) return;

    submitting = true;
    error = '';

    try {
      // Get user's IP address for verification
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;

      const waiverData = {
        bookingId: booking.id,
        waiverAccepted: true,
        waiverTimestamp: new Date().toISOString(),
        digitalSignature,
        fullName,
        agreementDate,
        ipAddress,
        userAgent: navigator.userAgent,
        waiverVersion: '1.0',
        waiverContent: waiverContent
      };

      const response = await fetch(`/api/bookings/${booking.id}/waiver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(waiverData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit waiver');
      }

      const result = await response.json();
      
      dispatch('waiverAccepted', {
        waiverData: result.waiver,
        bookingId: booking.id
      });

      showModal = false;

    } catch (err) {
      console.error('Error submitting waiver:', err);
      error = err.message || 'Failed to submit waiver. Please try again.';
    } finally {
      submitting = false;
    }
  }

  function validateForm() {
    if (!waiverAccepted) {
      error = 'You must accept the liability waiver to proceed';
      return false;
    }

    if (!digitalSignature.trim()) {
      error = 'Digital signature is required';
      return false;
    }

    if (!fullName.trim()) {
      error = 'Full name is required';
      return false;
    }

    if (digitalSignature.toLowerCase() !== fullName.toLowerCase()) {
      error = 'Digital signature must match your full name exactly';
      return false;
    }

    return true;
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
      <div class="bg-red-500/20 border-b border-red-500/30 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
              <span class="text-xl">⚠️</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-white">Digital Liability Waiver</h2>
              <p class="text-red-200 text-sm">Required before booking completion</p>
            </div>
          </div>
          {#if !required}
            <button 
              on:click={handleCancel}
              class="text-white/70 hover:text-white transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Waiver Content -->
      <div class="p-6 overflow-y-auto max-h-96">
        <div class="bg-white/5 rounded-lg p-6 border border-white/10">
          <pre class="text-white text-sm leading-relaxed whitespace-pre-wrap font-mono">{waiverContent}</pre>
        </div>
      </div>

      <!-- Agreement Form -->
      <div class="border-t border-white/20 p-6 space-y-6">
        
        <!-- Full Name -->
        <div>
          <label for="fullName" class="block text-sm font-medium text-white mb-2">
            Full Legal Name *
          </label>
          <input
            id="fullName"
            type="text"
            bind:value={fullName}
            placeholder="Enter your full legal name"
            class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            required
          />
        </div>

        <!-- Digital Signature -->
        <div>
          <label for="digitalSignature" class="block text-sm font-medium text-white mb-2">
            Digital Signature *
          </label>
          <input
            id="digitalSignature"
            type="text"
            bind:value={digitalSignature}
            placeholder="Type your full name exactly as above"
            class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            required
          />
          <p class="text-gray-400 text-xs mt-1">
            By typing your name, you are providing a legally binding digital signature
          </p>
        </div>

        <!-- Agreement Date -->
        <div>
          <label for="agreementDate" class="block text-sm font-medium text-white mb-2">
            Agreement Date
          </label>
          <input
            id="agreementDate"
            type="date"
            bind:value={agreementDate}
            class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            readonly
          />
        </div>

        <!-- Acceptance Checkbox -->
        <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <label class="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={waiverAccepted}
              class="mt-1 h-5 w-5 text-green-400 bg-white/10 border-white/20 rounded focus:ring-green-400 focus:ring-2"
            />
            <div class="flex-1">
              <span class="text-white font-medium">
                I acknowledge that I have read, understood, and agree to the terms of this liability waiver
              </span>
              <p class="text-yellow-200 text-sm mt-1">
                This is a legally binding agreement. By checking this box and providing your digital signature, 
                you are waiving certain legal rights.
              </p>
            </div>
          </label>
        </div>

        <!-- Error Message -->
        {#if error}
          <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p class="text-red-300 text-sm">{error}</p>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="flex space-x-4">
          {#if !required}
            <button
              on:click={handleCancel}
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
          {/if}
          
          <button
            on:click={handleSubmit}
            disabled={!waiverAccepted || !digitalSignature.trim() || !fullName.trim() || submitting}
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {#if submitting}
              <div class="flex items-center justify-center">
                <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Submitting Waiver...
              </div>
            {:else}
              Accept Waiver & Continue
            {/if}
          </button>
        </div>

        <!-- Legal Notice -->
        <div class="text-center">
          <p class="text-gray-400 text-xs">
            This digital signature has the same legal effect as a handwritten signature. 
            Your IP address and timestamp will be recorded for verification purposes.
          </p>
        </div>

      </div>
    </div>
  </div>
{/if}
