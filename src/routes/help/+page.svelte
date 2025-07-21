<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let activeSection = 'getting-started';

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'renting', title: 'Renting Gear', icon: '🎒' },
    { id: 'listing', title: 'Listing Your Gear', icon: '📝' },
    { id: 'payments', title: 'Payments & Billing', icon: '💳' },
    { id: 'safety', title: 'Safety & Insurance', icon: '🛡️' },
    { id: 'support', title: 'Contact Support', icon: '💬' }
  ];

  const faqs = {
    'getting-started': [
      {
        question: 'How does GearGrab work?',
        answer: 'GearGrab connects outdoor enthusiasts who want to rent gear with those who have gear to share. Simply browse available gear, book what you need, and enjoy your adventure!'
      },
      {
        question: 'Do I need to create an account?',
        answer: 'Yes, you need to create an account to rent or list gear. This helps us maintain a safe and trusted community.'
      },
      {
        question: 'Is GearGrab available in my area?',
        answer: 'GearGrab is expanding nationwide. Check our coverage map or enter your location to see available gear near you.'
      }
    ],
    'renting': [
      {
        question: 'How do I rent gear?',
        answer: 'Browse available gear, select your dates, and book instantly. You\'ll receive pickup instructions and can coordinate with the gear owner.'
      },
      {
        question: 'What if the gear is damaged?',
        answer: 'All rentals are covered by our protection plan. Report any issues immediately and we\'ll help resolve them.'
      },
      {
        question: 'Can I cancel my booking?',
        answer: 'Yes, you can cancel bookings according to the cancellation policy shown at booking. Refunds depend on timing and circumstances.'
      }
    ],
    'listing': [
      {
        question: 'How do I list my gear?',
        answer: 'Create detailed listings with photos, descriptions, and pricing. Set your availability and let renters find your gear.'
      },
      {
        question: 'How much can I earn?',
        answer: 'Earnings depend on your gear type, location, and demand. Popular items can earn $50-200+ per rental.'
      },
      {
        question: 'Is my gear protected?',
        answer: 'Yes, all rentals include damage protection and liability coverage for gear owners.'
      }
    ]
  };
</script>

<svelte:head>
  <title>Help Center - GearGrab</title>
  <meta name="description" content="Get help with GearGrab - find answers to common questions about renting and listing outdoor gear." />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50">
  <!-- Hero Section -->
  <div class="bg-primary-600 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Help Center</h1>
        <p class="text-xl text-primary-100 max-w-2xl mx-auto">
          Find answers to common questions and get the help you need to make the most of GearGrab.
        </p>
      </div>
    </div>
  </div>

  <!-- Help Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Sidebar Navigation -->
      <div class="lg:col-span-1">
        <nav class="bg-white rounded-lg shadow-lg p-6 sticky top-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Help Topics</h2>
          <ul class="space-y-2">
            {#each sections as section}
              <li>
                <button
                  class="w-full text-left px-3 py-2 rounded-lg transition-colors {activeSection === section.id ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}"
                  on:click={() => activeSection = section.id}
                >
                  <span class="mr-2">{section.icon}</span>
                  {section.title}
                </button>
              </li>
            {/each}
          </ul>
        </nav>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-3">
        <div class="bg-white rounded-lg shadow-lg p-8">
          {#if activeSection === 'getting-started'}
            <h2 class="text-2xl font-bold text-gray-900 mb-6">🚀 Getting Started</h2>
            <div class="space-y-6">
              {#each faqs['getting-started'] as faq}
                <div class="border-b border-gray-200 pb-6 last:border-b-0">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p class="text-gray-600">{faq.answer}</p>
                </div>
              {/each}
            </div>
          {:else if activeSection === 'renting'}
            <h2 class="text-2xl font-bold text-gray-900 mb-6">🎒 Renting Gear</h2>
            <div class="space-y-6">
              {#each faqs['renting'] as faq}
                <div class="border-b border-gray-200 pb-6 last:border-b-0">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p class="text-gray-600">{faq.answer}</p>
                </div>
              {/each}
            </div>
          {:else if activeSection === 'listing'}
            <h2 class="text-2xl font-bold text-gray-900 mb-6">📝 Listing Your Gear</h2>
            <div class="space-y-6">
              {#each faqs['listing'] as faq}
                <div class="border-b border-gray-200 pb-6 last:border-b-0">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p class="text-gray-600">{faq.answer}</p>
                </div>
              {/each}
            </div>
          {:else if activeSection === 'support'}
            <h2 class="text-2xl font-bold text-gray-900 mb-6">💬 Contact Support</h2>
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
                  <p class="text-gray-600 mb-4">Get help via email within 24 hours</p>
                  <a href="mailto:support@geargrab.co" class="text-primary-600 hover:text-primary-700 font-medium">
                    support@geargrab.co
                  </a>
                </div>
                <div class="bg-gray-50 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
                  <p class="text-gray-600 mb-4">Chat with us during business hours</p>
                  <button class="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                    Start Chat
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Coming Soon</h2>
            <p class="text-gray-600">This help section is being updated. Please check back soon or contact support for assistance.</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />
