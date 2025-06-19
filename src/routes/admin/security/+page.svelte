<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { isCurrentUserAdmin } from '$lib/firebase/auth';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let loading = true;
  let isAdmin = false;
  let securityData: any = null;
  let refreshing = false;

  onMount(async () => {
    try {
      if (!$authStore.user) {
          goto("/auth/login?redirectTo=/admin/security");
        return;
      }

      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        goto('/dashboard');
        return;
      }

      await loadSecurityData();
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      goto('/dashboard');
    } finally {
      loading = false;
    }
  });

  async function loadSecurityData() {
    try {
      const response = await fetch('/api/admin/security/dashboard');
      const result = await response.json();

      if (response.ok) {
        securityData = result;
      } else {
        notifications.add({
          type: 'error',
          message: `Failed to load security data: ${result.error}`,
          timeout: 5000
        });
      }
    } catch (error) {
      console.error('Error loading security data:', error);
      notifications.add({
        type: 'error',
        message: 'Failed to load security data',
        timeout: 5000
      });
    }
  }

  async function refreshData() {
    if (refreshing) return;
    refreshing = true;
    await loadSecurityData();
    refreshing = false;
  }

  function getSeverityClass(severity: string) {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  function getRiskScoreClass(score: number) {
    if (score >= 8) return 'text-red-400';
    if (score >= 6) return 'text-orange-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-green-400';
  }

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString();
  }
</script>

