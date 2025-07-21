<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>Find a Store - GearGrab</title>
  <meta name="description" content="Find GearGrab partner stores and pickup locations near you." />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50">
  <!-- Hero Section -->
  <div class="bg-primary-600 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Find a Store</h1>
        <p class="text-xl text-primary-100 max-w-2xl mx-auto">
          Locate GearGrab partner stores and pickup locations near you for convenient gear rental and returns.
        </p>
      </div>
    </div>
  </div>

  <!-- Store Locator -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Search Form -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Find Stores Near You</h2>
        
        <form class="space-y-6">
          <div>
            <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
              Enter your location
            </label>
            <input
              type="text"
              id="location"
              placeholder="City, State or ZIP code"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label for="radius" class="block text-sm font-medium text-gray-700 mb-2">
              Search radius
            </label>
            <select
              id="radius"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="5">5 miles</option>
              <option value="10" selected>10 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
            </select>
          </div>
          
          <button
            type="submit"
            class="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Find Stores
          </button>
        </form>
      </div>

      <!-- Store Information -->
      <div class="space-y-8">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Partner Store Benefits</h3>
          <ul class="space-y-3 text-gray-600">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Convenient pickup and drop-off locations
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Expert staff to help with gear questions
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Extended hours for your convenience
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Secure storage for your rentals
            </li>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Coming Soon</h3>
          <p class="text-gray-600 mb-4">
            We're expanding our network of partner stores across the country. Check back soon for locations near you!
          </p>
          <div class="text-sm text-gray-500">
            <p>Currently planning locations in:</p>
            <ul class="mt-2 space-y-1">
              <li>• San Francisco Bay Area</li>
              <li>• Denver, Colorado</li>
              <li>• Seattle, Washington</li>
              <li>• Austin, Texas</li>
              <li>• Portland, Oregon</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />
