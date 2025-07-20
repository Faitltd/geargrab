<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let value: string = '';
  export let type: string = 'text';
  export let placeholder: string = '';
  export let label: string = '';
  export let error: string = '';
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let variant: 'glass' | 'modern' | 'outline' = 'glass';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let icon: string = '';
  export let iconPosition: 'left' | 'right' = 'left';
  
  const dispatch = createEventDispatcher<{
    input: Event;
    change: Event;
    focus: FocusEvent;
    blur: FocusEvent;
  }>();
  
  const variants = {
    glass: 'input-glass',
    modern: 'input-modern',
    outline: 'bg-transparent border-2 border-neutral-300 focus:border-primary-500 rounded-xl px-4 py-3'
  };
  
  const sizes = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-base',
    lg: 'py-4 px-5 text-lg'
  };
  
  let focused = false;
  let inputElement: HTMLInputElement;
  
  $: classes = [
    variants[variant],
    sizes[size],
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    icon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : '',
    'w-full transition-all duration-200 focus:outline-none'
  ].filter(Boolean).join(' ');
  
  const handleInput = (event: Event) => {
    value = (event.target as HTMLInputElement).value;
    dispatch('input', event);
  };
  
  const handleFocus = (event: FocusEvent) => {
    focused = true;
    dispatch('focus', event);
  };
  
  const handleBlur = (event: FocusEvent) => {
    focused = false;
    dispatch('blur', event);
  };
</script>

<div class="relative">
  {#if label}
    <label 
      for={$$props.id || placeholder}
      class="block text-sm font-medium text-neutral-700 mb-2"
      class:text-primary-600={focused}
      class:text-red-600={error}
    >
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}
  
  <div class="relative">
    {#if icon && iconPosition === 'left'}
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <i class="{icon} text-neutral-400" class:text-primary-500={focused}></i>
      </div>
    {/if}
    
    {#if type === 'text'}
      <input
        bind:this={inputElement}
        bind:value
        type="text"
        {placeholder}
        {disabled}
        {required}
        id={$$props.id || placeholder}
        class={classes}
        on:input={handleInput}
        on:change
        on:focus={handleFocus}
        on:blur={handleBlur}
        on:keydown
        on:keyup
        on:keypress
      />
    {:else if type === 'email'}
      <input
        bind:this={inputElement}
        bind:value
        type="email"
        {placeholder}
        {disabled}
        {required}
        id={$$props.id || placeholder}
        class={classes}
        on:input={handleInput}
        on:change
        on:focus={handleFocus}
        on:blur={handleBlur}
        on:keydown
        on:keyup
        on:keypress
      />
    {:else if type === 'password'}
      <input
        bind:this={inputElement}
        bind:value
        type="password"
        {placeholder}
        {disabled}
        {required}
        id={$$props.id || placeholder}
        class={classes}
        on:input={handleInput}
        on:change
        on:focus={handleFocus}
        on:blur={handleBlur}
        on:keydown
        on:keyup
        on:keypress
      />
    {:else if type === 'search'}
      <input
        bind:this={inputElement}
        bind:value
        type="search"
        {placeholder}
        {disabled}
        {required}
        id={$$props.id || placeholder}
        class={classes}
        on:input={handleInput}
        on:change
        on:focus={handleFocus}
        on:blur={handleBlur}
        on:keydown
        on:keyup
        on:keypress
      />
    {:else}
      <input
        bind:this={inputElement}
        bind:value
        type="text"
        {placeholder}
        {disabled}
        {required}
        id={$$props.id || placeholder}
        class={classes}
        on:input={handleInput}
        on:change
        on:focus={handleFocus}
        on:blur={handleBlur}
        on:keydown
        on:keyup
        on:keypress
      />
    {/if}
    
    {#if icon && iconPosition === 'right'}
      <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <i class="{icon} text-neutral-400" class:text-primary-500={focused}></i>
      </div>
    {/if}
  </div>
  
  {#if error}
    <p class="mt-2 text-sm text-red-600 animate-fade-in-up">
      {error}
    </p>
  {/if}
</div>
