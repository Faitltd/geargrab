<script lang="ts">
  export let listing: any;
  export let onClick: (() => void) | undefined = undefined;
  
  function handleClick() {
    if (onClick) {
      onClick();
    }
  }
  
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price || 0);
  }
  
  // Safe property access with fallbacks
  $: title = listing?.title || 'Outdoor Gear';
  $: category = listing?.category || 'Equipment';
  $: dailyPrice = listing?.dailyPrice || 25;
  $: location = listing?.location || { city: 'Local', state: 'Area' };
  $: images = listing?.images || [];
  $: primaryImage = images[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80';"
</script>

<div class="parent" on:click="{handleClick}" on:keydown="{handleClick}" role="button" tabindex="0">
  <div class="card">
    <!-- Photo Background -->
    <div class="photo-background" style="background-image: url('{primaryImage}')"></div>
    
    <!-- Gradient Overlay for readability -->
    <div class="gradient-overlay"></div>
    
    <!-- Glass layer -->
    <div class="glass"></div>
    
    <!-- Logo circles -->
    <div class="logo">
      <span class="circle circle1"></span>
      <span class="circle circle2"></span>
      <span class="circle circle3"></span>
      <span class="circle circle4"></span>
      <span class="circle circle5">
        <svg class="svg" viewBox="0 0 24 24">
          <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z"/>
        </svg>
      </span>
    </div>
    
    <!-- Main content -->
    <div class="content">
      <span class="title">{title}</span>
      <span class="text">{category}</span>
      <span class="price">{formatPrice(dailyPrice)}/day</span>
      <span class="location">{location.city}, {location.state}</span>
    </div>
    
    <!-- Bottom section -->
    <div class="bottom">
      <div class="social-buttons-container">
        <button class="social-button" type="button" title="Add to favorites">
          <svg class="svg" viewBox="0 0 24 24">
            <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"/>
          </svg>
        </button>
        <button class="social-button" type="button" title="Share">
          <svg class="svg" viewBox="0 0 24 24">
            <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12S8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5S19.66 2 18 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12S4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.92 18 21.92S20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z"/>
          </svg>
        </button>
        <button class="social-button" type="button" title="More info">
          <svg class="svg" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M13 17H11V15H13V17M13 13H11V7H13V13Z"/>
          </svg>
        </button>
      </div>
      
      <div class="view-more">
        <button class="view-more-button" type="button">View More</button>
        <svg class="svg" viewBox="0 0 24 24">
          <path d="M5 12H19M19 12L12 5M19 12L12 19"/>
        </svg>
      </div>
    </div>
  </div>
</div>

<style>
  .parent {
    width: 290px;
    height: 300px;
    perspective: 1000px;
    cursor: pointer;
  }

  .card {
    height: 100%;
    border-radius: 50px;
    position: relative;
    overflow: hidden;
    transition: all 0.5s ease-in-out;
    transform-style: preserve-3d;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px;
  }

  .photo-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transform: translate3d(0, 0, 0);
    transition: transform 0.5s ease-in-out;
  }

  .gradient-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(0, 255, 214, 0.3) 0%,
      rgba(8, 226, 96, 0.4) 50%,
      rgba(0, 0, 0, 0.6) 100%
    );
    transform: translate3d(0, 0, 10px);
    transition: all 0.5s ease-in-out;
  }

  .glass {
    transform-style: preserve-3d;
    position: absolute;
    inset: 8px;
    border-radius: 55px;
    border-top-right-radius: 100%;
    background: linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.3) 100%
    );
    transform: translate3d(0px, 0px, 25px);
    border-left: 1px solid rgba(255, 255, 255, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.5);
    transition: all 0.5s ease-in-out;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .content {
    padding: 100px 60px 0px 30px;
    transform: translate3d(0, 0, 26px);
    position: relative;
    z-index: 10;
  }

  .content .title {
    display: block;
    color: white;
    font-weight: 900;
    font-size: 18px;
    line-height: 1.2;
    margin-bottom: 6px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .content .text {
    display: block;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin-top: 4px;
    line-height: 1.3;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .content .price {
    display: block;
    color: #00ffd6;
    font-size: 16px;
    font-weight: bold;
    margin-top: 6px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .content .location {
    display: block;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    margin-top: 4px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .bottom {
    padding: 10px 12px;
    transform-style: preserve-3d;
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transform: translate3d(0, 0, 26px);
    z-index: 10;
  }

  .bottom .view-more {
    display: flex;
    align-items: center;
    width: 40%;
    justify-content: flex-end;
    transition: all 0.2s ease-in-out;
  }

  .bottom .view-more:hover {
    transform: translate3d(0, 0, 10px);
  }

  .bottom .view-more .view-more-button {
    background: none;
    border: none;
    color: white;
    font-weight: bolder;
    font-size: 12px;
    cursor: pointer;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .bottom .view-more .svg {
    fill: none;
    stroke: white;
    stroke-width: 3px;
    max-height: 15px;
    margin-left: 4px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }

  .bottom .social-buttons-container {
    display: flex;
    gap: 8px;
    transform-style: preserve-3d;
  }

  .bottom .social-buttons-container .social-button {
    width: 28px;
    aspect-ratio: 1;
    padding: 4px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    border: none;
    display: grid;
    place-content: center;
    box-shadow: rgba(0, 0, 0, 0.3) 0px 4px 8px -2px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .bottom .social-buttons-container .social-button:first-child {
    transition: transform 0.2s ease-in-out 0.4s, box-shadow 0.2s ease-in-out 0.4s;
  }

  .bottom .social-buttons-container .social-button:nth-child(2) {
    transition: transform 0.2s ease-in-out 0.6s, box-shadow 0.2s ease-in-out 0.6s;
  }

  .bottom .social-buttons-container .social-button:nth-child(3) {
    transition: transform 0.2s ease-in-out 0.8s, box-shadow 0.2s ease-in-out 0.8s;
  }

  .bottom .social-buttons-container .social-button .svg {
    width: 14px;
    fill: #00894d;
  }

  .bottom .social-buttons-container .social-button:hover {
    background: rgba(0, 255, 214, 0.9);
    transform: scale(1.1);
  }

  .bottom .social-buttons-container .social-button:hover .svg {
    fill: white;
  }

  .bottom .social-buttons-container .social-button:active {
    background: rgba(8, 226, 96, 0.9);
  }

  .logo {
    position: absolute;
    right: 0;
    top: 0;
    transform-style: preserve-3d;
    z-index: 5;
  }

  .logo .circle {
    display: block;
    position: absolute;
    aspect-ratio: 1;
    border-radius: 50%;
    top: 0;
    right: 0;
    box-shadow: rgba(0, 0, 0, 0.2) -5px 5px 15px 0px;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.5s ease-in-out;
  }

  .logo .circle1 {
    width: 170px;
    transform: translate3d(0, 0, 20px);
    top: 8px;
    right: 8px;
  }

  .logo .circle2 {
    width: 140px;
    transform: translate3d(0, 0, 40px);
    top: 10px;
    right: 10px;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    transition-delay: 0.4s;
  }

  .logo .circle3 {
    width: 110px;
    transform: translate3d(0, 0, 60px);
    top: 17px;
    right: 17px;
    transition-delay: 0.8s;
  }

  .logo .circle4 {
    width: 80px;
    transform: translate3d(0, 0, 80px);
    top: 23px;
    right: 23px;
    transition-delay: 1.2s;
  }

  .logo .circle5 {
    width: 50px;
    transform: translate3d(0, 0, 100px);
    top: 30px;
    right: 30px;
    display: grid;
    place-content: center;
    transition-delay: 1.6s;
  }

  .logo .circle5 .svg {
    width: 20px;
    fill: white;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  .parent:hover .card {
    transform: rotate3d(1, 1, 0, 30deg);
    box-shadow: rgba(0, 0, 0, 0.2) 20px 30px 40px -10px, rgba(0, 0, 0, 0.1) 0px 15px 25px 0px;
  }

  .parent:hover .photo-background {
    transform: translate3d(0, 0, 0) scale(1.1);
  }

  .parent:hover .gradient-overlay {
    background: linear-gradient(
      135deg,
      rgba(0, 255, 214, 0.4) 0%,
      rgba(8, 226, 96, 0.5) 50%,
      rgba(0, 0, 0, 0.7) 100%
    );
  }

  .parent:hover .card .bottom .social-buttons-container .social-button {
    transform: translate3d(0, 0, 50px);
    box-shadow: rgba(0, 0, 0, 0.3) -3px 15px 8px 0px;
  }

  .parent:hover .card .logo .circle2 {
    transform: translate3d(0, 0, 60px);
  }

  .parent:hover .card .logo .circle3 {
    transform: translate3d(0, 0, 80px);
  }

  .parent:hover .card .logo .circle4 {
    transform: translate3d(0, 0, 100px);
  }

  .parent:hover .card .logo .circle5 {
    transform: translate3d(0, 0, 120px);
  }
</style>