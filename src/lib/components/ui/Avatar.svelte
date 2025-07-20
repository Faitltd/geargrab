<script lang="ts">
  export let src: string = '';
  export let alt: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let fallback: string = '';
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };
  
  let imageError = false;
  
  const handleImageError = () => {
    imageError = true;
  };
  
  $: displayFallback = !src || imageError;
  $: initials = fallback || alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
</script>

<div class="relative inline-flex items-center justify-center rounded-full bg-neutral-100 {sizeClasses[size]}">
  {#if !displayFallback}
    <img
      {src}
      {alt}
      class="w-full h-full rounded-full object-cover"
      on:error={handleImageError}
    />
  {:else}
    <span class="font-medium text-neutral-600">
      {initials}
    </span>
  {/if}
</div>
