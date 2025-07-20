<script lang="ts">
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  export let direction: 'left' | 'right' | 'up' | 'down' = 'right';
  export let duration = 500;
  export let delay = 0;
  export let distance = 100;
  
  const getTransitionParams = () => {
    switch (direction) {
      case 'left':
        return { x: -distance, duration, delay, easing: quintOut };
      case 'right':
        return { x: distance, duration, delay, easing: quintOut };
      case 'up':
        return { y: -distance, duration, delay, easing: quintOut };
      case 'down':
        return { y: distance, duration, delay, easing: quintOut };
      default:
        return { x: distance, duration, delay, easing: quintOut };
    }
  };
</script>

<div in:fly={getTransitionParams()} out:fly={getTransitionParams()}>
  <slot />
</div>
