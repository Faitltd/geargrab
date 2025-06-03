<script lang="ts">
  export const prerender = true;
  import ScrollAnimated from '$lib/components/layout/ScrollAnimated.svelte';
  import { onMount } from 'svelte';

  let videoElement: HTMLVideoElement;
  let heroVisible = false;

  // Video event handlers
  function handleVideoLoaded() {
    if (videoElement) {
      videoElement.style.opacity = '1';
    }
  }

  function handleVideoError() {
    if (videoElement) {
      videoElement.style.display = 'none';
    }
  }

  onMount(() => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);
  });

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'play',
      description: 'Learn the basics of using GearGrab',
      articles: [
        { title: 'How to create an account', link: '#' },
        { title: 'Verifying your identity', link: '#' },
        { title: 'Setting up your profile', link: '#' },
        { title: 'Understanding our community guidelines', link: '#' }
      ]
    },
    {
      id: 'renting',
      title: 'Renting Gear',
      icon: 'search',
      description: 'Everything about finding and booking gear',
      articles: [
        { title: 'How to search for gear', link: '#' },
        { title: 'Understanding gear conditions', link: '#' },
        { title: 'Booking and payment process', link: '#' },
        { title: 'Pickup and transfer options', link: '#' },
        { title: 'What to do if gear is damaged', link: '#' }
      ]
    },
    {
      id: 'listing',
      title: 'Listing Your Gear',
      icon: 'plus',
      description: 'Start earning by sharing your equipment',
      articles: [
        { title: 'Creating your first listing', link: '#' },
        { title: 'Taking great photos', link: '#' },
        { title: 'Setting competitive prices', link: '#' },
        { title: 'Managing your calendar', link: '#' },
        { title: 'Handling bookings and communication', link: '#' }
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Trust',
      icon: 'shield',
      description: 'Stay safe and build trust in our community',
      articles: [
        { title: 'User verification process', link: '#' },
        { title: 'Insurance coverage explained', link: '#' },
        { title: 'Reporting safety concerns', link: '#' },
        { title: 'Dispute resolution process', link: '#' }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Billing',
      icon: 'credit-card',
      description: 'Understand payments, fees, and payouts',
      articles: [
        { title: 'Payment methods and security', link: '#' },
        { title: 'Understanding fees', link: '#' },
        { title: 'Security deposits explained', link: '#' },
        { title: 'Getting paid as a gear owner', link: '#' },
        { title: 'Refunds and cancellations', link: '#' }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: 'cog',
      description: 'Troubleshoot technical issues',
      articles: [
        { title: 'App not working properly', link: '#' },
        { title: 'Login and password issues', link: '#' },
        { title: 'Photo upload problems', link: '#' },
        { title: 'Notification settings', link: '#' }
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: 'mail',
      link: '/contact',
      color: 'blue'
    },
    {
      title: 'Report an Issue',
      description: 'Report safety or technical issues',
      icon: 'flag',
      link: '/contact?category=support',
      color: 'red'
    },
    {
      title: 'Community Guidelines',
      description: 'Learn about our community standards',
      icon: 'users',
      link: '/community-guidelines',
      color: 'blue'
    }
  ];
</script>

<svelte:head>
  <title>Help Center - GearGrab</title>
  <meta name="description" content="Get help and support for using GearGrab. Find answers to common questions and learn how to make the most of our outdoor gear rental platform." />
</svelte:head>

<!-- Full Page Video Background -->
<div class="fixed inset-0 z-0">
  <!-- Background Image (always visible as fallback) -->
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape with stars"
      class="w-full h-full object-cover"
    >
  </div>

  <!-- Video Background (overlays image when loaded) -->
  <video
    bind:this={videoElement}
    class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
    style="opacity: 1;"
    autoplay
    muted
    loop
    playsinline
    on:loadeddata={handleVideoLoaded}
    on:error={handleVideoError}
    on:loadstart={() => console.log('Help video load started')}
  >
    <!-- Outdoor gear/equipment video for help page -->
    <source src="/857134-hd_1280_720_24fps.mp4" type="video/mp4" />
    <!-- Fallback videos -->
    <source src="https://player.vimeo.com/external/291648067.hd.mp4?s=94998971682c6a3267e4cbd19d16a7b6c720f345&profile_id=175" type="video/mp4" />
  </video>

  <!-- Light Overlay for Text Readability -->
  <div class="absolute inset-0 bg-black opacity-30"></div>
</div>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen">
  <!-- Hero Content -->
  <div class="relative h-60 flex flex-col items-center justify-center text-center text-white px-4 pt-20">
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 {heroVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'} transition-all duration-800">Help Center</h1>
    <p class="text-lg md:text-xl max-w-2xl mx-auto {heroVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0 translate-y-8'} transition-all duration-800">Get help and support for using GearGrab.</p>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

      <!-- Quick Actions -->
      <ScrollAnimated animation="fade-up" delay={400}>
        <div class="mb-16">
          <h2 class="text-2xl font-bold text-center mb-8 text-white drop-shadow-lg">Need immediate help?</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each quickActions as action, index}
              <ScrollAnimated animation="fade-up" delay={600 + (index * 150)}>
                <a
                  href={action.link}
                  class="block p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors shadow-lg"
                >
                  <div class="flex items-center mb-3">
                    <div class={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 backdrop-blur-sm border shadow-lg ${
                      action.color === 'green' ? 'bg-green-600/20 border-green-500/30' :
                      action.color === 'red' ? 'bg-red-600/20 border-red-500/30' : 'bg-blue-600/20 border-blue-500/30'
                    }`}>
                      {#if action.icon === 'mail'}
                        <svg xmlns="http://www.w3.org/2000/svg" class={`h-5 w-5 ${
                          action.color === 'green' ? 'text-green-400' :
                          action.color === 'red' ? 'text-red-400' : 'text-blue-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      {:else if action.icon === 'flag'}
                        <svg xmlns="http://www.w3.org/2000/svg" class={`h-5 w-5 ${
                          action.color === 'green' ? 'text-green-400' :
                          action.color === 'red' ? 'text-red-400' : 'text-blue-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2h7a2 2 0 012 2v6a2 2 0 01-2 2H12l-1-2H5a2 2 0 00-2 2z" />
                        </svg>
                      {:else if action.icon === 'users'}
                        <svg xmlns="http://www.w3.org/2000/svg" class={`h-5 w-5 ${
                          action.color === 'green' ? 'text-green-400' :
                          action.color === 'red' ? 'text-red-400' : 'text-blue-400'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      {/if}
                    </div>
                    <h3 class="text-lg font-medium text-white drop-shadow-lg">{action.title}</h3>
                  </div>
                  <p class="text-gray-200 drop-shadow-lg">{action.description}</p>
                </a>
              </ScrollAnimated>
            {/each}
          </div>
        </div>
      </ScrollAnimated>

      <!-- Help Categories -->
      <ScrollAnimated animation="fade-up" delay={1000}>
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-center mb-12 text-white drop-shadow-lg">Browse Help Topics</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each helpCategories as category, index}
              <ScrollAnimated animation="fade-up" delay={1200 + (index * 100)}>
                <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 shadow-lg hover:bg-white/20 transition-colors">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 border border-white/30 shadow-lg">
                      {#if category.icon === 'play'}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h10a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                        </svg>
                      {:else if category.icon === 'search'}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      {:else if category.icon === 'plus'}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                      {:else if category.icon === 'shield'}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      {:else if category.icon === 'credit-card'}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      {:else if category.icon === 'cog'}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      {/if}
                    </div>
                    <h3 class="text-xl font-bold text-white drop-shadow-lg">{category.title}</h3>
                  </div>

                  <p class="text-gray-200 mb-4 drop-shadow-lg">{category.description}</p>

                  <ul class="space-y-2">
                    {#each category.articles as article}
                      <li>
                        <a href={article.link} class="text-gray-300 hover:text-white text-sm drop-shadow-lg">
                          {article.title}
                        </a>
                      </li>
                    {/each}
                  </ul>
                </div>
              </ScrollAnimated>
            {/each}
          </div>
        </div>
      </ScrollAnimated>

      <!-- Call to Action -->
      <ScrollAnimated animation="scale-in" delay={1800}>
        <div class="text-center text-white">
          <h2 class="text-2xl md:text-3xl font-bold mb-4 drop-shadow-lg">Still Need Help?</h2>
          <p class="text-lg max-w-2xl mx-auto mb-6 text-gray-200 drop-shadow-lg">Our support team is here to help you with any questions or issues.</p>
          <a href="/contact" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-lg px-8 py-3 rounded-lg font-semibold transition-colors border border-white/30 shadow-lg">Contact Support</a>
        </div>
      </ScrollAnimated>

    </div>
  </div>
</div>
