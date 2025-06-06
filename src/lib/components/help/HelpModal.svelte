<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';
  import type { HelpCategory, HelpArticle } from '$lib/data/helpContent';

  export let show = false;
  export let content: HelpCategory | HelpArticle | null = null;

  function isCategory(content: any): content is HelpCategory {
    return content && 'articles' in content;
  }

  function isArticle(content: any): content is HelpArticle {
    return content && 'content' in content && !('articles' in content);
  }

  function close() {
    show = false;
  }
</script>

<Modal bind:show title={content?.title || 'Help'} maxWidth="max-w-4xl" on:close={close}>
  <div class="p-6">
    {#if content}
      {#if isCategory(content)}
        <!-- Category Overview -->
        <div class="mb-6">
          <p class="text-gray-300 text-lg mb-6">{content.description}</p>
          
          <div class="space-y-6">
            {#each content.articles as article}
              <div class="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 class="text-xl font-semibold text-white mb-3">{article.title}</h3>
                <p class="text-gray-300 mb-4">{article.content}</p>
                
                {#if article.steps && article.steps.length > 0}
                  <div class="mb-4">
                    <h4 class="text-lg font-medium text-white mb-2">Steps:</h4>
                    <ul class="space-y-2">
                      {#each article.steps as step}
                        <li class="text-gray-300 flex items-start">
                          <span class="text-green-400 mr-2 mt-1">•</span>
                          <span>{step}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}

                {#if article.tips && article.tips.length > 0}
                  <div class="mb-4">
                    <h4 class="text-lg font-medium text-white mb-2">Tips:</h4>
                    <ul class="space-y-2">
                      {#each article.tips as tip}
                        <li class="text-blue-300 flex items-start">
                          <span class="text-blue-400 mr-2 mt-1">💡</span>
                          <span>{tip}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}

                {#if article.warnings && article.warnings.length > 0}
                  <div class="mb-4">
                    <h4 class="text-lg font-medium text-white mb-2">Important:</h4>
                    <ul class="space-y-2">
                      {#each article.warnings as warning}
                        <li class="text-yellow-300 flex items-start">
                          <span class="text-yellow-400 mr-2 mt-1">⚠️</span>
                          <span>{warning}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {:else if isArticle(content)}
        <!-- Individual Article -->
        <div class="mb-6">
          <p class="text-gray-300 text-lg mb-6">{content.content}</p>
          
          {#if content.steps && content.steps.length > 0}
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-white mb-4">Steps:</h3>
              <div class="space-y-3">
                {#each content.steps as step, index}
                  <div class="flex items-start bg-white/5 rounded-lg p-4 border border-white/10">
                    <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span class="text-gray-300">{step}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if content.tips && content.tips.length > 0}
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-white mb-4">Tips:</h3>
              <div class="space-y-3">
                {#each content.tips as tip}
                  <div class="flex items-start bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
                    <span class="text-blue-400 mr-3 mt-0.5">💡</span>
                    <span class="text-blue-200">{tip}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if content.warnings && content.warnings.length > 0}
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-white mb-4">Important:</h3>
              <div class="space-y-3">
                {#each content.warnings as warning}
                  <div class="flex items-start bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/20">
                    <span class="text-yellow-400 mr-3 mt-0.5">⚠️</span>
                    <span class="text-yellow-200">{warning}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {:else}
      <div class="text-center py-8">
        <p class="text-gray-400">No help content available.</p>
      </div>
    {/if}
  </div>

  <div slot="footer" class="p-6 border-t border-white/20 bg-gray-800/50">
    <div class="flex justify-between items-center">
      <p class="text-gray-400 text-sm">
        Still need help? <a href="/contact" class="text-green-400 hover:text-green-300">Contact Support</a>
      </p>
      <button
        on:click={close}
        class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Close
      </button>
    </div>
  </div>
</Modal>
