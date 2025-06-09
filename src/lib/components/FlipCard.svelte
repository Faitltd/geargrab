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
  $: weeklyPrice = listing?.weeklyPrice || 150;
  $: monthlyPrice = listing?.monthlyPrice || 500;
  $: location = listing?.location || { city: 'Local', state: 'Area' };
  $: images = listing?.images || [];
  $: primaryImage = images[0] || '/default-gear-image.jpg';
  $: averageRating = listing?.averageRating || 4.5;
  $: reviewCount = listing?.reviewCount || 12;
  $: description = listing?.description || 'High-quality outdoor equipment for your adventures.';
</script>

<div class="flip-card" on:click={handleClick} on:keydown={handleClick} role="button" tabindex="0">
  <div class="flip-card-inner">
    <!-- Front: Photo -->
    <div class="flip-card-front" style="background-image: url('{primaryImage}')">
      <div class="photo-overlay">
        <h3 class="title">{title}</h3>
        <div class="price-badge">
          {formatPrice(dailyPrice)}/day
        </div>
      </div>
    </div>
    
    <!-- Back: Details -->
    <div class="flip-card-back">
      <div class="details-content">
        <h3 class="back-title">{title}</h3>
        <p class="category">{category}</p>
        <p class="location">{location.city}, {location.state}</p>
        
        <div class="pricing">
          <div class="price-item">
            <span class="price-label">Daily:</span>
            <span class="price-value">{formatPrice(dailyPrice)}</span>
          </div>
          <div class="price-item">
            <span class="price-label">Weekly:</span>
            <span class="price-value">{formatPrice(weeklyPrice)}</span>
          </div>
          <div class="price-item">
            <span class="price-label">Monthly:</span>
            <span class="price-value">{formatPrice(monthlyPrice)}</span>
          </div>
        </div>
        
        <div class="rating">
          <div class="stars">
            {#each Array(5) as _, i}
              <svg class="star {i < Math.floor(averageRating) ? 'filled' : 'empty'}" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            {/each}
          </div>
          <span class="review-count">({reviewCount} reviews)</span>
        </div>
        
        <p class="description">{description.slice(0, 80)}...</p>
        
        <button class="view-button" type="button">View Details</button>
      </div>
    </div>
  </div>
</div>

<style>
  /* From Uiverse.io by joe-watson-sbf - Modified for GearGrab */
  .flip-card {
    background-color: transparent;
    width: 250px;
    height: 320px;
    perspective: 1000px;
    font-family: sans-serif;
    cursor: pointer;
  }

  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }

  .flip-card:hover .flip-card-inner {
    transform: rotateY(180deg);
  }

  .flip-card-front, .flip-card-back {
    box-shadow: 0 8px 14px 0 rgba(0,0,0,0.2);
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    border: 1px solid rgba(0, 255, 214, 0.3);
    border-radius: 1rem;
    overflow: hidden;
  }

  .flip-card-front {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: white;
    position: relative;
  }

  .photo-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .title {
    font-size: 1.2em;
    font-weight: 900;
    text-align: center;
    margin: 0 0 10px 0;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    line-height: 1.2;
  }

  .price-badge {
    background: rgba(0, 255, 214, 0.9);
    color: #000;
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .flip-card-back {
    background: linear-gradient(135deg, 
      rgba(0, 255, 214, 0.9) 0%, 
      rgba(8, 226, 96, 0.9) 50%,
      rgba(0, 137, 78, 0.9) 100%);
    color: white;
    transform: rotateY(180deg);
    padding: 20px;
  }

  .details-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
  }

  .back-title {
    font-size: 1.1em;
    font-weight: 900;
    margin: 0 0 8px 0;
    color: white;
    line-height: 1.2;
  }

  .category {
    font-size: 0.9em;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 4px 0;
    font-weight: 600;
  }

  .location {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 15px 0;
  }

  .pricing {
    margin: 10px 0;
  }

  .price-item {
    display: flex;
    justify-content: space-between;
    margin: 4px 0;
    font-size: 0.85em;
  }

  .price-label {
    color: rgba(255, 255, 255, 0.9);
  }

  .price-value {
    font-weight: bold;
    color: white;
  }

  .rating {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px 0;
  }

  .stars {
    display: flex;
    gap: 2px;
    margin-bottom: 4px;
  }

  .star {
    width: 14px;
    height: 14px;
  }

  .star.filled {
    fill: #fbbf24;
  }

  .star.empty {
    fill: rgba(255, 255, 255, 0.3);
  }

  .review-count {
    font-size: 0.75em;
    color: rgba(255, 255, 255, 0.8);
  }

  .description {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.3;
    margin: 8px 0;
    text-align: left;
  }

  .view-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .view-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  /* Focus styles for accessibility */
  .flip-card:focus {
    outline: 2px solid #00ffd6;
    outline-offset: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .flip-card {
      width: 220px;
      height: 280px;
    }
    
    .title {
      font-size: 1em;
    }
    
    .back-title {
      font-size: 1em;
    }
  }
</style>