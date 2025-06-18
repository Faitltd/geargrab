<script lang="ts">
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';
  import ScrollLinkedSequential from '$lib/components/layout/scroll-linked-sequential.svelte';
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
  <h1 class="text-4xl font-bold mb-8 text-center">Animation Test Page</h1>
  
  <!-- Test basic fade-up animation -->
  <div class="mb-16">
    <h2 class="text-2xl mb-4">Basic Fade-Up Animation</h2>
    <ScrollLinkedAnimator animation="fade-up" startOffset={0.1} endOffset={0.5}>
      <div class="bg-blue-600 p-8 rounded-lg">
        <p>This should fade up as you scroll down</p>
      </div>
    </ScrollLinkedAnimator>
  </div>

  <!-- Test sequential animations -->
  <div class="mb-16">
    <h2 class="text-2xl mb-4">Sequential Animations</h2>
    <ScrollLinkedSequential 
      animation="fade-up" 
      baseDelay={0.1} 
      incrementDelay={0.1} 
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      startOffset={0.1} 
      endOffset={0.7}
    >
      <div class="bg-red-600 p-8 rounded-lg">Box 1</div>
      <div class="bg-green-600 p-8 rounded-lg">Box 2</div>
      <div class="bg-purple-600 p-8 rounded-lg">Box 3</div>
    </ScrollLinkedSequential>
  </div>

  <!-- Test different animation types -->
  <div class="mb-16">
    <h2 class="text-2xl mb-4">Different Animation Types</h2>
    
    <div class="space-y-8">
      <ScrollLinkedAnimator animation="fade-left" startOffset={0.1} endOffset={0.5}>
        <div class="bg-yellow-600 p-8 rounded-lg">Fade Left</div>
      </ScrollLinkedAnimator>
      
      <ScrollLinkedAnimator animation="fade-right" startOffset={0.1} endOffset={0.5}>
        <div class="bg-pink-600 p-8 rounded-lg">Fade Right</div>
      </ScrollLinkedAnimator>
      
      <ScrollLinkedAnimator animation="scale-in" startOffset={0.1} endOffset={0.5}>
        <div class="bg-indigo-600 p-8 rounded-lg">Scale In</div>
      </ScrollLinkedAnimator>
      
      <ScrollLinkedAnimator animation="slide-down" startOffset={0.1} endOffset={0.5}>
        <div class="bg-teal-600 p-8 rounded-lg">Slide Down</div>
      </ScrollLinkedAnimator>
    </div>
  </div>

  <!-- Add lots of content to enable scrolling -->
  <div class="space-y-8">
    {#each Array(10) as _, i}
      <ScrollLinkedAnimator animation="fade-up" startOffset={0.1} endOffset={0.5}>
        <div class="bg-gray-700 p-8 rounded-lg">
          <h3 class="text-xl font-bold mb-2">Content Block {i + 1}</h3>
          <p>This is some test content to create scrollable space and test the animations.</p>
        </div>
      </ScrollLinkedAnimator>
    {/each}
  </div>
</div>
