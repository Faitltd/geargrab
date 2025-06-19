<script lang="ts">
  export let padding: string = 'py-16';
  export let maxWidth: string = 'max-w-7xl';
  export let background: string = 'bg-white/95';
  export let blur: boolean = true;
  export let shadow: boolean = true;
  export let rounded: boolean = true;
  export let border: boolean = true;
  export let margin: string = 'my-8';
  export let animation: string = 'animate-fade-in-up';
  export let delay: number = 0;

  $: containerClasses = [
    padding,
    margin,
    'relative z-10'
  ].join(' ');

  $: cardClasses = [
    maxWidth,
    'mx-auto px-4 sm:px-6 lg:px-8',
    background,
    blur ? 'backdrop-blur-sm' : '',
    shadow ? 'shadow-2xl' : '',
    rounded ? 'rounded-xl' : '',
    border ? 'border border-white/20' : '',
    animation,
    'opacity-0'
  ].filter(Boolean).join(' ');
</script>

<div class="{containerClasses}">
  <div
    class="{cardClasses}"
    style="animation-delay: {delay}ms;"
  >
    <slot />
  </div>
</div>

<style>
  /* Ensure animations trigger */
  div {
    animation-fill-mode: forwards;
  }
</style>
