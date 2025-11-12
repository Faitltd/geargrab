<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let src;
  export let alt;
  export let width | undefined = undefined;
  export let height | undefined = undefined;
  export let loading: 'lazy' | 'eager' = 'lazy';
  export let priority = false;
  export let className = '';
  export let sizes = '100vw';
  export let quality = 80;
  export let placeholder = '';
  export let blurDataURL = '';

  let containerElement: HTMLDivElement;
  let loaded = false;
  let error = false;
  let intersecting = false;

  // Enhanced image optimization for multiple services
  function generateOptimizedSrc(originalSrc, format: 'webp' | 'avif' | 'jpg' = 'webp', targetWidth?) {
    // Unsplash optimization
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      url.searchParams.set('fm', format);
      url.searchParams.set('q', quality.toString());
      if (targetWidth) url.searchParams.set('w', targetWidth.toString());
      return url.toString();
    }

    // Firebase Storage optimization (if using Firebase)
    if (originalSrc.includes('firebasestorage.googleapis.com')) {
      // Firebase doesn't support format conversion, but we can add quality params
      const url = new URL(originalSrc);
      if (targetWidth) url.searchParams.set('w', targetWidth.toString());
      return url.toString();
    }

    // Cloudinary optimization
    if (originalSrc.includes('cloudinary.com')) {
      const parts = originalSrc.split('/upload/');
      if (parts.length === 2) {
        const transforms = [`f_${format}`, `q_${quality}`];
        if (targetWidth) transforms.push(`w_${targetWidth}`);
        return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
      }
    }

    return originalSrc;
  }

  // Generate responsive sizes with multiple breakpoints
  function generateSrcSet(originalSrc, format?: 'webp' | 'avif' | 'jpg') {
    const widths = [320, 480, 640, 768, 1024, 1280, 1536, 1920];

    if (originalSrc.includes('unsplash.com') || originalSrc.includes('cloudinary.com')) {
      return widths.map(w => {
        const optimizedSrc = generateOptimizedSrc(originalSrc, format, w);
        return `${optimizedSrc} ${w}w`;
      }).join(', ');
    }

    return '';
  }

  // Intersection Observer for lazy loading
  onMount(() => {
    if (!browser || loading === 'eager' || priority) {
      intersecting = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting = true;
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    if (containerElement) {
      observer.observe(containerElement);
    }

    return () => observer.disconnect();
  });

  function handleLoad() {
    loaded = true;
    error = false;
  }

  function handleError() {
    error = true;
    loaded = false;
  }

  $: webpSrc = generateOptimizedSrc(src, 'webp');
  $: avifSrc = generateOptimizedSrc(src, 'avif');
  $: webpSrcSet = generateSrcSet(src, 'webp');
  $: avifSrcSet = generateSrcSet(src, 'avif');
  $: fallbackSrcSet = generateSrcSet(src, 'jpg');
</script>

<div
  class="optimized-image-container {className}"
  bind:this={containerElement}
>
  {#if intersecting || priority}
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
        src={intersecting ? src : (placeholder || blurDataURL)}
        {alt}
        {width}
        {height}
        loading={priority ? 'eager' : loading}
        decoding={priority ? 'sync' : 'async'}
        fetchpriority={priority ? 'high' : 'auto'}
        srcset={fallbackSrcSet || undefined}
        sizes={fallbackSrcSet ? sizes : undefined}
        class="optimized-image {loaded ? 'loaded' : ''} {error ? 'error' : ''}"
        style="max-width: 100%; height: auto;"
        on:load={handleLoad}
        on:error={handleError}
      />
    </picture>
  {:else}
    <!-- Placeholder while not intersecting -->
    <div class="image-placeholder" style="aspect-ratio: {width && height ? `${width}/${height}` : '16/9'};">
      {#if blurDataURL}
        <img src={blurDataURL} {alt} class="blur-placeholder" />
      {:else}
        <div class="skeleton-placeholder"></div>
      {/if}
    </div>
  {/if}

  {#if error}
    <div class="error-state">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>Failed to load image</span>
    </div>
  {/if}
</div>

<style>
  .optimized-image-container {
    position: relative;
    overflow: hidden;
    display: block;
  }

  .optimized-image {
    width: 100%;
    height: auto;
    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
    opacity: 0;
  }

  .optimized-image.loaded {
    opacity: 1;
  }

  .optimized-image.error {
    opacity: 0;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f3f4f6;
    border-radius: inherit;
  }

  .blur-placeholder {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(10px);
    opacity: 0.7;
    transform: scale(1.1);
  }

  .skeleton-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: inherit;
  }

  .error-state {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f9fafb;
    color: #6b7280;
    border-radius: inherit;
  }

  .error-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
  }

  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Performance optimizations */
  .optimized-image {
    will-change: opacity;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  /* Responsive image behavior */
  picture {
    display: block;
    width: 100%;
    height: 100%;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .image-placeholder {
      background-color: #374151;
    }

    .skeleton-placeholder {
      background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
      background-size: 200% 100%;
    }

    .error-state {
      background-color: #1f2937;
      color: #9ca3af;
    }
  }
</style>
