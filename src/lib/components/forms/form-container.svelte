<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
  export let className: string = '';
  export let showGlass: boolean = true;

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  // Container classes
  $: containerClasses = showGlass 
    ? 'bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50'
    : 'bg-transparent';

  $: wrapperClasses = `w-full ${maxWidthClasses[maxWidth]} ${className}`;
</script>

<div class={wrapperClasses}>
  {#if title || subtitle}
    <div class="text-center mb-8">
      {#if title}
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          {title}
        </h1>
      {/if}
      {#if subtitle}
        <p class="text-xl text-gray-200 drop-shadow-lg">
          {subtitle}
        </p>
      {/if}
    </div>
  {/if}

  <div class={containerClasses}>
    <slot />
  </div>
</div>

<style>
  /* Smooth animations for form container */
  div {
    transition: all 0.3s ease-in-out;
  }
</style>
