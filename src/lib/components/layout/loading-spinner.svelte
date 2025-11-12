<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let color: 'primary' | 'secondary' | 'white' = 'primary';
  export let text = '';
  export let fullScreen = false;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'border-green-400',
    secondary: 'border-blue-400',
    white: 'border-white'
  };
</script>

{#if fullScreen}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="text-center">
      <div class="animate-spin rounded-full {sizeClasses[size]} border-b-2 {colorClasses[color]} mx-auto mb-4"></div>
      {#if text}
        <p class="text-white text-lg">{text}</p>
      {/if}
    </div>
  </div>
{:else}
  <div class="flex items-center justify-center py-8">
    <div class="text-center">
      <div class="animate-spin rounded-full {sizeClasses[size]} border-b-2 {colorClasses[color]} mx-auto mb-2"></div>
      {#if text}
        <p class="text-white/80 text-sm">{text}</p>
      {/if}
    </div>
  </div>
{/if}
