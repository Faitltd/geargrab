<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';

  const membershipTiers = [
    {
      name: 'Explorer',
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for occasional adventurers',
      features: [
        'Browse all gear listings',
        'Basic customer support',
        'Standard booking protection',
        'Access to community reviews',
        'Mobile app access'
      ],
      limitations: [
        '5% service fee on rentals',
        'Standard response time',
        'Basic insurance coverage'
      ],
      cta: 'Get Started Free',
      popular: false,
      color: 'gray'
    },
    {
      name: 'Adventurer',
      price: '$9.99',
      period: 'per month',
      description: 'For regular outdoor enthusiasts',
      features: [
        'Everything in Explorer',
        'Reduced 3% service fee',
        'Priority customer support',
        'Enhanced insurance coverage',
        'Early access to new gear',
        'Exclusive member discounts',
        'Free gear cleaning service'
      ],
      limitations: [],
      cta: 'Start Free Trial',
      popular: true,
      color: 'primary'
    },
    {
      name: 'Pro Explorer',
      price: '$19.99',
      period: 'per month',
      description: 'For serious gear enthusiasts and frequent renters',
      features: [
        'Everything in Adventurer',
        'No service fees on rentals',
        '24/7 priority support',
        'Premium insurance coverage',
        'Concierge gear delivery',
        'Exclusive gear access',
        'Free gear maintenance',
        'Personal gear consultant'
      ],
      limitations: [],
      cta: 'Start Free Trial',
      popular: false,
      color: 'accent'
    }
  ];

  function handleSignUp(tier: string) {
    if (tier === 'Explorer') {
      goto('/auth');
    } else {
      goto(`/auth?plan=${tier.toLowerCase()}`);
    }
  }
</script>

<svelte:head>
  <title>Membership Plans - GearGrab</title>
  <meta name="description" content="Join GearGrab membership for exclusive benefits, reduced fees, and premium outdoor gear access. Choose the plan that fits your adventure style." />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50">
  <!-- Hero Section -->
  <section class="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 class="text-4xl md:text-6xl font-bold mb-6">
        Join the GearGrab Community
      </h1>
      <p class="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
        Unlock exclusive benefits, save on every rental, and get access to premium outdoor gear from trusted local owners.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="secondary" size="lg" on:click={() => handleSignUp('Adventurer')}>
          Start Free Trial
        </Button>
        <Button variant="outline" size="lg" on:click={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
          View Plans
        </Button>
      </div>
    </div>
  </section>

  <!-- Membership Benefits -->
  <section class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Why Join GearGrab?
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Get more from every adventure with exclusive member benefits and savings.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="text-center p-6">
          <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Save on Every Rental</h3>
          <p class="text-gray-600">Reduced service fees mean more money for your adventures. Pro members pay zero fees!</p>
        </div>

        <div class="text-center p-6">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Premium Protection</h3>
          <p class="text-gray-600">Enhanced insurance coverage and protection for all your rentals and adventures.</p>
        </div>

        <div class="text-center p-6">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Priority Support</h3>
          <p class="text-gray-600">Get help when you need it with priority customer support and dedicated assistance.</p>
        </div>

        <div class="text-center p-6">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Early Access</h3>
          <p class="text-gray-600">Be the first to access new gear listings and exclusive equipment from premium brands.</p>
        </div>

        <div class="text-center p-6">
          <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Exclusive Discounts</h3>
          <p class="text-gray-600">Member-only discounts on gear purchases, services, and partner outdoor experiences.</p>
        </div>

        <div class="text-center p-6">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Concierge Service</h3>
          <p class="text-gray-600">Pro members get personal gear consultants and white-glove delivery service.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Plans -->
  <section id="plans" class="py-16 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Choose Your Adventure Level
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Start free and upgrade anytime. All plans include access to thousands of verified gear listings.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {#each membershipTiers as tier}
          <div class="bg-white rounded-lg shadow-lg overflow-hidden relative" class:ring-2={tier.popular} class:ring-primary-500={tier.popular}>
            {#if tier.popular}
              <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span class="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
            {/if}
            
            <div class="p-8">
              <div class="text-center mb-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p class="text-gray-600 mb-4">{tier.description}</p>
                <div class="mb-4">
                  <span class="text-4xl font-bold text-gray-900">{tier.price}</span>
                  {#if tier.period !== 'Forever'}
                    <span class="text-gray-600">/{tier.period}</span>
                  {/if}
                </div>
              </div>

              <ul class="space-y-3 mb-8">
                {#each tier.features as feature}
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-gray-700">{feature}</span>
                  </li>
                {/each}
              </ul>

              <div class="w-full">
                <Button 
                  variant={tier.popular ? 'primary' : 'secondary'} 
                  size="lg" 
                  fullWidth={true}
                  on:click={() => handleSignUp(tier.name)}
                >
                  {tier.cta}
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Money Back Guarantee -->
      <div class="text-center mt-12">
        <p class="text-gray-600">
          <strong>30-day money-back guarantee</strong> • Cancel anytime • No hidden fees
        </p>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="py-16 bg-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
      </div>

      <div class="space-y-8">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Can I cancel my membership anytime?</h3>
          <p class="text-gray-600">Yes! You can cancel your membership at any time. Your benefits will continue until the end of your current billing period.</p>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">What's included in the free trial?</h3>
          <p class="text-gray-600">Your free trial includes all the benefits of your chosen plan for 30 days. No credit card required to start.</p>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">How does the insurance coverage work?</h3>
          <p class="text-gray-600">All rentals are covered by our protection plan. Members get enhanced coverage with lower deductibles and faster claim processing.</p>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
          <p class="text-gray-600">Absolutely! You can change your plan at any time from your account settings. Changes take effect at your next billing cycle.</p>
        </div>
      </div>
    </div>
  </section>
</main>

<Footer />
