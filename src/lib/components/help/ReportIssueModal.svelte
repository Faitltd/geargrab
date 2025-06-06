<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';

  export let show = false;

  let formData = {
    email: '',
    issueType: 'safety',
    subject: '',
    description: '',
    userInvolved: '',
    listingId: '',
    incidentDate: '',
    location: ''
  };

  let isSubmitting = false;
  let submitSuccess = false;
  let submitError = '';

  const issueTypes = [
    { value: 'safety', label: 'Safety Concern', description: 'Threatening behavior, unsafe equipment, fraud' },
    { value: 'technical', label: 'Technical Issue', description: 'Site bugs, payment errors, booking failures' },
    { value: 'policy', label: 'Policy Violation', description: 'Community guideline violations' },
    { value: 'spam', label: 'Spam/Abuse', description: 'Inappropriate content or behavior' }
  ];

  function close() {
    show = false;
    resetForm();
  }

  function resetForm() {
    formData = {
      email: '',
      issueType: 'safety',
      subject: '',
      description: '',
      userInvolved: '',
      listingId: '',
      incidentDate: '',
      location: ''
    };
    submitSuccess = false;
    submitError = '';
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    // Basic validation
    if (!formData.email || !formData.subject || !formData.description) {
      submitError = 'Please fill in all required fields.';
      return;
    }

    isSubmitting = true;
    submitError = '';

    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      submitSuccess = true;
      
      // Auto-close after success
      setTimeout(() => {
        close();
      }, 3000);
      
    } catch (error) {
      submitError = 'Failed to submit report. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }


</script>

<Modal bind:show title="Report an Issue" maxWidth="max-w-2xl" on:close={close}>
  <div class="p-6">
    {#if submitSuccess}
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Report Submitted!</h3>
        <p class="text-gray-300 mb-4">
          Thank you for reporting this issue. Our {formData.issueType === 'safety' ? 'Safety & Trust' : 'Engineering'} team will review it within 12 hours.
        </p>
        <p class="text-sm text-gray-400">
          You'll receive a confirmation email with your report number shortly.
        </p>
      </div>
    {:else}
      <div class="mb-6">
        <p class="text-gray-300 mb-4">
          GearGrab is committed to maintaining a safe marketplace. If you encounter any behavior, listing, or transaction that violates our policies—or if you find a technical problem—please let us know right away.
        </p>
        
        <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <h4 class="text-red-300 font-medium mb-2">All reports are reviewed within 12 hours</h4>
          <p class="text-red-200 text-sm">
            For life-threatening emergencies, call 911 first, then file a report.
          </p>
        </div>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Issue Type -->
        <fieldset>
          <legend class="block text-sm font-medium text-white mb-3">
            Issue Type *
          </legend>
          <div class="space-y-3">
            {#each issueTypes as type}
              <label class="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  bind:group={formData.issueType}
                  value={type.value}
                  class="mt-1 text-red-600 focus:ring-red-500"
                />
                <div>
                  <div class="text-white font-medium">{type.label}</div>
                  <div class="text-gray-400 text-sm">{type.description}</div>
                </div>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-white mb-2">
            Your Email Address *
          </label>
          <input
            type="email"
            id="email"
            bind:value={formData.email}
            required
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        <!-- Subject -->
        <div>
          <label for="subject" class="block text-sm font-medium text-white mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            bind:value={formData.subject}
            required
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Brief description of the issue"
          />
        </div>

        <!-- Additional Fields for Safety Concerns -->
        {#if formData.issueType === 'safety'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="userInvolved" class="block text-sm font-medium text-white mb-2">
                Other User's Username
              </label>
              <input
                type="text"
                id="userInvolved"
                bind:value={formData.userInvolved}
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Username (if applicable)"
              />
            </div>

            <div>
              <label for="listingId" class="block text-sm font-medium text-white mb-2">
                Listing ID
              </label>
              <input
                type="text"
                id="listingId"
                bind:value={formData.listingId}
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Listing ID (if applicable)"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="incidentDate" class="block text-sm font-medium text-white mb-2">
                Incident Date/Time
              </label>
              <input
                type="datetime-local"
                id="incidentDate"
                bind:value={formData.incidentDate}
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label for="location" class="block text-sm font-medium text-white mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                bind:value={formData.location}
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="City, State (if applicable)"
              />
            </div>
          </div>
        {/if}

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-white mb-2">
            Detailed Description *
          </label>
          <textarea
            id="description"
            bind:value={formData.description}
            required
            rows="6"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            placeholder={formData.issueType === 'safety' 
              ? "Describe the incident in detail. Include what happened, when it occurred, and any evidence you have..."
              : "Describe the technical issue. Include what you were doing when it occurred, error messages, and your device/browser info..."
            }
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

  <div slot="footer" class="p-6 border-t border-white/20 bg-gray-800/50">
    {#if !submitSuccess}
      <div class="flex justify-end space-x-4">
        <button
          type="button"
          on:click={close}
          class="px-6 py-2 text-gray-300 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          on:click={handleSubmit}
          disabled={isSubmitting}
          class="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          {#if isSubmitting}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Submitting...
          {:else}
            Submit Report
          {/if}
        </button>
      </div>
    {/if}
  </div>
</Modal>
