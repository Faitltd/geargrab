<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let checked: boolean = false;
  export let label: string = '';
  export let name: string = '';
  export let value: string = '';
  export let disabled: boolean = false;
  export let id: string = '';
  export let required: boolean = false;
  export let labelClass: string = 'text-white text-sm';
  export let wrapperClass: string = '';

  const dispatch = createEventDispatcher();

  // Generate unique ID if not provided
  const uniqueId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    checked = target.checked;
    dispatch('change', {
      checked,
      value,
      name,
      event
    });
  }
</script>

<div class="flex items-center space-x-3 {wrapperClass}">
  <div class="checkbox-wrapper-12">
    <div class="cbx">
      <input
        id="{uniqueId}"
        type="checkbox"
        {name}
        {value}
        {disabled}
        {required}
        bind:checked
        on:change="{handleChange}"
      />
      <label for="{uniqueId}"></label>
      <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
        <path d="M2 8.36364L6.23077 12L13 2"></path>
      </svg>
    </div>
  </div>
  
  {#if label}
    <label for="{uniqueId}" class="cursor-pointer {labelClass}">
      {label}
    </label>
  {/if}
  
  <!-- Slot for custom label content -->
  <slot />
</div>
