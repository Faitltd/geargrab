<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let animation = 'scale-in';
  export let baseDelay = 0; // Base delay as a percentage (0-1)
  export let incrementDelay = 0.1; // Delay increment between items (0-1)
  export let threshold = 0.1;
  export let className = '';
  export let startOffset = 0;
  export let endOffset = 0.8;
  export let reverseOnScrollUp = true;
  export let smoothness = 0.15;
  
  let containerElement;
  let childElements = [];
  let rafId;
  let containerProgress = 0;
  let targetProgress = 0;
  
  onMount(() => {
    if (containerElement) {
      childElements = Array.from(containerElement.children);
      
      // Initialize child elements
      childElements.forEach((child, index) => {
        child.style.opacity = '0';
        child.style.willChange = 'transform, opacity';
      });
      
      const updateAnimation = () => {
        if (!containerElement) return;
        
        const rect = containerElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementHeight = rect.height;
        
        // Calculate when container starts and ends being visible
        const elementTop = rect.top;
        const elementBottom = rect.bottom;
        
        const isVisible = elementBottom > 0 && elementTop < windowHeight;
        
        if (isVisible) {
          // Calculate progress based on container position in viewport
          const startPoint = windowHeight - (elementHeight * startOffset);
          const endPoint = windowHeight * (1 - endOffset);
          
          const rawProgress = Math.max(0, Math.min(1, 
            (startPoint - elementTop) / (startPoint - endPoint)
          ));
          
          targetProgress = rawProgress;
        } else if (elementTop > windowHeight) {
          targetProgress = 0;
        } else if (elementBottom < 0) {
          targetProgress = reverseOnScrollUp ? 0 : 1;
        }
        
        // Smooth container progress with improved easing
        const progressDiff = targetProgress - containerProgress;
        containerProgress += progressDiff * smoothness;

        // Apply animation to each child with staggered timing
        childElements.forEach((child, index) => {
          const childDelay = baseDelay + (index * incrementDelay);

          // Improved progress calculation for smoother sequential loading
          let childProgress = 0;
          if (containerProgress > childDelay) {
            const adjustedProgress = (containerProgress - childDelay) / Math.max(0.1, 1 - childDelay);
            childProgress = Math.max(0, Math.min(1, adjustedProgress));
          }

          applyAnimation(child, childProgress);
        });
        
        rafId = requestAnimationFrame(updateAnimation);
      };
      
      rafId = requestAnimationFrame(updateAnimation);
    }
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  });
  
  onDestroy(() => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  });
  
  function applyAnimation(element, progress) {
    if (!element) return;
    
    // Clamp progress between 0 and 1
    progress = Math.max(0, Math.min(1, progress));
    
    // Apply easing function for smoother animation
    const easedProgress = easeOutQuart(progress);
    
    switch (animation) {
      case 'fade-up':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateY(${(1 - easedProgress) * 40}px) scale(${0.95 + (easedProgress * 0.05)})`;
        break;
        
      case 'fade-left':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateX(${(1 - easedProgress) * 30}px)`;
        break;
        
      case 'fade-right':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateX(${(easedProgress - 1) * 30}px)`;
        break;
        
      case 'scale-in':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `scale(${0.85 + (easedProgress * 0.15)}) translateY(${(1 - easedProgress) * 20}px)`;
        break;
        
      case 'slide-down':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateY(${(easedProgress - 1) * 30}px)`;
        break;
    }
  }
  
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }
</script>

<div
  bind:this="{containerElement}"
  class="scroll-linked-sequential {className}"
  data-scroll-linked="true"
>
  <slot />
</div>


