<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let variant: 'primary' | 'secondary' | 'outline' | 'glass' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let fullWidth: boolean = false;
  export let icon: string = '';
  export let iconPosition: 'left' | 'right' = 'left';
  export let href: string = '';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  
  const dispatch = createEventDispatcher<{
    click: MouseEvent;
  }>();
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    glass: 'btn-glass',
    ghost: 'btn-ghost'
  };
  
  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
    xl: 'py-5 px-10 text-xl'
  };
  
  $: classes = [
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-50 cursor-not-allowed transform-none' : '',
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300'
  ].filter(Boolean).join(' ');
  
  const handleClick = (event: MouseEvent) => {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  };
</script>

{#if href}
  <a 
    {href}
    class={classes}
    class:pointer-events-none={disabled || loading}
    on:click={handleClick}
  >
    {#if icon && iconPosition === 'left'}
      <i class={icon}></i>
    {/if}
    
    {#if loading}
      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {/if}
    
    <slot />
    
    {#if icon && iconPosition === 'right'}
      <i class={icon}></i>
    {/if}
  </a>
{:else}
  <button
    {type}
    class={classes}
    {disabled}
    on:click={handleClick}
  >
    {#if icon && iconPosition === 'left'}
      <i class={icon}></i>
    {/if}
    
    {#if loading}
      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {/if}
    
    <slot />
    
    {#if icon && iconPosition === 'right'}
      <i class={icon}></i>
    {/if}
  </button>
{/if}
