<!--
  Rental Handoff Component
  Handles photo documentation for both pre-rental and post-rental phases
  Used by both owners and renters for insurance documentation
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import type { Booking, RentalPhoto } from '$lib/types/firestore';
  import PhotoUploader from './PhotoUploader.svelte';
  import PhotoGallery from './PhotoGallery.svelte';
  
  // Props
  export let booking: Booking;
  export let phase: 'pre' | 'post'; // pre-rental or post-rental
  export let userRole: 'owner' | 'renter';
  export let readonly: boolean = false;
  
  // Internal state
  let loading = false;
  let uploading = false;
  let confirmationStep = false;
  let damageReported = false;
  let damageDescription = '';
  let conditionNotes = '';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Get current photos
  $: currentPhotos = getPhotosForUser();
  $: otherPartyPhotos = getPhotosForOtherParty();
  $: isConfirmed = getUserConfirmationStatus();
  $: otherPartyConfirmed = getOtherPartyConfirmationStatus();
  $: allPhotosUploaded = currentPhotos.length >= getMinimumPhotoCount();
  
  function getPhotosForUser(): RentalPhoto[] {
    const phaseData = booking.photoDocumentation?.[`${phase}Rental`];
    if (!phaseData) return [];
    return phaseData[`${userRole}Photos`] || [];
  }
  
  function getPhotosForOtherParty(): RentalPhoto[] {
    const phaseData = booking.photoDocumentation?.[`${phase}Rental`];
    if (!phaseData) return [];
    const otherRole = userRole === 'owner' ? 'renter' : 'owner';
    return phaseData[`${otherRole}Photos`] || [];
  }
  
  function getUserConfirmationStatus(): boolean {
    const phaseData = booking.photoDocumentation?.[`${phase}Rental`];
    return phaseData?.[`${userRole}Confirmed`] || false;
  }
  
  function getOtherPartyConfirmationStatus(): boolean {
    const phaseData = booking.photoDocumentation?.[`${phase}Rental`];
    const otherRole = userRole === 'owner' ? 'renter' : 'owner';
    return phaseData?.[`${otherRole}Confirmed`] || false;
  }
  
  function getMinimumPhotoCount(): number {
    // Require minimum photos based on phase and role
    if (phase === 'pre') {
      return 3; // Overall condition, serial numbers, accessories
    } else {
      return damageReported ? 5 : 3; // More photos if damage reported
    }
  }
  
  function getPhaseTitle(): string {
    if (phase === 'pre') {
      return userRole === 'owner' ? 'Pre-Rental Handoff' : 'Pre-Rental Inspection';
    } else {
      return userRole === 'owner' ? 'Post-Rental Return' : 'Post-Rental Handoff';
    }
  }
  
  function getPhaseDescription(): string {
    if (phase === 'pre') {
      return userRole === 'owner' 
        ? 'Document the condition of your gear before handing it over to the renter.'
        : 'Inspect and document the condition of the gear you\'re receiving.';
    } else {
      return userRole === 'owner'
        ? 'Document the condition of your gear upon return from the renter.'
        : 'Document the condition of the gear you\'re returning to the owner.';
    }
  }
  
  async function handlePhotoUploaded(event: CustomEvent) {
    const { photo } = event.detail;
    
    // Refresh booking data to get updated photos
    dispatch('refresh');
  }
  
  async function confirmHandoff() {
    if (!$authStore.user) return;
    
    loading = true;
    try {
      const response = await fetch(`/api/bookings/${booking.id}/confirm-handoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase,
          userRole,
          conditionNotes: conditionNotes.trim() || undefined,
          damageReported: phase === 'post' ? damageReported : undefined,
          damageDescription: phase === 'post' && damageReported ? damageDescription.trim() : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm handoff');
      }
      
      dispatch('confirmed', { phase, userRole });
      
    } catch (error) {
      console.error('Error confirming handoff:', error);
      alert('Failed to confirm handoff. Please try again.');
    } finally {
      loading = false;
    }
  }
  
  function proceedToConfirmation() {
    if (currentPhotos.length < getMinimumPhotoCount()) {
      alert(`Please upload at least ${getMinimumPhotoCount()} photos before proceeding.`);
      return;
    }
    confirmationStep = true;
  }
  
  function goBackToPhotos() {
    confirmationStep = false;
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
  <!-- Header -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-xl font-bold text-white">{getPhaseTitle()}</h2>
      {#if isConfirmed}
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
          ✓ Confirmed
        </span>
      {:else if readonly}
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
          View Only
        </span>
      {/if}
    </div>
    <p class="text-gray-300 text-sm">{getPhaseDescription()}</p>
  </div>

  {#if !confirmationStep}
    <!-- Photo Upload Section -->
    <div class="space-y-6">
      <!-- Your Photos -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-3">
          Your Photos ({currentPhotos.length}/{getMinimumPhotoCount()} minimum)
        </h3>
        
        {#if !readonly && !isConfirmed}
          <PhotoUploader
            {booking}
            {phase}
            {userRole}
            on:uploaded={handlePhotoUploaded}
            bind:uploading
          />
        {/if}
        
        {#if currentPhotos.length > 0}
          <PhotoGallery photos={currentPhotos} editable={!readonly && !isConfirmed} />
        {:else}
          <div class="text-center py-8 text-gray-400">
            <p>No photos uploaded yet</p>
            {#if !readonly && !isConfirmed}
              <p class="text-sm mt-1">Upload photos to document the gear condition</p>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Other Party's Photos -->
      {#if otherPartyPhotos.length > 0}
        <div>
          <h3 class="text-lg font-semibold text-white mb-3">
            {userRole === 'owner' ? 'Renter\'s' : 'Owner\'s'} Photos
            {#if otherPartyConfirmed}
              <span class="text-green-300 text-sm ml-2">✓ Confirmed</span>
            {/if}
          </h3>
          <PhotoGallery photos={otherPartyPhotos} editable={false} />
        </div>
      {/if}

      <!-- Action Buttons -->
      {#if !readonly && !isConfirmed}
        <div class="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <button
            type="button"
            on:click={proceedToConfirmation}
            disabled={!allPhotosUploaded || uploading}
            class="bg-green-600/80 hover:bg-green-600/90 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg backdrop-blur-sm border border-green-500/50 transition-all duration-200"
          >
            {#if uploading}
              Uploading...
            {:else}
              Proceed to Confirmation
            {/if}
          </button>
        </div>
      {/if}
    </div>

  {:else}
    <!-- Confirmation Step -->
    <div class="space-y-6">
      <div class="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 class="text-lg font-semibold text-white mb-3">Confirm Handoff</h3>
        <p class="text-gray-300 text-sm mb-4">
          Please review the photos and confirm the condition of the gear.
        </p>

        <!-- Condition Notes -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-white mb-2">
            Condition Notes (Optional)
          </label>
          <textarea
            bind:value={conditionNotes}
            placeholder="Add any notes about the gear condition..."
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
            rows="3"
          ></textarea>
        </div>

        <!-- Damage Reporting (Post-rental only) -->
        {#if phase === 'post'}
          <div class="mb-4">
            <label class="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                bind:checked={damageReported}
                class="rounded border-white/20 bg-white/10 text-green-600 focus:ring-green-500/50"
              />
              <span class="text-sm">Report damage or issues</span>
            </label>
            
            {#if damageReported}
              <div class="mt-3">
                <label class="block text-sm font-medium text-white mb-2">
                  Damage Description *
                </label>
                <textarea
                  bind:value={damageDescription}
                  placeholder="Describe the damage or issues in detail..."
                  class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
                  rows="3"
                  required
                ></textarea>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Photo Summary -->
        <div class="mb-6">
          <p class="text-sm text-gray-300">
            You have uploaded <strong>{currentPhotos.length}</strong> photos for this handoff.
          </p>
        </div>
      </div>

      <!-- Confirmation Buttons -->
      <div class="flex justify-between">
        <button
          type="button"
          on:click={goBackToPhotos}
          class="bg-gray-600/80 hover:bg-gray-600/90 text-white px-6 py-2 rounded-lg backdrop-blur-sm border border-gray-500/50 transition-all duration-200"
        >
          Back to Photos
        </button>
        
        <button
          type="button"
          on:click={confirmHandoff}
          disabled={loading || (damageReported && !damageDescription.trim())}
          class="bg-green-600/80 hover:bg-green-600/90 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg backdrop-blur-sm border border-green-500/50 transition-all duration-200"
        >
          {#if loading}
            Confirming...
          {:else}
            Confirm Handoff
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
