<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { showToast } from '$lib/stores/toast.store';

  let formData = {
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  };

  let isSubmitting = false;
  let errors = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'safety', label: 'Safety & Security' },
    { value: 'partnership', label: 'Business Partnership' },
    { value: 'press', label: 'Press & Media' }
  ];

  function validateForm() {
    errors = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };

    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
      isValid = false;
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
      isValid = false;
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters long';
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast('success', 'Message sent successfully! We\'ll get back to you within 24 hours.');
      
      // Reset form
      formData = {
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      };
    } catch (error) {
      showToast('error', 'Failed to send message. Please try again.');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Contact Us - GearGrab</title>
  <meta name="description" content="Get in touch with GearGrab support team. We're here to help with any questions or issues." />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Have a question or need help? We're here to assist you. Send us a message and we'll get back to you as soon as possible.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Contact Information -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-2xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
          
          <div class="space-y-6">
            <!-- Email -->
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-primary-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Email</h3>
                <p class="text-gray-600">support@geargrab.com</p>
                <p class="text-sm text-gray-500 mt-1">We typically respond within 24 hours</p>
              </div>
            </div>

            <!-- Phone -->
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-primary-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Phone</h3>
                <p class="text-gray-600">+1 (555) 123-4567</p>
                <p class="text-sm text-gray-500 mt-1">Mon-Fri, 9am-6pm PST</p>
              </div>
            </div>

            <!-- Address -->
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-primary-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Office</h3>
                <p class="text-gray-600">
                  123 Main Street<br>
                  San Francisco, CA 94105<br>
                  United States
                </p>
              </div>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="mt-8 pt-8 border-t border-gray-200">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
            <div class="space-y-2">
              <a href="/help" class="block text-primary-600 hover:text-primary-700 transition-colors">
                Help Center
              </a>
              <a href="/terms" class="block text-primary-600 hover:text-primary-700 transition-colors">
                Terms of Service
              </a>
              <a href="/privacy" class="block text-primary-600 hover:text-primary-700 transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-2xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
          
          <form on:submit={handleSubmit} class="space-y-6">
            <!-- Name and Email -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  bind:value={formData.name}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  class:border-red-500={errors.name}
                  placeholder="Your full name"
                />
                {#if errors.name}
                  <p class="mt-1 text-sm text-red-600">{errors.name}</p>
                {/if}
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  bind:value={formData.email}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  class:border-red-500={errors.email}
                  placeholder="your@email.com"
                />
                {#if errors.email}
                  <p class="mt-1 text-sm text-red-600">{errors.email}</p>
                {/if}
              </div>
            </div>

            <!-- Category -->
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                bind:value={formData.category}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                {#each categories as category}
                  <option value={category.value}>{category.label}</option>
                {/each}
              </select>
            </div>

            <!-- Subject -->
            <div>
              <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                bind:value={formData.subject}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                class:border-red-500={errors.subject}
                placeholder="Brief description of your inquiry"
              />
              {#if errors.subject}
                <p class="mt-1 text-sm text-red-600">{errors.subject}</p>
              {/if}
            </div>

            <!-- Message -->
            <div>
              <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                bind:value={formData.message}
                rows="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-vertical"
                class:border-red-500={errors.message}
                placeholder="Please provide details about your inquiry..."
              ></textarea>
              {#if errors.message}
                <p class="mt-1 text-sm text-red-600">{errors.message}</p>
              {/if}
            </div>

            <!-- Submit Button -->
            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />
