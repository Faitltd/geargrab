<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { isCurrentUserAdmin } from '$lib/firebase/auth';
  import { notifications } from '$lib/stores/notifications';

  let loading = true;
  let isAdmin = false;

  // Admin navigation items
  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: '📊' },
    { id: 'users', label: 'User Management', href: '/admin/users', icon: '👥' },
    { id: 'listings', label: 'Listings Management', href: '/admin/listings', icon: '📦' },
    { id: 'bookings', label: 'Bookings Management', href: '/admin/bookings', icon: '📅' },
    { id: 'messages', label: 'Messages', href: '/admin/messages', icon: '💬' },
    // HIDDEN: Background check functionality temporarily disabled
    // { id: 'background-checks', label: 'Background Checks', href: '/admin/background-checks', icon: '🔍' },
    // { id: 'background-check-test', label: 'BG Check Testing', href: '/admin/background-checks/test', icon: '🧪' },
    { id: 'verification', label: 'User Verification', href: '/admin/verification', icon: '✅' },
    { id: 'claims', label: 'Insurance Claims', href: '/admin/claims', icon: '🛡️' },
    { id: 'webhooks', label: 'Webhook Testing', href: '/admin/webhooks', icon: '🔗' },
    { id: 'email-test', label: 'Email Testing', href: '/admin/emails/test', icon: '📧' },
    { id: 'system-health', label: 'System Health', href: '/admin/system-health', icon: '🏥' },
    { id: 'integration-tests', label: 'Integration Tests', href: '/admin/integration-tests', icon: '🧪' },
    { id: 'e2e-testing', label: 'E2E Testing', href: '/admin/e2e-testing', icon: '🔬' },
    { id: 'security', label: 'Security Dashboard', href: '/admin/security', icon: '🔒' },
    { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: '📈' },
    { id: 'settings', label: 'System Settings', href: '/admin/settings', icon: '⚙️' }
  ];

  // Check admin status on mount
  onMount(async () => {
    try {
      if (!$authStore.user) {
        notifications.add({
          type: 'error',
          message: 'Please log in to access admin features.',
          timeout: 5000
        });
        goto('/auth/login?redirectTo=/admin');
        return;
      }

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

  // Get current page for navigation highlighting
  $: currentPath = $page.url.pathname;
  $: activeNavItem = adminNavItems.find(item => 
    currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href))
  )?.id || 'dashboard';
</script>

<svelte:head>
  <title>Admin Panel - GearGrab</title>
</svelte:head>

{#if loading}
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
      <p class="text-white">Checking admin privileges...</p>
    </div>
  </div>
{:else if isAdmin}
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
    <!-- Admin Header -->
    <header class="bg-black/20 backdrop-blur-md border-b border-yellow-500/20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-yellow-400">⚡ Admin Panel</h1>
            <span class="text-gray-400">|</span>
            <span class="text-white">{activeNavItem ? adminNavItems.find(item => item.id === activeNavItem)?.label : 'Dashboard'}</span>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-gray-300">Welcome, {$authStore.user?.displayName || $authStore.user?.email}</span>
            <a href="/dashboard" class="text-gray-400 hover:text-white transition-colors">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Admin Sidebar -->
      <nav class="w-64 bg-black/30 backdrop-blur-md min-h-screen border-r border-yellow-500/20">
        <div class="p-4">
          <ul class="space-y-2">
            {#each adminNavItems as item}
              <li>
                <a
                  href={item.href}
                  class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors {
                    activeNavItem === item.id
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }"
                >
                  <span class="text-lg">{item.icon}</span>
                  <span class="font-medium">{item.label}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </nav>

      <!-- Admin Content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-white mb-4">Access Denied</h2>
      <p class="text-gray-400 mb-6">You don't have admin privileges to access this area.</p>
      <a href="/dashboard" class="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors">
        Return to Dashboard
      </a>
    </div>
  </div>
{/if}
