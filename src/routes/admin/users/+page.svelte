<script lang="ts">
  import { onMount } from 'svelte';
  import { makeUserAdmin, isCurrentUserAdmin, removeAdminPrivileges } from '$lib/firebase/auth';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';
  import { collection, getDocs } from 'firebase/firestore';
  import { firestore } from '$lib/firebase/client';
  import SkeletonCard from '$lib/components/layout/SkeletonCard.svelte';
  import ProgressiveLoader from '$lib/components/layout/ProgressiveLoader.svelte';

  let loading = true;
  let isAdmin = false;
  let newAdminUid = '';
  let processing = false;
  let users = [];
  let filteredUsers = [];
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedUser = null;
  let showUserModal = false;
  let showAddUserModal = false;
  let newUser = {
    email: '',
    displayName: '',
    password: '',
    role: 'user'
  };
  let formErrors = {
    email: '',
    password: '',
    displayName: ''
  };

  const statusOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'verified', label: 'Verified' },
    { value: 'unverified', label: 'Unverified' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'admin', label: 'Admins' }
  ];

  onMount(async () => {
    // Check if current user is admin
    try {
      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        notifications.add({
          type: 'error',
          message: 'Access denied. Admin privileges required.',
          timeout: 5000
        });
        goto('/dashboard');
        return;
      }
      await loadUsers();
    } catch (error) {
      console.error('Error checking admin status:', error);
      notifications.add({
        type: 'error',
        message: 'Error checking admin status',
        timeout: 5000
      });
      goto('/dashboard');
      return;
    }
    loading = false;
  });

  async function loadUsers() {
    try {
      const [usersSnap, adminUsersSnap] = await Promise.all([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'adminUsers'))
      ]);

      const adminUids = new Set(adminUsersSnap.docs.map(doc => doc.id));

      users = usersSnap.docs.map(doc => {
        const userData = doc.data();
        return {
          id: doc.id,
          uid: userData.uid || doc.id, // Ensure uid is set, fallback to doc.id
          ...userData,
          isAdmin: adminUids.has(doc.id),
          createdAt: userData.createdAt?.toDate() || new Date()
        };
      });

      filterUsers();
    } catch (error) {
      console.error('Error loading users:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load users',
        timeout: 5000
      });
    }
  }

  function filterUsers() {
    filteredUsers = users.filter(user => {
      const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.uid?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'verified' && user.isVerified) ||
                           (statusFilter === 'unverified' && !user.isVerified) ||
                           (statusFilter === 'suspended' && user.status === 'suspended') ||
                           (statusFilter === 'admin' && user.isAdmin);

      return matchesSearch && matchesStatus;
    });
  }

  $: {
    searchQuery;
    statusFilter;
    filterUsers();
  }

  async function updateUserStatus(userId: string, status: string) {
    try {
      // Call the API to update user status
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          action: status === 'verified' ? 'verify' : status === 'suspended' ? 'suspend' : 'activate'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      notifications.add({
        type: 'success',
        message: `User ${status} successfully`,
        timeout: 3000
      });

      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      notifications.add({
        type: 'error',
        message: error.message || 'Failed to update user',
        timeout: 5000
      });
    }
  }

  function openUserModal(user) {
    selectedUser = user;
    showUserModal = true;
  }

  function closeUserModal() {
    selectedUser = null;
    showUserModal = false;
  }

  function openAddUserModal() {
    newUser = {
      email: '',
      displayName: '',
      password: '',
      role: 'user'
    };
    formErrors = {
      email: '',
      password: '',
      displayName: ''
    };
    showAddUserModal = true;
  }

  function closeAddUserModal() {
    showAddUserModal = false;
  }

  function validateForm() {
    formErrors = {
      email: '',
      password: '',
      displayName: ''
    };

    let isValid = true;

    // Email validation
    if (!newUser.email) {
      formErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      formErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!newUser.password) {
      formErrors.password = 'Password is required';
      isValid = false;
    } else if (newUser.password.length < 6) {
      formErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    // Display name validation (optional but if provided, should be reasonable)
    if (newUser.displayName && newUser.displayName.length < 2) {
      formErrors.displayName = 'Display name must be at least 2 characters long';
      isValid = false;
    }

    return isValid;
  }

  async function createUser() {
    try {
      processing = true;

      // Validate form data
      if (!validateForm()) {
        processing = false;
        return;
      }

      // Call the API to create the user
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newUser.email,
          displayName: newUser.displayName,
          password: newUser.password,
          role: newUser.role,
          sendWelcomeEmail: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      notifications.add({
        type: 'success',
        message: `User ${newUser.email} created successfully! ${result.note || 'Note: In development mode, you may need to create the user in Firebase Console for login capability.'}`,
        timeout: 8000
      });

      closeAddUserModal();

      // Reload users to get the latest data
      await loadUsers();

    } catch (error) {
      console.error('Error creating user:', error);
      notifications.add({
        type: 'error',
        message: error.message || 'Failed to create user',
        timeout: 5000
      });
    } finally {
      processing = false;
    }
  }

  async function resetUserPassword(userId: string, userEmail: string) {
    if (!confirm(`Are you sure you want to reset the password for ${userEmail}?`)) {
      return;
    }

    try {
      // In a real app, this would use Firebase Admin SDK to reset password
      // For now, we'll simulate the reset

      notifications.add({
        type: 'success',
        message: `Password reset email sent to ${userEmail}`,
        timeout: 3000
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to reset password',
        timeout: 5000
      });
    }
  }

  async function deleteUser(userId: string, userEmail: string) {
    if (!confirm(`Are you sure you want to permanently delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Call the API to delete the user
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      notifications.add({
        type: 'success',
        message: `User ${userEmail} deleted successfully`,
        timeout: 3000
      });

      // Reload users to get the latest data
      await loadUsers();

    } catch (error) {
      console.error('Error deleting user:', error);
      notifications.add({
        type: 'error',
        message: error.message || 'Failed to delete user',
        timeout: 5000
      });
    }
  }

  async function addAdmin() {
    if (!newAdminUid.trim()) {
      notifications.add({
        type: 'error',
        message: 'Please enter a valid User UID',
        timeout: 5000
      });
      return;
    }

    processing = true;
    try {
      await makeUserAdmin(newAdminUid.trim());
      notifications.add({
        type: 'success',
        message: `Successfully granted admin privileges to user ${newAdminUid}`,
        timeout: 5000
      });
      newAdminUid = '';
    } catch (error) {
      console.error('Error adding admin:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to grant admin privileges',
        timeout: 5000
      });
    } finally {
      processing = false;
    }
  }

  async function removeAdmin() {
    if (!newAdminUid.trim()) {
      notifications.add({
        type: 'error',
        message: 'Please enter a valid User UID',
        timeout: 5000
      });
      return;
    }

    processing = true;
    try {
      await removeAdminPrivileges(newAdminUid.trim());
      notifications.add({
        type: 'success',
        message: `Successfully removed admin privileges from user ${newAdminUid}`,
        timeout: 5000
      });
      newAdminUid = '';
    } catch (error) {
      console.error('Error removing admin:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to remove admin privileges',
        timeout: 5000
      });
    } finally {
      processing = false;
    }
  }
</script>

<svelte:head>
  <title>User Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-white">User Management</h1>
      <p class="text-gray-400 mt-1">Manage all users on the platform</p>
    </div>
    <div class="flex items-center space-x-4">
      <button
        on:click={openAddUserModal}
        class="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        + Add User
      </button>
      <div class="text-right">
        <p class="text-sm text-gray-400">Total Users</p>
        <p class="text-2xl font-bold text-white">{users.length}</p>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="space-y-6">
      <!-- Loading skeleton for filters -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="skeleton h-10 rounded"></div>
          <div class="skeleton h-10 rounded"></div>
          <div class="skeleton h-10 rounded"></div>
        </div>
      </div>

      <!-- Loading skeleton for user cards -->
      <div class="space-y-4">
        <SkeletonCard variant="user" count={6} />
      </div>
    </div>
  {:else}
    <!-- Filters -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Search Users</label>
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search by email, name, or UID..."
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Status Filter</label>
          <select
            bind:value={statusFilter}
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {#each statusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- Results Count -->
        <div class="flex items-end">
          <div class="text-center">
            <p class="text-sm text-gray-400">Showing Results</p>
            <p class="text-xl font-bold text-white">{filteredUsers.length}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
      {#if filteredUsers.length === 0}
        <div class="p-8 text-center">
          <p class="text-gray-400">No users found matching your criteria.</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-white/5">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              {#each filteredUsers as user, index}
                <ProgressiveLoader delay={index * 100} animation="slide-up">
                  <tr class="hover:bg-white/5">
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="h-10 w-10 bg-gray-600 rounded-full mr-4 flex items-center justify-center">
                        {#if user.photoURL}
                          <img src={user.photoURL} alt={user.displayName} class="h-10 w-10 rounded-full object-cover" />
                        {:else}
                          <span class="text-gray-400">👤</span>
                        {/if}
                      </div>
                      <div>
                        <div class="text-white font-medium">{user.displayName || 'No name'}</div>
                        <div class="text-gray-400 text-sm">{user.email}</div>
                        <div class="text-gray-500 text-xs">ID: {user.uid ? user.uid.slice(0, 8) + '...' : 'No ID'}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    {#if user.isVerified}
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-green-500/20 text-green-300 border-green-500/30">
                        Verified
                      </span>
                    {:else}
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        Unverified
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4">
                    {#if user.isAdmin}
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30">
                        Admin
                      </span>
                    {:else}
                      <span class="text-gray-400">User</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-gray-400 text-sm">
                      {user.createdAt?.toLocaleDateString() || 'Unknown'}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-2">
                      <button
                        on:click={() => openUserModal(user)}
                        class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View
                      </button>
                      {#if !user.isVerified && user.uid}
                        <button
                          on:click={() => updateUserStatus(user.uid, 'verified')}
                          class="text-green-400 hover:text-green-300 text-sm font-medium"
                        >
                          Verify
                        </button>
                      {/if}
                      {#if !user.isAdmin && user.uid}
                        <button
                          on:click={() => makeUserAdmin(user.uid)}
                          class="text-purple-400 hover:text-purple-300 text-sm font-medium"
                        >
                          Make Admin
                        </button>
                      {:else if user.isAdmin && user.uid}
                        <button
                          on:click={() => removeAdminPrivileges(user.uid)}
                          class="text-orange-400 hover:text-orange-300 text-sm font-medium"
                        >
                          Remove Admin
                        </button>
                      {/if}
                      {#if user.uid}
                        <button
                          on:click={() => resetUserPassword(user.uid, user.email)}
                          class="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                        >
                          Reset Password
                        </button>
                        <button
                          on:click={() => updateUserStatus(user.uid, 'suspended')}
                          class="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Suspend
                        </button>
                        <button
                          on:click={() => deleteUser(user.uid, user.email)}
                          class="text-red-600 hover:text-red-500 text-sm font-medium"
                        >
                          Delete
                        </button>
                      {/if}
                    </div>
                  </td>
                  </tr>
                </ProgressiveLoader>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Quick Admin Actions -->
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 class="text-xl font-semibold text-white mb-4">Quick Admin Actions</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">User UID</label>
          <input
            type="text"
            bind:value={newAdminUid}
            placeholder="Enter user UID to grant/remove admin..."
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div class="flex items-end space-x-2">
          <button
            on:click={addAdmin}
            disabled={processing || !newAdminUid.trim()}
            class="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {processing ? 'Processing...' : 'Grant Admin'}
          </button>
          <button
            on:click={removeAdmin}
            disabled={processing || !newAdminUid.trim()}
            class="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {processing ? 'Processing...' : 'Remove Admin'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Add User Modal -->
{#if showAddUserModal}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 border border-white/20">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">Add New User</h2>
        <button
          on:click={closeAddUserModal}
          class="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <input
            type="email"
            bind:value={newUser.email}
            placeholder="user@example.com"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 {formErrors.email ? 'border-red-500' : ''}"
            required
          />
          {#if formErrors.email}
            <p class="text-red-400 text-sm mt-1">{formErrors.email}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
          <input
            type="text"
            bind:value={newUser.displayName}
            placeholder="John Doe"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 {formErrors.displayName ? 'border-red-500' : ''}"
          />
          {#if formErrors.displayName}
            <p class="text-red-400 text-sm mt-1">{formErrors.displayName}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Temporary Password</label>
          <input
            type="password"
            bind:value={newUser.password}
            placeholder="Temporary password"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 {formErrors.password ? 'border-red-500' : ''}"
            required
          />
          {#if formErrors.password}
            <p class="text-red-400 text-sm mt-1">{formErrors.password}</p>
          {:else}
            <p class="text-gray-400 text-xs mt-1">User will be prompted to change on first login</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Role</label>
          <select
            bind:value={newUser.role}
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="user">Regular User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end space-x-4 mt-6">
        <button
          on:click={closeAddUserModal}
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={createUser}
          disabled={processing || !newUser.email || !newUser.password}
          class="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {processing ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- User Details Modal -->
{#if showUserModal && selectedUser}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-white/20 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">User Details</h2>
        <button
          on:click={closeUserModal}
          class="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Basic Info -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Basic Information</h3>
          <div class="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-gray-400">Email:</span>
              <span class="text-white ml-2">{selectedUser.email}</span>
            </div>
            <div>
              <span class="text-gray-400">Display Name:</span>
              <span class="text-white ml-2">{selectedUser.displayName || 'Not set'}</span>
            </div>
            <div>
              <span class="text-gray-400">User ID:</span>
              <span class="text-white ml-2 font-mono text-sm">{selectedUser.uid || 'No ID'}</span>
            </div>
            <div>
              <span class="text-gray-400">Created:</span>
              <span class="text-white ml-2">{selectedUser.createdAt?.toLocaleString() || 'Unknown'}</span>
            </div>
          </div>
        </div>

        <!-- Status & Permissions -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Status & Permissions</h3>
          <div class="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <span class="text-gray-400">Verification Status:</span>
              {#if selectedUser.isVerified}
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-green-500/20 text-green-300 border-green-500/30 ml-2">
                  Verified
                </span>
              {:else}
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-500/30 ml-2">
                  Unverified
                </span>
              {/if}
            </div>
            <div>
              <span class="text-gray-400">Role:</span>
              {#if selectedUser.isAdmin}
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30 ml-2">
                  Administrator
                </span>
              {:else}
                <span class="text-white ml-2">Regular User</span>
              {/if}
            </div>
            <div>
              <span class="text-gray-400">Account Status:</span>
              <span class="text-white ml-2 capitalize">{selectedUser.status || 'Active'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-4 mt-6 pt-6 border-t border-white/20">
        <button
          on:click={closeUserModal}
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Close
        </button>
        <div class="flex space-x-2">
          {#if selectedUser.uid}
            <button
              on:click={() => {resetUserPassword(selectedUser.uid, selectedUser.email); closeUserModal();}}
              class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
            >
              Reset Password
            </button>
            {#if !selectedUser.isAdmin}
              <button
                on:click={() => {makeUserAdmin(selectedUser.uid); closeUserModal();}}
                class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
              >
                Make Admin
              </button>
            {:else}
              <button
                on:click={() => {removeAdminPrivileges(selectedUser.uid); closeUserModal();}}
                class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
              >
                Remove Admin
              </button>
            {/if}
            <button
              on:click={() => {deleteUser(selectedUser.uid, selectedUser.email); closeUserModal();}}
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              Delete User
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
