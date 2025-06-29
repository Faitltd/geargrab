<script lang="ts">
  export let listing: any;
  export let showOwner = false;
  export let compact = false;

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDistance(distance: number): string {
    return distance < 1 ? `${(distance * 5280).toFixed(0)} ft` : `${distance.toFixed(1)} mi`;
  }

  function getCategoryIcon(category: string): string {
    const icons = {
      camping: '⛺',
      hiking: '🥾',
      cycling: '🚴',
      photography: '📸',
      water_sports: '🏄',
      winter_sports: '⛷️',
      climbing: '🧗'
    };
    return icons[category as keyof typeof icons] || '🎒';
  }

  function getConditionColor(condition: string): string {
    const colors = {
      'Like New': 'text-green-400',
      'Excellent': 'text-green-300',
      'Very Good': 'text-blue-400',
      'Good': 'text-yellow-400',
      'Fair': 'text-orange-400'
    };
    return colors[condition as keyof typeof colors] || 'text-gray-400';
  }
</script>

<div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:border-green-500/30 transition-all duration-300 hover:scale-105 group">
  <!-- Image Section -->
  <div class="relative aspect-video bg-gray-800 overflow-hidden">
    {#if listing.images && listing.images.length > 0}
      <img 
        src={listing.images[0]} 
        alt={listing.title}
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        loading="lazy"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center">
        <span class="text-6xl">{getCategoryIcon(listing.category)}</span>
      </div>
    {/if}

    <!-- Category Badge -->
    <div class="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full">
      {getCategoryIcon(listing.category)} {listing.category.replace('_', ' ')}
    </div>

    <!-- Condition Badge -->
    <div class="absolute top-2 right-2 bg-black/70 text-xs font-medium px-2 py-1 rounded-full {getConditionColor(listing.condition)}">
      {listing.condition}
    </div>

    <!-- Featured Badge -->
    {#if listing.isFeatured}
      <div class="absolute bottom-2 left-2 bg-yellow-600 text-white text-xs font-medium px-2 py-1 rounded-full">
        ⭐ Featured
      </div>
    {/if}

    <!-- Availability Indicator -->
    <div class="absolute bottom-2 right-2 flex items-center space-x-1">
      <div class="w-2 h-2 rounded-full {listing.isAvailable ? 'bg-green-400' : 'bg-red-400'}"></div>
      <span class="text-white text-xs font-medium">
        {listing.isAvailable ? 'Available' : 'Unavailable'}
      </span>
    </div>
  </div>

  <!-- Content Section -->
  <div class="p-4 space-y-3">
    <!-- Title and Brand -->
    <div>
      <h3 class="text-white font-semibold text-lg leading-tight line-clamp-2 group-hover:text-green-400 transition-colors">
        {listing.title}
      </h3>
      {#if listing.brand}
        <p class="text-gray-400 text-sm mt-1">{listing.brand} {listing.model || ''}</p>
      {/if}
    </div>

    <!-- Pricing -->
    <div class="flex items-center justify-between">
      <div>
        <span class="text-green-400 font-bold text-xl">{formatCurrency(listing.dailyPrice)}</span>
        <span class="text-gray-400 text-sm">/day</span>
      </div>
      {#if listing.weeklyPrice}
        <div class="text-right">
          <div class="text-gray-300 text-sm">{formatCurrency(listing.weeklyPrice)}/week</div>
          <div class="text-green-300 text-xs">Save {Math.round((1 - listing.weeklyPrice / (listing.dailyPrice * 7)) * 100)}%</div>
        </div>
      {/if}
    </div>

    <!-- Location and Distance -->
    {#if listing.location}
      <div class="flex items-center text-gray-400 text-sm">
        <span class="mr-1">📍</span>
        <span>{listing.location.city}, {listing.location.state}</span>
        {#if listing.distance}
          <span class="ml-2 text-green-400">• {formatDistance(listing.distance)} away</span>
        {/if}
      </div>
    {/if}

    <!-- Rating and Reviews -->
    {#if listing.averageRating}
      <div class="flex items-center space-x-2">
        <div class="flex items-center">
          <span class="text-yellow-400 mr-1">★</span>
          <span class="text-white font-medium">{listing.averageRating.toFixed(1)}</span>
        </div>
        <span class="text-gray-400 text-sm">({listing.totalReviews || 0} reviews)</span>
        {#if listing.totalBookings}
          <span class="text-gray-400 text-sm">• {listing.totalBookings} bookings</span>
        {/if}
      </div>
    {/if}

    <!-- Features (compact view) -->
    {#if !compact && listing.features && listing.features.length > 0}
      <div class="flex flex-wrap gap-1">
        {#each listing.features.slice(0, 3) as feature}
          <span class="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-full">
            {feature}
          </span>
        {/each}
        {#if listing.features.length > 3}
          <span class="text-gray-400 text-xs px-2 py-1">
            +{listing.features.length - 3} more
          </span>
        {/if}
      </div>
    {/if}

    <!-- Owner Info -->
    {#if showOwner && listing.ownerName}
      <div class="flex items-center space-x-2 pt-2 border-t border-white/10">
        <div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
          <span class="text-white text-xs font-bold">
            {listing.ownerName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span class="text-gray-300 text-sm">Hosted by {listing.ownerName}</span>
        {#if listing.ownerVerified}
          <span class="text-green-400 text-xs">✓ Verified</span>
        {/if}
      </div>
    {/if}

    <!-- Action Button -->
    <div class="pt-2">
      <a
        href="/listing/{listing.id}"
        class="block w-full bg-green-600 hover:bg-green-700 text-white text-center font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        {listing.isAvailable ? 'View Details' : 'View Listing'}
      </a>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