<svelte:head>
  <title>Security Dashboard | Admin | GearGrab</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 pt-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    {#if loading}
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    {:else}
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Security Dashboard</h1>
            <p class="text-gray-300">Monitor security events and system threats</p>
          </div>
          
          <button
            on:click="{refreshData}"
            disabled="{refreshing}"
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            {#if refreshing}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Refreshing...
            {:else}
              🔄 Refresh
            {/if}
          </button>
        </div>
      </div>

      {#if securityData}
        <!-- Security Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div class="flex items-center">
              <div class="text-3xl mr-4">🛡️</div>
              <div>
                <p class="text-gray-300 text-sm">Security Events (24h)</p>
                <p class="text-2xl font-bold text-white">{securityData.overview?.totalEvents || 0}</p>
              </div>
            </div>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div class="flex items-center">
              <div class="text-3xl mr-4">⚠️</div>
              <div>
                <p class="text-gray-300 text-sm">High Risk Events</p>
                <p class="text-2xl font-bold text-red-400">{securityData.overview?.highRiskEvents || 0}</p>
              </div>
            </div>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div class="flex items-center">
              <div class="text-3xl mr-4">🚫</div>
              <div>
                <p class="text-gray-300 text-sm">Blocked IPs</p>
                <p class="text-2xl font-bold text-orange-400">{securityData.overview?.blockedIPs || 0}</p>
              </div>
            </div>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <div class="flex items-center">
              <div class="text-3xl mr-4">👥</div>
              <div>
                <p class="text-gray-300 text-sm">Active Sessions</p>
                <p class="text-2xl font-bold text-green-400">{securityData.overview?.activeSessions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Security Events -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <h2 class="text-xl font-bold text-white mb-4">Recent Security Events</h2>
          
          {#if securityData.recentEvents?.length > 0}
            <div class="space-y-4">
              {#each securityData.recentEvents as event}
                <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-3">
                      <span class="px-2 py-1 rounded-full text-xs border {getSeverityClass(event.severity)}">
                        {event.severity?.toUpperCase()}
                      </span>
                      <span class="text-white font-medium">{event.type}</span>
                      {#if event.riskScore}
                        <span class="text-sm {getRiskScoreClass(event.riskScore)}">
                          Risk: {event.riskScore}/10
                        </span>
                      {/if}
                    </div>
                    <span class="text-gray-400 text-sm">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {#if event.userId}
                      <div>
                        <span class="text-gray-400">User ID:</span>
                        <span class="text-white ml-2 font-mono">{event.userId}</span>
                      </div>
                    {/if}
                    {#if event.ip}
                      <div>
                        <span class="text-gray-400">IP Address:</span>
                        <span class="text-white ml-2 font-mono">{event.ip}</span>
                      </div>
                    {/if}
                    {#if event.path}
                      <div>
                        <span class="text-gray-400">Path:</span>
                        <span class="text-white ml-2">{event.path}</span>
                      </div>
                    {/if}
                  </div>
                  
                  {#if event.details}
                    <div class="mt-2">
                      <details class="text-sm">
                        <summary class="text-gray-400 cursor-pointer hover:text-white">View Details</summary>
                        <pre class="mt-2 p-2 bg-black/20 rounded text-xs text-gray-300 overflow-auto">{JSON.stringify(event.details, null, 2)}</pre>
                      </details>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-gray-400">No recent security events</p>
          {/if}
        </div>

        <!-- Suspicious Activity -->
        {#if securityData.suspiciousActivity}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Suspicious IPs -->
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <h3 class="text-lg font-bold text-white mb-4">Suspicious IP Addresses</h3>
              
              {#if securityData.suspiciousActivity.suspiciousIPs?.length > 0}
                <div class="space-y-2">
                  {#each securityData.suspiciousActivity.suspiciousIPs as ip}
                    <div class="flex items-center justify-between bg-white/5 rounded p-2">
                      <span class="text-white font-mono">{ip}</span>
                      <button class="text-red-400 hover:text-red-300 text-sm">Block</button>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-gray-400">No suspicious IPs detected</p>
              {/if}
            </div>

            <!-- Failed Login Attempts -->
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <h3 class="text-lg font-bold text-white mb-4">Repeated Failed Attempts</h3>
              
              {#if securityData.suspiciousActivity.repeatedFailures?.length > 0}
                <div class="space-y-2">
                  {#each securityData.suspiciousActivity.repeatedFailures as failure}
                    <div class="flex items-center justify-between bg-white/5 rounded p-2">
                      <span class="text-white font-mono">{failure.userId}</span>
                      <span class="text-red-400">{failure.count} attempts</span>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-gray-400">No repeated failures detected</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Active Sessions -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <h2 class="text-xl font-bold text-white mb-4">Active User Sessions</h2>
          
          {#if securityData.activeSessions?.length > 0}
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-white/20">
                    <th class="text-left text-gray-300 py-2">User</th>
                    <th class="text-left text-gray-300 py-2">IP Address</th>
                    <th class="text-left text-gray-300 py-2">Device</th>
                    <th class="text-left text-gray-300 py-2">Last Activity</th>
                    <th class="text-left text-gray-300 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each securityData.activeSessions as session}
                    <tr class="border-b border-white/10">
                      <td class="py-2 text-white">{session.email}</td>
                      <td class="py-2 text-white font-mono">{session.ip}</td>
                      <td class="py-2 text-gray-300">{session.deviceInfo || 'Unknown'}</td>
                      <td class="py-2 text-gray-300">{formatTimestamp(session.lastActivity)}</td>
                      <td class="py-2">
                        <button class="text-red-400 hover:text-red-300 text-sm">Terminate</button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="text-gray-400">No active sessions</p>
          {/if}
        </div>

        <!-- Security Recommendations -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h2 class="text-xl font-bold text-white mb-4">Security Recommendations</h2>
          
          <div class="space-y-3">
            <div class="flex items-start space-x-3">
              <div class="text-yellow-400 mt-1">⚠️</div>
              <div>
                <p class="text-white font-medium">Enable Two-Factor Authentication</p>
                <p class="text-gray-300 text-sm">Require 2FA for all admin accounts to enhance security</p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="text-blue-400 mt-1">🔍</div>
              <div>
                <p class="text-white font-medium">Regular Security Audits</p>
                <p class="text-gray-300 text-sm">Schedule monthly security audits and penetration testing</p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="text-green-400 mt-1">🛡️</div>
              <div>
                <p class="text-white font-medium">Update Security Rules</p>
                <p class="text-gray-300 text-sm">Review and update Firebase security rules quarterly</p>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <p class="text-gray-400">Failed to load security data</p>
        </div>
      {/if}
    {/if}
  </div>
</div>
