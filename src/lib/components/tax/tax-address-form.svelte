<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let required = true;
  export let initialAddress: any = null;

  const dispatch = createEventDispatcher();

  // Form fields
  let line1 = initialAddress?.line1 || '';
  let line2 = initialAddress?.line2 || '';
  let city = initialAddress?.city || '';
  let state = initialAddress?.state || '';
  let postal_code = initialAddress?.postal_code || '';
  let country = 'US'; // Only US supported for now

  // Validation
  let errors: Record<string, string> = {};
  let isValidating = false;
  let taxPreview: any = null;
  let loadingTaxPreview = false;

  // US States for dropdown
  const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' }
  ];

  $: isValid = validateForm();
  $: address = { line1, line2, city, state, postal_code, country };

  // Auto-preview tax rates when address is complete
  $: if (isValid && !loadingTaxPreview) {
    previewTaxRates();
  }

  function validateForm(): boolean {
    errors = {};

    if (!line1.trim()) {
      errors.line1 = 'Street address is required';
    }

    if (!city.trim()) {
      errors.city = 'City is required';
    }

    if (!state.trim()) {
      errors.state = 'State is required';
    }

    if (!postal_code.trim()) {
      errors.postal_code = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(postal_code)) {
      errors.postal_code = 'ZIP code must be in format 12345 or 12345-6789';
    }

    return Object.keys(errors).length === 0;
  }

  async function previewTaxRates() {
    if (!isValid) return;

    try {
      loadingTaxPreview = true;
      
      const params = new URLSearchParams({
        line1,
        city,
        state,
        postal_code,
        country
      });

      const response = await fetch(`/api/tax/calculate?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        taxPreview = data.taxRates;
      } else {
        taxPreview = null;
      }
    } catch (error) {
      console.error('Error previewing tax rates:', error);
      taxPreview = null;
    } finally {
      loadingTaxPreview = false;
    }
  }

  function handleSubmit() {
    if (!validateForm()) return;

    dispatch('addressSubmitted', {
      address: { line1, line2, city, state, postal_code, country },
      taxPreview
    });
  }

  function handleCancel() {
    dispatch('cancelled');
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
  <div class="mb-6">
    <h3 class="text-xl font-bold text-white mb-2">Billing Address</h3>
    <p class="text-gray-300 text-sm">
      Required for tax calculation. Sales tax will be calculated based on your location.
    </p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    
    <!-- Street Address -->
    <div>
      <label for="line1" class="block text-sm font-medium text-white mb-2">
        Street Address *
      </label>
      <input
        id="line1"
        type="text"
        bind:value={line1}
        placeholder="123 Main Street"
        class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
        class:border-red-500={errors.line1}
        required
      />
      {#if errors.line1}
        <p class="text-red-300 text-sm mt-1">{errors.line1}</p>
      {/if}
    </div>

    <!-- Apartment/Suite (Optional) -->
    <div>
      <label for="line2" class="block text-sm font-medium text-white mb-2">
        Apartment, Suite, etc. (Optional)
      </label>
      <input
        id="line2"
        type="text"
        bind:value={line2}
        placeholder="Apt 4B"
        class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
      />
    </div>

    <!-- City and State -->
    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <label for="city" class="block text-sm font-medium text-white mb-2">
          City *
        </label>
        <input
          id="city"
          type="text"
          bind:value={city}
          placeholder="Denver"
          class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          class:border-red-500={errors.city}
          required
        />
        {#if errors.city}
          <p class="text-red-300 text-sm mt-1">{errors.city}</p>
        {/if}
      </div>

      <div>
        <label for="state" class="block text-sm font-medium text-white mb-2">
          State *
        </label>
        <select
          id="state"
          bind:value={state}
          class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          class:border-red-500={errors.state}
          required
        >
          <option value="">Select State</option>
          {#each US_STATES as stateOption}
            <option value={stateOption.code}>{stateOption.name}</option>
          {/each}
        </select>
        {#if errors.state}
          <p class="text-red-300 text-sm mt-1">{errors.state}</p>
        {/if}
      </div>
    </div>

    <!-- ZIP Code -->
    <div>
      <label for="postal_code" class="block text-sm font-medium text-white mb-2">
        ZIP Code *
      </label>
      <input
        id="postal_code"
        type="text"
        bind:value={postal_code}
        placeholder="80202"
        class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
        class:border-red-500={errors.postal_code}
        required
      />
      {#if errors.postal_code}
        <p class="text-red-300 text-sm mt-1">{errors.postal_code}</p>
      {/if}
    </div>

    <!-- Tax Preview -->
    {#if loadingTaxPreview}
      <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div class="flex items-center">
          <div class="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full mr-3"></div>
          <span class="text-blue-200 text-sm">Calculating tax rates...</span>
        </div>
      </div>
    {:else if taxPreview}
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <h4 class="text-green-300 font-semibold mb-2">Tax Information</h4>
        <div class="text-green-200 text-sm space-y-1">
          <p>Estimated tax rate: <strong>{taxPreview.formattedRate}</strong></p>
          <p>Tax jurisdiction: {taxPreview.jurisdiction}</p>
          {#if taxPreview.applicableTaxes.length > 0}
            <div class="mt-2">
              <p class="font-medium">Tax breakdown:</p>
              <ul class="ml-4 space-y-1">
                {#each taxPreview.applicableTaxes as tax}
                  <li>• {tax.jurisdiction} ({tax.type}): {(tax.rate * 100).toFixed(2)}%</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>
    {:else if isValid}
      <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p class="text-yellow-200 text-sm">
          Unable to calculate tax rates for this address. Tax will be calculated during checkout.
        </p>
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="flex space-x-4 pt-4">
      <button
        type="button"
        on:click={handleCancel}
        class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        Cancel
      </button>
      
      <button
        type="submit"
        disabled={!isValid}
        class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        Continue with Address
      </button>
    </div>
  </form>
</div>
