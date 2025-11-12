<script lang="ts">
  export let variant: 'skewed' | 'egg' | 'mountain' | 'wave' = 'skewed';
  export let color = '#000000';
  export let opacity = 0.1;
  export let height = '400px';
  export let skewAngle = 6;
  export let position: 'top' | 'bottom' | 'center' = 'center';
</script>

<div class="geometric-background" style="height: {height};">
  {#if variant === 'skewed'}
    <div class="skewed-container">
      <div 
        class="skewed-left" 
        style="background: {color}; opacity: {opacity}; transform: skew(0deg, {skewAngle}deg);"
      ></div>
      <div 
        class="skewed-right" 
        style="background: {color}; opacity: {opacity}; transform: skew(0deg, -{skewAngle}deg);"
      ></div>
    </div>
  {:else if variant === 'egg'}
    <div 
      class="egg-shape" 
      style="background: {color}; opacity: {opacity};"
    ></div>
  {:else if variant === 'mountain'}
    <div class="mountain-container">
      <div 
        class="mountain-peak" 
        style="border-bottom-color: {color}; opacity: {opacity};"
      ></div>
      <div 
        class="mountain-base" 
        style="background: {color}; opacity: {opacity};"
      ></div>
    </div>
  {:else if variant === 'wave'}
    <div class="wave-container">
      <svg class="wave-svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path 
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
          fill={color} 
          fill-opacity={opacity}
        ></path>
      </svg>
    </div>
  {/if}
  
  <div class="content-overlay">
    <slot />
  </div>
</div>

<style>
  .geometric-background {
    position: relative;
    width: 100%;
    overflow: hidden;
  }
  
  .content-overlay {
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Skewed Background */
  .skewed-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  
  .skewed-left,
  .skewed-right {
    position: absolute;
    top: 0;
    height: 100%;
    width: 50%;
  }
  
  .skewed-left {
    left: 0;
    transform-origin: top left;
  }
  
  .skewed-right {
    right: 0;
    transform-origin: top right;
  }
  
  /* Egg Shape */
  .egg-shape {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 400px;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    z-index: 1;
  }
  
  /* Mountain Shape */
  .mountain-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  
  .mountain-peak {
    position: absolute;
    bottom: 40%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 200px solid transparent;
    border-right: 200px solid transparent;
    border-bottom: 200px solid;
  }
  
  .mountain-base {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40%;
  }
  
  /* Wave Shape */
  .wave-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 120px;
    z-index: 1;
  }
  
  .wave-svg {
    position: relative;
    display: block;
    width: calc(100% + 1.3px);
    height: 120px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .egg-shape {
      width: 200px;
      height: 300px;
    }
    
    .mountain-peak {
      border-left-width: 150px;
      border-right-width: 150px;
      border-bottom-width: 150px;
    }
  }
  
  @media (max-width: 480px) {
    .egg-shape {
      width: 150px;
      height: 200px;
    }
    
    .mountain-peak {
      border-left-width: 100px;
      border-right-width: 100px;
      border-bottom-width: 100px;
    }
  }
</style>
