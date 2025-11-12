<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let animation = 'scale-in';
  export let threshold = 0.1;
  export let className = '';
  export let startOffset = 0; // Additional offset from when element enters viewport
  export let endOffset = 0.5; // How far through viewport before animation completes
  export let reverseOnScrollUp = true;
  export let smoothness = 0.1; // Animation smoothness (0-1, lower = smoother)
  
  let element;
  let animationProgress = 0;
  let isVisible = false;
  let rafId;
  let lastScrollY = 0;
  let targetProgress = 0;
  let mounted = false;
  
  onMount(() => {
    mounted = true;
    const updateAnimation = () => {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;

      // Calculate when element starts and ends being visible
      const elementTop = rect.top;
      const elementBottom = rect.bottom;

      // Element is visible when any part is in viewport
      isVisible = elementBottom > 0 && elementTop < windowHeight;

      if (isVisible) {
        // Calculate progress based on element position in viewport
        const startPoint = windowHeight - (elementHeight * startOffset);
        const endPoint = windowHeight * (1 - endOffset);

        // Progress from 0 to 1 as element moves through viewport
        const rawProgress = Math.max(0, Math.min(1,
          (startPoint - elementTop) / (startPoint - endPoint)
        ));

        targetProgress = rawProgress;
      } else if (elementTop > windowHeight) {
        // Element is below viewport
        targetProgress = 0;
      } else if (elementBottom < 0) {
        // Element is above viewport
        targetProgress = reverseOnScrollUp ? 0 : 1;
      }

      // Apply animation progress immediately (no smoothing for instant response)
      animationProgress = targetProgress;

      // Apply animation based on progress
      applyAnimation(animationProgress);
    };

    // Handle scroll events for instant updates
    const handleScroll = () => {
      updateAnimation();
    };

    // Add scroll listener for immediate response
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateAnimation);

    // Initial call
    updateAnimation();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateAnimation);
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
  
  function applyAnimation(progress) {
    if (!element) return;
    
    // Clamp progress between 0 and 1
    progress = Math.max(0, Math.min(1, progress));
    
    // Apply easing function for smoother animation
    const easedProgress = easeOutCubic(progress);
    
    switch (animation) {
      case 'fade-up':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateY(${(1 - easedProgress) * 50}px)`;
        break;
        
      case 'fade-left':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateX(${(1 - easedProgress) * 50}px)`;
        break;
        
      case 'fade-right':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateX(${(easedProgress - 1) * 50}px)`;
        break;
        
      case 'scale-in':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `scale(${0.8 + (easedProgress * 0.2)})`;
        break;
        
      case 'slide-down':
        element.style.opacity = easedProgress.toString();
        element.style.transform = `translateY(${(easedProgress - 1) * 50}px)`;
        break;
    }
  }
  
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
</script>

<div
  bind:this="{element}"
  class="scroll-linked-animator {className}"
  style="opacity: 0; transform: scale(0.8); will-change: transform, opacity;"
  data-scroll-linked="true"
>
  <slot />
</div>

<style>
  .scroll-linked-animator {
    transition: none; /* Remove CSS transitions to prevent conflicts */
  }
</style>
