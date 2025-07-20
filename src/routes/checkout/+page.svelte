<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import ModernButton from '$lib/components/ui/ModernButton.svelte';
  import GlassInput from '$lib/components/ui/GlassInput.svelte';
  import { cart, cartSubtotal, cartTax, cartServiceFee, cartGrandTotal, formatPrice } from '$lib/stores/cart';
  
  let currentStep = 1;
  let scrollY = 0;
  let isProcessing = false;
  
  // Form data
  let contactInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };
  
  let billingAddress = {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  };
  
  let paymentInfo = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  };
  
  let rentalAgreement = {
    termsAccepted: false,
    damageWaiverAccepted: false,
    ageVerified: false
  };
  
  const steps = [
    { id: 1, title: 'Contact Info', description: 'Your details' },
    { id: 2, title: 'Billing', description: 'Address & payment' },
    { id: 3, title: 'Review', description: 'Confirm order' }
  ];
  
  // Redirect if cart is empty
  onMount(() => {
    if ($cart.items.length === 0) {
      goto('/gear');
    }
  });
  
  const nextStep = () => {
    if (currentStep < steps.length) {
      currentStep++;
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      currentStep--;
    }
  };
  
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(contactInfo.firstName && contactInfo.lastName && contactInfo.email && contactInfo.phone);
      case 2:
        return !!(billingAddress.street && billingAddress.city && billingAddress.state && billingAddress.zipCode &&
                 paymentInfo.cardNumber && paymentInfo.expiryDate && paymentInfo.cvv && paymentInfo.nameOnCard);
      case 3:
        return rentalAgreement.termsAccepted && rentalAgreement.damageWaiverAccepted && rentalAgreement.ageVerified;
      default:
        return false;
    }
  };
  
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep < steps.length) {
      nextStep();
    } else {
      // Process final order
      isProcessing = true;
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clear cart and redirect to success page
        cart.clear();
        goto('/checkout/success');
      } catch (error) {
        console.error('Checkout error:', error);
        isProcessing = false;
      }
    }
  };
  
  $: canProceed = validateStep(currentStep);
  $: isLastStep = currentStep === steps.length;
</script>

<svelte:window bind:scrollY />

<!-- Header -->
<div class="glass-nav fixed top-0 w-full z-50" class:shadow-lg={scrollY > 10}>
  <Header />
</div>

