<script lang="ts">
  export let type = 'text';
  export let value = '';
  export let placeholder = '';
  export let label = '';
  export let error = '';
  export let disabled = false;
  export let required = false;
  export let id = '';
  export let name = '';
  export let className = '';

  // Generate unique ID if not provided
  $: inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Base input classes using design system
  const baseClasses = 'w-full px-4 py-3 rounded-lg border transition-colors duration-normal focus:outline-none focus:ring-2 focus:ring-offset-2';

  // State classes
  $: stateClasses = error 
    ? 'border-error focus:border-error focus:ring-error' 
    : 'border-gray-300 focus:border-primary focus:ring-primary';

  // Disabled classes
  $: disabledClasses = disabled 
    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
    : 'bg-white text-gray-900';

  // Combined classes
  $: inputClasses = `${baseClasses} ${stateClasses} ${disabledClasses} ${className}`;
</script>

<div class="space-y-2">
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-gray-700">
      {label}
      {#if required}
        <span class="text-error">*</span>
      {/if}
    </label>
  {/if}

  <input
    {type}
    {placeholder}
    {disabled}
    {required}
    {name}
    id={inputId}
    bind:value
    class={inputClasses}
    on:input
    on:change
    on:focus
    on:blur
  />

  {#if error}
    <p class="text-sm text-error flex items-center">
      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {error}
    </p>
  {/if}
</div>

<style>
  /* Custom focus styles using design system */
  input:focus {
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
  
  input[aria-invalid="true"]:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
</style>
