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
    }).format(price);
  }
</script>

<div class="test-card" on:click={handleClick} on:keydown={handleClick}>
  <div class="card-content">
    <h3>{listing?.title || 'No Title'}</h3>
    <p>{listing?.category || 'No Category'}</p>
    <p>{formatPrice(listing?.dailyPrice || 0)}/day</p>
    <p>Location: {listing?.location?.city || 'Unknown'}, {listing?.location?.state || 'Unknown'}</p>
  </div>
</div>

<style>
  .test-card {
    background: linear-gradient(135deg, #00ffd6 0%, #08e260 100%);
    border-radius: 12px;
    padding: 16px;
    margin: 8px;
    cursor: pointer;
    transition: transform 0.2s;
    min-height: 200px;
    width: 250px;
  }
  
  .test-card:hover {
    transform: scale(1.05);
  }
  
  .card-content {
    color: white;
  }
  
  .card-content h3 {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .card-content p {
    margin: 4px 0;
  }
</style>