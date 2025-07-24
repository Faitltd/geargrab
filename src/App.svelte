<script>
  import TaxInformationForm from './components/TaxInformationForm.svelte';
  
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

<main class="min-h-screen bg-gray-50 py-8">
  <div class="container mx-auto px-4">
    <h1 class="text-3xl font-bold text-center mb-8 text-gray-900">GearGrab Tax Compliance</h1>
    <TaxInformationForm {user} onUpdate={handleUpdate} />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
</style>
