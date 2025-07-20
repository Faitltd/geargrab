<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  
  export let variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let tooltip = '';
  export let href: string | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let fullWidth = false;
  
  const dispatch = createEventDispatcher<{
    click: MouseEvent;
  }>();
  
  $: isDisabled = disabled || loading;
  
  const handleClick = (e: MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    dispatch('click', e);
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  // Variant classes with disabled states
  const variantClasses = {
    primary: {
      enabled: 'bg-primary-500 hover:bg-primary-600 text-white border border-primary-500 hover:border-primary-600',
      disabled: 'bg-neutral-300 text-neutral-500 border border-neutral-300 cursor-not-allowed'
    },
    secondary: {
      enabled: 'bg-accent-500 hover:bg-accent-600 text-white border border-accent-500 hover:border-accent-600',
      disabled: 'bg-neutral-300 text-neutral-500 border border-neutral-300 cursor-not-allowed'
    },
    outline: {
      enabled: 'bg-transparent hover:bg-primary-50 text-primary-500 border border-primary-500 hover:border-primary-600 hover:text-primary-600',
      disabled: 'bg-transparent text-neutral-400 border border-neutral-300 cursor-not-allowed'
    },
    danger: {
      enabled: 'bg-red-500 hover:bg-red-600 text-white border border-red-500 hover:border-red-600',
      disabled: 'bg-neutral-300 text-neutral-500 border border-neutral-300 cursor-not-allowed'
    },
    ghost: {
      enabled: 'bg-transparent hover:bg-neutral-100 text-neutral-700 border border-transparent hover:border-neutral-200',
      disabled: 'bg-transparent text-neutral-400 border border-transparent cursor-not-allowed'
    }
  };
  
  $: buttonClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizeClasses[size],
    isDisabled ? variantClasses[variant].disabled : variantClasses[variant].enabled,
    fullWidth ? 'w-full' : '',
    // Focus ring colors based on variant
    !isDisabled && variant === 'primary' ? 'focus:ring-primary-500' :
    !isDisabled && variant === 'secondary' ? 'focus:ring-accent-500' :
    !isDisabled && variant === 'danger' ? 'focus:ring-red-500' :
    !isDisabled ? 'focus:ring-neutral-500' : 'focus:ring-0'
  ].filter(Boolean).join(' ');
</script>

{#if href && !isDisabled}
  <a
    {href}
    class={buttonClasses}
    title={tooltip}
    role="button"
    tabindex="0"
    on:click={handleClick}
    on:keydown={(e) => e.key === 'Enter' && handleClick(e)}
  >
    {#if loading}
      <LoadingSpinner 
        size="sm" 
        color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'} 
      />
      <span class="ml-2">
        <slot name="loading">Loading...</slot>
      </span>
    {:else}
      <slot />
    {/if}
  </a>
{:else}
  <button
    {type}
    class={buttonClasses}
    disabled={isDisabled}
    title={tooltip}
    on:click={handleClick}
  >
    {#if loading}
      <LoadingSpinner 
        size="sm" 
        color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'} 
      />
      <span class="ml-2">
        <slot name="loading">Loading...</slot>
      </span>
    {:else}
      <slot />
    {/if}
  </button>
{/if}

<!-- Tooltip (if provided and disabled) -->
{#if tooltip && isDisabled}
  <div class="sr-only" role="tooltip">
    {tooltip}
  </div>
{/if}
