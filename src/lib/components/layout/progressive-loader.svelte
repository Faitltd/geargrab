<script lang="ts">
  import { onMount } from 'svelte';
  
  export let delay = 0;
  export let duration = 600;
  export let animation: 'fade' | 'slide-up' | 'slide-down' | 'scale' = 'fade';
  
  let visible = false;
  let mounted = false;
  
  onMount(() => {
    mounted = true;
    setTimeout(() => {
      visible = true;
    }, delay);
  });
  
  $: animationClass = mounted ? (visible ? 'animate-in' : 'animate-out') : 'animate-out';
</script>

<div 
  class="progressive-loader {animationClass} {animation}"
  style="--duration: {duration}ms"
>
  <slot />
</div>

<style>
  .progressive-loader {
    transition: all var(--duration) cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity, transform;
  }

  .animate-out {
    opacity: 0;
  }

  .animate-in {
    opacity: 1;
  }

  .fade.animate-out {
    opacity: 0;
    transform: translateY(0);
  }

  .fade.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .slide-up.animate-out {
    opacity: 0;
    transform: translateY(15px);
  }

  .slide-up.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .slide-down.animate-out {
    opacity: 0;
    transform: translateY(-15px);
  }

  .slide-down.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .scale.animate-out {
    opacity: 0;
    transform: scale(0.95);
  }

  .scale.animate-in {
    opacity: 1;
    transform: scale(1);
  }
</style>
