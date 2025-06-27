<script lang="ts">
  import { onMount } from 'svelte';
  import { getGuides } from '$lib/firebase/db/guides';
  import { GUIDE_SPECIALTIES } from '$lib/constants';
  import type { Guide } from '$lib/types/firestore';
  import VideoBackground from '$lib/components/layout/video-background.svelte';
  import ScrollLinkedAnimator from '$lib/components/layout/scroll-linked-animator.svelte';

  let guides: Guide[] = [];
  let loading = true;
  let error: string | null = null;


  // Filter state
  let selectedSpecialty = '';
  let minRate = '';
  let maxRate = '';
  let verifiedOnly = false;

  // Load guides on mount
  onMount(async () => {
    await loadGuides();
  });

  async function loadGuides() {
    try {
      loading = true;
      error = null;

      const filters: any = {};
      
      if (selectedSpecialty) {
        filters.specialty = selectedSpecialty;
      }
      
      if (verifiedOnly) {
        filters.isVerified = true;
      }
      
      if (minRate || maxRate) {
        filters.rateRange = {};
        if (minRate) filters.rateRange.min = parseFloat(minRate);
        if (maxRate) filters.rateRange.max = parseFloat(maxRate);
      }

      const result = await getGuides(filters, 'averageRating', 'desc', 50);
      guides = result.guides;
    } catch (err) {
      console.error('Error loading guides:', err);
      error = 'Failed to load guides. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Reactive filter updates
  $: {
    if (selectedSpecialty !== undefined || verifiedOnly !== undefined || minRate !== undefined || maxRate !== undefined) {
      loadGuides();
    }
  }

  function formatRate(rate: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rate);
  }

  function getSpecialtyIcon(specialtyId: string): string {
    const specialty = GUIDE_SPECIALTIES.find(s => s.id === specialtyId);
    return specialty?.icon || '🎯';
  }

  function getSpecialtyName(specialtyId: string): string {
    const specialty = GUIDE_SPECIALTIES.find(s => s.id === specialtyId);
    return specialty?.name || specialtyId;
  }

  function getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }

  function getResponseTimeColor(responseTime: string): string {
    if (responseTime.includes('1 hour')) return 'text-green-400';
    if (responseTime.includes('2 hours')) return 'text-green-300';
    if (responseTime.includes('4 hours')) return 'text-yellow-400';
    if (responseTime.includes('24 hours')) return 'text-orange-400';
    return 'text-gray-400';
  }
</script>

<svelte:head>
  <title>Browse Expert Guides - GearGrab</title>
  <meta name="description" content="Find expert outdoor guides and trainers on GearGrab. Learn from certified professionals in climbing, hiking, skiing, and more." />
</svelte:head>

<!-- Video Background -->
<VideoBackground
  videoSrc="/Stars.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
/>

<!-- Hero Section -->
<ScrollLinkedAnimator>
  <section class="relative min-h-[50vh] flex items-center justify-center text-center text-white">
    <div class="relative z-10 max-w-4xl mx-auto px-4">
      <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
        Find Expert <span class="text-green-400">Guides</span>
      </h1>
      <p class="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
        Learn from certified outdoor professionals. Book personalized instruction, guided tours, and expert consultations.
      </p>
    </div>
  </section>
</ScrollLinkedAnimator>

<!-- Filters Section -->
<section class="relative py-8">
  <div class="max-w-7xl mx-auto px-4">
    <div class="bg-black/20 backdrop-blur-md rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4">Filter Guides</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Specialty Filter -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Specialty</label>
          <select
            bind:value={selectedSpecialty}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Specialties</option>
            {#each GUIDE_SPECIALTIES as specialty}
              <option value={specialty.id}>{specialty.icon} {specialty.name}</option>
            {/each}
          </select>
        </div>

        <!-- Verified Filter -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Verification</label>
          <label class="flex items-center space-x-2 text-white cursor-pointer">
            <input
              type="checkbox"
              bind:checked={verifiedOnly}
              class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <span class="text-sm">Verified guides only</span>
          </label>
        </div>

        <!-- Rate Range -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Min Rate/Hour</label>
          <input
            type="number"
            bind:value={minRate}
            placeholder="$0"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-white mb-2">Max Rate/Hour</label>
          <input
            type="number"
            bind:value={maxRate}
            placeholder="$500"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Guides Grid -->
<section class="relative py-8 min-h-screen">
  <div class="max-w-7xl mx-auto px-4">
    {#if loading}
      <div class="flex justify-center items-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    {:else if error}
      <div class="text-center py-16">
        <p class="text-red-400 text-lg">{error}</p>
        <button
          on:click={loadGuides}
          class="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    {:else if guides.length === 0}
      <div class="text-center py-16">
        <p class="text-white/70 text-lg">No guides found matching your criteria.</p>
        <p class="text-white/50 mt-2">Try adjusting your filters or check back later.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each guides as guide}
          <div class="bg-black/20 backdrop-blur-md rounded-lg overflow-hidden hover:bg-black/30 transition-all duration-300 group">
            <!-- Image placeholder -->
            <div class="aspect-video bg-gradient-to-br from-green-400/20 to-blue-400/20 flex items-center justify-center relative">
              <span class="text-4xl">👨‍🏫</span>
              {#if guide.isVerified}
                <div class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  ✓ Verified
                </div>
              {/if}
            </div>
            
            <!-- Content -->
            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                  {guide.displayName}
                </h3>
                <div class="text-right ml-2">
                  <div class="text-lg font-bold text-green-400">
                    {formatRate(guide.hourlyRate)}/hr
                  </div>
                  {#if guide.dayRate}
                    <div class="text-sm text-white/70">
                      {formatRate(guide.dayRate)}/day
                    </div>
                  {/if}
                </div>
              </div>
              
              <!-- Rating and Experience -->
              <div class="flex items-center justify-between text-sm text-white/70 mb-2">
                <div class="flex items-center gap-1">
                  <span class="text-yellow-400">{getRatingStars(guide.avgRating || 0)}</span>
                  <span>({guide.reviewCount || 0})</span>
                </div>
                <span>{guide.experience}</span>
              </div>
              
              <!-- Location -->
              <div class="text-sm text-white/60 mb-3">
                📍 {guide.location.city}, {guide.location.state}
              </div>
              
              <!-- Bio -->
              <p class="text-white/60 text-sm line-clamp-2 mb-3">
                {guide.bio}
              </p>
              
              <!-- Specialties -->
              <div class="flex flex-wrap gap-1 mb-3">
                {#each guide.specialties.slice(0, 3) as specialty}
                  <span class="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded flex items-center gap-1">
                    {getSpecialtyIcon(specialty)}
                    {getSpecialtyName(specialty)}
                  </span>
                {/each}
                {#if guide.specialties.length > 3}
                  <span class="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded">
                    +{guide.specialties.length - 3} more
                  </span>
                {/if}
              </div>
              
              <!-- Response Time -->
              <div class="text-xs mb-3">
                <span class="text-white/50">Response time:</span>
                <span class={getResponseTimeColor(guide.responseTime || '')}>
                  {guide.responseTime}
                </span>
              </div>
              
              <a href="/guides/{guide.id}" class="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center">
                View Profile & Book
              </a>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
