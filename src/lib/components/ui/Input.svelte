<script lang="ts">
  import type { InputType, InputSize } from '$lib/types';

  // Props
  export let type: InputType = 'text';
  export let size: InputSize = 'md';
  export let value = '';
  export let placeholder = '';
  export let disabled = false;
  export let readonly = false;
  export let required = false;
  export let error = '';
  export let helpText = '';
  export let label = '';
  export let id = '';
  export let name = '';
  export let autocomplete = '';
  export let maxlength: number | undefined = undefined;
  export let minlength: number | undefined = undefined;
  export let pattern: string | undefined = undefined;
  export let min: string | number | undefined = undefined;
  export let max: string | number | undefined = undefined;
  export let step: string | number | undefined = undefined;

  // Generate unique ID if not provided
  $: inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Classes
  const baseClasses = 'block w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const stateClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    disabled: 'bg-gray-50 border-gray-200'
  };

  $: state = error ? 'error' : disabled ? 'disabled' : 'default';
  $: classes = [
    baseClasses,
    sizeClasses[size],
    stateClasses[state]
  ].join(' ');
</script>

<div class="space-y-1">
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-gray-700">
      {label}
      {#if required}
        <span class="text-red-500 ml-1">*</span>
      {/if}
    </label>
  {/if}

  <div class="relative">
    <input
      {type}
      {name}
      {placeholder}
      {disabled}
      {readonly}
      {required}
      {autocomplete}
      {maxlength}
      {minlength}
      {pattern}
      {min}
      {max}
      {step}
      id={inputId}
      class={classes}
      bind:value
      on:input
      on:change
      on:focus
      on:blur
      on:keydown
      on:keyup
      on:keypress
    />

    <!-- Icon slot for input decorations -->
    <slot name="icon" />
  </div>

  {#if error}
    <p class="text-sm text-red-600" role="alert">
      {error}
    </p>
  {:else if helpText}
    <p class="text-sm text-gray-500">
      {helpText}
    </p>
  {/if}
</div>

<style>
  /* Remove default input styling for better cross-browser consistency */
  input {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }

  /* Custom focus styles */
  input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Error state focus */
  input.border-red-300:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
</style>
