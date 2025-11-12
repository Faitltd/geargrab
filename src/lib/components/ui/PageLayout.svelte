<!--
  Consistent Page Layout Component
  Provides standardized layout, spacing, and styling for all pages
-->
<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let variant: 'default' | 'admin' | 'auth' | 'landing' = 'default';
  export let showHeader: boolean = true;
  export let showContainer: boolean = true;
  export let maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = 'xl';
  export let background: 'default' | 'dark' | 'gradient' | 'transparent' = 'default';
  export let padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'lg';

  // Dynamic classes based on props
  $: containerClasses = showContainer ? getContainerClasses() : '';
  $: backgroundClasses = getBackgroundClasses();
  $: paddingClasses = getPaddingClasses();

  function getContainerClasses(): string {
    const baseClasses = 'mx-auto px-4 sm:px-6 lg:px-8';
    switch (maxWidth) {
      case 'sm': return `${baseClasses} max-w-2xl`;
      case 'md': return `${baseClasses} max-w-4xl`;
      case 'lg': return `${baseClasses} max-w-6xl`;
      case 'xl': return `${baseClasses} max-w-7xl`;
      case '2xl': return `${baseClasses} max-w-screen-2xl`;
      case 'full': return `${baseClasses} max-w-full`;
      default: return `${baseClasses} max-w-7xl`;
    }
  }

  function getBackgroundClasses(): string {
    switch (background) {
      case 'dark': 
        return 'bg-gray-900 text-white';
      case 'gradient': 
        return 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white';
      case 'transparent': 
        return 'bg-transparent';
      default: 
        return variant === 'admin' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
          : 'bg-gray-50 text-gray-900';
    }
  }

  function getPaddingClasses(): string {
    switch (padding) {
      case 'none': return '';
      case 'sm': return 'py-4';
      case 'md': return 'py-8';
      case 'lg': return 'py-12';
      case 'xl': return 'py-16';
      default: return 'py-12';
    }
  }

  function getHeaderClasses(): string {
    return variant === 'admin' 
      ? 'mb-8 border-b border-gray-700 pb-6'
      : 'mb-8 border-b border-gray-200 pb-6';
  }
</script>

<div class="min-h-screen {backgroundClasses}">
  <div class="{containerClasses} {paddingClasses}">
    {#if showHeader && (title || subtitle)}
      <header class="{getHeaderClasses()}">
        {#if title}
          <h1 class="text-3xl font-bold {variant === 'admin' ? 'text-white' : 'text-gray-900'} mb-2">
            {title}
          </h1>
        {/if}
        {#if subtitle}
          <p class="text-lg {variant === 'admin' ? 'text-gray-300' : 'text-gray-600'}">
            {subtitle}
          </p>
        {/if}
      </header>
    {/if}

    <main class="space-y-6">
      <slot />
    </main>
  </div>
</div>

<style>
  /* Ensure consistent typography */
  :global(.page-layout h1) {
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-bold);
  }

  :global(.page-layout h2) {
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-semibold);
  }

  :global(.page-layout h3) {
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-medium);
  }

  /* Consistent spacing */
  :global(.page-layout .space-y-6 > * + *) {
    margin-top: 1.5rem;
  }

  /* Consistent card styling */
  :global(.page-layout .card) {
    background: rgba(31, 41, 55, 0.5);
    border: 1px solid rgb(75, 85, 99);
    border-radius: 0.5rem;
    padding: 1.5rem;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  :global(.page-layout.light .card) {
    background: white;
    border: 1px solid rgb(229, 231, 235);
    color: rgb(17, 24, 39);
  }

  /* Consistent button styling */
  :global(.page-layout .btn-primary) {
    background-color: var(--color-primary);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: var(--font-weight-medium);
    transition: all var(--duration-normal) var(--ease-in-out);
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  :global(.page-layout .btn-primary:hover) {
    background-color: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  :global(.page-layout .btn-secondary) {
    background-color: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: var(--font-weight-medium);
    transition: all var(--duration-normal) var(--ease-in-out);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  :global(.page-layout .btn-secondary:hover) {
    background-color: var(--color-primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  /* Consistent form styling */
  :global(.page-layout .form-group) {
    margin-bottom: 1.5rem;
  }

  :global(.page-layout .form-label) {
    display: block;
    font-size: 0.875rem;
    font-weight: var(--font-weight-medium);
    margin-bottom: 0.5rem;
    color: inherit;
  }

  :global(.page-layout .form-input) {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgb(75, 85, 99);
    background-color: rgba(31, 41, 55, 0.7);
    color: white;
    font-family: var(--font-family-primary);
    transition: all var(--duration-normal) var(--ease-in-out);
  }

  :global(.page-layout .form-input:focus) {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }

  :global(.page-layout.light .form-input) {
    background-color: white;
    border-color: rgb(209, 213, 219);
    color: rgb(17, 24, 39);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    :global(.page-layout .card) {
      padding: 1rem;
    }

    :global(.page-layout h1) {
      font-size: 1.875rem;
      line-height: 2.25rem;
    }

    :global(.page-layout h2) {
      font-size: 1.5rem;
      line-height: 2rem;
    }
  }
</style>
