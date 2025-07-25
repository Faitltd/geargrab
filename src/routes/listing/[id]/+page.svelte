<script>
  import { page } from '$app/stores';
  
  // Get the listing ID from the URL parameter
  $: listingId = $page.params.id;
  
  // Mock listing data - in a real app this would come from an API
  let listing = {
    id: listingId,
    title: 'Premium Outdoor Gear',
    description: 'High-quality outdoor equipment for your next adventure.',
    price: '$50/day',
    category: 'Camping',
    owner: 'John Doe',
    location: 'San Francisco, CA',
    images: ['/placeholder-gear.jpg'],
    available: true,
    rating: 4.8,
    reviews: 24
  };
</script>

<svelte:head>
  <title>GearGrab - {listing.title}</title>
  <meta name="description" content={listing.description} />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <!-- Breadcrumb -->
    <nav class="mb-6">
      <ol class="flex items-center space-x-2 text-sm text-gray-500">
        <li><a href="/" class="hover:text-blue-600">Home</a></li>
        <li>/</li>
        <li><a href="/browse" class="hover:text-blue-600">Browse</a></li>
        <li>/</li>
        <li class="text-gray-900">{listing.title}</li>
      </ol>
    </nav>

    <!-- Listing Header -->
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      <div class="md:flex">
        <!-- Image Gallery -->
        <div class="md:w-1/2">
          <div class="aspect-w-16 aspect-h-12 bg-gray-200">
            <div class="flex items-center justify-center h-64 bg-gray-300 rounded-lg">
              <span class="text-gray-500">Image Placeholder</span>
            </div>
          </div>
        </div>

        <!-- Listing Details -->
        <div class="md:w-1/2 p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {listing.category}
            </span>
            <span class="text-2xl font-bold text-green-600">{listing.price}</span>
          </div>

          <h1 class="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
          
          <div class="flex items-center mb-4">
            <div class="flex items-center">
              <span class="text-yellow-400">★</span>
              <span class="ml-1 text-sm text-gray-600">{listing.rating} ({listing.reviews} reviews)</span>
            </div>
          </div>

          <p class="text-gray-600 mb-6">{listing.description}</p>

          <div class="space-y-3 mb-6">
            <div class="flex items-center">
              <span class="text-gray-500 w-20">Owner:</span>
              <span class="text-gray-900">{listing.owner}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-20">Location:</span>
              <span class="text-gray-900">{listing.location}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-20">Status:</span>
              <span class="text-green-600 font-medium">
                {listing.available ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <button 
              class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              disabled={!listing.available}
            >
              {listing.available ? 'Rent Now' : 'Currently Unavailable'}
            </button>
            <button class="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Contact Owner
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Information -->
    <div class="mt-8 grid md:grid-cols-2 gap-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Description</h3>
        <p class="text-gray-600">
          This is a detailed description of the gear item. It includes information about 
          the condition, specifications, and any special instructions for use.
        </p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Rental Terms</h3>
        <ul class="space-y-2 text-gray-600">
          <li>• Minimum rental: 1 day</li>
          <li>• Security deposit required</li>
          <li>• Free cancellation 24h before</li>
          <li>• Pickup/delivery available</li>
        </ul>
      </div>
    </div>
  </div>
</div>
