<script lang="ts">
  export let gear: {
    id: string;
    image: string;
    title: string;
    price: number;
    condition: 'New' | 'Good' | 'Used';
    rating: number;
    location: string;
  };

  let isHovering = false;
</script>

<a
  href="{`/gear/${gear.id}`}"
  class="gear-card"
  class:hovering="{isHovering}"
  on:mouseenter="{()" => isHovering = true}
  on:mouseleave="{()" => isHovering = false}
>
  <div class="image-container">
    <img src="{gear.image}" alt="{gear.title}" class="gear-image" />
    <span class="condition-badge">{gear.condition}</span>
  </div>
  <div class="card-content">
    <h2 class="gear-title">{gear.title}</h2>
    <div class="gear-location">{gear.location}</div>
    <div class="card-footer">
      <span class="gear-price">${gear.price}/day</span>
      <div class="rating-container">
        <svg xmlns="http://www.w3.org/2000/svg" class="star-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span class="rating-text">{gear.rating}</span>
      </div>
    </div>
  </div>
</a>

<style>
  .gear-card {
    display: block;
    border-radius: 1rem;
    background: white;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    position: relative;
  }

  .gear-card.hovering {
    transform: translateY(-8px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .image-container {
    position: relative;
    overflow: hidden;
  }

  .gear-image {
    width: 100%;
    height: 12rem;
    object-fit: cover;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .gear-card.hovering .gear-image {
    transform: scale(1.05);
  }

  .condition-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.875rem;
    background: rgba(255, 255, 255, 0.9);
    color: #374151;
    border-radius: 9999px;
    padding: 0.125rem 0.5rem;
    backdrop-filter: blur(4px);
    font-weight: 500;
  }

  .card-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .gear-title {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.25;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    color: #111827;
  }

  .gear-location {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }

  .gear-price {
    color: #059669;
    font-weight: 700;
    font-size: 1rem;
  }

  .rating-container {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .star-icon {
    height: 1rem;
    width: 1rem;
    color: #f59e0b;
  }

  .rating-text {
    font-size: 0.875rem;
    color: #374151;
  }

  /* Focus styles for accessibility */
  .gear-card:focus {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .gear-card {
      background: #1f2937;
    }

    .gear-title {
      color: #f9fafb;
    }

    .gear-location {
      color: #9ca3af;
    }

    .rating-text {
      color: #d1d5db;
    }

    .condition-badge {
      background: rgba(31, 41, 55, 0.9);
      color: #f9fafb;
    }
  }
</style>