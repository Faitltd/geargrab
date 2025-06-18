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
  $: primaryImage = images[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  $: averageRating = listing?.averageRating || 4.5;
  $: reviewCount = listing?.reviewCount || 12;
</script>

<div class="listing-card" on:click={handleClick} on:keydown={handleClick} role="button" tabindex="0">
  <!-- Image -->
  <div class="image-container">
    <img src={primaryImage} alt={title} class="listing-image" />
    <div class="price-badge">
      {formatPrice(dailyPrice)}/day
    </div>
  </div>

  <!-- Content -->
  <div class="card-content">
    <h3 class="title">{title}</h3>
    <p class="category">{category}</p>
    <p class="location">{location.city}, {location.state}</p>
    
    <!-- Rating -->
    <div class="rating">
      <div class="stars">
        {#each Array(5) as _, i}
          <svg class="star {i < Math.floor(averageRating) ? 'filled' : 'empty'}" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        {/each}
      </div>
      <span class="review-count">({reviewCount})</span>
    </div>
  </div>
</div>

<style>
  .listing-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    max-width: 300px;
  }

  .listing-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(0, 255, 214, 0.5);
  }

  .image-container {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }

  .listing-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .listing-card:hover .listing-image {
    transform: scale(1.05);
  }

  .price-badge {
    position: absolute;
    bottom: 12px;
    left: 12px;
    background: rgba(0, 255, 214, 0.9);
    color: #000;
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .card-content {
    padding: 16px;
    color: white;
  }

  .title {
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 8px 0;
    color: white;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 4px 0;
  }

  .location {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 12px 0;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stars {
    display: flex;
    gap: 2px;
  }

  .star {
    width: 16px;
    height: 16px;
  }

  .star.filled {
    fill: #fbbf24;
  }

  .star.empty {
    fill: rgba(255, 255, 255, 0.3);
  }

  .review-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }

  /* Focus styles for accessibility */
  .listing-card:focus {
    outline: 2px solid #00ffd6;
    outline-offset: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .listing-card {
      max-width: 100%;
    }
    
    .image-container {
      height: 180px;
    }
    
    .title {
      font-size: 16px;
    }
  }
</style>