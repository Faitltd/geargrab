<script lang="ts">
  export let padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'lg';
  export let background: 'white' | 'gray' | 'dark' | 'transparent' = 'white';
  export let className = '';

  // Padding classes using design system with responsive behavior
  const paddingClasses = {
    none: 'py-0',
    sm: 'py-4 sm:py-6 md:py-8',
    md: 'py-6 sm:py-8 md:py-12',
    lg: 'py-8 sm:py-12 md:py-16',
    xl: 'py-12 sm:py-16 md:py-24'
  };

  // Background classes
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    dark: 'bg-gray-900',
    transparent: 'bg-transparent'
  };

  // Combined classes
  $: sectionClasses = `${paddingClasses[padding]} ${backgroundClasses[background]} ${className}`;
</script>

<section class={sectionClasses}>
  <slot />
</section>
