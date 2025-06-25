<script lang="ts">
  export let src: string;
  export let alt: string;
  export let width: number | undefined = undefined;
  export let height: number | undefined = undefined;
  export let loading: 'lazy' | 'eager' = 'lazy';
  export let priority: boolean = false;
  export let className: string = '';
  export let sizes: string = '100vw';
  
  // Generate WebP and AVIF versions if using Unsplash
  function generateOptimizedSrc(originalSrc: string, format: 'webp' | 'avif' = 'webp') {
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      url.searchParams.set('fm', format);
      url.searchParams.set('q', '80'); // Good quality/size balance
      return url.toString();
    }
    return originalSrc;
  }
  
  // Generate responsive sizes for Unsplash images
  function generateSrcSet(originalSrc: string, format?: 'webp' | 'avif') {
    if (originalSrc.includes('unsplash.com')) {
      const baseUrl = format ? generateOptimizedSrc(originalSrc, format) : originalSrc;
      const url = new URL(baseUrl);
      
      const widths = [320, 640, 768, 1024, 1280, 1920];
      return widths.map(w => {
        const srcUrl = new URL(url);
        srcUrl.searchParams.set('w', w.toString());
        return `${srcUrl.toString()} ${w}w`;
      }).join(', ');
    }
    return '';
  }
  
  $: webpSrc = generateOptimizedSrc(src, 'webp');
  $: avifSrc = generateOptimizedSrc(src, 'avif');
  $: webpSrcSet = generateSrcSet(src, 'webp');
  $: avifSrcSet = generateSrcSet(src, 'avif');
  $: fallbackSrcSet = generateSrcSet(src);
</script>

<picture>
  <!-- AVIF format (best compression) -->
  {#if avifSrcSet}
    <source 
      srcset={avifSrcSet}
      sizes={sizes}
      type="image/avif"
    />
  {/if}
  
  <!-- WebP format (good compression, wide support) -->
  {#if webpSrcSet}
    <source 
      srcset={webpSrcSet}
      sizes={sizes}
      type="image/webp"
    />
  {/if}
  
  <!-- Fallback to original format -->
  <img
    {src}
    {alt}
    {width}
    {height}
    loading={priority ? 'eager' : loading}
    decoding={priority ? 'sync' : 'async'}
    srcset={fallbackSrcSet || undefined}
    sizes={fallbackSrcSet ? sizes : undefined}
    class={className}
    style="max-width: 100%; height: auto;"
  />
</picture>

<style>
  img {
    transition: opacity 0.3s ease;
  }
  
  img[loading="lazy"] {
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
  }
  
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
</style>
