<script lang="ts">
  export const prerender = true;
  import ScrollAnimated from '$lib/components/layout/scroll-animated.svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import { onMount } from 'svelte';

  let heroVisible = false;

  onMount(() => {
    setTimeout(() => {
      heroVisible = true;
    }, 300);
  });
</script>

<svelte:head>
  <title>About - GearGrab</title>
  <meta name="description" content="Learn about GearGrab's mission to connect outdoor enthusiasts through gear sharing and adventure." />
</svelte:head>

<!-- Full Page Video Background -->
<VideoBackground
  videoSrc="/1877846-hd_1920_1080_30fps.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity="{0.4}"
/>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen">
  <!-- Hero Content -->
  <div class="relative h-60 flex flex-col items-center justify-center text-center text-white px-4 pt-20">
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 {heroVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'} transition-all duration-800">About GearGrab</h1>
    <p class="text-lg md:text-xl max-w-2xl mx-auto {heroVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0 translate-y-8'} transition-all duration-800">Connecting outdoor enthusiasts through gear sharing and adventure.</p>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

      <!-- Main Content -->
      <ScrollAnimated animation="fade-up" delay="{400}">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 class="text-3xl font-bold text-white mb-6 drop-shadow-lg">Our Mission</h2>
          <p class="text-gray-200 mb-4 text-lg drop-shadow-lg">
            GearGrab was born from a simple idea: outdoor gear shouldn't sit unused in garages when it could be helping others explore the great outdoors.
          </p>
          <p class="text-gray-200 mb-4 text-lg drop-shadow-lg">
            We believe that sharing gear creates stronger communities, reduces environmental impact, and makes outdoor adventures more accessible to everyone.
          </p>
          <p class="text-gray-200 text-lg drop-shadow-lg">
            Whether you're a weekend warrior or a seasoned adventurer, GearGrab connects you with the equipment you need and the community you want to be part of.
          </p>
        </div>
        <div class="relative h-64 rounded-lg overflow-hidden shadow-lg bg-gray-800/20 backdrop-blur-sm border border-gray-600/30">
          <img
            src="https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            alt="Hikers on mountain trail"
            class="w-full h-full object-cover opacity-80"
          />
        </div>
      </ScrollAnimated>

      <ScrollAnimated animation="fade-up" delay="{600}">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <ScrollAnimated animation="fade-left" delay="{800}">
            <div class="text-center">
              <div class="w-16 h-16 bg-green-600/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2 text-white drop-shadow-lg">Community Driven</h3>
              <p class="text-gray-200 drop-shadow-lg">Built by outdoor enthusiasts, for outdoor enthusiasts. We understand your needs because we share your passion.</p>
            </div>
          </ScrollAnimated>

          <ScrollAnimated animation="fade-up" delay="{950}">
            <div class="text-center">
              <div class="w-16 h-16 bg-green-600/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2 text-white drop-shadow-lg">Safe & Secure</h3>
              <p class="text-gray-200 drop-shadow-lg">Every transaction is protected with insurance coverage and our trusted verification system.</p>
            </div>
          </ScrollAnimated>

          <ScrollAnimated animation="fade-right" delay="{1100}">
            <div class="text-center">
              <div class="w-16 h-16 bg-green-600/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2 text-white drop-shadow-lg">Sustainable</h3>
              <p class="text-gray-200 drop-shadow-lg">Reduce waste and environmental impact by sharing gear instead of buying new equipment for occasional use.</p>
            </div>
          </ScrollAnimated>
        </div>
      </ScrollAnimated>

      <!-- Call to Action -->
      <ScrollAnimated animation="scale-in" delay="{1300}">
        <div class="text-center text-white">
          <h2 class="text-3xl md:text-4xl font-bold mb-6 drop-shadow-lg">Ready to Join Our Community?</h2>
          <p class="text-xl max-w-2xl mx-auto mb-8 text-gray-200 drop-shadow-lg">Start sharing gear and connecting with fellow adventurers today.</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/browse" class="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg">Browse Gear</a>
            <a href="/list-gear" class="bg-transparent border-2 border-white/70 text-white hover:bg-white/20 hover:border-white text-lg px-8 py-3 rounded-lg font-semibold transition-colors backdrop-blur-sm">List Your Gear</a>
          </div>
        </div>
      </ScrollAnimated>

    </div>
  </div>
</div>
