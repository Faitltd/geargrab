<script lang="ts">
  import { onMount } from 'svelte';
  
  export let baseDelay: number = 200;
  export let incrementDelay: number = 150;
  export let animation: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in' | 'slide-down' = 'fade-up';
  export let threshold: number = 0.1;
  export let className: string = '';
  
  let containerElement: HTMLElement;
  let childElements: HTMLElement[] = [];
  let animationStarted = false;
  
  onMount(() => {
    // Find all direct children that should be animated
    if (containerElement) {
      childElements = Array.from(containerElement.children) as HTMLElement[];
      
      // Set up intersection observer for the container
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !animationStarted) {
              animationStarted = true;
              startSequentialAnimation();
            }
          });
        },
        { threshold }
      );
      
      observer.observe(containerElement);
      
      return () => {
        observer.disconnect();
      };
    }
  });
  
  function startSequentialAnimation() {
    childElements.forEach((element, index) => {
      const delay = baseDelay + (index * incrementDelay);
      
      // Add initial hidden state
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Trigger animation with delay
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, delay);
    });
  }
</script>

<div bind:this="{containerElement}" class="sequential-animator {className}">
  <slot />
</div>

<style>
  .sequential-animator {
    /* Container styles if needed */
  }
</style>
