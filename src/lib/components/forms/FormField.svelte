<script lang="ts">
  export let label: string;
  export let id: string;
  export let type: string = 'text';
  export let value: string | number = '';
  export let placeholder: string = '';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = '';
  export let autocomplete: string = '';
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let step: number | undefined = undefined;
  export let maxlength: number | undefined = undefined;
  export let rows: number | undefined = undefined;
  export let options: Array<{value: string, label: string}> = [];
  export let className: string = '';

  // Determine if this is a textarea, select, or input
  $: isTextarea = type === 'textarea';
  $: isSelect = type === 'select';
  $: isNumber = type === 'number';
  $: isEmail = type === 'email';
  $: isPassword = type === 'password';

  // Base classes for all form elements
  const baseClasses = 'w-full px-4 py-3 rounded-lg bg-gray-800/70 border border-gray-600 text-white placeholder-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200';
  
  // Error classes
  $: errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  
  // Combined classes
  $: inputClasses = `${baseClasses} ${errorClasses} ${className}`;
</script>

<div class="form-field">
  <label for={id} class="block text-sm font-medium text-white mb-2">
    {label}
    {#if required}
      <span class="text-red-400 ml-1" aria-label="required">*</span>
    {/if}
  </label>

  {#if isTextarea}
    <textarea
      {id}
      bind:value
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      {maxlength}
      rows={rows || 4}
      class={inputClasses}
      on:input
      on:blur
      on:focus
    ></textarea>
  {:else if isSelect}
    <select
      {id}
      bind:value
      {required}
      {disabled}
      class={inputClasses}
      on:change
      on:blur
      on:focus
    >
      <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  {:else if isEmail}
    <input
      {id}
      type="email"
      bind:value
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      {maxlength}
      class={inputClasses}
      on:input
      on:blur
      on:focus
      on:keydown
    />
  {:else if isPassword}
    <input
      {id}
      type="password"
      bind:value
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      {maxlength}
      class={inputClasses}
      on:input
      on:blur
      on:focus
      on:keydown
    />
  {:else if isNumber}
    <input
      {id}
      type="number"
      bind:value
      {placeholder}
      {required}
      {disabled}
      {min}
      {max}
      {step}
      class={inputClasses}
      on:input
      on:blur
      on:focus
      on:keydown
    />
  {:else}
    <input
      {id}
      type="text"
      bind:value
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      {maxlength}
      class={inputClasses}
      on:input
      on:blur
      on:focus
      on:keydown
    />
  {/if}

  {#if error}
    <p class="mt-1 text-sm text-red-400">{error}</p>
  {/if}
</div>

<style>
  .form-field {
    margin-bottom: 1.5rem;
  }

  /* Custom focus styles for better accessibility */
  .form-field input:focus,
  .form-field textarea:focus,
  .form-field select:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }

  /* Disabled state */
  .form-field input:disabled,
  .form-field textarea:disabled,
  .form-field select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Number input styling */
  .form-field input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .form-field input[type="number"]::-webkit-outer-spin-button,
  .form-field input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
