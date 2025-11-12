<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let animation = 'fade-up';
  export let delay = 0;
  export let className = '';
  
  let element;
  let isVisible = false;
  let observer;
  
  onMount(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                isVisible = true;
              }, delay);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      );
      
      if (element) {
        observer.observe(element);
      }
    } else {
      // Fallback for environments without IntersectionObserver
      isVisible = true;
    }
  });
  
  onDestroy(() => {
    if (observer && element) {
      observer.unobserve(element);
    }
  });
</script>

<div
  bind:this={element}
  class="scroll-animate {animation} {className} {isVisible ? 'visible' : ''}"
>
  <slot />
</div>

<style>
  .scroll-animate {
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  /* Fade Up Animation */
  .fade-up {
    opacity: 0;
    transform: translateY(30px);
  }

  .fade-up.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Scale In Animation */
  .scale-in {
    opacity: 0;
    transform: scale(0.8);
  }

  .scale-in.visible {
    opacity: 1;
    transform: scale(1);
  }

  /* Fade Left Animation */
  .fade-left {
    opacity: 0;
    transform: translateX(30px);
  }

  .fade-left.visible {
    opacity: 1;
    transform: translateX(0);
  }

  /* Fade Right Animation */
  .fade-right {
    opacity: 0;
    transform: translateX(-30px);
  }

  .fade-right.visible {
    opacity: 1;
    transform: translateX(0);
  }

  /* Slide Down Animation */
  .slide-down {
    opacity: 0;
    transform: translateY(-30px);
  }

  .slide-down.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style>
