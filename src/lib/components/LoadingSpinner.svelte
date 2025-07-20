<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let color: 'primary' | 'accent' | 'white' = 'primary';
  export let text: string = '';
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colorClasses = {
    primary: 'text-primary-500',
    accent: 'text-accent-500',
    white: 'text-white'
  };
</script>

<div class="flex flex-col items-center justify-center space-y-3">
  <!-- GearGrab-styled spinning loader -->
  <div class="relative {sizeClasses[size]}">
    <div class="absolute inset-0 {colorClasses[color]} animate-spin">
      <svg class="w-full h-full" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="60 20"
          class="opacity-75"
        />
      </svg>
    </div>
    <!-- Inner circle with GearGrab-style accent -->
    <div class="absolute inset-2 {color === 'primary' ? 'text-accent-500' : 'text-primary-500'} animate-pulse">
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="8" cy="8" r="2" />
      </svg>
    </div>
  </div>
  
  {#if text}
    <p class="text-sm font-medium {colorClasses[color]} animate-pulse">
      {text}
    </p>
  {/if}
</div>

<style>
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
