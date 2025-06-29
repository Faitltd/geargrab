<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { aiRecommendationService } from '$lib/services/ai-recommendations';
  import type { RecommendationScore, SmartFilter } from '$lib/services/ai-recommendations';
  import GearCard from '$lib/components/gear/gear-card.svelte';

  export let searchQuery = '';
  export let currentFilters: any = {};
  export let onFilterApply: (filter: SmartFilter) => void = () => {};

  let loading = true;
  let recommendations: any[] = [];
  let smartFilters: SmartFilter[] = [];
  let trendingGear: any[] = [];
  let showRecommendations = true;
  let showSmartFilters = true;

  $: authState = simpleAuth.authState;

  onMount(async () => {
    await loadAIContent();
  });

  async function loadAIContent() {
    try {
      loading = true;

      // Load content in parallel
      const [recommendationsData, filtersData, trendingData] = await Promise.all([
        loadPersonalizedRecommendations(),
        loadSmartFilters(),
        loadTrendingGear()
      ]);

      recommendations = recommendationsData;
      smartFilters = filtersData;
      trendingGear = trendingData;

    } catch (error) {
      console.error('Error loading AI content:', error);
    } finally {
      loading = false;
    }
  }

  async function loadPersonalizedRecommendations(): Promise<any[]> {
    if (!$authState.user) return [];

    try {
      const recommendationScores = await aiRecommendationService.getPersonalizedRecommendations($authState.user.uid, 8);
      
      // Convert recommendation scores to full listing data
      const listings = [];
      for (const rec of recommendationScores) {
        // In a real implementation, you'd fetch the full listing data
        // For now, we'll create mock data based on the recommendation
        listings.push({
          id: rec.listingId,
          title: `Recommended Item ${rec.listingId.slice(-4)}`,
          dailyPrice: Math.floor(Math.random() * 100) + 20,
          category: 'camping',
          location: 'Denver, CO',
          rating: 4.5 + Math.random() * 0.5,
          imageUrl: '/images/placeholder-gear.jpg',
          recommendationScore: rec.score,
          recommendationReasons: rec.reasons,
          confidence: rec.confidence
        });
      }
      
      return listings;
    } catch (error) {
      console.error('Error loading personalized recommendations:', error);
      return [];
    }
  }

  async function loadSmartFilters(): Promise<SmartFilter[]> {
    try {
      const userId = $authState.user?.uid;
      return await aiRecommendationService.getSmartFilters(userId, searchQuery);
    } catch (error) {
      console.error('Error loading smart filters:', error);
      return [];
    }
  }

  async function loadTrendingGear(): Promise<any[]> {
    try {
      return await aiRecommendationService.getTrendingGear(6);
    } catch (error) {
      console.error('Error loading trending gear:', error);
      // Return mock trending data
      return [
        {
          id: 'trending1',
          title: 'REI Co-op Half Dome Tent',
          dailyPrice: 35,
          category: 'camping',
          location: 'Boulder, CO',
          rating: 4.8,
          imageUrl: '/images/placeholder-gear.jpg',
          trending: true
        },
        {
          id: 'trending2',
          title: 'Canon EOS R5 Camera',
          dailyPrice: 85,
          category: 'photography',
          location: 'Denver, CO',
          rating: 4.9,
          imageUrl: '/images/placeholder-gear.jpg',
          trending: true
        }
      ];
    }
  }

  function handleFilterClick(filter: SmartFilter) {
    onFilterApply(filter);
  }

  function getFilterIcon(type: string): string {
    switch (type) {
      case 'category': return '🏷️';
      case 'price': return '💰';
      case 'location': return '📍';
      case 'feature': return '⭐';
      case 'availability': return '✅';
      default: return '🔍';
    }
  }

  function getFilterColor(boost: number): string {
    if (boost >= 1.2) return 'border-green-500/30 bg-green-500/10 text-green-400';
    if (boost >= 1.1) return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

{#if loading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
    <span class="ml-3 text-gray-300">Loading AI-powered recommendations...</span>
  </div>
{:else}
  <div class="space-y-8">
    <!-- Smart Filters -->
    {#if showSmartFilters && smartFilters.length > 0}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-white">🤖 Smart Filters</h2>
          <button
            on:click={() => showSmartFilters = !showSmartFilters}
            class="text-gray-400 hover:text-white"
          >
            {showSmartFilters ? '−' : '+'}
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {#each smartFilters.slice(0, 8) as filter}
            <button
              on:click={() => handleFilterClick(filter)}
              class="border rounded-lg p-3 text-left transition-all hover:scale-105 {getFilterColor(filter.boost)}"
            >
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-lg">{getFilterIcon(filter.type)}</span>
                <span class="font-medium text-sm">{filter.name}</span>
              </div>
              <div class="text-xs opacity-75">{filter.description}</div>
              {#if filter.boost > 1.0}
                <div class="text-xs mt-1 font-medium">🔥 Popular</div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Personalized Recommendations -->
    {#if $authState.user && showRecommendations && recommendations.length > 0}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-white">🎯 Recommended for You</h2>
          <button
            on:click={() => showRecommendations = !showRecommendations}
            class="text-gray-400 hover:text-white"
          >
            {showRecommendations ? '−' : '+'}
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {#each recommendations.slice(0, 8) as item}
            <div class="relative">
              <!-- Recommendation Badge -->
              <div class="absolute top-2 left-2 z-10 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                {Math.round(item.recommendationScore * 100)}% match
              </div>
              
              <!-- Gear Card -->
              <div class="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-green-500/30 transition-all">
                <div class="aspect-video bg-gray-800 flex items-center justify-center">
                  <span class="text-4xl">📦</span>
                </div>
                
                <div class="p-4">
                  <h3 class="text-white font-medium mb-2">{item.title}</h3>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-green-400 font-semibold">{formatCurrency(item.dailyPrice)}/day</span>
                    <div class="flex items-center space-x-1">
                      <span class="text-yellow-400">★</span>
                      <span class="text-gray-300 text-sm">{item.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div class="text-gray-400 text-sm mb-3">{item.location}</div>
                  
                  <!-- Recommendation Reasons -->
                  {#if item.recommendationReasons && item.recommendationReasons.length > 0}
                    <div class="mb-3">
                      <div class="text-xs text-gray-400 mb-1">Why recommended:</div>
                      <div class="text-xs text-green-300">
                        {item.recommendationReasons[0]}
                      </div>
                    </div>
                  {/if}
                  
                  <a
                    href="/listing/{item.id}"
                    class="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded-lg transition-colors"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Trending Gear -->
    {#if trendingGear.length > 0}
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-semibold text-white mb-4">🔥 Trending Now</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each trendingGear.slice(0, 6) as item}
            <div class="relative">
              <!-- Trending Badge -->
              <div class="absolute top-2 left-2 z-10 bg-orange-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                🔥 Trending
              </div>
              
              <!-- Gear Card -->
              <div class="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-orange-500/30 transition-all">
                <div class="aspect-video bg-gray-800 flex items-center justify-center">
                  <span class="text-4xl">📦</span>
                </div>
                
                <div class="p-4">
                  <h3 class="text-white font-medium mb-2">{item.title}</h3>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-green-400 font-semibold">{formatCurrency(item.dailyPrice)}/day</span>
                    <div class="flex items-center space-x-1">
                      <span class="text-yellow-400">★</span>
                      <span class="text-gray-300 text-sm">{item.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div class="text-gray-400 text-sm mb-3">{item.location}</div>
                  
                  <a
                    href="/listing/{item.id}"
                    class="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-2 rounded-lg transition-colors"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- AI Insights -->
    <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg border border-purple-500/30 p-6">
      <h2 class="text-xl font-semibold text-white mb-4">🧠 AI Insights</h2>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-purple-400 font-medium mb-2">Search Optimization</h3>
          <ul class="text-gray-300 text-sm space-y-1">
            <li>• {smartFilters.length} smart filters available</li>
            <li>• {recommendations.length} personalized recommendations</li>
            <li>• {trendingGear.length} trending items identified</li>
          </ul>
        </div>
        
        <div>
          <h3 class="text-purple-400 font-medium mb-2">Recommendations</h3>
          <ul class="text-gray-300 text-sm space-y-1">
            <li>• Try location-based filtering for better results</li>
            <li>• Consider expanding your search radius</li>
            <li>• Check out trending categories for popular items</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
{/if}
