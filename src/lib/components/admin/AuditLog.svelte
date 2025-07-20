<script lang="ts">
  import { onMount } from 'svelte';
  import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    type DocumentData
  } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import type { AdminAction } from '$lib/services/admin.service';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  // State
  let auditLogs: AdminAction[] = [];
  let isLoading = true;
  let error = '';
  let selectedLog: AdminAction | null = null;
  let showLogModal = false;

  onMount(async () => {
    await loadAuditLogs();
  });

  async function loadAuditLogs() {
    if (!db) {
      error = 'Database not initialized';
      isLoading = false;
      return;
    }

    try {
      isLoading = true;
      error = '';

      const logsRef = collection(db, 'adminActions');
      const q = query(logsRef, orderBy('createdAt', 'desc'), limit(100));
      
      const snapshot = await getDocs(q);
      auditLogs = [];

      snapshot.forEach((doc: any) => {
        auditLogs.push({
          id: doc.id,
          ...doc.data()
        } as AdminAction);
      });

    } catch (err) {
      console.error('Error loading audit logs:', err);
      error = err instanceof Error ? err.message : 'Failed to load audit logs';
    } finally {
      isLoading = false;
    }
  }

  function viewLogDetails(log: AdminAction) {
    selectedLog = log;
    showLogModal = true;
  }

  function closeLogModal() {
    selectedLog = null;
    showLogModal = false;
  }

  function getActionColor(action: string): string {
    if (action.includes('ban') || action.includes('remove')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('approve') || action.includes('resolve')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('reject') || action.includes('flag')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  }

  function getActionIcon(action: string): string {
    if (action.includes('ban')) {
      return 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728';
    }
    if (action.includes('remove')) {
      return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16';
    }
    if (action.includes('approve')) {
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    if (action.includes('resolve')) {
      return 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';
    }
    return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function formatActionName(action: string): string {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">Audit Log</h3>
      <p class="text-sm text-gray-600">Track all administrative actions and decisions</p>
    </div>
    <button
      on:click={loadAuditLogs}
      class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      disabled={isLoading}
    >
      <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Refresh
    </button>
  </div>

  <!-- Content -->
  {#if isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error loading audit logs</h3>
          <p class="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    </div>

  {:else if auditLogs.length === 0}
    <div class="text-center py-12">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No audit logs</h3>
      <p class="text-gray-600">No administrative actions have been logged yet</p>
    </div>

  {:else}
    <!-- Audit Log List -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="divide-y divide-gray-200">
        {#each auditLogs as log}
          <div class="p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-start space-x-3">
              <!-- Action Icon -->
              <div class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center {getActionColor(log.action)}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getActionIcon(log.action)} />
                </svg>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <h4 class="font-medium text-gray-900">{formatActionName(log.action)}</h4>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getActionColor(log.action)}">
                      {log.targetType}
                    </span>
                  </div>
                  <button
                    on:click={() => viewLogDetails(log)}
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>
                </div>

                <div class="mt-1 text-sm text-gray-600">
                  <p>
                    <span class="font-medium">{log.adminName}</span>
                    performed action on {log.targetType} 
                    <span class="font-mono text-xs bg-gray-100 px-1 rounded">{log.targetId}</span>
                  </p>
                  {#if log.reason}
                    <p class="mt-1 text-gray-500">Reason: {log.reason}</p>
                  {/if}
                </div>

                <div class="mt-2 text-xs text-gray-500">
                  {formatDate(log.createdAt)}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Log Details Modal -->
{#if showLogModal && selectedLog}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Audit Log Details</h3>
          <button
            on:click={closeLogModal}
            class="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="block text-sm font-medium text-gray-700">Action</span>
              <p class="mt-1 text-sm text-gray-900">{formatActionName(selectedLog.action)}</p>
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700">Target Type</span>
              <p class="mt-1 text-sm text-gray-900">{selectedLog.targetType}</p>
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700">Target ID</span>
              <p class="mt-1 text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{selectedLog.targetId}</p>
            </div>
            <div>
              <span class="block text-sm font-medium text-gray-700">Timestamp</span>
              <p class="mt-1 text-sm text-gray-900">{formatDate(selectedLog.createdAt)}</p>
            </div>
          </div>

          <!-- Admin Info -->
          <div>
            <span class="block text-sm font-medium text-gray-700">Administrator</span>
            <div class="mt-1 text-sm text-gray-900">
              <p><span class="font-medium">{selectedLog.adminName}</span></p>
              <p class="text-gray-600 font-mono text-xs">{selectedLog.adminId}</p>
            </div>
          </div>

          <!-- Reason -->
          {#if selectedLog.reason}
            <div>
              <span class="block text-sm font-medium text-gray-700">Reason</span>
              <p class="mt-1 text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{selectedLog.reason}</p>
            </div>
          {/if}

          <!-- Details -->
          {#if selectedLog.details && Object.keys(selectedLog.details).length > 0}
            <div>
              <span class="block text-sm font-medium text-gray-700">Additional Details</span>
              <div class="mt-1 bg-gray-50 rounded-lg p-3">
                <pre class="text-xs text-gray-900 whitespace-pre-wrap">{JSON.stringify(selectedLog.details, null, 2)}</pre>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
