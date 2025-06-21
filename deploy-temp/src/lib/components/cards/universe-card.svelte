<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { UniverseCardProps } from '$lib/types/components';
  import type { Listing } from '$lib/types/firestore';

  // Props with TypeScript interface
  export let listing: UniverseCardProps['listing'];
  export let onClick: UniverseCardProps['onClick'] = undefined;
  export let width: UniverseCardProps['width'] = '190px';
  export let height: UniverseCardProps['height'] = '254px';
  export let showDetails: UniverseCardProps['showDetails'] = true;
  export let className: UniverseCardProps['className'] = '';

  const dispatch = createEventDispatcher<{
    click: Listing;
  }>();
  
  function handleClick() {
    if (onClick) {
      onClick();
    } else {
      dispatch('click', listing);
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
  
  // Get primary image with fallback
  function getPrimaryImage(listing: any): string {
    if (listing?.images && listing.images.length > 0) {
      return listing.images[0];
    }
    if (listing?.primaryImage) {
      return listing.primaryImage;
    }
    if (listing?.image) {
      return listing.image;
    }
    // Fallback to a default outdoor gear image
    return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }
  
  // Calculate average rating
  function getAverageRating(listing: any): number {
    if (listing?.averageRating) return listing.averageRating;
    if (listing?.reviews && listing.reviews.length > 0) {
      return listing.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / listing.reviews.length;
    }
    return 4.5; // Default rating
  }
  
  // Get review count
  function getReviewCount(listing: any): number {
    if (listing?.reviewCount) return listing.reviewCount;
    if (listing?.reviews) return listing.reviews.length;
    return 12; // Default count
  }
  
  $: primaryImage = getPrimaryImage(listing);
  $: averageRating = getAverageRating(listing);
  $: reviewCount = getReviewCount(listing);
</script>

<!-- From Uiverse.io by joe-watson-sbf - Modified for GearGrab with Green Theme -->
<div
  class="flip-card {className}"
  style="width: {width}; height: {height};"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
  aria-label="View details for {listing?.title || 'Item'}"
>
  <div class="flip-card-inner">
    <!-- Front: Photo Display -->
    <div class="flip-card-front" style="background-image: url('{primaryImage}')">
      <div class="photo-overlay">
        <h3 class="title">{listing?.title || 'No Title'}</h3>
        <div class="price-badge">
          {formatPrice(listing?.dailyPrice || 0)}/day
        </div>
      </div>
    </div>

    <!-- Back: Details Display -->
    <div class="flip-card-back">
      <div class="details-content">
        {#if showDetails}
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

          <!-- Location -->
          <p class="location">
            {listing?.location?.city || 'Unknown'}, {listing?.location?.state || 'CO'}
          </p>

          <!-- Category -->
          <p class="category">{listing?.category || 'Outdoor Gear'}</p>

          <!-- Condition -->
          <div class="condition-badge">
            {listing?.condition || 'Good'}
          </div>

          <!-- Pricing -->
          <div class="pricing">
            <div class="price-item">
              <span class="price-label">Daily:</span>
              <span class="price-value">{formatPrice(listing?.dailyPrice || 0)}</span>
            </div>
            <div class="price-item">
              <span class="price-label">Weekly:</span>
              <span class="price-value">{formatPrice(listing?.weeklyPrice || 0)}</span>
            </div>
          </div>
        {:else}
          <!-- Simplified view when showDetails is false -->
          <h3 class="title">{listing?.title || 'No Title'}</h3>
          <div class="price-badge">
            {formatPrice(listing?.dailyPrice || 0)}/day
          </div>
        {/if}

        <!-- View Button -->
        <button class="view-button" type="button">View Details</button>
      </div>
    </div>
  </div>
</div>

<style>
  /* From Uiverse.io by joe-watson-sbf - Modified for GearGrab with Green Theme */
  .flip-card {
    background-color: transparent;
    width: 190px;
    height: 254px;
    perspective: 1000px;
    font-family: sans-serif;
    cursor: pointer;
    position: relative;
  }

  .title {
    font-size: 1.5em;
    font-weight: 900;
    text-align: center;
    margin: 0;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  }

  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.8s ease-in-out;
    transform-style: preserve-3d;
  }

  .flip-card:hover .flip-card-inner {
    transform: rotateY(180deg);
  }

  .flip-card-front, .flip-card-back {
    box-shadow: 0 8px 14px 0 rgba(0,0,0,0.2);
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 1rem;
    overflow: hidden;
  }

  .flip-card-front {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    box-sizing: border-box;
  }

  .flip-card-front::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(120deg,
      rgba(34, 197, 94, 0.1) 60%,
      rgba(16, 185, 129, 0.2) 88%,
      rgba(5, 150, 105, 0.3) 40%,
      rgba(34, 197, 94, 0.4) 48%);
    z-index: 1;
  }

  .photo-overlay {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .price-badge {
    background: rgba(34, 197, 94, 0.9);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 1rem;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  }

  .flip-card-back {
    background: linear-gradient(120deg,
      rgba(34, 197, 94, 0.9) 30%,
      rgba(16, 185, 129, 0.95) 88%,
      rgba(5, 150, 105, 0.9) 40%,
      rgba(34, 197, 94, 0.85) 78%);
    color: white;
    transform: rotateY(180deg);
    padding: 1rem;
    box-sizing: border-box;
  }

  .details-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
  }

  .rating {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .stars {
    display: flex;
    gap: 2px;
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
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .location {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    text-align: center;
  }

  .category {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    text-align: center;
    font-weight: 500;
  }

  .condition-badge {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .pricing {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
  }

  .price-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .price-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .price-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
  }

  .view-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .view-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  /* Focus styles for accessibility */
  .flip-card:focus {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }

  .view-button:focus {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .flip-card {
      width: 170px;
      height: 230px;
    }

    .title {
      font-size: 1.25em;
    }

    .price-badge {
      font-size: 0.8rem;
      padding: 0.4rem 0.8rem;
    }

    .details-content {
      gap: 0.5rem;
    }
  }
</style>
