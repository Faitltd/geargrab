<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { SearchInputProps } from '$lib/types/components';
  import { validatePropsInDev, commonSchemas } from '$lib/utils/prop-validation';

  // Props with TypeScript interface
  export let value: SearchInputProps['value'] = '';
  export let placeholder: SearchInputProps['placeholder'] = 'What gear do you need?';
  export let disabled: SearchInputProps['disabled'] = false;
  export let className: SearchInputProps['className'] = '';

  const dispatch = createEventDispatcher<{
    input: { value: string };
    focus: void;
    blur: void;
    keydown: { event: KeyboardEvent; value: string };
  }>();

  // Validate props in development
  onMount(() => {
    validatePropsInDev(
      { value, placeholder, disabled, className },
      commonSchemas.searchInput,
      'SearchInput'
    );
  });

  let inputElement: HTMLInputElement;
  let debounceTimeout: NodeJS.Timeout;

  function handleInput() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      dispatch('input', { value });
    }, 300);
  }

  function handleFocus() {
    dispatch('focus');
  }

  function handleBlur() {
    // Delay blur to allow suggestion clicks
    setTimeout(() => {
      dispatch('blur');
    }, 200);
  }

  function handleKeydown(event: KeyboardEvent) {
    dispatch('keydown', { event, value });
  }

  // Expose focus method for parent components
  export function focus() {
    inputElement?.focus();
  }
</script>

<input
  bind:this={inputElement}
  bind:value
  type="text"
  {placeholder}
  {disabled}
  class="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-300 text-sm md:text-base transition-colors duration-200 {className}"
  style="background-color: rgba(31, 41, 55, 0.7) !important; border-color: rgb(75, 85, 99) !important; color: white !important;"
  autocomplete="off"
  role="searchbox"
  aria-label="Search for outdoor gear"
  aria-autocomplete="list"
  on:input={handleInput}
  on:focus={handleFocus}
  on:blur={handleBlur}
  on:keydown={handleKeydown}
/>
