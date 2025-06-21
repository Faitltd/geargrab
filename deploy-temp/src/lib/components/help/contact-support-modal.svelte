<script lang="ts">
  // import Modal from '$lib/components/ui/modal.svelte'; // Temporarily disabled for deployment

  export let show = false;

  let formData = {
    email: '',
    subject: '',
    message: '',
    category: 'general',
    priority: 'normal'
  };

  let isSubmitting = false;
  let submitSuccess = false;
  let submitError = '';

  const categories = [
    { value: 'general', label: 'General Question' },
    { value: 'account', label: 'Account Issues' },
    { value: 'booking', label: 'Booking Problems' },
    { value: 'payment', label: 'Payment Issues' },
    { value: 'technical', label: 'Technical Problems' },
    { value: 'safety', label: 'Safety Concerns' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent (Security/Safety)' }
  ];

  function close() {
    show = false;
    resetForm();
  }

  function resetForm() {
    formData = {
      email: '',
      subject: '',
      message: '',
      category: 'general',
      priority: 'normal'
    };
    submitSuccess = false;
    submitError = '';
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    // Basic validation
    if (!formData.email || !formData.subject || !formData.message) {
      submitError = 'Please fill in all required fields.';
      return;
    }

    isSubmitting = true;
    submitError = '';

    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, just show success
      submitSuccess = true;
      
      // Auto-close after success
      setTimeout(() => {
        close();
      }, 2000);
      
    } catch (error) {
      submitError = 'Failed to submit support request. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if show}
  <!-- Simple modal backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={close}>
    <!-- Modal content -->
    <div class="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
      <!-- Modal header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 class="text-xl font-semibold text-white">Contact Support</h2>
        <button type="button" class="text-gray-400 hover:text-gray-300" on:click={close}>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal body -->
      <div class="p-6">
    {#if submitSuccess}
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Support Request Submitted!</h3>
        <p class="text-gray-300 mb-4">
          We've received your message and will respond within 24 hours on business days.
        </p>
        <p class="text-sm text-gray-400">
          You'll receive a confirmation email with your ticket number shortly.
        </p>
      </div>
    {:else}
      <div class="mb-6">
        <p class="text-gray-300 mb-4">
          If you can't find the answer you're looking for in our help center, our Support Team is here to help. 
          We aim to respond to all inquiries within 24 hours on business days.
        </p>
        
        <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h4 class="text-blue-300 font-medium mb-2">What information to include:</h4>
          <ul class="text-blue-200 text-sm space-y-1">
            <li>• Your GearGrab username or email</li>
            <li>• Device type and browser version (if applicable)</li>
            <li>• Step-by-step description of the issue</li>
            <li>• Error messages or screenshots</li>
            <li>• Time, date, and location if relevant</li>
          </ul>
        </div>
      </div>

      <form on:submit|preventDefault="{handleSubmit}" class="space-y-6">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-white mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            bind:value="{formData.email}"
            required
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        <!-- Category and Priority -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="category" class="block text-sm font-medium text-white mb-2">
              Category
            </label>
            <select
              id="category"
              bind:value="{formData.category}"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {#each categories as category}
                <option value="{category.value}">{category.label}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="priority" class="block text-sm font-medium text-white mb-2">
              Priority
            </label>
            <select
              id="priority"
              bind:value="{formData.priority}"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {#each priorities as priority}
                <option value="{priority.value}">{priority.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Subject -->
        <div>
          <label for="subject" class="block text-sm font-medium text-white mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            bind:value="{formData.subject}"
            required
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            bind:value="{formData.message}"
            required
            rows="6"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="Please provide as much detail as possible about your issue or question..."
          ></textarea>
        </div>

        {#if submitError}
          <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p class="text-red-300 text-sm">{submitError}</p>
          </div>
        {/if}
      </form>
    {/if}
      </div>

      <!-- Modal footer -->
      <div class="p-6 border-t border-gray-700 bg-gray-800/50">
        {#if !submitSuccess}
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              on:click="{close}"
              class="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              on:click="{handleSubmit}"
              disabled="{isSubmitting}"
              class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {#if isSubmitting}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              {:else}
                Send Message
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
