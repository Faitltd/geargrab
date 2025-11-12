<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let checked = false;
  export let label = '';
  export let name = '';
  export let value = '';
  export let disabled = false;
  export let id = '';
  export let required = false;
  export let labelClass = 'text-white text-sm';
  export let wrapperClass = '';

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

<style>
  .checkbox-wrapper-12 {
    position: relative;
  }

  .checkbox-wrapper-12 > svg {
    position: absolute;
    top: -130%;
    left: -170%;
    width: 110px;
    height: 110px;
    pointer-events: none;
  }

  .checkbox-wrapper-12 * {
    box-sizing: border-box;
  }

  .checkbox-wrapper-12 input[type="checkbox"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    margin: 0;
  }

  .checkbox-wrapper-12 input[type="checkbox"]:focus {
    outline: 0;
  }

  .checkbox-wrapper-12 .cbx {
    width: 24px;
    height: 24px;
    top: calc(50% - 12px);
    left: calc(50% - 12px);
    position: relative;
    transform: rotate(0deg);
    border-radius: 50%;
    color: #10b981;
    transition: all 0.3s ease;
    perspective: 800px;
  }

  .checkbox-wrapper-12 .cbx label {
    width: 24px;
    height: 24px;
    background: transparent;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }

  .checkbox-wrapper-12 .cbx label:after {
    content: '';
    width: 10px;
    height: 10px;
    position: absolute;
    top: 5px;
    left: 5px;
    background: #10b981;
    border-radius: 50%;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s ease;
  }

  .checkbox-wrapper-12 .cbx svg {
    position: absolute;
    top: 5px;
    left: 4px;
    z-index: 1;
    pointer-events: none;
  }

  .checkbox-wrapper-12 .cbx svg path {
    stroke: #fff;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 19;
    stroke-dashoffset: 19;
    transition: stroke-dashoffset 0.3s ease;
    transition-delay: 0.2s;
  }

  .checkbox-wrapper-12 input[type="checkbox"]:checked + label {
    border-color: #10b981;
    background: #10b981;
    animation: pulse 0.3s ease;
  }

  .checkbox-wrapper-12 input[type="checkbox"]:checked + label:after {
    opacity: 1;
    transform: scale(1);
  }

  .checkbox-wrapper-12 input[type="checkbox"]:checked ~ svg path {
    stroke-dashoffset: 0;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
