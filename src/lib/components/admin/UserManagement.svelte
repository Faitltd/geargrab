<script lang="ts">
  import { onMount } from 'svelte';
  import { showToast } from '$lib/stores/toast.store';
  import { 
    banUser,
    logAdminAction,
    type UserProfile
  } from '$lib/services/admin.service';
  import { getUserProfile } from '$lib/services/users.service';
  import Button from '$lib/components/ui/Button.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  // State
  let searchQuery = '';
  let searchResults: UserProfile[] = [];
  let isSearching = false;
  let selectedUser: UserProfile | null = null;
  let showUserModal = false;
  let showBanModal = false;
  let banReason = '';
  let banDuration = '';
  let isProcessing = false;

  async function searchUsers() {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }

    try {
      isSearching = true;
      // In a real implementation, you'd have a search service
      // For now, we'll simulate with a single user lookup if it's a UID
      if (searchQuery.length > 20) { // Assume it's a UID
        const user = await getUserProfile(searchQuery);
        searchResults = user ? [user] : [];
      } else {
        // For email/name search, you'd implement a proper search
        searchResults = [];
        showToast('info', 'Search by UID for now. Full search coming soon.');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      showToast('error', 'Failed to search users');
      searchResults = [];
    } finally {
      isSearching = false;
    }
  }

  function viewUser(user: UserProfile) {
    selectedUser = user;
    showUserModal = true;
  }

  function closeUserModal() {
    selectedUser = null;
    showUserModal = false;
  }

  function openBanModal(user: UserProfile) {
    selectedUser = user;
    showBanModal = true;
    banReason = '';
    banDuration = '';
  }

  function closeBanModal() {
    selectedUser = null;
    showBanModal = false;
    banReason = '';
    banDuration = '';
  }

  async function handleBanUser() {
    if (!selectedUser || !banReason.trim()) {
      showToast('error', 'Please provide a ban reason');
      return;
    }

    try {
      isProcessing = true;

      const duration = banDuration ? parseInt(banDuration) : undefined;
      await banUser(selectedUser.uid, banReason, duration);

      showToast('success', 'User banned successfully');
      closeBanModal();
      
      // Refresh search results
      if (searchQuery) {
        await searchUsers();
      }

    } catch (error) {
      console.error('Error banning user:', error);
      showToast('error', 'Failed to ban user');
    } finally {
      isProcessing = false;
    }
  }

  async function unbanUser(user: UserProfile) {
    try {
      isProcessing = true;

      await logAdminAction({
        action: 'unban_user',
        targetType: 'user',
        targetId: user.uid,
        details: { reason: 'Manual unban' },
        reason: 'Manual unban'
      });

      showToast('success', 'User unbanned successfully');
      
      // Refresh search results
      if (searchQuery) {
        await searchUsers();
      }

    } catch (error) {
      console.error('Error unbanning user:', error);
      showToast('error', 'Failed to unban user');
    } finally {
      isProcessing = false;
    }
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function getUserStatus(user: UserProfile): { status: string; color: string } {
    if (user.isBanned) {
      return { status: 'Banned', color: 'bg-red-100 text-red-800' };
    }
    if (user.isVerified) {
      return { status: 'Verified', color: 'bg-green-100 text-green-800' };
    }
    return { status: 'Active', color: 'bg-blue-100 text-blue-800' };
  }
</script>

<div class="space-y-6">
  <!-- Search Section -->
  <div class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Search Users</h3>
    
    <div class="flex space-x-4">
      <div class="flex-1">
        <input
          type="text"
          bind:value={searchQuery}
          on:keydown={(e) => e.key === 'Enter' && searchUsers()}
          placeholder="Search by UID, email, or name..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button
        variant="primary"
        on:click={searchUsers}
        loading={isSearching}
        disabled={isSearching || !searchQuery.trim()}
      >
        {isSearching ? 'Searching...' : 'Search'}
      </Button>
    </div>
  </div>

  <!-- Search Results -->
  {#if searchResults.length > 0}
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
      
      <div class="space-y-4">
        {#each searchResults as user}
          {@const userStatus = getUserStatus(user)}
          
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center space-x-4">
              <!-- Avatar -->
              <div class="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                {#if user.photoURL}
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <div class="w-full h-full flex items-center justify-center bg-blue-100">
                    <span class="text-lg font-medium text-blue-600">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                {/if}
              </div>

              <!-- User Info -->
              <div>
                <div class="flex items-center space-x-2">
                  <h4 class="font-medium text-gray-900">{user.displayName}</h4>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {userStatus.color}">
                    {userStatus.status}
                  </span>
                </div>
                <p class="text-sm text-gray-600">{user.email}</p>
                <p class="text-xs text-gray-500">
                  Joined {formatDate(user.createdAt)} • {user.listingCount} listings • {user.reviewCount} reviews
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                on:click={() => viewUser(user)}
              >
                View Details
              </Button>
              
              {#if user.isBanned}
                <Button
                  variant="primary"
                  size="sm"
                  on:click={() => unbanUser(user)}
                  disabled={isProcessing}
                >
                  Unban
                </Button>
              {:else}
                <Button
                  variant="danger"
                  size="sm"
                  on:click={() => openBanModal(user)}
                >
                  Ban User
                </Button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else if searchQuery && !isSearching}
    <div class="bg-white rounded-lg border border-gray-200 p-6 text-center">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No users found</h3>
      <p class="text-gray-600">Try searching with a different term</p>
    </div>
  {/if}
</div>

<!-- User Details Modal -->
{#if showUserModal && selectedUser}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">User Details</h3>
          <button
            on:click={closeUserModal}
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-6">
          <!-- Basic Info -->
          <div class="flex items-start space-x-4">
            <div class="w-16 h-16 bg-gray-100 rounded-full overflow-hidden">
              {#if selectedUser.photoURL}
                <img
                  src={selectedUser.photoURL}
                  alt={selectedUser.displayName}
                  class="w-full h-full object-cover"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center bg-blue-100">
                  <span class="text-xl font-medium text-blue-600">
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              {/if}
            </div>

            <div class="flex-1">
              <h4 class="text-xl font-semibold text-gray-900">{selectedUser.displayName}</h4>
              <p class="text-gray-600">{selectedUser.email}</p>
              {#if selectedUser.phoneNumber}
                <p class="text-gray-600">{selectedUser.phoneNumber}</p>
              {/if}
              {#if selectedUser.location}
                <p class="text-gray-600">{selectedUser.location}</p>
              {/if}
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-gray-900">{selectedUser.listingCount}</div>
              <div class="text-sm text-gray-600">Listings</div>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-gray-900">{selectedUser.rentalCount}</div>
              <div class="text-sm text-gray-600">Rentals</div>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-gray-900">{selectedUser.reviewCount}</div>
              <div class="text-sm text-gray-600">Reviews</div>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-gray-900">{selectedUser.rating.toFixed(1)}</div>
              <div class="text-sm text-gray-600">Rating</div>
            </div>
          </div>

          <!-- Account Info -->
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="font-medium text-gray-700">Account Status:</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getUserStatus(selectedUser).color}">
                {getUserStatus(selectedUser).status}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-700">Verification Level:</span>
              <span class="text-gray-900">{selectedUser.verificationLevel}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-700">Joined:</span>
              <span class="text-gray-900">{formatDate(selectedUser.createdAt)}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-700">Last Active:</span>
              <span class="text-gray-900">{formatDate(selectedUser.lastActiveAt)}</span>
            </div>
          </div>

          <!-- Bio -->
          {#if selectedUser.bio}
            <div>
              <h5 class="font-medium text-gray-700 mb-2">Bio</h5>
              <p class="text-gray-900 bg-gray-50 rounded-lg p-3">{selectedUser.bio}</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Ban User Modal -->
{#if showBanModal && selectedUser}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Ban User</h3>
      
      <div class="mb-4 p-3 bg-red-50 rounded-lg">
        <p class="text-sm text-red-800">
          <strong>Warning:</strong> This will ban {selectedUser.displayName} from the platform.
        </p>
      </div>

      <form on:submit|preventDefault={handleBanUser} class="space-y-4">
        <!-- Reason -->
        <div>
          <label for="banReason" class="block text-sm font-medium text-gray-700 mb-1">
            Ban Reason *
          </label>
          <textarea
            id="banReason"
            bind:value={banReason}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Explain why this user is being banned..."
            required
          ></textarea>
        </div>

        <!-- Duration -->
        <div>
          <label for="banDuration" class="block text-sm font-medium text-gray-700 mb-1">
            Duration (days)
          </label>
          <input
            id="banDuration"
            type="number"
            min="1"
            bind:value={banDuration}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave empty for permanent ban"
          />
          <p class="text-xs text-gray-500 mt-1">Leave empty for permanent ban</p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            on:click={closeBanModal}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            loading={isProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? 'Banning...' : 'Ban User'}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
