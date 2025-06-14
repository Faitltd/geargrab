<script lang="ts">
  export const prerender = true;
  import ScrollAnimated from '$lib/components/layout/scroll-animated.svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';

  let heroVisible = false;
  let activeCategory = 'general';
  let openFAQ: string | null = null;

  onMount(() => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);
  });

  const categories = [
    { id: 'general', name: 'General' },
    { id: 'renting', name: 'Renting Gear' },
    { id: 'listing', name: 'Listing Gear' },
    { id: 'payments', name: 'Payments & Billing' },
    { id: 'safety', name: 'Safety & Insurance' }
  ];

  const faqs = {
    general: [
      {
        id: 'what-is-geargrab',
        question: 'What is GearGrab?',
        answer: 'GearGrab is a peer-to-peer marketplace where outdoor enthusiasts can rent gear from local owners. Whether you need equipment for a weekend camping trip or want to earn money from gear sitting in your garage, GearGrab connects you with your local outdoor community.'
      },
      {
        id: 'how-does-it-work',
        question: 'How does GearGrab work?',
        answer: 'It\'s simple! Renters can browse and book gear from verified local owners, while gear owners can list their equipment to earn money. All transactions are protected with insurance coverage and secure payments.'
      },
      {
        id: 'where-available',
        question: 'Where is GearGrab available?',
        answer: 'GearGrab is currently available throughout the United States, with the highest concentration of gear in outdoor recreation areas like Colorado, California, Utah, and the Pacific Northwest.'
      }
    ],
    renting: [
      {
        id: 'how-to-rent',
        question: 'How do I rent gear?',
        answer: 'Browse our listings, select your dates, choose transfer options, and book securely. You can pick up gear from the owner or arrange delivery to your location or trailhead.'
      },
      {
        id: 'gear-condition',
        question: 'How do I know the gear is in good condition?',
        answer: 'All gear owners provide detailed condition reports, photos, and descriptions. You can also message owners directly with questions. Every rental includes damage protection for your peace of mind.'
      },
      {
        id: 'cancellation-policy',
        question: 'What is the cancellation policy?',
        answer: 'Cancellation policies vary by owner, but most offer free cancellation up to 48 hours before your rental start date. Check the specific listing for details.'
      },
      {
        id: 'transfer-options',
        question: 'What transfer options are available?',
        answer: 'Options include pickup from the owner, delivery to your location, delivery to trailheads, and shipping for smaller items. Delivery fees vary by distance and item size.'
      }
    ],
    listing: [
      {
        id: 'what-can-i-list',
        question: 'What gear can I list?',
        answer: 'You can list most outdoor recreation equipment including camping gear, hiking equipment, bikes, kayaks, skis, climbing gear, and more. Items must be in good working condition and safe to use.'
      },
      {
        id: 'how-much-earn',
        question: 'How much can I earn?',
        answer: 'Earnings vary by gear type, condition, and local demand. Popular items like premium tents, bikes, and kayaks can earn $100-500+ per month. Our pricing tool helps you set competitive rates.'
      },
      {
        id: 'listing-fees',
        question: 'Are there fees for listing gear?',
        answer: 'Listing gear is free! We only charge a small service fee (typically 10-15%) when your gear is successfully rented. You keep the majority of the rental income.'
      },
      {
        id: 'gear-protection',
        question: 'What if my gear gets damaged?',
        answer: 'Every rental includes damage protection. Minor wear is expected, but significant damage is covered by our insurance policy. Renters also provide security deposits for additional protection.'
      }
    ],
    payments: [
      {
        id: 'payment-methods',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through our encrypted payment system.'
      },
      {
        id: 'when-charged',
        question: 'When am I charged for a rental?',
        answer: 'Your payment method is charged when your booking is confirmed by the gear owner. For longer rentals, we may split payments or require a deposit upfront.'
      },
      {
        id: 'security-deposits',
        question: 'How do security deposits work?',
        answer: 'Security deposits are held (not charged) on your payment method during the rental period. They\'re automatically released when you return the gear in good condition.'
      },
      {
        id: 'owner-payments',
        question: 'How do gear owners get paid?',
        answer: 'Owners receive payment within 24 hours of the rental completion, minus our service fee. Payments are sent directly to your bank account or PayPal.'
      }
    ],
    safety: [
      {
        id: 'user-verification',
        question: 'How are users verified?',
        answer: 'All users complete identity verification including government ID, phone number, and email confirmation. We also run background checks and maintain user ratings and reviews.'
      },
      {
        id: 'insurance-coverage',
        question: 'What insurance coverage is included?',
        answer: 'Every rental includes liability coverage and damage protection. This covers accidental damage to gear and provides liability protection for both renters and owners during the rental period.'
      },
      {
        id: 'dispute-resolution',
        question: 'What if there\'s a problem with my rental?',
        answer: 'Our support team is available 24/7 to help resolve any issues. We have clear policies for damage claims, late returns, and other disputes to ensure fair resolution for all parties.'
      },
      {
        id: 'gear-safety',
        question: 'How do you ensure gear safety?',
        answer: 'Gear owners are required to maintain their equipment in safe working condition. We encourage renters to inspect gear before use and provide safety guidelines for all equipment categories.'
      }
    ]
  };

  function toggleFAQ(faqId: string) {
    openFAQ = openFAQ === faqId ? null : faqId;
  }
