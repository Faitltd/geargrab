#!/usr/bin/env node

/**
 * Component Generator Script
 * 
 * Usage:
 * node scripts/generate-component.js --type=component --name=Button --path=lib/components/forms
 * node scripts/generate-component.js --type=page --name=ListGear --path=routes/list-gear
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {});

// Default values
const type = args.type || 'component';
const name = args.name || 'NewComponent';
const componentPath = args.path || 'lib/components';

// Templates
const componentTemplate = `<script lang="ts">
  // Props
  export let prop1: string = '';
  export let prop2: number = 0;
  
  // State
  let localState = '';
  
  // Methods
  function handleClick() {
    console.log('Clicked!');
  }
</script>

<div class="component">
  <h2>{prop1}</h2>
  <p>Value: {prop2}</p>
  <button on:click={handleClick}>Click me</button>
</div>

<style>
  .component {
    /* Component styles */
  }
</style>`;

const pageTemplate = `<script lang="ts">
  import { onMount } from 'svelte';
  
  // Page state
  let loading = true;
  let data = [];
  
  // Load data
  onMount(async () => {
    try {
      // Fetch data or initialize page
      loading = false;
    } catch (error) {
      console.error('Error loading page:', error);
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>${name} - GearGrab</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">${name}</h1>
  
  {#if loading}
    <div class="loading">Loading...</div>
  {:else}
    <div class="content">
      <!-- Page content goes here -->
    </div>
  {/if}
</div>`;

// Create directory if it doesn't exist
const baseDir = 'src';
const fullPath = path.join(baseDir, componentPath);

if (!fs.existsSync(fullPath)) {
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`Created directory: ${fullPath}`);
}

// Create the file
const fileName = `${name}.svelte`;
const filePath = path.join(fullPath, fileName);
const template = type === 'component' ? componentTemplate : pageTemplate;

fs.writeFileSync(filePath, template);
console.log(`Created ${type}: ${filePath}`);
