<script lang="ts">
  

  // Props with TypeScript interface
  export let steps: StepIndicatorProps['steps'] = [];
  export let currentStep: StepIndicatorProps['currentStep'] = 0;
  export let variant: StepIndicatorProps['variant'] = 'horizontal';
  export let size: StepIndicatorProps['size'] = 'md';
  export let className: StepIndicatorProps['className'] = '';

  // Size configurations
  const sizeConfig = {
    sm: {
      circle: 'w-6 h-6',
      text: 'text-xs',
      connector: 'h-0.5'
    },
    md: {
      circle: 'w-8 h-8',
      text: 'text-sm',
      connector: 'h-0.5'
    },
    lg: {
      circle: 'w-10 h-10',
      text: 'text-base',
      connector: 'h-1'
    }
  };

  $: config = sizeConfig[size];

  function getStepClasses(index, step) {
    const isActive = index === currentStep;
    const isCompleted = step.completed || index < currentStep;
    
    if (isCompleted) {
      return 'bg-green-500 text-white';
    } else if (isActive) {
      return 'bg-green-500 text-white';
    } else {
      return 'bg-gray-600 text-gray-300';
    }
  }

  function getConnectorClasses(index) {
    const isCompleted = index < currentStep;
    return isCompleted ? 'bg-green-500' : 'bg-gray-600';
  }

  function getTextClasses(index) {
    const isActive = index === currentStep;
    return isActive ? 'text-white' : 'text-gray-300';
  }
</script>

{#if variant === 'horizontal'}
  <div class="flex items-center justify-center space-x-4 {className}">
    {#each steps as step, index}
      <div class="flex items-center">
        <!-- Step Circle -->
        <div class="{config.circle} rounded-full {getStepClasses(index, step)} flex items-center justify-center">
          {#if step.completed || index < currentStep}
            <!-- Checkmark for completed steps -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <!-- Step number -->
            <span class="{config.text} font-medium">{index + 1}</span>
          {/if}
        </div>
        
        <!-- Step Label -->
        <span class="ml-2 {config.text} {getTextClasses(index)}">{step.label}</span>
      </div>
      
      <!-- Connector Line (not for last step) -->
      {#if index < steps.length - 1}
        <div class="w-8 {config.connector} {getConnectorClasses(index)}"></div>
      {/if}
    {/each}
  </div>
{:else}
  <!-- Vertical Layout -->
  <div class="flex flex-col space-y-4 {className}">
    {#each steps as step, index}
      <div class="flex items-center">
        <!-- Step Circle -->
        <div class="{config.circle} rounded-full {getStepClasses(index, step)} flex items-center justify-center flex-shrink-0">
          {#if step.completed || index < currentStep}
            <!-- Checkmark for completed steps -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <!-- Step number -->
            <span class="{config.text} font-medium">{index + 1}</span>
          {/if}
        </div>
        
        <!-- Step Label -->
        <span class="ml-3 {config.text} {getTextClasses(index)}">{step.label}</span>
      </div>
      
      <!-- Connector Line (not for last step) -->
      {#if index < steps.length - 1}
        <div class="ml-4 w-0.5 h-8 {getConnectorClasses(index)}"></div>
      {/if}
    {/each}
  </div>
{/if}
