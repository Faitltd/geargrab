<script lang="ts">
  export const prerender = true;
  import ScrollAnimated from '$lib/components/layout/scroll-animated.svelte';
  import ContactSection from '$lib/components/forms/contact-section.svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import { onMount } from 'svelte';

  let heroVisible = false;

  onMount(() => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);
  });

  let formData = {
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  };

  let isSubmitting = false;
  let submitted = false;

  const categories = [
    { id: 'general', name: 'General Inquiry' },
    { id: 'support', name: 'Technical Support' },
    { id: 'billing', name: 'Billing & Payments' },
    { id: 'safety', name: 'Safety & Trust' },
    { id: 'partnership', name: 'Partnership Opportunities' },
    { id: 'press', name: 'Press & Media' }
  ];

  async function handleSubmit() {
    isSubmitting = true;

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Form submitted successfully
    submitted = true;
    isSubmitting = false;

    // Reset form
    formData = {
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general'
    };
  }
</script>

<svelte:head>
  <title>Contact Us - GearGrab</title>
  <meta name="description" content="Get in touch with GearGrab. We're here to help with questions, support, and feedback about our outdoor gear rental platform." />
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
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 {heroVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'} transition-all duration-800">Contact Us</h1>
    <p class="text-lg md:text-xl max-w-2xl mx-auto {heroVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0 translate-y-8'} transition-all duration-800">We're here to help with questions, support, and feedback.</p>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Contact Form -->
        <ScrollAnimated animation="fade-left" delay="{400}">
          <div>
          <h2 class="text-2xl font-bold mb-6 text-white drop-shadow-lg">Send us a message</h2>

          {#if submitted}
            <div class="bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-6 mb-6 shadow-lg">
              <div class="flex items-center">
                <svg class="h-6 w-6 text-green-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 class="text-lg font-medium text-white drop-shadow-lg">Message sent successfully!</h3>
                  <p class="text-gray-200 drop-shadow-lg">We'll get back to you within 24 hours.</p>
                </div>
              </div>
            </div>
          {/if}

          <form on:submit|preventDefault="{handleSubmit}" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Name *</label>
                <input
                  type="text"
                  id="name"
                  class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
                  placeholder="Your full name"
                  bind:value="{formData.name}"
                  required
                />
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Email *</label>
                <input
                  type="email"
                  id="email"
                  class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
                  placeholder="your.email@example.com"
                  bind:value="{formData.email}"
                  required
                />
              </div>
            </div>

            <div>
              <label for="category" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Category</label>
              <select
                id="category"
                class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white focus:ring-green-500 focus:border-green-500 shadow-lg"
                bind:value="{formData.category}"
              >
                {#each categories as category}
                  <option value="{category.id}" class="bg-gray-800 text-white">{category.name}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="subject" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Subject *</label>
              <input
                type="text"
                id="subject"
                class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
                placeholder="Brief description of your inquiry"
                bind:value="{formData.subject}"
                required
              />
            </div>

            <div>
              <label for="message" class="block text-sm font-medium text-white mb-2 drop-shadow-lg">Message *</label>
              <textarea
                id="message"
                rows="6"
                class="block w-full rounded-lg bg-gray-800/70 backdrop-blur-sm border-gray-600/50 text-white placeholder-gray-300 focus:ring-green-500 focus:border-green-500 shadow-lg"
                placeholder="Please provide details about your inquiry..."
                bind:value="{formData.message}"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              class="w-full bg-green-600/80 backdrop-blur-sm hover:bg-green-700/80 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-green-500/30 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled="{isSubmitting}"
            >
              {#if isSubmitting}
                <svg class="animate-spin h-5 w-5 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              {:else}
                Send Message
              {/if}
            </button>
          </form>
          </div>
        </ScrollAnimated>

        <!-- Contact Information -->
        <ScrollAnimated animation="fade-right" delay="{600}">
          <div>
          <h2 class="text-2xl font-bold mb-6 text-white drop-shadow-lg">Get in touch</h2>

          <div class="space-y-6">
            <div class="flex items-start">
              <div class="w-12 h-12 bg-green-600/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 flex-shrink-0 border border-green-500/30 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-medium mb-1 text-white drop-shadow-lg">Email Support</h3>
                <p class="text-gray-200 mb-2 drop-shadow-lg">For general inquiries and support</p>
                <a href="mailto:support@geargrab.com" class="text-green-400 hover:text-green-300 drop-shadow-lg">support@geargrab.com</a>
              </div>
            </div>

            <div class="flex items-start">
              <div class="w-12 h-12 bg-green-600/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 flex-shrink-0 border border-green-500/30 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-medium mb-1 text-white drop-shadow-lg">Phone Support</h3>
                <p class="text-gray-200 mb-2 drop-shadow-lg">Monday - Friday, 9AM - 6PM MST</p>
                <a href="tel:+1-555-GEAR-GRAB" class="text-green-400 hover:text-green-300 drop-shadow-lg">+1 (555) GEAR-GRAB</a>
              </div>
            </div>

            <div class="flex items-start">
              <div class="w-12 h-12 bg-green-600/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 flex-shrink-0 border border-green-500/30 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-medium mb-1 text-white drop-shadow-lg">Office Location</h3>
                <p class="text-gray-200 drop-shadow-lg">
                  1234 Mountain View Drive<br />
                  Boulder, CO 80302<br />
                  United States
                </p>
              </div>
            </div>

            <div class="flex items-start">
              <div class="w-12 h-12 bg-green-600/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 flex-shrink-0 border border-green-500/30 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-medium mb-1 text-white drop-shadow-lg">Response Time</h3>
                <p class="text-gray-200 drop-shadow-lg">
                  We typically respond to all inquiries within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>
          </div>
        </ScrollAnimated>
      </div>

    </div>
  </div>
</div>
