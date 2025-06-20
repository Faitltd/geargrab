<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { addDamageToReport } from '$lib/services/condition-photos';
  import type { GearDamage } from '$lib/types/gear-condition';
  
  export let reportId: string;
  
  const dispatch = createEventDispatcher();
  
  let showDamageForm = false;
  let saving = false;
  let newDamage: Omit<GearDamage, 'id'> = {
    type: 'scratch',
    severity: 'minor',
    description: '',
    photos: [],
    estimatedCost: 0,
    repairRequired: false,
    discoveredBy: 'owner',
    discoveredAt: new Date()
  };

  const damageTypes = [
    { value: 'scratch', label: 'Scratch' },
    { value: 'dent', label: 'Dent' },
    { value: 'tear', label: 'Tear' },
    { value: 'stain', label: 'Stain' },
    { value: 'missing_part', label: 'Missing Part' },
    { value: 'malfunction', label: 'Malfunction' },
    { value: 'other', label: 'Other' }
  ];

  const severityLevels = [
    { value: 'minor', label: 'Minor', color: 'text-yellow-400' },
    { value: 'moderate', label: 'Moderate', color: 'text-orange-400' },
    { value: 'major', label: 'Major', color: 'text-red-400' }
  ];

  async function submitDamage() {
    if (!newDamage.description.trim()) return;

    saving = true;
    try {
      const damageId = await addDamageToReport(reportId, newDamage);
      
      dispatch('damageAdded', { damageId });
      
      // Reset form
      resetForm();
      showDamageForm = false;
      
    } catch (error) {
      console.error('Error adding damage:', error);
    } finally {
      saving = false;
    }
  }

  function resetForm() {
    newDamage = {
      type: 'scratch',
      severity: 'minor',
      description: '',
      photos: [],
      estimatedCost: 0,
      repairRequired: false,
      discoveredBy: 'owner',
      discoveredAt: new Date()
    };
  }

  function cancelDamage() {
    resetForm();
    showDamageForm = false;
  }
</script>

<div class="damage-reporter">
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">Damage Report</h3>
      {#if !showDamageForm}
        <button
          type="button"
          on:click={() => showDamageForm = true}
          class="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Report Damage
        </button>
      {/if}
    </div>

    <p class="text-gray-300 text-sm mb-4">
      Document any damage, wear, or issues found with the gear
    </p>

    {#if showDamageForm}
      <div class="damage-form space-y-4">
        <!-- Damage Type -->
        <div>
          <label for="damage-type" class="block text-sm font-medium text-gray-300 mb-2">
            Damage Type *
          </label>
          <select
            id="damage-type"
            bind:value="{newDamage.type}"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {#each damageTypes as type}
              <option value="{type.value}">{type.label}</option>
            {/each}
          </select>
        </div>

        <!-- Severity -->
        <div>
          <label for="severity" class="block text-sm font-medium text-gray-300 mb-2">
            Severity *
          </label>
          <div class="grid grid-cols-3 gap-3">
            {#each severityLevels as severity}
              <label class="severity-option">
                <input id="severity"
                  type="radio"
                  bind:group="{newDamage.severity}"
                  value="{severity.value}"
                  class="sr-only"
                />
                <div class="severity-card {newDamage.severity === severity.value ? 'selected' : ''}">
                  <span class="severity-label {severity.color}">{severity.label}</span>
                </div>
              </label>
            {/each}
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="damage-description" class="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            id="damage-description"
            bind:value="{newDamage.description}"
            rows="3"
            placeholder="Describe the damage in detail..."
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          ></textarea>
        </div>

        <!-- Estimated Cost -->
        <div>
          <label for="estimated-cost" class="block text-sm font-medium text-gray-300 mb-2">
            Estimated Repair Cost (Optional)
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-gray-400">$</span>
            <input
              id="estimated-cost"
              type="number"
              bind:value="{newDamage.estimatedCost}"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <!-- Repair Required -->
        <div class="flex items-center">
          <input
            id="repair-required"
            type="checkbox"
            bind:checked="{newDamage.repairRequired}"
            class="w-4 h-4 text-orange-600 bg-white/10 border-white/20 rounded focus:ring-orange-500"
          />
          <label for="repair-required" class="ml-2 text-sm text-gray-300">
            Repair required before next rental
          </label>
        </div>

        <!-- Discovered By<label for="discovered-by" class="block text-sm font-medium text-gray-300 mb-2">
            Discovered By
          </label>covered By
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="discoverer-option">
              <input id="discovered-by"
                type="radio"
                bind:group="{newDamage.discoveredBy}"
                value="owner"
                class="sr-only"
              />
              <div class="discoverer-card {newDamage.discoveredBy === 'owner' ? 'selected' : ''}">
                <span class="discoverer-label">Owner</span>
              </div>
            </label>
            </label class="discoverer-option">
              <input
                type="radio"
                bind:group="{newDamage.discoveredBy}"
                value="renter"
                class="sr-only"
              />
              <div class="discoverer-card {newDamage.discoveredBy === 'renter' ? 'selected' : ''}">
                <span class="discoverer-label">Renter</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            on:click="{cancelDamage}"
            class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            on:click="{submitDamage}"
            disabled="{saving" || !newDamage.description.trim()}
            class="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {#if saving}
              Adding...
            {:else}
              Add Damage
            {/if}
          </button>
        </div>
      </div>
    {:else}
      <div class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-300">No damage reported</p>
        <p class="text-gray-400 text-sm">Click "Report Damage" if you find any issues</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .severity-option,
  .discoverer-option {
    cursor: pointer;
  }

  .severity-card,
  .discoverer-card {
    padding: 0.75rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    text-align: center;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.05);
  }

  .severity-card:hover,
  .discoverer-card:hover {
    border-color: rgba(234, 88, 12, 0.5);
    background: rgba(234, 88, 12, 0.1);
  }

  .severity-card.selected,
  .discoverer-card.selected {
    border-color: #ea580c;
    background: rgba(234, 88, 12, 0.2);
  }

  .severity-label,
  .discoverer-label {
    font-weight: 500;
    color: #ffffff;
  }
</style>
