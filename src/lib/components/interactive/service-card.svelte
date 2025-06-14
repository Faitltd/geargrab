<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let icon: string = 'fas fa-cog';
  export let title: string = '';
  export let description: string = '';
  export let iconColor: string = '#FBDF7E';
  export let href: string = '';
  export let clickable: boolean = true;
  
  const dispatch = createEventDispatcher();
  
  let isHovering = false;
  
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
  class="service-card"
  class:hovering={isHovering}
  class:clickable
  on:mouseenter={() => isHovering = true}
  on:mouseleave={() => isHovering = false}
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role={clickable ? 'button' : 'article'}
  tabindex={clickable ? 0 : -1}
>
  <div class="icon-container">
    <i class={icon} style="color: {iconColor};"></i>
  </div>
  
  <h3 class="service-title">{title}</h3>
  
  <p class="service-description">{description}</p>
  
  <slot />
</div>

<style>
  .service-card {
    display: inline-block;
    padding: 2rem 1rem;
    text-align: center;
    margin: 0.5rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 200px;
    max-width: 300px;
    position: relative;
    overflow: hidden;
  }
  
  .service-card.clickable {
    cursor: pointer;
  }
  
  .service-card.hovering {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
  
  .service-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(251, 223, 126, 0.1), rgba(16, 185, 129, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  .service-card.hovering::before {
    opacity: 1;
  }
  
  .icon-container {
    margin-bottom: 1rem;
  }
  
  .icon-container i {
    font-size: 2.5rem;
    transition: transform 0.3s ease;
  }
  
  .service-card.hovering .icon-container i {
    transform: scale(1.1);
  }
  
  .service-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin: 1rem 0;
    line-height: 1.4;
  }
  
  .service-description {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    margin: 0;
  }
  
  /* Focus styles for accessibility */
  .service-card:focus {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .service-card {
      padding: 1.5rem 1rem;
      margin: 0.25rem;
      min-height: 180px;
    }
    
    .icon-container i {
      font-size: 2rem;
    }
    
    .service-title {
      font-size: 1.125rem;
    }
  }
  
  @media (max-width: 480px) {
    .service-card {
      padding: 1rem;
      min-height: 160px;
      max-width: 280px;
    }
    
    .icon-container i {
      font-size: 1.75rem;
    }
    
    .service-title {
      font-size: 1rem;
    }
    
    .service-description {
      font-size: 0.8rem;
    }
  }
</style>
