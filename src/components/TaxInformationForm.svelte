<script>
  import { onMount } from 'svelte';
  import { User } from '../api/entities.js';

  export let user = {};
  export let onUpdate = null;

  let taxInfo = {
    tax_id_type: "",
    tax_id_number: "",
    entity_type: "individual",
    business_name: "",
    tax_address: {
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "US"
    },
    backup_withholding: false,
    tax_exempt: false,
    tax_exempt_reason: ""
  };

  let isSaving = false;
  let message = { type: "", text: "" };
  let annualEarnings = 0;

  onMount(() => {
    if (user) {
      taxInfo = {
        tax_id_type: user.tax_id_type || "",
        tax_id_number: user.tax_id_number || "",
        entity_type: user.entity_type || "individual",
        business_name: user.business_name || "",
        tax_address: user.tax_address || {
          street_address: "",
          city: "",
          state: "",
          zip_code: "",
          country: "US"
        },
        backup_withholding: user.backup_withholding || false,
        tax_exempt: user.tax_exempt || false,
        tax_exempt_reason: user.tax_exempt_reason || ""
      };
      
      // Simulate fetching annual earnings
      annualEarnings = user.annual_earnings || 0;
    }
  });

  function validateTaxId(type, number) {
    if (!type || !number) return false;
    
    const cleanNumber = number.replace(/[-\s]/g, '');
    
    switch (type) {
      case 'ssn':
        return /^\d{9}$/.test(cleanNumber);
      case 'ein':
        return /^\d{9}$/.test(cleanNumber);
      case 'itin':
        return /^9\d{8}$/.test(cleanNumber);
      default:
        return false;
    }
  }

  function getTaxIdPlaceholder(type) {
    switch (type) {
      case 'ssn':
        return 'XXX-XX-XXXX';
      case 'ein':
        return 'XX-XXXXXXX';
      case 'itin':
        return '9XX-XX-XXXX';
      default:
        return 'Enter tax ID';
    }
  }

  async function handleSave() {
    isSaving = true;
    message = { type: "", text: "" };

    try {
      // Validate required fields
      if (!taxInfo.tax_id_type || !taxInfo.tax_id_number) {
        message = { type: "error", text: "Tax ID type and number are required." };
        return;
      }

      if (!validateTaxId(taxInfo.tax_id_type, taxInfo.tax_id_number)) {
        message = { type: "error", text: "Invalid tax ID format." };
        return;
      }

      if (taxInfo.entity_type === 'business' && !taxInfo.business_name) {
        message = { type: "error", text: "Business name is required for business entities." };
        return;
      }

      // Update user with tax information
      const updateData = {
        ...taxInfo,
        tax_id_verified: false,
        tax_info_updated_at: new Date().toISOString(),
        tax_info_updated_by: user.id
      };

      await User.update(user.id, updateData);
      
      message = { type: "success", text: "Tax information saved successfully." };
      
      if (onUpdate) {
        onUpdate(updateData);
      }

    } catch (error) {
      console.error("Error saving tax information:", error);
      message = { type: "error", text: "Failed to save tax information. Please try again." };
    } finally {
      isSaving = false;
    }
  }

  $: showBusinessName = taxInfo.entity_type === 'business';
  $: showEarningsAlert = annualEarnings >= 600;
</script>

<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Tax Information</h2>
    <p class="text-gray-600">Please provide your tax information for 1099 reporting compliance.</p>
  </div>

  {#if showEarningsAlert}
    <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <div>
          <h3 class="text-sm font-medium text-yellow-800">1099 Reporting Required</h3>
          <p class="text-sm text-yellow-700 mt-1">
            Your annual earnings (${annualEarnings.toLocaleString()}) exceed $600. Tax information is required for 1099 reporting.
          </p>
        </div>
      </div>
    </div>
  {/if}

  {#if message.text}
    <div class="mb-4 p-4 rounded-md {message.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}">
      <p class="text-sm {message.type === 'error' ? 'text-red-700' : 'text-green-700'}">{message.text}</p>
    </div>
  {/if}

  <form on:submit|preventDefault={handleSave} class="space-y-6">
    <!-- Entity Type -->
    <div>
      <label for="entity_type" class="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
      <select 
        id="entity_type" 
        bind:value={taxInfo.entity_type}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="individual">Individual</option>
        <option value="business">Business</option>
      </select>
    </div>

    <!-- Business Name (conditional) -->
    {#if showBusinessName}
      <div>
        <label for="business_name" class="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
        <input 
          type="text" 
          id="business_name"
          bind:value={taxInfo.business_name}
          placeholder="Enter business name"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    {/if}

    <!-- Tax ID Type -->
    <div>
      <label for="tax_id_type" class="block text-sm font-medium text-gray-700 mb-2">Tax ID Type</label>
      <select 
        id="tax_id_type" 
        bind:value={taxInfo.tax_id_type}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select tax ID type</option>
        <option value="ssn">Social Security Number (SSN)</option>
        <option value="ein">Employer Identification Number (EIN)</option>
        <option value="itin">Individual Taxpayer Identification Number (ITIN)</option>
      </select>
    </div>

    <!-- Tax ID Number -->
    <div>
      <label for="tax_id_number" class="block text-sm font-medium text-gray-700 mb-2">Tax ID Number</label>
      <input 
        type="text" 
        id="tax_id_number"
        bind:value={taxInfo.tax_id_number}
        placeholder={getTaxIdPlaceholder(taxInfo.tax_id_type)}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Tax Address -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-3">Tax Address</h3>
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label for="street_address" class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
          <input 
            type="text" 
            id="street_address"
            bind:value={taxInfo.tax_address.street_address}
            placeholder="Enter street address"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input 
              type="text" 
              id="city"
              bind:value={taxInfo.tax_address.city}
              placeholder="Enter city"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label for="state" class="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input 
              type="text" 
              id="state"
              bind:value={taxInfo.tax_address.state}
              placeholder="Enter state"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="zip_code" class="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input 
              type="text" 
              id="zip_code"
              bind:value={taxInfo.tax_address.zip_code}
              placeholder="Enter ZIP code"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label for="country" class="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select 
              id="country" 
              bind:value={taxInfo.tax_address.country}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="US">United States</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Options -->
    <div class="space-y-3">
      <div class="flex items-center">
        <input 
          type="checkbox" 
          id="backup_withholding"
          bind:checked={taxInfo.backup_withholding}
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="backup_withholding" class="ml-2 block text-sm text-gray-700">Subject to backup withholding</label>
      </div>
    </div>

    <!-- Save Button -->
    <button 
      type="submit"
      disabled={isSaving}
      class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSaving ? "Saving..." : "Save Tax Information"}
    </button>
  </form>
</div>
