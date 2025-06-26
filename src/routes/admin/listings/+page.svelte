<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';
  import { notifications } from '$lib/stores/notifications';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { isCurrentUserAdmin, initializeAdminUser } from '$lib/auth/admin';

  let listings = [];
  let filteredListings = [];
  let loading = true;
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedListing = null;
  let showEditModal = false;
  let isAdmin = false;

  const statusOptions = [
    { value: 'all', label: 'All Listings' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'flagged', label: 'Flagged' }
  ];

  onMount(async () => {
    await checkAdminAccess();
    if (isAdmin) {
      await loadListings();
    }
  });

  async function checkAdminAccess() {
    try {
      // Wait for auth to be ready
      await simpleAuth.waitForAuthReady();

      if (!simpleAuth.user) {
        goto('/auth/login?redirectTo=/admin/listings');
        return;
      }

      // Initialize admin user if needed
      await initializeAdminUser();

      // Check admin status
      isAdmin = await isCurrentUserAdmin();

      if (!isAdmin) {
        console.warn('🚫 User is not admin:', simpleAuth.user.email);
        goto('/?error=admin_required');
        return;
      }

      console.log('✅ Admin access granted for listings management:', simpleAuth.user.email);
    } catch (error) {
      console.error('Error checking admin access:', error);
      goto('/?error=admin_check_failed');
    }
  }

  async function loadListings() {
    try {
      loading = true;
      const listingsRef = collection(firestore, 'listings');
      const listingsSnap = await getDocs(query(listingsRef, orderBy('createdAt', 'desc')));
      
      listings = listingsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      filterListings();
    } catch (error) {
      console.error('Error loading listings:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load listings',
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  function filterListings() {
    filteredListings = listings.filter(listing => {
      const matchesSearch = listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           listing.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'published' && listing.isPublished) ||
                           (statusFilter === 'draft' && !listing.isPublished) ||
                           (statusFilter === 'suspended' && listing.status === 'suspended') ||
                           (statusFilter === 'flagged' && listing.flagged);
      
      return matchesSearch && matchesStatus;
    });
  }

  $: {
    searchQuery;
    statusFilter;
    filterListings();
  }

  async function updateListingStatus(listingId: string, status: string) {
    try {
      const listingRef = doc(firestore, 'listings', listingId);
      await updateDoc(listingRef, { 
        status,
        isPublished: status === 'published',
        updatedAt: new Date()
      });
      
      notifications.add({
        type: 'success',
        message: `Listing ${status} successfully`,
        timeout: 3000
      });
      
      await loadListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to update listing',
        timeout: 5000
      });
    }
  }

  async function deleteListing(listingId: string) {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete listing');
      }

      notifications.add({
        type: 'success',
        message: 'Listing deleted successfully',
        timeout: 3000
      });
      await loadListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      notifications.add({
        type: 'error',
        message: error.message || 'Failed to delete listing',
        timeout: 5000
      });
    }
  }

  function openEditModal(listing) {
    selectedListing = { ...listing };
    showEditModal = true;
  }

  function closeEditModal() {
    selectedListing = null;
    showEditModal = false;
  }

  async function saveListing() {
    if (!selectedListing) return;
    
    try {
      const listingRef = doc(firestore, 'listings', selectedListing.id);
      await updateDoc(listingRef, {
        title: selectedListing.title,
        description: selectedListing.description,
        dailyPrice: selectedListing.dailyPrice,
        category: selectedListing.category,
        updatedAt: new Date()
      });
      
      notifications.add({
        type: 'success',
        message: 'Listing updated successfully',
        timeout: 3000
      });
      
      closeEditModal();
      await loadListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to update listing',
        timeout: 5000
      });
    }
  }

  function getStatusBadge(listing) {
    if (listing.flagged) return { class: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'Flagged' };
    if (listing.status === 'suspended') return { class: 'bg-orange-500/20 text-orange-300 border-orange-500/30', text: 'Suspended' };
    if (listing.isPublished) return { class: 'bg-green-500/20 text-green-300 border-green-500/30', text: 'Published' };
    return { class: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: 'Draft' };
  }
