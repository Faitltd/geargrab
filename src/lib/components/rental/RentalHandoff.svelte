<!--
  Rental Handoff Component
  Handles comprehensive condition documentation for both pre-rental and post-rental phases
  Uses the new condition report system with detailed photo categorization
-->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import type { Booking } from '$lib/types/firestore';
  import type { GearConditionReport } from '$lib/types/gear-condition';
  import ConditionReport from '../condition/ConditionReport.svelte';
  import { getConditionReportsForBooking } from '$lib/services/condition-photos';

  // Props
  export let booking: Booking;
  export let phase: 'pickup' | 'return'; // pickup or return
  export let userRole: 'owner' | 'renter';
  export let readonly: boolean = false;

  // Internal state
  let conditionReports: GearConditionReport[] = [];
  let currentReport: GearConditionReport | null = null;
  let showConditionReport = false;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  onMount(async () => {
    await loadConditionReports();
  });

  async function loadConditionReports() {
    try {
      conditionReports = await getConditionReportsForBooking(booking.id);
      currentReport = conditionReports.find(report =>
        report.reportType === phase &&
        report.createdBy === $authStore.user?.uid
      ) || null;
    } catch (error) {
      console.error('Error loading condition reports:', error);
    }
  }

  // Get current status
  $: isConfirmed = currentReport?.status === 'completed';
  $: hasReport = currentReport !== null;
  $: otherPartyReport = conditionReports.find(report =>
    report.reportType === phase &&
    report.createdBy !== $authStore.user?.uid
  );
  $: otherPartyConfirmed = otherPartyReport?.status === 'completed';
  
  function getPhaseTitle(): string {
    if (phase === 'pickup') {
      return userRole === 'owner' ? 'Gear Pickup Handoff' : 'Gear Pickup Inspection';
    } else {
      return userRole === 'owner' ? 'Gear Return Inspection' : 'Gear Return Handoff';
    }
  }

  function getPhaseDescription(): string {
    if (phase === 'pickup') {
      return userRole === 'owner'
        ? 'Document the condition of your gear before handing it over to the renter.'
        : 'Inspect and document the condition of the gear you\'re receiving.';
    } else {
      return userRole === 'owner'
        ? 'Document the condition of your gear upon return from the renter.'
        : 'Document the condition of the gear you\'re returning to the owner.';
    }
  }

  function startConditionReport() {
    showConditionReport = true;
  }

  function handleReportConfirmed(event: CustomEvent) {
    const { reportId } = event.detail;
    console.log('Condition report confirmed:', reportId);

    // Reload reports to get updated status
    loadConditionReports();

    // Close the condition report
    showConditionReport = false;

    // Notify parent component
    dispatch('confirmed', { phase, userRole, reportId });
  }

  function viewOtherPartyReport() {
    if (otherPartyReport) {
      // Navigate to view the other party's report
      dispatch('viewReport', { reportId: otherPartyReport.id });
    }
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

  {#if showConditionReport}
    <!-- Condition Report Interface -->
    <ConditionReport
      bookingId={booking.id}
      listingId={booking.listingId}
      reportType={phase}
      {userRole}
      existingReportId={currentReport?.id}
      on:confirmed={handleReportConfirmed}
    />
  {:else}
    <!-- Status Overview -->
    <div class="space-y-6">
      <!-- Current Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Your Status -->
        <div class="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 class="text-lg font-semibold text-white mb-3">Your Status</h3>
          {#if isConfirmed}
            <div class="flex items-center text-green-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Condition report completed
            </div>
            <p class="text-gray-400 text-sm mt-2">
              You have documented the gear condition and confirmed the handoff.
            </p>
          {:else if hasReport}
            <div class="flex items-center text-yellow-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Condition report in progress
            </div>
            <p class="text-gray-400 text-sm mt-2">
              Continue documenting the gear condition.
            </p>
          {:else}
            <div class="flex items-center text-gray-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Condition report not started
            </div>
            <p class="text-gray-400 text-sm mt-2">
              Start documenting the gear condition with photos and notes.
            </p>
          {/if}
        </div>

        <!-- Other Party Status -->
        <div class="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 class="text-lg font-semibold text-white mb-3">
            {userRole === 'owner' ? 'Renter\'s' : 'Owner\'s'} Status
          </h3>
          {#if otherPartyConfirmed}
            <div class="flex items-center text-green-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Condition report completed
            </div>
            <p class="text-gray-400 text-sm mt-2">
              They have completed their condition documentation.
            </p>
            {#if otherPartyReport}
              <button
                type="button"
                on:click={viewOtherPartyReport}
                class="mt-3 text-blue-400 hover:text-blue-300 text-sm underline"
              >
                View their report
              </button>
            {/if}
          {:else if otherPartyReport}
            <div class="flex items-center text-yellow-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Condition report in progress
            </div>
            <p class="text-gray-400 text-sm mt-2">
              They are currently documenting the gear condition.
            </p>
          {:else}
            <div class="flex items-center text-gray-300">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Waiting for their report
            </div>
            <p class="text-gray-400 text-sm mt-2">
              They haven't started their condition documentation yet.
            </p>
          {/if}
        </div>
      </div>

      <!-- Action Buttons -->
      {#if !readonly && !isConfirmed}
        <div class="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <button
            type="button"
            on:click={startConditionReport}
            class="bg-green-600/80 hover:bg-green-600/90 text-white px-6 py-2 rounded-lg backdrop-blur-sm border border-green-500/50 transition-all duration-200"
          >
            {#if hasReport}
              Continue Condition Report
            {:else}
              Start Condition Report
            {/if}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