<!-- Main Content -->
<main class="pt-20 min-h-screen bg-neutral-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Progress Steps -->
    <div class="mb-12">
      <div class="flex items-center justify-center">
        {#each steps as step, index}
          <div class="flex items-center">
            <!-- Step Circle -->
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300"
              class:bg-primary-500={currentStep >= step.id}
              class:text-white={currentStep >= step.id}
              class:bg-neutral-200={currentStep < step.id}
              class:text-neutral-600={currentStep < step.id}
            >
              {#if currentStep > step.id}
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {:else}
                {step.id}
              {/if}
            </div>
            
            <!-- Step Info -->
            <div class="ml-4 min-w-0">
              <p 
                class="text-sm font-medium transition-colors duration-300"
                class:text-primary-600={currentStep >= step.id}
                class:text-neutral-900={currentStep < step.id}
              >
                {step.title}
              </p>
              <p class="text-sm text-neutral-500">{step.description}</p>
            </div>
            
            <!-- Connector Line -->
            {#if index < steps.length - 1}
              <div 
                class="w-16 h-0.5 mx-8 transition-colors duration-300"
                class:bg-primary-500={currentStep > step.id}
                class:bg-neutral-200={currentStep <= step.id}
              ></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <!-- Main Form -->
      <div class="lg:col-span-2">
        <GlassCard variant="default" size="lg">
          <form on:submit|preventDefault={handleSubmit}>
            <!-- Step 1: Contact Information -->
            {#if currentStep === 1}
              <div class="animate-fade-in-up">
                <h2 class="text-2xl font-bold text-neutral-900 mb-6">Contact Information</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassInput
                    bind:value={contactInfo.firstName}
                    label="First Name"
                    placeholder="John"
                    required={true}
                    variant="modern"
                  />
                  
                  <GlassInput
                    bind:value={contactInfo.lastName}
                    label="Last Name"
                    placeholder="Doe"
                    required={true}
                    variant="modern"
                  />
                  
                  <GlassInput
                    bind:value={contactInfo.email}
                    type="email"
                    label="Email Address"
                    placeholder="john@example.com"
                    required={true}
                    variant="modern"
                  />
                  
                  <GlassInput
                    bind:value={contactInfo.phone}
                    type="tel"
                    label="Phone Number"
                    placeholder="(555) 123-4567"
                    required={true}
                    variant="modern"
                  />
                </div>
              </div>
            {/if}
            
            <!-- Step 2: Billing & Payment -->
            {#if currentStep === 2}
              <div class="animate-fade-in-up">
                <h2 class="text-2xl font-bold text-neutral-900 mb-6">Billing & Payment</h2>
                
                <!-- Billing Address -->
                <div class="mb-8">
                  <h3 class="text-lg font-semibold text-neutral-900 mb-4">Billing Address</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                      <GlassInput
                        bind:value={billingAddress.street}
                        label="Street Address"
                        placeholder="123 Main St"
                        required={true}
                        variant="modern"
                      />
                    </div>
                    
                    <GlassInput
                      bind:value={billingAddress.city}
                      label="City"
                      placeholder="Seattle"
                      required={true}
                      variant="modern"
                    />
                    
                    <GlassInput
                      bind:value={billingAddress.state}
                      label="State"
                      placeholder="WA"
                      required={true}
                      variant="modern"
                    />
                    
                    <GlassInput
                      bind:value={billingAddress.zipCode}
                      label="ZIP Code"
                      placeholder="98101"
                      required={true}
                      variant="modern"
                    />
                  </div>
                </div>
                
                <!-- Payment Information -->
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 mb-4">Payment Information</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                      <GlassInput
                        bind:value={paymentInfo.cardNumber}
                        label="Card Number"
                        placeholder="1234 5678 9012 3456"
                        required={true}
                        variant="modern"
                      />
                    </div>
                    
                    <GlassInput
                      bind:value={paymentInfo.expiryDate}
                      label="Expiry Date"
                      placeholder="MM/YY"
                      required={true}
                      variant="modern"
                    />
                    
                    <GlassInput
                      bind:value={paymentInfo.cvv}
                      label="CVV"
                      placeholder="123"
                      required={true}
                      variant="modern"
                    />
                    
                    <div class="md:col-span-2">
                      <GlassInput
                        bind:value={paymentInfo.nameOnCard}
                        label="Name on Card"
                        placeholder="John Doe"
                        required={true}
                        variant="modern"
                      />
                    </div>
                  </div>
                </div>
              </div>
            {/if}
            
            <!-- Step 3: Review & Confirm -->
            {#if currentStep === 3}
              <div class="animate-fade-in-up">
                <h2 class="text-2xl font-bold text-neutral-900 mb-6">Review & Confirm</h2>
                
                <!-- Rental Agreement -->
                <div class="space-y-4 mb-8">
                  <label class="flex items-start gap-3">
                    <input
                      type="checkbox"
                      bind:checked={rentalAgreement.termsAccepted}
                      class="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span class="text-sm text-neutral-700">
                      I agree to the <a href="/terms" class="text-primary-600 hover:underline">Terms of Service</a> 
                      and <a href="/privacy" class="text-primary-600 hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                  
                  <label class="flex items-start gap-3">
                    <input
                      type="checkbox"
                      bind:checked={rentalAgreement.damageWaiverAccepted}
                      class="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span class="text-sm text-neutral-700">
                      I understand the damage waiver policy and accept responsibility for any damage to rented equipment
                    </span>
                  </label>
                  
                  <label class="flex items-start gap-3">
                    <input
                      type="checkbox"
                      bind:checked={rentalAgreement.ageVerified}
                      class="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span class="text-sm text-neutral-700">
                      I confirm that I am 18 years of age or older
                    </span>
                  </label>
                </div>
                
                <!-- Order Summary -->
                <div class="bg-neutral-50 rounded-xl p-6">
                  <h3 class="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice($cartSubtotal)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Service Fee</span>
                      <span>{formatPrice($cartServiceFee)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice($cartTax)}</span>
                    </div>
                    <div class="border-t border-neutral-200 pt-2 mt-2">
                      <div class="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{formatPrice($cartGrandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
            
            <!-- Navigation Buttons -->
            <div class="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
              <div>
                {#if currentStep > 1}
                  <ModernButton variant="ghost" on:click={prevStep}>
                    ← Back
                  </ModernButton>
                {/if}
              </div>
              
              <ModernButton 
                variant="primary" 
                type="submit"
                disabled={!canProceed || isProcessing}
                loading={isProcessing}
              >
                {#if isLastStep}
                  {isProcessing ? 'Processing...' : 'Complete Order'}
                {:else}
                  Continue →
                {/if}
              </ModernButton>
            </div>
          </form>
        </GlassCard>
      </div>
      
      <!-- Order Summary Sidebar -->
      <div class="lg:col-span-1">
        <div class="sticky top-24">
          <GlassCard variant="default" size="md">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4">Your Order</h3>
            
            <!-- Cart Items -->
            <div class="space-y-4 mb-6">
              {#each $cart.items as item}
                <div class="flex gap-3">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    class="w-12 h-12 rounded-lg object-cover"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-neutral-900 truncate">
                      {item.title}
                    </p>
                    <p class="text-xs text-neutral-600">
                      {item.rentalDates.days} days × {item.quantity}
                    </p>
                    <p class="text-sm font-medium text-neutral-900">
                      {formatPrice(item.price * item.rentalDates.days * item.quantity)}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
            
            <!-- Pricing Breakdown -->
            <div class="border-t border-neutral-200 pt-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice($cartSubtotal)}</span>
              </div>
              <div class="flex justify-between">
                <span>Service Fee</span>
                <span>{formatPrice($cartServiceFee)}</span>
              </div>
              <div class="flex justify-between">
                <span>Tax</span>
                <span>{formatPrice($cartTax)}</span>
              </div>
              <div class="border-t border-neutral-200 pt-2 mt-2">
                <div class="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice($cartGrandTotal)}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- Footer -->
<Footer />
