<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let checked = false;
  export let disabled = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let variant: 'primary' | 'secondary' | 'neutral' = 'primary';
  export let label = '';
  export let icon = '';
  export let loading = false;
  export let id = '';
  
  const dispatch = createEventDispatcher<{
    change: { checked: boolean };
  }>();
  
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-3 h-3',
      gap: 'space-x-1.5'
    },
    md: {
      container: 'px-4 py-2 text-sm',
      icon: 'w-4 h-4',
      gap: 'space-x-2'
    },
    lg: {
      container: 'px-5 py-2.5 text-base',
      icon: 'w-5 h-5',
      gap: 'space-x-2.5'
    }
  };
  
  // Variant configurations
  const variantConfig = {
    primary: {
      unchecked: 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-400 hover:bg-primary-50',
      checked: 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600',
      disabled: 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
    },
    secondary: {
      unchecked: 'bg-white text-neutral-700 border-neutral-300 hover:border-accent-400 hover:bg-accent-50',
      checked: 'bg-accent-500 text-white border-accent-500 hover:bg-accent-600',
      disabled: 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
    },
    neutral: {
      unchecked: 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50',
      checked: 'bg-neutral-700 text-white border-neutral-700 hover:bg-neutral-800',
      disabled: 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
    }
  };
  
  $: config = sizeConfig[size];
  $: colors = variantConfig[variant];
  $: buttonClasses = [
    'inline-flex items-center justify-center font-medium rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    config.container,
    disabled 
      ? colors.disabled 
      : checked 
        ? colors.checked 
        : colors.unchecked,
    // Focus ring color based on variant
    !disabled && variant === 'primary' ? 'focus:ring-primary-500' :
    !disabled && variant === 'secondary' ? 'focus:ring-accent-500' :
    !disabled ? 'focus:ring-neutral-500' : 'focus:ring-0'
  ].filter(Boolean).join(' ');
  
  const handleClick = () => {
    if (disabled || loading) return;
    
    checked = !checked;
    dispatch('change', { checked });
  };
  
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };
</script>

<!-- Pill Toggle Button -->
<button
  {id}
  type="button"
  class={buttonClasses}
  {disabled}
  aria-pressed={checked}
  aria-label={label || $$slots.default ? undefined : 'Toggle'}
  on:click={handleClick}
  on:keydown={handleKeydown}
>
  <div class="flex items-center {config.gap}">
    <!-- Loading Spinner -->
    {#if loading}
      <div class="animate-spin {config.icon}">
        <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    {:else if icon}
      <!-- Custom Icon -->
      <div class={config.icon}>
        {@html icon}
      </div>
    {:else if checked}
      <!-- Default Checked Icon -->
      <svg class={config.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    {:else}
      <!-- Default Unchecked Icon -->
      <svg class={config.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    {/if}
    
    <!-- Label Content -->
    {#if label}
      <span>{label}</span>
    {:else if $$slots.default}
      <slot />
    {/if}
  </div>
</button>
