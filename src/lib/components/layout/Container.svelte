<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = 'xl';
  export let padding = true;
  export let className = '';

  // Container size classes using design system
  const sizeClasses = {
    sm: 'max-w-container-sm',
    md: 'max-w-container-md',
    lg: 'max-w-container-lg',
    xl: 'max-w-container-xl',
    '2xl': 'max-w-container-2xl',
    full: 'max-w-full'
  };

  // Padding classes
  $: paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8' : '';

  // Combined classes
  $: containerClasses = `mx-auto ${sizeClasses[size]} ${paddingClasses} ${className}`;
</script>

<div class={containerClasses}>
  <slot />
</div>
