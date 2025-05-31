<script lang="ts">
  import { onMount } from 'svelte';
  import { insuranceService, INSURANCE_TIERS, type InsuranceClaim } from '$lib/services/insurance';
  import { authStore } from '$lib/stores/auth';

  let claims: InsuranceClaim[] = [];
  let loading = true;
  let showClaimForm = false;
  let selectedClaim: InsuranceClaim | null = null;

  // Sample claims data
  let sampleClaims: InsuranceClaim[] = [
    {
      id: 'claim_001',
      bookingId: 'booking_123',
      listingId: 'listing_456',
      claimantId: 'user_789',
      respondentId: 'owner_101',
      type: 'damage',
      status: 'under_review',
      description: 'Tent zipper broke during normal use in windy conditions',
      incidentDate: new Date('2024-01-15'),
      reportedDate: new Date('2024-01-16'),
      estimatedCost: 75,
      evidence: {
        photos: ['photo1.jpg', 'photo2.jpg'],
        documents: [],
        witnessStatements: []
      },
      timeline: [
        {
          date: new Date('2024-01-16'),
          action: 'Claim submitted',
          actor: 'user_789',
          notes: 'Initial claim submission with photos'
        },
        {
          date: new Date('2024-01-17'),
          action: 'Under review',
          actor: 'insurance_agent',
          notes: 'Claim assigned to adjuster for review'
        }
      ]
    }
  ];

  onMount(() => {
    loadClaims();
  });

  async function loadClaims() {
    try {
      if ($authStore.user) {
        // In development, use sample data
        claims = sampleClaims;
      }
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      loading = false;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'submitted': return 'bg-blue-500';
      case 'under_review': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'denied': return 'bg-red-500';
      case 'settled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'damage': return '🔧';
      case 'theft': return '🚨';
      case 'loss': return '❓';
      case 'personal_injury': return '🏥';
      default: return '📋';
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Insurance Claims - GearGrab</title>
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">Insurance Claims</h1>
          <p class="text-gray-300">Manage your insurance claims and protection</p>
        </div>
        <button 
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          on:click={() => showClaimForm = true}
        >
          File New Claim
        </button>
      </div>
    </div>

    <!-- Insurance Tiers Overview -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
      <h2 class="text-lg font-semibold text-white mb-4">🛡️ Protection Plans</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        {#each INSURANCE_TIERS as tier}
          <div class="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 class="font-semibold text-white mb-2">{tier.name}</h3>
            <p class="text-sm text-gray-300 mb-3">{tier.description}</p>
            <div class="space-y-1">
              <div class="text-xs text-gray-400">
                Damage: {tier.coverage.damageLimit > 0 ? formatCurrency(tier.coverage.damageLimit) : 'None'}
              </div>
              <div class="text-xs text-gray-400">
                Deductible: {tier.coverage.deductible > 0 ? formatCurrency(tier.coverage.deductible) : 'None'}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Claims List -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
      <div class="px-6 py-4 border-b border-white/20">
        <h2 class="text-lg font-semibold text-white">Your Claims</h2>
      </div>
      
      <div class="p-6">
        {#if loading}
          <div class="text-center py-8">
            <div class="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            <p class="text-gray-300 mt-4">Loading claims...</p>
          </div>
        {:else if claims.length === 0}
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-300">No claims filed</h3>
            <p class="mt-1 text-sm text-gray-400">You haven't filed any insurance claims yet.</p>
            <div class="mt-6">
              <button 
                class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                on:click={() => showClaimForm = true}
              >
                File Your First Claim
              </button>
            </div>
          </div>
        {:else}
          <div class="space-y-4">
            {#each claims as claim}
              <div class="border border-white/20 rounded-lg p-6 hover:bg-white/5 transition-all bg-white/5">
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-4">
                    <div class="text-2xl">{getTypeIcon(claim.type)}</div>
                    <div class="flex-1">
                      <div class="flex items-center space-x-3">
                        <h3 class="text-lg font-medium text-white">
                          Claim #{claim.id.slice(-6).toUpperCase()}
                        </h3>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(claim.status)} text-white">
                          {claim.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p class="text-gray-300 mt-1">{claim.description}</p>
                      <div class="flex items-center space-x-6 mt-3 text-sm text-gray-400">
                        <div>
                          <span class="font-medium">Incident:</span> {formatDate(claim.incidentDate)}
                        </div>
                        <div>
                          <span class="font-medium">Reported:</span> {formatDate(claim.reportedDate)}
                        </div>
                        <div>
                          <span class="font-medium">Type:</span> {claim.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-white">
                      {formatCurrency(claim.estimatedCost)}
                    </div>
                    <div class="text-sm text-gray-300">Estimated</div>
                    {#if claim.approvedAmount}
                      <div class="text-sm text-green-400 mt-1">
                        {formatCurrency(claim.approvedAmount)} approved
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- Timeline -->
                <div class="mt-6 pt-4 border-t border-white/20">
                  <h4 class="text-sm font-medium text-white mb-3">Claim Timeline</h4>
                  <div class="space-y-2">
                    {#each claim.timeline.slice(-3) as event}
                      <div class="flex items-center space-x-3 text-sm">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div class="text-gray-300">
                          <span class="font-medium">{event.action}</span>
                          <span class="text-gray-400">• {formatDate(event.date)}</span>
                          {#if event.notes}
                            <div class="text-xs text-gray-400 mt-1">{event.notes}</div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Actions -->
                <div class="mt-4 flex space-x-3">
                  <button 
                    class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    on:click={() => selectedClaim = claim}
                  >
                    View Details
                  </button>
                  {#if claim.status === 'submitted'}
                    <button class="text-green-400 hover:text-green-300 text-sm font-medium">
                      Add Evidence
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Help Section -->
    <div class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
      <h2 class="text-lg font-semibold text-white mb-4">Need Help?</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-2xl mb-2">📞</div>
          <h3 class="font-medium text-white">24/7 Support</h3>
          <p class="text-sm text-gray-300">Call (555) 123-4567</p>
        </div>
        <div class="text-center">
          <div class="text-2xl mb-2">💬</div>
          <h3 class="font-medium text-white">Live Chat</h3>
          <p class="text-sm text-gray-300">Available 9 AM - 9 PM</p>
        </div>
        <div class="text-center">
          <div class="text-2xl mb-2">📧</div>
          <h3 class="font-medium text-white">Email Support</h3>
          <p class="text-sm text-gray-300">claims@geargrab.co</p>
        </div>
      </div>
    </div>

  </div>
</div>
