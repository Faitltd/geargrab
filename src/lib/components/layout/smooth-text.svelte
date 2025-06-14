<script lang="ts">
  import { onMount } from 'svelte';
  
  export let delay: number = 0;
  export let stagger: number = 50; // Delay between words
  export let className: string = '';
  
  let textElement: HTMLElement;
  let mounted = false;
  
  onMount(() => {
    mounted = true;

    if (textElement) {
      // Split text into words and wrap each in a span
      const text = textElement.textContent || '';
      const words = text.split(' ');

      textElement.innerHTML = words
        .map((word, index) =>
          `<span class="word" data-index="${index}">${word}</span>`
        )
        .join(' ');

      // Animate words individually with staggered timing
      const wordElements = textElement.querySelectorAll('.word') as NodeListOf<HTMLElement>;
      wordElements.forEach((wordEl, index) => {
        setTimeout(() => {
          wordEl.style.opacity = '1';
          wordEl.style.transform = 'translateY(0)';
        }, delay + (index * stagger));
      });
    }
  });
</script>

<div
  bind:this={textElement}
  class="smooth-text {className}"
>
  <slot />
</div>

<style>
  .smooth-text {
    opacity: 1;
  }
  
  .smooth-text :global(.word) {
    display: inline-block;
    opacity: 0;
    transform: translateY(5px);
    transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .smooth-text.visible :global(.word) {
    opacity: 1;
    transform: translateY(0);
  }
</style>
