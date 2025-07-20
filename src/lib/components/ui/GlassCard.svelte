<script lang="ts">
  export let variant: 'default' | 'dark' | 'primary' | 'accent' = 'default';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let hover: boolean = true;
  export let clickable: boolean = false;
  export let padding: boolean = true;
  
  const variants = {
    default: 'glass-card',
    dark: 'glass-dark text-white',
    primary: 'glass bg-primary-500/10 border-primary-500/20',
    accent: 'glass bg-accent-500/10 border-accent-500/20'
  };
  
  const sizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };
  
  $: classes = [
    variants[variant],
    padding ? sizes[size] : '',
    hover ? 'hover:shadow-2xl hover:scale-[1.02]' : '',
    clickable ? 'cursor-pointer' : '',
    'rounded-2xl transition-all duration-300'
  ].filter(Boolean).join(' ');
</script>

<div 
  class={classes}
  on:click
  on:keydown
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
>
  <slot />
</div>
