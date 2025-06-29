<script lang="ts">
  import { onMount } from 'svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/scroll-linked-sequential.svelte';

  let guaranteeContent = '';

  onMount(async () => {
    // Load the guarantee content
    try {
      const response = await fetch('/src/lib/content/geargrab-guarantee.md');
      if (response.ok) {
        guaranteeContent = await response.text();
      }
    } catch (error) {
      console.error('Error loading guarantee content:', error);
    }
  });
</script>

<svelte:head>
  <title>GearGrab Guarantee - Protection for Every Rental</title>
  <meta name="description" content="Comprehensive protection for gear rentals with Standard and Premium Coverage options. Peace of mind for both renters and owners." />
</svelte:head>

<div class="min-h-screen">
  <!-- Hero Section -->
  <ScrollLinkedAnimator animation="fade-up" startOffset={0} endOffset={0.3}>
    <section class="relative py-20 px-4 text-center">
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 class="text-5xl md:text-6xl font-bold text-white mb-6">
            GearGrab <span class="text-green-400">Guarantee</span>
          </h1>
          <p class="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Comprehensive protection for every rental. Peace of mind for renters and owners with our Standard and Premium Coverage options.
          </p>
        </div>

        <!-- Coverage Options -->
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <div class="text-center mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2">Standard Coverage</h3>
              <p class="text-blue-300 font-medium">Included with every rental</p>
            </div>
            <ul class="space-y-3 text-gray-300">
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Up to 50% repair cost coverage
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                $200 maximum renter liability
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Security deposit protection
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                48-hour claim window
              </li>
            </ul>
          </div>

          <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl border border-green-500/30 p-8">
            <div class="text-center mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2">Premium Coverage</h3>
              <p class="text-green-300 font-medium">Optional upgrade for owners</p>
            </div>
            <ul class="space-y-3 text-gray-300">
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Full replacement value coverage
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Up to $5,000 per item
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Theft and loss protection
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Direct owner payment
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </ScrollLinkedAnimator>

  <!-- How It Works -->
  <ScrollLinkedSequential animation="fade-up" baseDelay={0.1} incrementDelay={0.15} className="py-20 px-4" startOffset={0.2} endOffset={0.8}>
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-white mb-4">How It Works</h2>
        <p class="text-xl text-gray-300">Simple protection process for every rental</p>
      </div>

      <div class="grid md:grid-cols-4 gap-8">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-6">
            <span class="text-2xl font-bold text-blue-400">1</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Book with Confidence</h3>
          <p class="text-gray-300">Standard Coverage is automatically included with every rental booking.</p>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-6">
            <span class="text-2xl font-bold text-green-400">2</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Enjoy Your Adventure</h3>
          <p class="text-gray-300">Use the gear with peace of mind knowing you're protected against damage.</p>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-6">
            <span class="text-2xl font-bold text-yellow-400">3</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Report Issues</h3>
          <p class="text-gray-300">If damage occurs, report it within 48 hours with photos and details.</p>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-6">
            <span class="text-2xl font-bold text-purple-400">4</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Get Covered</h3>
          <p class="text-gray-300">We handle the claim and provide coverage according to your protection level.</p>
        </div>
      </div>
    </div>
  </ScrollLinkedSequential>

  <!-- Key Benefits -->
  <ScrollLinkedAnimator animation="fade-up" startOffset={0.4} endOffset={0.9}>
    <section class="py-20 px-4 bg-white/5">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl font-bold text-white mb-12">Why Choose GearGrab Guarantee?</h2>
        
        <div class="grid md:grid-cols-3 gap-8">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div class="text-4xl mb-4">🛡️</div>
            <h3 class="text-xl font-bold text-white mb-3">Comprehensive Protection</h3>
            <p class="text-gray-300">Coverage for damage, loss, and theft with clear terms and fast claims processing.</p>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div class="text-4xl mb-4">⚡</div>
            <h3 class="text-xl font-bold text-white mb-3">Fast Claims</h3>
            <p class="text-gray-300">Quick 14-day payment processing for approved claims with minimal paperwork.</p>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div class="text-4xl mb-4">💰</div>
            <h3 class="text-xl font-bold text-white mb-3">Fair Pricing</h3>
            <p class="text-gray-300">Affordable coverage options that protect both renters and owners without breaking the bank.</p>
          </div>
        </div>
      </div>
    </section>
  </ScrollLinkedAnimator>

  <!-- Full Terms -->
  <ScrollLinkedAnimator animation="fade-up" startOffset={0.6} endOffset={1.0}>
    <section class="py-20 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
          <h2 class="text-3xl font-bold text-white mb-8 text-center">Complete Guarantee Terms</h2>
          
          <div class="prose prose-invert max-w-none">
            <div class="text-gray-300 leading-relaxed space-y-6">
              <div class="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 class="text-xl font-bold text-white mb-4">📋 Quick Reference</h3>
                <div class="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 class="font-semibold text-green-400 mb-2">Standard Coverage</h4>
                    <ul class="space-y-1">
                      <li>• 50% repair cost coverage</li>
                      <li>• $200 max renter liability</li>
                      <li>• Included with every rental</li>
                      <li>• 48-hour claim window</li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="font-semibold text-green-400 mb-2">Premium Coverage</h4>
                    <ul class="space-y-1">
                      <li>• Full replacement value</li>
                      <li>• Up to $5,000 per item</li>
                      <li>• Optional for owners</li>
                      <li>• Covers theft and loss</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="text-center">
                <a 
                  href="/legal/terms" 
                  class="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Read Full Terms & Conditions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </ScrollLinkedAnimator>

  <!-- CTA Section -->
  <ScrollLinkedAnimator animation="fade-up" startOffset={0.8} endOffset={1.0}>
    <section class="py-20 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-4xl font-bold text-white mb-6">Ready to Rent with Confidence?</h2>
        <p class="text-xl text-gray-300 mb-8">
          Start exploring gear with the peace of mind that comes from comprehensive protection.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/browse" 
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition-colors"
          >
            Browse Gear
          </a>
          <a 
            href="/list-gear" 
            class="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-lg border border-white/20 transition-colors"
          >
            List Your Gear
          </a>
        </div>
      </div>
    </section>
  </ScrollLinkedAnimator>
</div>
