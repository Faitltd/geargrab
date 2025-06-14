<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let elevation: number = 2;
  export let hoverElevation: number = 12;
  export let imageSrc: string = '';
  export let imageAlt: string = '';
  export let title: string = '';
  export let subtitle: string = '';
  export let description: string = '';
  export let href: string = '';
  export let maxWidth: string = '344px';
  export let imageHeight: string = '200px';
  export let clickable: boolean = true;
  
  const dispatch = createEventDispatcher();
  
  let isHovering = false;
  
  function handleMouseEnter() {
    isHovering = true;
  }
  
  function handleMouseLeave() {
    isHovering = false;
  }
  
  function handleClick() {
    if (clickable) {
      if (href) {
        window.location.href = href;
      } else {
        dispatch('click');
      }
    }
  }
</script>

<div
  class="hover-card"
  class:hovering={isHovering}
  class:clickable
  style="max-width: {maxWidth};"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role={clickable ? 'button' : 'article'}
  tabindex={clickable ? 0 : -1}
>
  {#if imageSrc}
    <div class="image-container" style="height: {imageHeight};">
      <img src={imageSrc} alt={imageAlt} class="card-image" />
    </div>
  {/if}
  
  <div class="card-content">
    {#if title}
      <h3 class="card-title">{title}</h3>
    {/if}
    
    {#if subtitle}
      <p class="card-subtitle">{subtitle}</p>
    {/if}
    
    {#if description}
      <p class="card-description">{description}</p>
    {/if}
    
    <slot />
  </div>
</div>

<style>
  .hover-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 0 auto;
  }
  
  .hover-card.clickable {
    cursor: pointer;
  }
  
  .hover-card.hovering {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
  
  .image-container {
    width: 100%;
    overflow: hidden;
    position: relative;
  }
  
  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hover-card.hovering .card-image {
    transform: scale(1.05);
  }
  
  .card-content {
    padding: 1.5rem;
  }
  
  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
  }
  
  .card-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1rem 0;
    font-weight: 500;
  }
  
  .card-description {
    font-size: 0.875rem;
    color: #4b5563;
    margin: 0;
    line-height: 1.5;
  }
  
  /* Focus styles for accessibility */
  .hover-card:focus {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .hover-card {
      background: #1f2937;
    }
    
    .card-title {
      color: #f9fafb;
    }
    
    .card-subtitle {
      color: #9ca3af;
    }
    
    .card-description {
      color: #d1d5db;
    }
  }
</style>
