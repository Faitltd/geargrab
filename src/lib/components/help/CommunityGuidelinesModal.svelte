<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';
  import { helpContent } from '$lib/data/helpContent';

  export let show = false;

  const guidelines = helpContent.communityGuidelines;

  function close() {
    show = false;
  }
</script>

<Modal bind:show title={guidelines.title} maxWidth="max-w-4xl" on:close={close}>
  <div class="p-6">
    <div class="mb-6">
      <p class="text-gray-300 text-lg leading-relaxed">{guidelines.content}</p>
    </div>

    <div class="space-y-8">
      {#each guidelines.sections as section}
        <div class="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 class="text-xl font-semibold text-white mb-4 flex items-center">
            <span class="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
            {section.title}
          </h3>
          
          <ul class="space-y-3">
            {#each section.points as point}
              <li class="text-gray-300 flex items-start">
                <span class="text-green-400 mr-3 mt-1 flex-shrink-0">•</span>
                <span>{point}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>

    <div class="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
      <h4 class="text-yellow-300 font-semibold mb-3 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Enforcement & Consequences
      </h4>
      <div class="text-yellow-200 space-y-2 text-sm">
        <p><strong>First violation:</strong> Warning and educational resources</p>
        <p><strong>Repeated violations:</strong> Temporary account suspension (7-30 days)</p>
        <p><strong>Serious violations:</strong> Permanent account ban and removal from platform</p>
        <p><strong>Illegal activity:</strong> Immediate ban and reporting to authorities</p>
      </div>
    </div>

    <div class="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
      <h4 class="text-blue-300 font-semibold mb-3 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Questions About Guidelines?
      </h4>
      <p class="text-blue-200 text-sm">
        If you have questions about our community guidelines or need clarification on any policy, 
        please don't hesitate to contact our support team. We're here to help ensure everyone 
        has a positive experience on GearGrab.
      </p>
    </div>
  </div>

  <div slot="footer" class="p-6 border-t border-white/20 bg-gray-800/50">
    <div class="flex justify-between items-center">
      <p class="text-gray-400 text-sm">
        Last updated: January 2024
      </p>
      <button
        on:click={close}
        class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        I Understand
      </button>
    </div>
  </div>
</Modal>
