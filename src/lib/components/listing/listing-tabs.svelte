<script lang="ts">
  import type { Listing } from '$lib/services/listing';
  import { listingService } from '$lib/services/listing';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';

  export let listing: Listing;
  export let activeTab: string = 'description';
  export let showAllReviews: boolean = false;
  export let handleMessageOwner: () => void;

  const formatCurrency = listingService.formatCurrency;
</script>

<ScrollLinkedAnimator animation="fade-left" startOffset="{0.2}" endOffset="{0.8}" className="mt-16">
  <div class="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 p-8 shadow-2xl max-w-4xl mx-auto hover:bg-white/25 transition-all duration-300">
    <div class="border-b border-white/20">
      <nav class="flex -mb-px space-x-8 justify-center">
        <button
          class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'description' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
          on:click={() => activeTab = 'description'}
        >
          Description
        </button>
        <button
          class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'features' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
          on:click={() => activeTab = 'features'}
        >
          Features & Specs
        </button>
        <button
          class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
          on:click={() => activeTab = 'reviews'}
        >
          Reviews ({listing.reviewCount})
        </button>
        <button
          class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'owner' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
          on:click={() => activeTab = 'owner'}
        >
          Owner
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="py-6">
      {#if activeTab === 'description'}
        <div class="prose max-w-none text-white">
          <p class="text-white/90 leading-relaxed">{listing.description}</p>

          <div class="mt-6">
            <h3 class="text-lg font-medium mb-4 text-white">Transfer Options</h3>
            <ul class="space-y-3">
              {#if listing.deliveryOptions.pickup}
                <li class="flex items-start">
                  <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <div>
                    <span class="font-medium text-white">Pickup</span>
                    {#if listing.deliveryOptions.pickupLocation}
                      <p class="text-white/70 text-sm mt-1">Location: {listing.deliveryOptions.pickupLocation}</p>
                    {/if}
                  </div>
                </li>
              {/if}

              {#if listing.deliveryOptions.dropoff}
                <li class="flex items-start">
                  <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <div>
                    <span class="font-medium text-white">Dropoff</span>
                    {#if listing.deliveryOptions.dropoffDistance}
                      <p class="text-white/70 text-sm mt-1">Within {listing.deliveryOptions.dropoffDistance} miles</p>
                    {/if}
                  </div>
                </li>
              {/if}

              {#if listing.deliveryOptions.shipping}
                <li class="flex items-start">
                  <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <div>
                    <span class="font-medium text-white">Shipping</span>
                    <p class="text-white/70 text-sm mt-1">Fee: {formatCurrency(15)}</p>
                  </div>
                </li>
              {/if}
            </ul>
          </div>

          {#if listing.includesInsurance}
            <div class="mt-6">
              <h3 class="text-lg font-medium mb-4 text-white">Insurance</h3>
              <div class="flex items-start">
                <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <div>
                  <span class="font-medium text-white">Insurance Included</span>
                  {#if listing.insuranceDetails}
                    <p class="text-white/70 text-sm mt-1">{listing.insuranceDetails}</p>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'features'}
        <div>
          <!-- Features -->
          <div class="mb-8">
            <h3 class="text-lg font-medium mb-4 text-white">Features</h3>
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#each listing.features as feature}
                <li class="flex items-center">
                  <svg class="h-5 w-5 text-green-400 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-white/90">{feature}</span>
                </li>
              {/each}
            </ul>
          </div>

          <!-- Specifications -->
          {#if listing.specifications}
            <div class="mb-8">
              <h3 class="text-lg font-medium mb-4 text-white">Specifications</h3>
              <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  {#each Object.entries(listing.specifications) as [key, value]}
                    <div class="sm:col-span-1">
                      <dt class="text-sm font-medium text-white/70">{key}</dt>
                      <dd class="mt-1 text-sm text-white">{value}</dd>
                    </div>
                  {/each}
                </dl>
              </div>
            </div>
          {/if}

          <!-- Additional Info -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div>
              <h3 class="text-sm text-white/70">Brand</h3>
              <p class="font-medium text-white">{listing.brand || 'Not specified'}</p>
            </div>
            <div>
              <h3 class="text-sm text-white/70">Model</h3>
              <p class="font-medium text-white">{listing.model || 'Not specified'}</p>
            </div>
            <div>
              <h3 class="text-sm text-white/70">Condition</h3>
              <p class="font-medium text-white">{listing.condition}</p>
            </div>
            <div>
              <h3 class="text-sm text-white/70">Age</h3>
              <p class="font-medium text-white">{listing.ageInYears} {listing.ageInYears === 1 ? 'year' : 'years'}</p>
            </div>
          </div>
        </div>
      {:else if activeTab === 'reviews'}
        <div>
          {#if listing.reviews && listing.reviews.length > 0}
            <div class="mb-6">
              <h3 class="text-lg font-medium mb-4 text-white">Customer Reviews</h3>

              <div class="space-y-6">
                {#each (showAllReviews ? listing.reviews : listing.reviews.slice(0, 3)) as review}
                  <div class="border-b border-white/20 pb-6 last:border-b-0 last:pb-0">
                    <div class="flex items-start">
                      <img src="{review.userImage}" alt="{review.userName}" class="h-10 w-10 rounded-full mr-4" />
                      <div>
                        <div class="flex items-center">
                          <h4 class="font-medium text-white">{review.userName}</h4>
                          <span class="mx-2 text-white/50">•</span>
                          <span class="text-white/70 text-sm">{review.date}</span>
                        </div>
                        <div class="text-yellow-400 mt-1">
                          {#each Array(5) as _, i}
                            <span>{i < review.rating ? '★' : '☆'}</span>
                          {/each}
                        </div>
                        <p class="mt-2 text-white/90">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              {#if listing.reviews.length > 3 && !showAllReviews}
                <button
                  class="mt-4 text-green-400 font-medium hover:text-green-300"
                  on:click={() => showAllReviews = true}
                >
                  Show all {listing.reviews.length} reviews
                </button>
              {/if}
            </div>
          {:else}
            <p class="text-white/70">No reviews yet.</p>
          {/if}
        </div>
      {:else if activeTab === 'owner'}
        <div>
          {#if listing.owner}
            <div class="flex items-start">
              <img src="{listing.owner.profileImage}" alt="{listing.owner.name}" class="h-16 w-16 rounded-full mr-4" />
              <div>
                <h3 class="text-lg font-medium text-white">{listing.owner.name}</h3>
                <p class="text-white/70 text-sm">Member since {listing.owner.joinedDate}</p>

                <div class="mt-2 flex items-center">
                  <div class="text-yellow-400 mr-1">
                    {#each Array(5) as _, i}
                      <span>{i < Math.floor(4.5) ? '★' : i < Math.ceil(4.5) ? '★' : '☆'}</span>
                    {/each}
                  </div>
                  <span class="font-medium text-white">4.5</span>
                  <span class="text-white/70 ml-1">(12 reviews)</span>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-white/70">Response rate</p>
                    <p class="font-medium text-white">{listing.owner.responseRate || 95}%</p>
                  </div>
                  <div>
                    <p class="text-sm text-white/70">Response time</p>
                    <p class="font-medium text-white">{listing.owner.responseTime || 'Within 1 hour'}</p>
                  </div>
                </div>

                <button
                  class="mt-4 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-md border border-white/20 transition-colors"
                  on:click="{handleMessageOwner}"
                >
                  Message {listing.owner.name}
                </button>
              </div>
            </div>
          {:else}
            <p class="text-white/70">Owner information not available.</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</ScrollLinkedAnimator>
