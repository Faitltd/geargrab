<script lang="ts">
  import { onMount } from 'svelte';
  import LoyaltyBadge from './loyalty-badge.svelte';
  
  export let ownerUid: string;
  export let showBenefits = false;
  export let showSavings = false;

  let tierInfo: any = null;
  let loading = true;
  let error = '';

  onMount(() => {
    if (ownerUid) {
      loadOwnerTier();
    }
  });

  async function loadOwnerTier() {
    try {
      loading = true;
      error = '';

      const response = await fetch(`/api/loyalty/status?userId=${ownerUid}`);
      
      if (response.ok) {
        const data = await response.json();
        tierInfo = {
          tier: data.loyaltyStatus.currentTier,
          tierData: data.tierInfo,
          platformFeeReduction: data.loyaltyStatus.benefits.platformFeeReduction,
          tierSince: data.loyaltyStatus.tierSince
        };
      } else {
        // Default to bronze if no tier found
        tierInfo = {
          tier: 'bronze',
          tierData: {
            name: 'Bronze Owner',
            benefits: { platformFeeReduction: 0 }
          },
          platformFeeReduction: 0,
          tierSince: null
        };
      }

    } catch (err) {
      console.error('Error loading owner tier:', err);
      // Default to bronze on error
      tierInfo = {
        tier: 'bronze',
        tierData: {
          name: 'Bronze Owner',
          benefits: { platformFeeReduction: 0 }
        },
        platformFeeReduction: 0,
        tierSince: null
      };
    } finally {
      loading = false;
    }
  }

  function formatDate(date: string | Date): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  }

  function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(0)}%`;
  }
</script>

{#if loading}
  <div class="flex items-center space-x-2">
    <div class="animate-pulse bg-white/20 rounded-full h-6 w-20"></div>
  </div>

{:else if tierInfo}
  <div class="flex items-center space-x-3">
    <!-- Tier Badge -->
    <LoyaltyBadge 
      tier={tierInfo.tier} 
      size="small" 
      showTooltip={true}
    />

    <!-- Additional Info -->
    {#if showBenefits && tierInfo.platformFeeReduction > 0}
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1">
        <span class="text-green-300 text-sm font-medium">
          {formatPercentage(tierInfo.platformFeeReduction)} fee reduction
        </span>
      </div>
    {/if}

    {#if showSavings && tierInfo.platformFeeReduction > 0}
      <div class="text-green-300 text-sm">
        <span class="font-medium">Lower fees!</span>
        <span class="text-green-400">Save {formatPercentage(tierInfo.platformFeeReduction)}</span>
      </div>
    {/if}

    <!-- Tier Since -->
    {#if tierInfo.tierSince}
      <div class="text-gray-400 text-xs">
        Since {formatDate(tierInfo.tierSince)}
      </div>
    {/if}
  </div>
{/if}