</script>

<svelte:head>
  <title>Listings Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">Listings Management</h1>
      <p class="text-gray-400 mt-1">Manage all listings on the platform</p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-400">Total Listings</p>
      <p class="text-2xl font-bold text-white">{listings.length}</p>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Search -->
      <div>
        <label for="search-listings" class="block text-sm font-medium text-gray-300 mb-2">Search Listings</label>
        <input id="search-listings"
          type="text"
          bind:value="{searchQuery}"
          placeholder="Search by title, description, or owner..."
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      <!-- Status Filter -->
      <div>
        <label for="status-filter" class="block text-sm font-medium text-gray-300 mb-2">Status Filter</label>
        <select id="status-filter"
          bind:value="{statusFilter}"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          {#each statusOptions as option}
            <option value="{option.value}">{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Results Count -->
      <div class="flex items-end">
        <div class="text-center">
          <p class="text-sm text-gray-400">Showing Results</p>
          <p class="text-xl font-bold text-white">{filteredListings.length}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Listings Table -->
  <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
    {#if loading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p class="text-gray-400">Loading listings...</p>
      </div>
    {:else if filteredListings.length === 0}
      <div class="p-8 text-center">
        <p class="text-gray-400">No listings found matching your criteria.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-white/5">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Listing</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Owner</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            {#each filteredListings as listing}
              <tr class="hover:bg-white/5">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="h-12 w-12 bg-gray-600 rounded-lg mr-4 flex items-center justify-center">
                      {#if listing.images && listing.images[0]}
                        <img src="{listing.images[0]}" alt="{listing.title}" class="h-12 w-12 rounded-lg object-cover" />
                      {:else}
                        <span class="text-gray-400">📦</span>
                      {/if}
                    </div>
                    <div>
                      <div class="text-white font-medium">{listing.title || 'Untitled'}</div>
                      <div class="text-gray-400 text-sm">{listing.category || 'Uncategorized'}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white">{listing.ownerEmail || 'Unknown'}</div>
                  <div class="text-gray-400 text-sm">ID: {listing.ownerUid?.slice(0, 8)}...</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white font-medium">${listing.dailyPrice || 0}/day</div>
                </td>
                <td class="px-6 py-4">
                  {#if listing}
                    {@const badge = getStatusBadge(listing)}
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border {badge.class}">
                      {badge.text}
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="text-gray-400 text-sm">
                    {listing.createdAt?.toLocaleDateString() || 'Unknown'}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex space-x-2">
                    <button
                      on:click={() => openEditModal(listing)}
                      class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Edit
                    </button>
                    {#if listing.isPublished}
                      <button
                        on:click={() => updateListingStatus(listing.id, 'suspended')}
                        class="text-orange-400 hover:text-orange-300 text-sm font-medium"
                      >
                        Suspend
                      </button>
                    {:else}
                      <button
                        on:click={() => updateListingStatus(listing.id, 'published')}
                        class="text-green-400 hover:text-green-300 text-sm font-medium"
                      >
                        Publish
                      </button>
                    {/if}
                    <button
                      on:click={() => deleteListing(listing.id)}
                      class="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Edit Modal -->
{#if showEditModal && selectedListing}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-white/20">
      <h2 class="text-xl font-bold text-white mb-4">Edit Listing</h2>
      
      <div class="space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-300 mb-2">Title</label>
          <input id="title"
            type="text"
            bind:value="{selectedListing.title}"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea id="description"
            bind:value="{selectedListing.description}"
            rows="4"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          ></textarea>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="daily-price" class="block text-sm font-medium text-gray-300 mb-2">Daily Price</label>
            <input id="daily-price"
              type="number"
              bind:value="{selectedListing.dailyPrice}"
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          
          <div>
            <label for="category" class="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <input id="category"
              type="text"
              bind:value="{selectedListing.category}"
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-4 mt-6">
        <button
          on:click="{closeEditModal}"
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          on:click="{saveListing}"
          class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if}