</script>

<svelte:head>
  <title>FAQ - GearGrab</title>
  <meta name="description" content="Find answers to frequently asked questions about GearGrab, the outdoor gear rental marketplace. Learn about renting, listing, payments, and safety." />
</svelte:head>

<!-- Full Page Video Background -->
<VideoBackground
  videoSrc="/1877846-hd_1920_1080_30fps.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity={0.4}
/>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen">
  <!-- Hero Content -->
  <div class="relative h-60 flex flex-col items-center justify-center text-center text-white px-4 pt-20">
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 {heroVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'} transition-all duration-800">Frequently Asked Questions</h1>
    <p class="text-lg md:text-xl max-w-2xl mx-auto {heroVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0 translate-y-8'} transition-all duration-800">Find answers to common questions about GearGrab.</p>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

      <!-- FAQ Content -->
      <div class="max-w-4xl mx-auto">
        <!-- Category Navigation -->
        <ScrollAnimated animation="fade-up" delay={400}>
          <div class="flex flex-wrap justify-center gap-2 mb-12">
            {#each categories as category}
              <button
                class={`px-4 py-2 rounded-lg font-medium transition-colors shadow-lg ${activeCategory === category.id ? 'bg-green-600/80 backdrop-blur-sm border border-green-500/30 text-white' : 'bg-gray-800/70 backdrop-blur-sm text-white border border-gray-600/50 hover:border-green-400 hover:text-green-400'}`}
                on:click={() => activeCategory = category.id}
              >
                {category.name}
              </button>
            {/each}
          </div>
        </ScrollAnimated>

        <!-- FAQ Items -->
        <ScrollAnimated animation="fade-up" delay={600}>
          <div class="space-y-4">
            {#each faqs[activeCategory] as faq, index}
              <ScrollAnimated animation="fade-up" delay={800 + (index * 100)}>
                <div class="border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm shadow-lg hover:bg-white/20 transition-colors">
                  <button
                    class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 focus:outline-none focus:bg-white/5 transition-colors"
                    on:click={() => toggleFAQ(faq.id)}
                  >
                    <h3 class="text-lg font-medium text-white drop-shadow-lg">{faq.question}</h3>
                    <svg
                      class={`w-5 h-5 text-gray-300 transition-transform duration-500 ${openFAQ === faq.id ? 'transform rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>

                  {#if openFAQ === faq.id}
                    <div class="px-6 pb-4 border-t border-white/10" transition:slide={{ duration: 600 }}>
                      <p class="text-gray-200 leading-relaxed drop-shadow-lg pt-4">{faq.answer}</p>
                    </div>
                  {/if}
                </div>
              </ScrollAnimated>
            {/each}
          </div>
        </ScrollAnimated>

      </div>

    </div>
  </div>
</div>
