<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  let showContactForm = false;
  let formData = {
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  };
  let submitting = false;
  let submitted = false;
  let error = '';

  const supportCategories = [
    { value: 'general', label: 'General Question' },
    { value: 'booking', label: 'Booking Issue' },
    { value: 'payment', label: 'Payment Problem' },
    { value: 'verification', label: 'Verification Help' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'safety', label: 'Safety Concern' },
    { value: 'other', label: 'Other' }
  ];

  function toggleContactForm() {
    showContactForm = !showContactForm;
    if (!showContactForm) {
      resetForm();
    }
  }

  function resetForm() {
    formData = {
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general'
    };
    submitted = false;
    error = '';
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    submitting = true;
    error = '';

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit support request');
      }

      submitted = true;
      dispatch('contactSubmitted', { formData });

    } catch (err) {
      console.error('Error submitting contact form:', err);
      error = err.message || 'Failed to submit your request. Please try again.';
    } finally {
      submitting = false;
    }
  }

  function validateForm(): boolean {
    if (!formData.name.trim()) {
      error = 'Name is required';
      return false;
    }
    if (!formData.email.trim()) {
      error = 'Email is required';
      return false;
    }
    if (!formData.subject.trim()) {
      error = 'Subject is required';
      return false;
    }
    if (!formData.message.trim()) {
      error = 'Message is required';
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      error = 'Please enter a valid email address';
      return false;
    }
    return true;
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold text-white mb-2">Still Need Help?</h2>
    <p class="text-gray-300">
      Can't find what you're looking for? Our support team is here to help.
    </p>
  </div>

  <!-- Support Options -->
  <div class="grid md:grid-cols-3 gap-6 mb-8">
    <!-- Email Support -->
    <div class="bg-white/5 rounded-lg p-4 text-center">
      <div class="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      </div>
      <h3 class="text-white font-semibold mb-2">Email Support</h3>
      <p class="text-gray-400 text-sm mb-3">Get help via email</p>
      <a 
        href="mailto:support@geargrab.co" 
        class="text-blue-400 hover:text-blue-300 text-sm underline"
      >
        support@geargrab.co
      </a>
    </div>

    <!-- Live Chat -->
    <div class="bg-white/5 rounded-lg p-4 text-center">
      <div class="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      </div>
      <h3 class="text-white font-semibold mb-2">Live Chat</h3>
      <p class="text-gray-400 text-sm mb-3">Chat with our team</p>
      <p class="text-green-400 text-sm">Mon-Fri 9AM-6PM MT</p>
    </div>

    <!-- Phone Support -->
    <div class="bg-white/5 rounded-lg p-4 text-center">
      <div class="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
        </svg>
      </div>
      <h3 class="text-white font-semibold mb-2">Phone Support</h3>
      <p class="text-gray-400 text-sm mb-3">Call us directly</p>
      <a 
        href="tel:+1-555-GEAR-GRAB" 
        class="text-purple-400 hover:text-purple-300 text-sm underline"
      >
        (555) GEAR-GRAB
      </a>
    </div>
  </div>

  <!-- Contact Form Toggle -->
  <div class="text-center">
    <button
      on:click={toggleContactForm}
      class="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
    >
      {showContactForm ? 'Hide Contact Form' : 'Send Us a Message'}
    </button>
  </div>

  <!-- Contact Form -->
  {#if showContactForm}
    <div class="mt-8 border-t border-white/20 pt-8">
      {#if submitted}
        <!-- Success Message -->
        <div class="bg-green-500/20 border border-green-500/30 rounded-lg p-6 text-center">
          <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Message Sent!</h3>
          <p class="text-green-200 mb-4">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
          <button
            on:click={resetForm}
            class="text-green-400 hover:text-green-300 underline"
          >
            Send Another Message
          </button>
        </div>
      {:else}
        <!-- Contact Form -->
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-white mb-2">
                Name *
              </label>
              <input
                id="name"
                type="text"
                bind:value={formData.name}
                required
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-white mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                bind:value={formData.email}
                required
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <!-- Category -->
          <div>
            <label for="category" class="block text-sm font-medium text-white mb-2">
              Category
            </label>
            <select
              id="category"
              bind:value={formData.category}
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            >
              {#each supportCategories as category}
                <option value={category.value}>{category.label}</option>
              {/each}
            </select>
          </div>

          <!-- Subject -->
          <div>
            <label for="subject" class="block text-sm font-medium text-white mb-2">
              Subject *
            </label>
            <input
              id="subject"
              type="text"
              bind:value={formData.subject}
              required
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              placeholder="Brief description of your issue"
            />
          </div>

          <!-- Message -->
          <div>
            <label for="message" class="block text-sm font-medium text-white mb-2">
              Message *
            </label>
            <textarea
              id="message"
              bind:value={formData.message}
              required
              rows="5"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-vertical"
              placeholder="Please provide as much detail as possible about your issue or question..."
            ></textarea>
          </div>

          <!-- Error Message -->
          {#if error}
            <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p class="text-red-300 text-sm">{error}</p>
            </div>
          {/if}

          <!-- Submit Button -->
          <div class="flex space-x-4">
            <button
              type="button"
              on:click={toggleContactForm}
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {#if submitting}
                <div class="flex items-center justify-center">
                  <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sending...
                </div>
              {:else}
                Send Message
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
  {/if}
</div>
