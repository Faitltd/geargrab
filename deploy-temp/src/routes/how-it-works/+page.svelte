<script lang="ts">
  import { onMount } from 'svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';

  export const prerender = true;

  let heroVisible = false;

  onMount(() => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);
  });

  // Steps for renters
  const renterSteps = [
    {
      id: 1,
      title: 'Browse & Search',
      icon: 'search',
      description: 'Search thousands of outdoor gear listings from verified local owners in your area.',
      details: 'Use our advanced filters to find exactly what you need by category, location, price, and availability.'
    },
    {
      id: 2,
      title: 'Book & Pay',
      icon: 'calendar',
      description: 'Select your dates, choose transfer options, and pay securely through our platform.',
      details: 'All payments are processed securely with insurance coverage and damage protection included.'
    },
    {
      id: 3,
      title: 'Get Your Gear',
      icon: 'truck',
      description: 'Pick up your gear or have it delivered, then start your adventure.',
      details: 'Meet the owner for pickup, or choose convenient transfer options including doorstep delivery.'
    },
    {
      id: 4,
      title: 'Adventure & Return',
      icon: 'mountain',
      description: 'Enjoy your outdoor adventure and return the gear when you\'re done.',
      details: 'Use the gear for your adventure, then return it clean and in the same condition you received it.'
    }
  ];

  // Steps for owners
  const ownerSteps = [
    {
      id: 1,
      title: 'List Your Gear',
      icon: 'plus',
      description: 'Create detailed listings for your outdoor equipment with photos and descriptions.',
      details: 'Upload high-quality photos, set competitive prices, and describe your gear\'s condition and features.'
    },
    {
      id: 2,
      title: 'Get Bookings',
      icon: 'bell',
      description: 'Receive booking requests from verified renters in your area.',
      details: 'Review renter profiles, communicate through our messaging system, and approve bookings.'
    },
    {
      id: 3,
      title: 'Meet & Handoff',
      icon: 'handshake',
      description: 'Meet the renter and hand over your gear, or arrange convenient transfer.',
      details: 'Inspect the gear together, provide usage tips, and ensure the renter is comfortable with the equipment.'
    },
    {
      id: 4,
      title: 'Earn Money',
      icon: 'dollar',
      description: 'Get paid automatically when the rental is complete and gear is returned.',
      details: 'Receive payment directly to your account, minus our small service fee. Rate your experience with the renter.'
    }
  ];

  let activeTab = 'renter';
</script>

<svelte:head>
  <title>How It Works - GearGrab</title>
  <meta name="description" content="Learn how GearGrab works for both renters and gear owners. Step-by-step guide to renting and listing outdoor equipment." />
</svelte:head>

<!-- Full Page Video Background -->
<VideoBackground
  videoSrc="/857134-hd_1280_720_24fps.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity="{0.3}"
