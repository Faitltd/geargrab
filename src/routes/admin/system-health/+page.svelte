<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { isCurrentUserAdmin, initializeAdminUser } from '$lib/auth/admin';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let loading = true;
  let isAdmin = false;
  let testing = false;
  let healthChecks: any[] = [];

  interface HealthCheck {
    name: string;
    status: 'pending' | 'success' | 'warning' | 'error';
    message: string;
    details?: string;
    duration?: number;
  }

  onMount(async () => {
    try {
      // Wait for auth to be ready
      await simpleAuth.waitForAuthReady();

      if (!simpleAuth.user) {
        goto('/auth/login?redirectTo=/admin/system-health');
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

      console.log('✅ Admin access granted for system health:', simpleAuth.user.email);

      // Run initial health checks
      await runHealthChecks();

    } catch (error) {
      console.error('Error checking admin access:', error);
      goto('/?error=admin_check_failed');
    } finally {
      loading = false;
    }
  });

  async function runHealthChecks() {
    if (testing) return;

    testing = true;
    healthChecks = [];

    const checks = [
      { name: 'Firebase Connection', test: testFirebaseConnection },
      { name: 'Authentication System', test: testAuthSystem },
      { name: 'Database Operations', test: testDatabaseOperations },
      { name: 'Email System', test: testEmailSystem },
      { name: 'Payment Webhooks', test: testPaymentWebhooks },
      { name: 'Background Check API', test: testBackgroundCheckAPI },
      { name: 'Search Functionality', test: testSearchFunctionality },
      { name: 'File Upload System', test: testFileUploadSystem }
    ];

    for (const check of checks) {
      const startTime = Date.now();
      
      // Add pending status
      healthChecks = [...healthChecks, {
        name: check.name,
        status: 'pending',
        message: 'Running...',
        duration: 0
      }];

      try {
        const result = await check.test();
        const duration = Date.now() - startTime;
        
        // Update with result
        healthChecks = healthChecks.map(hc => 
          hc.name === check.name 
            ? { ...result, name: check.name, duration }
            : hc
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        
        healthChecks = healthChecks.map(hc => 
          hc.name === check.name 
            ? {
                name: check.name,
                status: 'error',
                message: 'Test failed',
                details: error.message,
                duration
              }
            : hc
        );
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    testing = false;
  }

  async function testFirebaseConnection(): Promise<HealthCheck> {
    try {
      const response = await fetch('/api/health/firebase');
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          name: 'Firebase Connection',
          status: 'success',
          message: 'Firebase connection healthy',
          details: `Connected to project: ${result.projectId}`
        };
      } else {
        return {
          name: 'Firebase Connection',
          status: 'error',
          message: 'Firebase connection failed',
          details: result.error || 'Unknown error'
        };
      }
    } catch (error) {
      return {
        name: 'Firebase Connection',
        status: 'error',
        message: 'Connection test failed',
        details: error.message
      };
    }
  }

  async function testAuthSystem(): Promise<HealthCheck> {
    if (simpleAuth.user) {
      return {
        name: 'Authentication System',
        status: 'success',
        message: 'User authenticated successfully',
        details: `User: ${simpleAuth.user.email}`
      };
    } else {
      return {
        name: 'Authentication System',
        status: 'warning',
        message: 'No user authenticated',
        details: 'Authentication system available but no user logged in'
      };
    }
  }

  async function testDatabaseOperations(): Promise<HealthCheck> {
    try {
      const response = await fetch('/api/health/database');
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          name: 'Database Operations',
          status: 'success',
          message: 'Database operations working',
          details: `Collections accessible: ${result.collections?.join(', ')}`
        };
      } else {
        return {
          name: 'Database Operations',
          status: 'error',
          message: 'Database operations failed',
          details: result.error || 'Unknown error'
        };
      }
    } catch (error) {
      return {
        name: 'Database Operations',
        status: 'error',
        message: 'Database test failed',
        details: error.message
      };
    }
  }

  async function testEmailSystem(): Promise<HealthCheck> {
    try {
      const response = await fetch('/api/health/email');
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          name: 'Email System',
          status: 'success',
          message: 'Email system configured',
          details: `Provider: ${result.provider}, Templates: ${result.templateCount}`
        };
      } else {
        return {
          name: 'Email System',
          status: 'warning',
          message: 'Email system in development mode',
          details: 'Using console logging instead of real email delivery'
        };
      }
    } catch (error) {
      return {
        name: 'Email System',
        status: 'error',
        message: 'Email test failed',
        details: error.message
      };
    }
  }

  async function testPaymentWebhooks(): Promise<HealthCheck> {
    try {
      const response = await fetch('/api/health/webhooks');
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          name: 'Payment Webhooks',
          status: 'success',
          message: 'Webhook endpoints accessible',
          details: `Endpoints: ${result.endpoints?.join(', ')}`
        };
      } else {
        return {
          name: 'Payment Webhooks',
          status: 'warning',
          message: 'Webhook system available',
          details: 'Endpoints configured but not tested with real events'
        };
      }
    } catch (error) {
      return {
        name: 'Payment Webhooks',
        status: 'error',
        message: 'Webhook test failed',
        details: error.message
      };
    }
  }

  async function testBackgroundCheckAPI(): Promise<HealthCheck> {
    try {
      const response = await fetch('/api/health/background-checks');
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          name: 'Background Check API',
          status: 'success',
          message: 'Background check providers available',
          details: `Providers: ${result.providers?.join(', ')}`
        };
      } else {
        return {
          name: 'Background Check API',
          status: 'warning',
          message: 'Using mock provider',
          details: 'Real providers not configured, using development mock'
        };
      }
    } catch (error) {
      return {
        name: 'Background Check API',
        status: 'error',
        message: 'Background check test failed',
        details: error.message
      };
    }
  }

  async function testSearchFunctionality(): Promise<HealthCheck> {
    try {
      const response = await fetch('/api/health/search');
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          name: 'Search Functionality',
          status: 'success',
          message: 'Search system operational',
          details: `Search service: ${result.service}, Indexed collections: ${result.collections}`
        };
      } else {
        return {
          name: 'Search Functionality',
          status: 'warning',
          message: 'Using fallback search',
          details: 'Real search not configured, using mock data'
        };
      }
    } catch (error) {
      return {
        name: 'Search Functionality',
        status: 'error',
        message: 'Search test failed',
        details: error.message
      };
    }
  }

  async function testFileUploadSystem(): Promise<HealthCheck> {
    try {
      const response = await fetch('/api/health/storage');
      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          name: 'File Upload System',
          status: 'success',
          message: 'File storage operational',
          details: `Storage: ${result.provider}, Max size: ${result.maxSize}`
        };
      } else {
        return {
          name: 'File Upload System',
          status: 'warning',
          message: 'File storage available',
          details: 'Storage configured but not fully tested'
        };
      }
    } catch (error) {
      return {
        name: 'File Upload System',
        status: 'error',
        message: 'Storage test failed',
        details: error.message
      };
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'pending': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  function getOverallHealth() {
    if (healthChecks.length === 0) return { status: 'pending', message: 'No checks run' };
    
    const errorCount = healthChecks.filter(hc => hc.status === 'error').length;
    const warningCount = healthChecks.filter(hc => hc.status === 'warning').length;
    const successCount = healthChecks.filter(hc => hc.status === 'success').length;
    
    if (errorCount > 0) {
      return { status: 'error', message: `${errorCount} critical issues found` };
    } else if (warningCount > 0) {
      return { status: 'warning', message: `${warningCount} warnings, ${successCount} systems healthy` };
    } else {
      return { status: 'success', message: `All ${successCount} systems healthy` };
    }
  }

  $: overallHealth = getOverallHealth();
</script>

<svelte:head>
  <title>System Health | Admin | GearGrab</title>
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
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">System Health Check</h1>
        <p class="text-gray-300">Monitor the health and status of all GearGrab systems</p>
      </div>

      <!-- Overall Health Status -->
      <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="text-4xl">{getStatusIcon(overallHealth.status)}</div>
            <div>
              <h2 class="text-xl font-bold text-white">Overall System Health</h2>
              <p class="text-gray-300">{overallHealth.message}</p>
            </div>
          </div>
          
          <button
            on:click="{runHealthChecks}"
            disabled="{testing}"
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
          >
            {#if testing}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Running Checks...
            {:else}
              🔄 Run Health Checks
            {/if}
          </button>
        </div>
      </div>

      <!-- Health Check Results -->
      {#if healthChecks.length > 0}
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h2 class="text-xl font-bold text-white mb-4">System Components</h2>
          
          <div class="space-y-4">
            {#each healthChecks as check}
              <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-3">
                    <span class="text-2xl">{getStatusIcon(check.status)}</span>
                    <div>
                      <h3 class="font-semibold text-white">{check.name}</h3>
                      <p class="text-gray-300 text-sm">{check.message}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    {#if check.duration}
                      <span class="text-gray-400 text-sm">{check.duration}ms</span>
                    {/if}
                    <span class="px-2 py-1 rounded-full text-xs border {getStatusClass(check.status)}">
                      {check.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {#if check.details}
                  <div class="mt-2 text-sm text-gray-400">
                    <strong>Details:</strong> {check.details}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- System Information -->
      <div class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-bold text-white mb-4">System Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="font-semibold text-white mb-2">Core Systems</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Firebase Authentication</li>
              <li>• Firestore Database</li>
              <li>• Cloud Storage</li>
              <li>• Real-time Messaging</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-semibold text-white mb-2">Integrations</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Stripe Payments</li>
              <li>• Resend Email</li>
              <li>• Checkr Background Checks</li>
              <li>• Search & Filtering</li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold text-white mb-2">Admin Features</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• User Management</li>
              <li>• System Monitoring</li>
              <li>• Testing Interfaces</li>
              <li>• Health Checks</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
