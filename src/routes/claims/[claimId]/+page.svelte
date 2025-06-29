<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { firestore } from '$lib/firebase/client';
  import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
  import { notifications } from '$lib/stores/notifications';
  import AuthGuard from '$lib/components/auth/auth-guard.svelte';

  let loading = true;
  let claimId = '';
  let claim: any = null;
  let booking: any = null;
  let listing: any = null;
  let timeline: any[] = [];

  onMount(async () => {
    claimId = $page.params.claimId;
    await loadClaimData();
  });

  async function loadClaimData() {
    try {
      loading = true;

      // Load claim data
      const claimDoc = await getDoc(doc(firestore, 'insuranceClaims', claimId));
      if (!claimDoc.exists()) {
        throw new Error('Claim not found');
      }

      claim = { id: claimDoc.id, ...claimDoc.data() };

      // Verify user has access to this claim
      if (claim.claimantId !== simpleAuth.user?.uid && claim.respondentId !== simpleAuth.user?.uid) {
        throw new Error('Access denied');
      }

      // Load related booking
      if (claim.bookingId) {
        const bookingDoc = await getDoc(doc(firestore, 'bookings', claim.bookingId));
        if (bookingDoc.exists()) {
          booking = { id: bookingDoc.id, ...bookingDoc.data() };
        }
      }

      // Load related listing
      if (claim.listingId) {
        const listingDoc = await getDoc(doc(firestore, 'listings', claim.listingId));
        if (listingDoc.exists()) {
          listing = { id: listingDoc.id, ...listingDoc.data() };
        }
      }

      // Process timeline
      timeline = claim.timeline || [];

    } catch (error) {
      console.error('Error loading claim data:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load claim information',
        timeout: 5000
      });
      goto('/dashboard');
    } finally {
      loading = false;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'submitted': return 'text-blue-400 bg-blue-500/20';
      case 'under_review': return 'text-yellow-400 bg-yellow-500/20';
      case 'approved': return 'text-green-400 bg-green-500/20';
      case 'denied': return 'text-red-400 bg-red-500/20';
      case 'settled': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'submitted': return '📝';
      case 'under_review': return '🔍';
      case 'approved': return '✅';
      case 'denied': return '❌';
      case 'settled': return '💰';
      default: return '❓';
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  }

  function getExpectedResolution(): string {
    if (!claim) return '';
    
    const submittedDate = claim.reportedDate?.toDate() || new Date();
    const resolutionDate = new Date(submittedDate);
    resolutionDate.setDate(resolutionDate.getDate() + 14); // 14 days from submission
    
    return resolutionDate.toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Claim #{claimId} - GearGrab</title>
</svelte:head>

<AuthGuard>
  <div class="max-w-6xl mx-auto px-4 py-8">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        <span class="ml-3 text-gray-300">Loading claim information...</span>
      </div>
    {:else if claim}
      <!-- Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Claim #{claim.id.slice(-8).toUpperCase()}</h1>
          <p class="text-gray-400">Submitted {formatDate(claim.reportedDate)}</p>
        </div>
        <div class="text-right">
          <div class="inline-flex items-center px-4 py-2 rounded-full {getStatusColor(claim.status)}">
            <span class="mr-2">{getStatusIcon(claim.status)}</span>
            <span class="font-medium capitalize">{claim.status.replace('_', ' ')}</span>
          </div>
          {#if claim.status === 'submitted' || claim.status === 'under_review'}
            <p class="text-gray-400 text-sm mt-2">Expected resolution: {getExpectedResolution()}</p>
          {/if}
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Claim Details -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 class="text-xl font-semibold text-white mb-4">Claim Details</h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-white font-medium mb-2">Type</h3>
                <p class="text-gray-300 capitalize">{claim.type}</p>
              </div>
              
              <div>
                <h3 class="text-white font-medium mb-2">Incident Date</h3>
                <p class="text-gray-300">{claim.incidentDate?.toDate?.()?.toLocaleDateString() || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 class="text-white font-medium mb-2">Estimated Cost</h3>
                <p class="text-gray-300">{formatCurrency(claim.estimatedCost || 0)}</p>
              </div>
              
              {#if claim.approvedAmount}
                <div>
                  <h3 class="text-white font-medium mb-2">Approved Amount</h3>
                  <p class="text-green-400 font-semibold">{formatCurrency(claim.approvedAmount)}</p>
                </div>
              {/if}
            </div>

            <div class="mt-6">
              <h3 class="text-white font-medium mb-2">Description</h3>
              <p class="text-gray-300 leading-relaxed">{claim.description}</p>
            </div>

            {#if claim.evidence?.witnessStatements?.length > 0}
              <div class="mt-6">
                <h3 class="text-white font-medium mb-2">Witness Statement</h3>
                <div class="bg-white/5 rounded-lg p-4">
                  <p class="text-gray-300">{claim.evidence.witnessStatements[0]}</p>
                </div>
              </div>
            {/if}
          </div>

          <!-- Timeline -->
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 class="text-xl font-semibold text-white mb-4">Claim Timeline</h2>
            
            <div class="space-y-4">
              {#each timeline as event, index}
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    {#if index < timeline.length - 1}
                      <div class="w-px h-8 bg-white/20 ml-4 mt-2"></div>
                    {/if}
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="text-white font-medium">{event.action}</h4>
                        {#if event.notes}
                          <p class="text-gray-400 text-sm mt-1">{event.notes}</p>
                        {/if}
                      </div>
                      <span class="text-gray-400 text-sm">{formatDate(event.date)}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Resolution -->
          {#if claim.resolution}
            <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
              <h2 class="text-xl font-semibold text-green-400 mb-4">Resolution</h2>
              
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 class="text-white font-medium mb-2">Type</h3>
                  <p class="text-gray-300 capitalize">{claim.resolution.type}</p>
                </div>
                
                <div>
                  <h3 class="text-white font-medium mb-2">Amount</h3>
                  <p class="text-green-400 font-semibold">{formatCurrency(claim.resolution.amount)}</p>
                </div>
              </div>

              <div class="mt-4">
                <h3 class="text-white font-medium mb-2">Details</h3>
                <p class="text-gray-300">{claim.resolution.details}</p>
              </div>

              <div class="mt-4">
                <h3 class="text-white font-medium mb-2">Completed</h3>
                <p class="text-gray-300">{claim.resolution.completedDate?.toDate?.()?.toLocaleDateString()}</p>
              </div>
            </div>
          {/if}
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Rental Information -->
          {#if booking && listing}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <h3 class="text-lg font-semibold text-white mb-4">Rental Information</h3>
              
              <div class="space-y-3">
                <div>
                  <h4 class="text-white font-medium">{listing.title}</h4>
                  <p class="text-gray-400 text-sm">Booking #{booking.id.slice(-8).toUpperCase()}</p>
                </div>
                
                <div>
                  <p class="text-gray-400 text-sm">Rental Period</p>
                  <p class="text-white">{booking.startDate?.toDate?.()?.toLocaleDateString()} - {booking.endDate?.toDate?.()?.toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p class="text-gray-400 text-sm">Total Paid</p>
                  <p class="text-white">{formatCurrency(booking.totalPrice)}</p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Coverage Information -->
          <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-green-400 mb-4">🛡️ Your Coverage</h3>
            
            <div class="space-y-3 text-sm text-green-200">
              <div class="flex justify-between">
                <span>Coverage Type:</span>
                <span>Standard</span>
              </div>
              <div class="flex justify-between">
                <span>Repair Coverage:</span>
                <span>Up to 50%</span>
              </div>
              <div class="flex justify-between">
                <span>Max Liability:</span>
                <span>$200</span>
              </div>
              <div class="flex justify-between">
                <span>Claim Window:</span>
                <span>48 hours</span>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-green-500/20">
              <a href="/guarantee" target="_blank" class="text-green-400 hover:text-green-300 text-sm font-medium">
                View full guarantee terms →
              </a>
            </div>
          </div>

          <!-- Contact Support -->
          <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-blue-400 mb-4">Need Help?</h3>
            
            <div class="space-y-3 text-sm text-blue-200">
              <p>Have questions about your claim?</p>
              <div class="space-y-2">
                <a href="mailto:claims@geargrab.co" class="block text-blue-400 hover:text-blue-300">
                  📧 claims@geargrab.co
                </a>
                <a href="tel:+1-555-GEAR-GRAB" class="block text-blue-400 hover:text-blue-300">
                  📞 1-555-GEAR-GRAB
                </a>
              </div>
              <p class="text-xs">Support hours: Mon-Fri 9AM-6PM MT</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-8 flex justify-between">
        <a
          href="/dashboard"
          class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          ← Back to Dashboard
        </a>
        
        {#if claim.status === 'submitted' || claim.status === 'under_review'}
          <a
            href="mailto:claims@geargrab.co?subject=Claim%20#{claim.id.slice(-8).toUpperCase()}%20Update"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Contact Support
          </a>
        {/if}
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">❌</div>
        <h2 class="text-2xl font-bold text-white mb-2">Claim Not Found</h2>
        <p class="text-gray-400 mb-6">The claim you're looking for doesn't exist or you don't have access to it.</p>
        <a
          href="/dashboard"
          class="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    {/if}
  </div>
</AuthGuard>
