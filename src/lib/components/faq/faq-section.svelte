<script lang="ts">
  import { slide } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  
  export let faq: {
    id: string | number;
    question: string;
    answer: string;
    category?: string;
    tags?: string[];
    helpful?: number;
    views?: number;
  };
  
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let helpful = faq.helpful || 0;
  let userVoted = false;

  function toggleOpen() {
    isOpen = !isOpen;
    
    if (isOpen) {
      // Track view
      dispatch('view', { faqId: faq.id });
    }
  }

  function handleHelpful(isHelpful: boolean) {
    if (userVoted) return;
    
    userVoted = true;
    if (isHelpful) {
      helpful++;
    }
    
    dispatch('vote', { 
      faqId: faq.id, 
      helpful: isHelpful 
    });
  }

  function formatAnswer(answer: string): string {
    // Convert markdown-style formatting to HTML
    return answer
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  $: formattedAnswer = formatAnswer(faq.answer);
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
  <!-- Question Header -->
  <button
    on:click={toggleOpen}
    class="w-full p-6 text-left hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-inset"
    aria-expanded={isOpen}
  >
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-white pr-4">
        {faq.question}
      </h3>
      
      <div class="flex items-center space-x-3">
        <!-- Helpful count -->
        {#if helpful > 0}
          <div class="flex items-center text-green-400 text-sm">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
            </svg>
            {helpful}
          </div>
        {/if}
        
        <!-- Expand/Collapse Icon -->
        <div class="flex-shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>
    
    <!-- Tags -->
    {#if faq.tags && faq.tags.length > 0}
      <div class="flex flex-wrap gap-2 mt-3">
        {#each faq.tags as tag}
          <span class="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
            {tag}
          </span>
        {/each}
      </div>
    {/if}
  </button>

  <!-- Answer Content -->
  {#if isOpen}
    <div transition:slide={{ duration: 300 }} class="border-t border-white/20">
      <div class="p-6">
        <!-- Answer Text -->
        <div class="prose prose-invert max-w-none">
          <div class="text-gray-300 leading-relaxed">
            {@html formattedAnswer}
          </div>
        </div>

        <!-- Helpful Voting -->
        <div class="mt-6 pt-4 border-t border-white/20">
          <div class="flex items-center justify-between">
            <p class="text-gray-400 text-sm">Was this helpful?</p>
            
            <div class="flex items-center space-x-3">
              <button
                on:click={() => handleHelpful(true)}
                disabled={userVoted}
                class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors {userVoted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500/20 text-green-400'}"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                </svg>
                <span class="text-sm">Yes</span>
              </button>
              
              <button
                on:click={() => handleHelpful(false)}
                disabled={userVoted}
                class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors {userVoted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/20 text-red-400'}"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" transform="rotate(180)">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                </svg>
                <span class="text-sm">No</span>
              </button>
            </div>
          </div>
          
          {#if userVoted}
            <p class="text-green-400 text-sm mt-2">Thank you for your feedback!</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom prose styles for FAQ answers */
  :global(.prose h1, .prose h2, .prose h3, .prose h4) {
    color: white;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  
  :global(.prose ul, .prose ol) {
    margin: 1em 0;
    padding-left: 1.5em;
  }
  
  :global(.prose li) {
    margin: 0.5em 0;
  }
  
  :global(.prose strong) {
    color: white;
    font-weight: 600;
  }
  
  :global(.prose em) {
    color: #d1d5db;
  }
  
  :global(.prose p) {
    margin: 1em 0;
  }
</style>
