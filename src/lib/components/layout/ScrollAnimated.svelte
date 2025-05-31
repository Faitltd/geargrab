<script lang="ts">
  import { onMount } from 'svelte';
  
  export let animation: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in' | 'slide-down' = 'fade-up';
  export let delay: number = 0;
  export let threshold: number = 0.1;
  export let parallaxSpeed: number = 0;
  export let className: string = '';
  
  let element: HTMLElement;
  let isVisible = false;
  let scrollY = 0;
  
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible = true;
            // Add staggered delay
            setTimeout(() => {
              element.classList.add('animate-visible');
            }, delay);
          }
        });
      },
      { threshold }
    );
    
    if (element) {
      observer.observe(element);
    }
    
    // Parallax scroll handler
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    
    if (parallaxSpeed > 0) {
      window.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      observer.disconnect();
      if (parallaxSpeed > 0) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  });
  
  $: animationClass = {
    'fade-up': 'animate-fade-in-up',
    'fade-left': 'animate-fade-in-left', 
    'fade-right': 'animate-fade-in-right',
    'scale-in': 'animate-scale-in',
    'slide-down': 'animate-slide-in-down'
  }[animation];
  
  $: parallaxTransform = parallaxSpeed > 0 
    ? `translateY(${scrollY * parallaxSpeed}px)` 
    : '';
</script>

<div 
  bind:this={element}
  class="animate-on-scroll {animationClass} {className}"
  style="transform: {parallaxTransform}; animation-delay: {delay}ms;"
>
  <slot />
</div>