/>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen">
  <!-- Hero Content -->
  <div class="relative h-60 flex flex-col items-center justify-center text-center text-white px-4 pt-20">
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 {heroVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'} transition-all duration-800">How GearGrab Works</h1>
    <p class="text-lg md:text-xl max-w-2xl mx-auto {heroVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0 translate-y-8'} transition-all duration-800">Simple steps to rent gear or earn money by sharing your outdoor equipment.</p>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

      <!-- Tab Navigation -->
      <ScrollLinkedAnimator animation="scale-in" startOffset="{0}" endOffset="{0.4}">
        <div class="flex justify-center mb-12">
          <div class="bg-gray-800/70 backdrop-blur-sm p-1 rounded-lg border border-gray-600/50 shadow-lg">
            <button
              class={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'renter' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
              on:click={() => activeTab = 'renter'}
            >
              For Renters
            </button>
            <button
              class={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'owner' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
              on:click={() => activeTab = 'owner'}
            >
              For Gear Owners
            </button>
          </div>
        </div>
      </ScrollLinkedAnimator>

      <!-- Steps Content -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {#each (activeTab === 'renter' ? renterSteps : ownerSteps) as step, index}
          <ScrollLinkedAnimator animation="scale-in" startOffset={0.1 + (index * 0.05)} endOffset={0.6 + (index * 0.05)}>
            <div class="text-center">
              <div class="w-16 h-16 bg-green-600/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg">
                {#if step.icon === 'search'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                {:else if step.icon === 'calendar'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                {:else if step.icon === 'truck'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                {:else if step.icon === 'mountain'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                {:else if step.icon === 'plus'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                {:else if step.icon === 'bell'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.343 12.344l1.414 1.414L12 7.515l6.243 6.243 1.414-1.414L12 4.686z" />
                  </svg>
                {:else if step.icon === 'handshake'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                {:else if step.icon === 'dollar'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                {/if}
              </div>
              <div class="text-2xl font-bold text-green-400 mb-2 drop-shadow-lg">{step.id}</div>
              <h3 class="text-xl font-bold mb-3 text-white drop-shadow-lg">{step.title}</h3>
              <p class="text-gray-200 mb-3 drop-shadow-lg">{step.description}</p>
              <p class="text-sm text-gray-300 drop-shadow-lg">{step.details}</p>
            </div>
          </ScrollLinkedAnimator>
        {/each}
      </div>

      <!-- Safety & Trust Section -->
      <ScrollLinkedAnimator animation="scale-in" startOffset="{0.2}" endOffset="{0.7}">
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-center mb-12 text-white drop-shadow-lg">Safety & Trust</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollLinkedAnimator animation="scale-in" startOffset="{0.3}" endOffset="{0.8}">
              <div class="text-center">
                <div class="w-16 h-16 bg-green-600/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3 text-white drop-shadow-lg">Verified Users</h3>
                <p class="text-gray-200 drop-shadow-lg">All users go through identity verification and background checks for your safety and peace of mind.</p>
              </div>
            </ScrollLinkedAnimator>

            <ScrollLinkedAnimator animation="scale-in" startOffset="{0.35}" endOffset="{0.85}">
              <div class="text-center">
                <div class="w-16 h-16 bg-green-600/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3 text-white drop-shadow-lg">Secure Payments</h3>
                <p class="text-gray-200 drop-shadow-lg">All payments are processed securely through encrypted channels with fraud protection and dispute resolution.</p>
              </div>
            </ScrollLinkedAnimator>

            <ScrollLinkedAnimator animation="scale-in" startOffset="{0.4}" endOffset="{0.9}">
              <div class="text-center">
                <div class="w-16 h-16 bg-green-600/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3 text-white drop-shadow-lg">Insurance Coverage</h3>
                <p class="text-gray-200 drop-shadow-lg">Every rental includes damage protection and liability coverage to protect both renters and gear owners.</p>
              </div>
            </ScrollLinkedAnimator>
          </div>
        </div>
      </ScrollLinkedAnimator>

      <!-- Call to Action Section -->
      <ScrollLinkedAnimator animation="scale-in" startOffset="{0.2}" endOffset="{0.7}">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold mb-4 text-white drop-shadow-lg">Ready to Start Your Adventure?</h2>
          <p class="text-lg mb-6 text-gray-200 drop-shadow-lg">Join thousands of outdoor enthusiasts sharing and renting gear.</p>
          <div class="space-x-4">
            <a href="/browse" class="bg-green-600/80 backdrop-blur-sm hover:bg-green-700/80 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-green-500/30 shadow-lg">
              Browse Gear
            </a>
            <a href="/list-gear" class="bg-transparent border-2 border-white/70 text-white hover:bg-white/20 hover:border-white px-6 py-3 rounded-lg font-medium transition-colors backdrop-blur-sm">
              List Your Gear
            </a>
          </div>
        </div>
      </ScrollLinkedAnimator>

      <!-- FAQ Section -->
      <ScrollLinkedAnimator animation="scale-in" startOffset="{0.2}" endOffset="{0.7}">
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-center mb-12 text-white drop-shadow-lg">Frequently Asked Questions</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollLinkedAnimator animation="scale-in" startOffset="{0.3}" endOffset="{0.8}">
              <div>
                <h3 class="text-lg font-bold mb-2 text-white drop-shadow-lg">How do I know the gear is in good condition?</h3>
                <p class="text-gray-200 mb-4 drop-shadow-lg">All gear owners provide detailed condition reports and photos. You can also message owners directly with questions before booking.</p>

                <h3 class="text-lg font-bold mb-2 text-white drop-shadow-lg">What if something gets damaged?</h3>
                <p class="text-gray-200 mb-4 drop-shadow-lg">Every rental includes damage protection. Minor wear is expected, but significant damage is covered by our insurance policy.</p>

                <h3 class="text-lg font-bold mb-2 text-white drop-shadow-lg">How do I get my gear to the adventure location?</h3>
                <p class="text-gray-200 drop-shadow-lg">Choose from pickup, delivery, or shipping options. Many owners offer convenient transfer to trailheads or adventure locations.</p>
              </div>
            </ScrollLinkedAnimator>

            <ScrollLinkedAnimator animation="scale-in" startOffset="{0.35}" endOffset="{0.85}">
              <div>
                <h3 class="text-lg font-bold mb-2 text-white drop-shadow-lg">How much can I earn renting out my gear?</h3>
                <p class="text-gray-200 mb-4 drop-shadow-lg">Earnings vary by gear type and demand, but many owners earn $100-500+ per month from gear that would otherwise sit unused.</p>

                <h3 class="text-lg font-bold mb-2 text-white drop-shadow-lg">What if a renter doesn't return my gear?</h3>
                <p class="text-gray-200 mb-4 drop-shadow-lg">All renters provide security deposits and are verified. Our support team helps resolve any issues quickly.</p>

                <h3 class="text-lg font-bold mb-2 text-white drop-shadow-lg">How do I set competitive prices?</h3>
                <p class="text-gray-200 drop-shadow-lg">Our platform provides pricing suggestions based on similar gear in your area, condition, and demand.</p>
              </div>
            </ScrollLinkedAnimator>
          </div>
        </div>
      </ScrollLinkedAnimator>

    </div>
  </div>
</div>
