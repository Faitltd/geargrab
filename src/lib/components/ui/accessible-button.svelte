<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let ariaLabel = '';
  export let ariaDescribedBy = '';
  export let className = '';
  export let href = '';
  export let target = '';
  export let rel = '';

  const dispatch = createEventDispatcher<{
    click: MouseEvent;
    focus: FocusEvent;
    blur: FocusEvent;
    keydown;
  }>();

  // Determine if this should be a link or button
  $: isLink = !!href;

  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant classes
  const variantClasses = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-green-600 hover:bg-green-50 focus:ring-green-500 border border-green-600'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Combined classes
  $: buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  // Event handlers
  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }

  function handleKeydown(event) {
    // Handle Enter and Space for accessibility
    if ((event.key === 'Enter' || event.key === ' ') && !disabled && !loading) {
      event.preventDefault();
      dispatch('click', event as any);
    }
    dispatch('keydown', event);
  }

  function handleFocus(event: FocusEvent) {
    dispatch('focus', event);
  }

  function handleBlur(event: FocusEvent) {
    dispatch('blur', event);
  }
</script>

{#if isLink}
  <a
    {href}
    {target}
    {rel}
    class="{buttonClasses}"
    aria-label="{ariaLabel}"
    aria-describedby="{ariaDescribedBy" || undefined}
    aria-disabled="{disabled}"
    tabindex="{disabled" ? -1 : 0}
    on:click="{handleClick}"
    on:keydown="{handleKeydown}"
    on:focus="{handleFocus}"
    on:blur="{handleBlur}"
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading...
    {:else}
      <slot />
    {/if}
  </a>
{:else}
  <button
    {type}
    {disabled}
    class="{buttonClasses}"
    aria-label="{ariaLabel}"
    aria-describedby="{ariaDescribedBy" || undefined}
    aria-disabled="{disabled" || loading}
    on:click="{handleClick}"
    on:keydown="{handleKeydown}"
    on:focus="{handleFocus}"
    on:blur="{handleBlur}"
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading...
    {:else}
      <slot />
    {/if}
  </button>
{/if}

<style>
  /* Ensure focus is visible for keyboard users */
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    button,
    a {
      border: 2px solid currentColor;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    button,
    a {
      transition: none;
    }
    
    .animate-spin {
      animation: none;
    }
  }
</style>
