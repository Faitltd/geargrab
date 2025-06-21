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
  $: primaryImage = getBestImageUrl();
  $: averageRating = listing?.averageRating || 4.5;
  $: reviewCount = listing?.reviewCount || 12;



  // Clean malformed URLs and provide fallbacks
  function cleanImageUrl(url: string): string | null {
    if (!url || typeof url !== 'string') return null;

    // Remove whitespace
    url = url.trim();
    if (!url) return null;

    // Fix malformed URLs with multiple https://
    const cleanedUrl = url.replace(/https:\/\/https:\/\/https:\/\//, 'https://').replace(/https:\/\/https:\/\//, 'https://');

    // Basic URL validation
    try {
      new URL(cleanedUrl);
      return cleanedUrl;
    } catch {
      // If it's not a valid URL, check if it's a local path
      if (cleanedUrl.startsWith('/') || cleanedUrl.startsWith('./')) {
        return cleanedUrl;
      }
      return null;
    }
  }

  function getDefaultImage(category: string): string {
    const defaultImages = {
      // Main categories
      'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'biking': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'electric-mobility': 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'skating': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'hiking': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'skiing': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'climbing': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'water-sports': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'photography': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'fishing': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"

      // Additional categories for new listings
      'winter-sports': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'outdoor-gear': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'sports': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'adventure': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80',"
      'equipment': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80'"
    };

    // Try exact match first
    if (defaultImages[category]) {
      return defaultImages[category];
    }

    // Try partial matches for subcategories
    const categoryLower = category.toLowerCase();
    for (const [key, value] of Object.entries(defaultImages)) {
      if (categoryLower.includes(key) || key.includes(categoryLower)) {
        return value;
      }
    }

    // Ultimate fallback - outdoor gear image
    return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib="rb-4.0.3&auto=format&fit=crop&w=800&q=80';"
  }

  // Get the best available image from the listing
  function getBestImageUrl(): string {
    // Try to get a valid image from the images array
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        const cleanedImg = cleanImageUrl(img);
        if (cleanedImg) {
          return cleanedImg;
        }
      }
    }

    // If no valid images found, use category default
    return getDefaultImage(category);
  }



  // Hover state and image loading
  let isHovering = false;
  let imageError = false;
  let currentImageUrl = primaryImage;
  let fallbackAttempts = 0;
  const maxFallbackAttempts = 2;

  // Watch for changes in primaryImage and reset error state
  $: if (primaryImage !== currentImageUrl) {
    currentImageUrl = primaryImage;
    imageError = false;
    fallbackAttempts = 0;
  }

  // Multi-level fallback system
  $: displayImage = (() => {
    if (!imageError) {
      return currentImageUrl;
    }

    // First fallback: try a different image from the array
    if (fallbackAttempts === 0 && images && images.length > 1) {
      const nextImage = cleanImageUrl(images[1]);
      if (nextImage && nextImage !== currentImageUrl) {
        return nextImage;
      }
    }

    // Final fallback: category default
    return getDefaultImage(category);
  })();

  // Handle image loading errors with progressive fallback
  function handleImageError() {
    fallbackAttempts++;
    if (fallbackAttempts <= maxFallbackAttempts) {
      imageError = true;
      // Try next image in array or go to category default
      if (fallbackAttempts === 1 && images && images.length > 1) {
        const nextImage = cleanImageUrl(images[1]);
        if (nextImage && nextImage !== currentImageUrl) {
          currentImageUrl = nextImage;
          imageError = false;
          return;
        }
      }
    }
    imageError = true;
  }
</script>

<div
  class="listing-card"
  class:hovering="{isHovering}"
  style="background-image: url('{displayImage}'); background-color: #1a1a1a;"
  on:click="{handleClick}"
  on:keydown="{handleClick}"
  on:mouseenter="{()" => isHovering = true}
  on:mouseleave="{()" => isHovering = false}
  role="button"
  tabindex="0"
>
  <!-- Hidden image for error detection -->
  <img
    src="{currentImageUrl}"
    alt=""
    style="display: none;"
    on:error="{handleImageError}"
    on:load="{()" = /> { imageError = false; fallbackAttempts = 0; }}
  />
  <!-- Background overlay for better text readability -->
  <div class="background-overlay"></div>

  <!-- Title overlay - always visible -->
  <div class="title-overlay">
    <h3 class="card-title">{title}</h3>
  </div>

  <!-- Glass effect details overlay - visible on hover -->
  <div class="glass-overlay" class:visible="{isHovering}">
    <div class="details-content">
      <div class="category-badge">{category}</div>

      <div class="price-section">
        <div class="price">{formatPrice(dailyPrice)}/day</div>
      </div>

      <div class="location-section">
        <svg class="location-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2M12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z"/>
        </svg>
        <span class="location-text">{location.city}, {location.state}</span>
      </div>

      <div class="rating-section">
        <div class="stars">
          {#each Array(5) as _, i}
            <svg class="star {i < Math.floor(averageRating) ? 'filled' : 'empty'}" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          {/each}
        </div>
        <span class="review-count">({reviewCount} reviews)</span>
      </div>
    </div>
  </div>
</div>

<style>
  .listing-card {
    position: relative;
    width: 280px;
    height: 320px;
    background-color: #1a1a1a;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .listing-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    border-color: rgba(0, 255, 214, 0.5);
  }

  .background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.1) 50%,
      rgba(0, 0, 0, 0.6) 100%
    );
    z-index: 1;
  }

  .title-overlay {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    z-index: 2;
    transition: all 0.4s ease;
  }

  .listing-card.hovering .title-overlay {
    opacity: 0;
    transform: translateY(10px);
  }

  .card-title {
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .glass-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .glass-overlay.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .details-content {
    text-align: center;
    color: white;
    width: 100%;
  }

  .category-badge {
    background: rgba(0, 255, 214, 0.9);
    color: #000;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 16px;
    display: inline-block;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .price-section {
    margin-bottom: 16px;
  }

  .price {
    font-size: 1.5rem;
    font-weight: 700;
    color: #00ffd6;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .location-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .location-icon {
    width: 16px;
    height: 16px;
    fill: rgba(255, 255, 255, 0.8);
  }

  .location-text {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.875rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .rating-section {
    display: flex;
    flex-direction: column;
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
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  /* Focus styles for accessibility */
  .listing-card:focus {
    outline: 2px solid #00ffd6;
    outline-offset: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .listing-card {
      width: 260px;
      height: 300px;
    }

    .card-title {
      font-size: 1.125rem;
    }

    .price {
      font-size: 1.25rem;
    }
  }

  @media (max-width: 480px) {
    .listing-card {
      width: 240px;
      height: 280px;
    }

    .title-overlay {
      bottom: 16px;
      left: 16px;
      right: 16px;
    }

    .glass-overlay {
      padding: 16px;
    }
  }
</style>