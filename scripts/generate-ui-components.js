#!/usr/bin/env node

/**
 * UI Components Generator Script
 * 
 * This script creates common UI components for the GearGrab project.
 * 
 * Usage:
 * node scripts/generate-ui-components.js
 */

const fs = require('fs');
const path = require('path');

// UI Components
const uiComponents = [
  {
    path: 'src/lib/components/layout/Navbar.svelte',
    content: `<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  
  let isMenuOpen = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
</script>

<nav class="bg-white shadow">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="text-green-600 font-bold text-xl">GearGrab</a>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <a href="/" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Home
          </a>
          <a href="/browse" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Browse
          </a>
          <a href="/list-gear" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            List Gear
          </a>
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        {#if $authStore.user}
          <a href="/dashboard" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
            Dashboard
          </a>
          <button class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
            Sign Out
          </button>
        {:else}
          <a href="/auth/login" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
            Log In
          </a>
          <a href="/auth/signup" class="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium ml-2">
            Sign Up
          </a>
        {/if}
      </div>
      <div class="-mr-2 flex items-center sm:hidden">
        <button 
          type="button" 
          class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500" 
          aria-expanded="false"
          on:click={toggleMenu}
        >
          <span class="sr-only">Open main menu</span>
          <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  {#if isMenuOpen}
    <div class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <a href="/" class="bg-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
          Home
        </a>
        <a href="/browse" class="bg-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
          Browse
        </a>
        <a href="/list-gear" class="bg-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
          List Gear
        </a>
      </div>
      <div class="pt-4 pb-3 border-t border-gray-200">
        {#if $authStore.user}
          <div class="flex items-center px-4">
            <div class="flex-shrink-0">
              <span class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                <span class="text-xl font-medium leading-none text-white">
                  {$authStore.user.displayName?.[0] || $authStore.user.email?.[0] || 'U'}
                </span>
              </span>
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800">{$authStore.user.displayName || $authStore.user.email}</div>
            </div>
          </div>
          <div class="mt-3 space-y-1">
            <a href="/dashboard" class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              Dashboard
            </a>
            <button class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              Sign out
            </button>
          </div>
        {:else}
          <div class="mt-3 space-y-1">
            <a href="/auth/login" class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              Log In
            </a>
            <a href="/auth/signup" class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
              Sign Up
            </a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>`
  },
  {
    path: 'src/lib/components/layout/Footer.svelte',
    content: `<footer class="bg-gray-800 text-white">
  <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 class="text-lg font-semibold mb-4">GearGrab</h3>
        <p class="text-gray-300 text-sm">
          The peer-to-peer marketplace for outdoor gear rentals.
        </p>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-4">Company</h3>
        <ul class="space-y-2 text-gray-300 text-sm">
          <li><a href="/about" class="hover:text-white">About Us</a></li>
          <li><a href="/how-it-works" class="hover:text-white">How It Works</a></li>
          <li><a href="/safety" class="hover:text-white">Safety & Trust</a></li>
        </ul>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-4">Support</h3>
        <ul class="space-y-2 text-gray-300 text-sm">
          <li><a href="/help" class="hover:text-white">Help Center</a></li>
          <li><a href="/contact" class="hover:text-white">Contact Us</a></li>
          <li><a href="/faq" class="hover:text-white">FAQ</a></li>
        </ul>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold mb-4">Legal</h3>
        <ul class="space-y-2 text-gray-300 text-sm">
          <li><a href="/terms" class="hover:text-white">Terms of Service</a></li>
          <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    
    <div class="mt-8 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
      <p class="text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} GearGrab. All rights reserved.
      </p>
    </div>
  </div>
</footer>`
  },
  {
    path: 'src/lib/components/forms/Button.svelte',
    content: `<script lang="ts">
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'primary' | 'secondary' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  
  // Compute classes based on props
  $: variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }[variant];
  
  $: sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  }[size];
  
  $: widthClass = fullWidth ? 'w-full' : '';
</script>

<button
  {type}
  class="inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 {variantClasses} {sizeClasses} {widthClass} {disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}"
  {disabled}
  on:click
>
  {#if loading}
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  <slot />
</button>`
  },
  {
    path: 'src/lib/components/forms/Input.svelte',
    content: `<script lang="ts">
  export let type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' = 'text';
  export let name: string;
  export let label: string = '';
  export let value: string = '';
  export let placeholder: string = '';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = '';
  export let helpText: string = '';
  
  // Handle input change
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
  }
</script>

<div>
  {#if label}
    <label for={name} class="block text-sm font-medium text-gray-700 mb-1">
      {label}{required ? ' *' : ''}
    </label>
  {/if}
  
  <input
    {type}
    {name}
    id={name}
    {placeholder}
    {required}
    {disabled}
    {value}
    on:input={handleInput}
    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm {error ? 'border-red-300' : ''}"
    aria-invalid={!!error}
    aria-describedby={error ? \`\${name}-error\` : helpText ? \`\${name}-description\` : undefined}
  />
  
  {#if error}
    <p id="{name}-error" class="mt-1 text-sm text-red-600">{error}</p>
  {:else if helpText}
    <p id="{name}-description" class="mt-1 text-sm text-gray-500">{helpText}</p>
  {/if}
</div>`
  },
  {
    path: 'src/lib/components/display/Card.svelte',
    content: `<script lang="ts">
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let shadow: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let rounded: 'none' | 'sm' | 'md' | 'lg' | 'full' = 'md';
  export let border: boolean = false;
  
  // Compute classes based on props
  $: paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  }[padding];
  
  $: shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg'
  }[shadow];
  
  $: roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }[rounded];
  
  $: borderClass = border ? 'border border-gray-200' : '';
</script>

<div class="bg-white {paddingClasses} {shadowClasses} {roundedClasses} {borderClass}">
  <slot />
</div>`
  },
  {
    path: 'src/lib/components/display/Alert.svelte',
    content: `<script lang="ts">
  export let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  export let title: string = '';
  export let dismissible: boolean = false;
  
  let visible = true;
  
  // Compute classes based on type
  $: typeClasses = {
    info: 'bg-blue-50 text-blue-800',
    success: 'bg-green-50 text-green-800',
    warning: 'bg-yellow-50 text-yellow-800',
    error: 'bg-red-50 text-red-800'
  }[type];
  
  $: iconClasses = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  }[type];
  
  function dismiss() {
    visible = false;
  }
</script>

{#if visible}
  <div class="rounded-md p-4 {typeClasses}">
    <div class="flex">
      <div class="flex-shrink-0">
        {#if type === 'info'}
          <svg class="h-5 w-5 {iconClasses}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        {:else if type === 'success'}
          <svg class="h-5 w-5 {iconClasses}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        {:else if type === 'warning'}
          <svg class="h-5 w-5 {iconClasses}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        {:else if type === 'error'}
          <svg class="h-5 w-5 {iconClasses}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        {/if}
      </div>
      <div class="ml-3 flex-1">
        {#if title}
          <h3 class="text-sm font-medium">{title}</h3>
        {/if}
        <div class="text-sm {title ? 'mt-2' : ''}">
          <slot />
        </div>
      </div>
      {#if dismissible}
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button 
              type="button" 
              class="{typeClasses} rounded-md p-1.5 inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-{type}-50 focus:ring-{type}-600"
              on:click={dismiss}
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}`
  }
];

// Create files
uiComponents.forEach(component => {
  const fullPath = path.join(process.cwd(), component.path);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, component.content);
  console.log(`Created component: ${fullPath}`);
});

console.log('UI components generated successfully!');
console.log('Next steps:');
console.log('1. Update src/routes/+layout.svelte to import the Navbar and Footer components');
console.log('2. Use these components in your pages');
