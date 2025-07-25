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

<<<<<<< Updated upstream
<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-center mb-8 text-gray-900">GearGrab Tax Compliance</h1>
  <TaxInformationForm {user} onUpdate={handleUpdate} />
</div>
=======
<svelte:window bind:scrollY={scrollY} />

<!-- Hero Section -->
<div class="relative h-96 flex flex-col items-center justify-center text-center text-white px-4">
  <h1 class="text-4xl md:text-6xl font-bold mb-4 animate-fade-in drop-shadow-lg" style="animation-delay: 0.2s; opacity: 0;">Adventure Awaits</h1>
  <p class="text-xl md:text-2xl mb-8 max-w-3xl animate-fade-in drop-shadow-md" style="animation-delay: 0.4s; opacity: 0;">Rent outdoor gear from local owners and save money while exploring the great outdoors.</p>
  <div class="flex flex-col sm:flex-row gap-4 animate-fade-in" style="animation-delay: 0.6s; opacity: 0;">
    <a href="/browse" class="btn btn-primary text-lg px-8 py-3 shadow-lg">Browse Gear</a>
    <a href="/list-gear" class="btn btn-secondary text-lg px-8 py-3 shadow-lg">List Your Gear</a>
  </div>
</div>

<!-- Featured Categories -->
<section class="py-16">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12 animate-fade-in text-white drop-shadow-lg" style="animation-delay: 0.2s; opacity: 0;">Explore Gear Categories</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {#each categories as category}
        <a href="/browse?category={category.id}" class="group">
          <div class="relative h-64 rounded-lg overflow-hidden shadow-md transition-transform transform group-hover:scale-105">
            <img src={category.image} alt={category.name} class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
            <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 class="text-xl font-bold mb-1">{category.name}</h3>
              <p class="text-sm opacity-90">{category.description}</p>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>

<!-- How It Works -->
<section class="py-16">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12 animate-fade-in text-white drop-shadow-lg" style="animation-delay: 0.2s; opacity: 0;">How GearGrab Works</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {#each steps as step}
        <div class="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg text-center border border-white/20">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {#if step.icon === 'search'}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            {:else if step.icon === 'calendar'}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            {:else if step.icon === 'mountain'}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            {:else if step.icon === 'star'}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            {/if}
          </div>
          <h3 class="text-xl font-bold mb-2">{step.title}</h3>
          <p class="text-gray-600">{step.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Call to Action Section -->
<div class="relative h-80 flex items-center justify-center">
  <div class="relative text-center text-white px-4">
    <h2 class="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">Save Money. Reduce Waste. Explore More.</h2>
    <p class="text-xl max-w-3xl mx-auto drop-shadow-md">Renting gear is better for your wallet and the planet.</p>
  </div>
</div>

<!-- Testimonials -->
<section class="py-16">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12 animate-fade-in text-white drop-shadow-lg" style="animation-delay: 0.2s; opacity: 0;">What Our Users Say</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each testimonials as testimonial}
        <div class="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/20">
          <div class="flex items-center mb-4">
            <img src={testimonial.image} alt={testimonial.name} class="w-12 h-12 rounded-full mr-4" />
            <div>
              <h3 class="font-bold">{testimonial.name}</h3>
              <p class="text-sm text-gray-600">{testimonial.location}</p>
            </div>
          </div>
          <p class="text-gray-700 italic">"{testimonial.quote}"</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-16 text-white">
  <div class="container mx-auto px-4 text-center">
    <h2 class="text-3xl font-bold mb-6 drop-shadow-lg">Ready to Start Your Adventure?</h2>
    <p class="text-xl mb-8 max-w-3xl mx-auto drop-shadow-md">Join thousands of outdoor enthusiasts who are saving money and exploring more with GearGrab.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="/browse" class="btn bg-white/95 backdrop-blur-sm text-green-600 hover:bg-white text-lg px-8 py-3 shadow-lg">Browse Gear</a>
      <a href="/list-gear" class="btn border-2 border-white/80 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-lg px-8 py-3 shadow-lg">List Your Gear</a>
    </div>
  </div>
</section>
>>>>>>> Stashed changes
