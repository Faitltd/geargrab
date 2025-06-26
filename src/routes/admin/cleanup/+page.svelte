<script lang="ts">
  import { onMount } from 'svelte';
  import { firestore } from '$lib/firebase/client';
  import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
  import { simpleAuth } from '$lib/auth/simple-auth';

  let listings = [];
  let loading = true;
  let removing = false;
  let error = '';
  let success = '';

  // Dummy listing identifiers
  const DUMMY_IDENTIFIERS = [
    'REI Co-op Half Dome 4 Plus Tent',
    'Professional DSLR Camera Kit - Canon EOS R5',
    'Mountain Bike - Trek Fuel EX 8',
    'Mountain Bike - Trek X-Caliber 8',
    'Kayak - Wilderness Systems Pungo 120',
    'Canon EOS R5',
    'Trek Fuel EX 8',
    'Trek X-Caliber 8',
    'Wilderness Systems Pungo 120',
    'David Wilson',
    'Marcus Rodriguez',
    'James Taylor',
    'Sarah Johnson',
    'Lisa Martinez'
  ];

  onMount(async () => {
    await loadListings();
  });

  async function loadListings() {
    try {
      loading = true;
      error = '';

      const listingsRef = collection(firestore, 'listings');
      const snapshot = await getDocs(listingsRef);
      
      listings = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        listings.push({ id: doc.id, ...data });
      });

      console.log(`Found ${listings.length} total listings`);
      loading = false;
    } catch (err) {
      console.error('Error loading listings:', err);
      error = 'Failed to load listings: ' + err.message;
      loading = false;
    }
  }

  function isDummyListing(listing) {
    const searchText = [
      listing.title || '',
      listing.description || '',
      listing.brand || '',
      listing.model || '',
      listing.owner?.name || '',
      listing.location?.city || '',
      listing.location?.state || ''
    ].join(' ').toLowerCase();
    
    // Check against dummy identifiers
    for (const identifier of DUMMY_IDENTIFIERS) {
      if (searchText.includes(identifier.toLowerCase())) {
        return true;
      }
    }
    
    // Check for dummy owner UIDs
    if (listing.owner?.uid && listing.owner.uid.startsWith('owner')) {
      return true;
    }
    
    // Check for unrealistic pricing
    if (listing.dailyPrice && [25, 45, 50, 65, 85].includes(listing.dailyPrice)) {
      return true;
    }
    
    return false;
  }

  $: dummyListings = listings.filter(isDummyListing);
  $: realListings = listings.filter(listing => !isDummyListing(listing));

  async function removeDummyListings() {
    if (!confirm(`Are you sure you want to remove ${dummyListings.length} dummy listings? This cannot be undone.`)) {
      return;
    }

    try {
      removing = true;
      error = '';
      success = '';

      console.log(`Removing ${dummyListings.length} dummy listings...`);

      // Remove each dummy listing
      for (const listing of dummyListings) {
        console.log(`Removing: ${listing.title} (${listing.id})`);
        await deleteDoc(doc(firestore, 'listings', listing.id));
      }

      success = `Successfully removed ${dummyListings.length} dummy listings!`;
      
      // Reload listings
      await loadListings();
      
    } catch (err) {
      console.error('Error removing dummy listings:', err);
      error = 'Failed to remove dummy listings: ' + err.message;
    } finally {
      removing = false;
    }
  }

  async function removeSpecificListing(listingId) {
    if (!confirm('Are you sure you want to remove this listing?')) {
      return;
    }

    try {
      await deleteDoc(doc(firestore, 'listings', listingId));
      success = 'Listing removed successfully!';
      await loadListings();
    } catch (err) {
      console.error('Error removing listing:', err);
      error = 'Failed to remove listing: ' + err.message;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-white mb-8">Admin: Database Cleanup</h1>

    {#if error}
      <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
        <p class="text-red-200">{error}</p>
      </div>
    {/if}

    {#if success}
      <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
        <p class="text-green-200">{success}</p>
      </div>
    {/if}

    {#if loading}
      <div class="text-center py-12">
        <div class="animate-spin h-12 w-12 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-300">Loading listings...</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- Dummy Listings -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-white">Dummy Listings ({dummyListings.length})</h2>
            {#if dummyListings.length > 0}
              <button
                on:click={removeDummyListings}
                disabled={removing}
                class="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {removing ? 'Removing...' : 'Remove All'}
              </button>
            {/if}
          </div>

          {#if dummyListings.length === 0}
            <p class="text-green-400">✅ No dummy listings found!</p>
          {:else}
            <div class="space-y-3 max-h-96 overflow-y-auto">
              {#each dummyListings as listing}
                <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h3 class="font-medium text-white text-sm">{listing.title}</h3>
                      <p class="text-gray-400 text-xs">Owner: {listing.owner?.name || 'Unknown'}</p>
                      <p class="text-gray-400 text-xs">Location: {listing.location?.city || 'Unknown'}</p>
                      <p class="text-gray-400 text-xs">Price: ${listing.dailyPrice || 0}/day</p>
                    </div>
                    <button
                      on:click={() => removeSpecificListing(listing.id)}
                      class="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Real Listings -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h2 class="text-xl font-semibold text-white mb-4">Real Listings ({realListings.length})</h2>
          
          {#if realListings.length === 0}
            <p class="text-gray-400">No real listings found.</p>
          {:else}
            <div class="space-y-3 max-h-96 overflow-y-auto">
              {#each realListings as listing}
                <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h3 class="font-medium text-white text-sm">{listing.title}</h3>
                      <p class="text-gray-400 text-xs">Owner: {listing.owner?.name || 'Unknown'}</p>
                      <p class="text-gray-400 text-xs">Location: {listing.location?.city || 'Unknown'}</p>
                      <p class="text-gray-400 text-xs">Price: ${listing.dailyPrice || 0}/day</p>
                    </div>
                    <button
                      on:click={() => removeSpecificListing(listing.id)}
                      class="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="mt-8 text-center">
        <button
          on:click={loadListings}
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Refresh Listings
        </button>
      </div>
    {/if}
  </div>
</div>
