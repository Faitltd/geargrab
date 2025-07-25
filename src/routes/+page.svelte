<script>
  import TaxInformationForm from '../components/TaxInformationForm.svelte';
  
  // Mock user data for demonstration
  let user = {
    id: 'user-123',
    tax_id_type: 'ssn',
    tax_id_number: '123-45-6789',
    entity_type: 'individual',
    business_name: '',
    tax_address: {
      street_address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip_code: '12345',
      country: 'US'
    },
    backup_withholding: false,
    tax_exempt: false,
    tax_exempt_reason: '',
    annual_earnings: 1000
  };

  function handleUpdate(updatedData) {
    console.log('Tax information updated:', updatedData);
    user = { ...user, ...updatedData };
  }
</script>

<svelte:head>
  <title>GearGrab - Gear Rental Marketplace</title>
  <meta name="description" content="Rent and list outdoor gear with GearGrab" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-center mb-8 text-gray-900">GearGrab Tax Compliance</h1>
  <TaxInformationForm {user} onUpdate={handleUpdate} />
</div>
