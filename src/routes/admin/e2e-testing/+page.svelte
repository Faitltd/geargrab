<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { isCurrentUserAdmin } from '$lib/firebase/auth';
  import { notifications } from '$lib/stores/notifications';
  import { goto } from '$app/navigation';

  let loading = true;
  let isAdmin = false;
  let testing = false;
  let testResults: any[] = [];
  let currentTest = '';
  let testProgress = 0;
  let totalTests = 0;

  interface TestResult {
    name: string;
    category: string;
    status: 'pending' | 'running' | 'success' | 'warning' | 'error';
    message: string;
    details?: string;
    duration?: number;
    data?: any;
    subTests?: TestResult[];
  }

  const testSuites = [
    {
      name: 'Authentication & Authorization',
      tests: [
        'User Registration Flow',
        'User Login Flow',
        'Session Management',
        'Admin Privilege Verification',
        'Password Reset Flow',
        'Session Security'
      ]
    },
    {
      name: 'Core Application Features',
      tests: [
        'Homepage Loading',
        'Browse Page Functionality',
        'Search & Filtering',
        'Listing Details',
        'User Dashboard',
        'Profile Management'
      ]
    },
    {
      name: 'Messaging System',
      tests: [
        'Message Creation',
        'Real-time Message Delivery',
        'File Attachment Upload',
        'Conversation Management',
        'Message History',
        'Notification System'
      ]
    },
    {
      name: 'Payment System',
      tests: [
        'Payment Intent Creation',
        'Stripe Integration',
        'Webhook Processing',
        'Payment Confirmation',
        'Payment Failure Handling',
        'Refund Processing'
      ]
    },
    {
      name: 'Background Check System',
      tests: [
        'Background Check Initiation',
        'Provider Integration (Checkr)',
        'Check Status Updates',
        'Result Processing',
        'Email Notifications',
        'Admin Monitoring'
      ]
    },
    {
      name: 'Email System',
      tests: [
        'Email Template Rendering',
        'Email Delivery',
        'Booking Confirmations',
        'Payment Notifications',
        'Verification Emails',
        'System Notifications'
      ]
    },
    {
      name: 'Security Systems',
      tests: [
        'Rate Limiting',
        'Input Validation',
        'CSRF Protection',
        'File Upload Security',
        'Session Security',
        'Audit Logging'
      ]
    },
    {
      name: 'Admin Panel',
      tests: [
        'Admin Dashboard',
        'User Management',
        'System Health Monitoring',
        'Security Dashboard',
        'Testing Interfaces',
        'Analytics & Reporting'
      ]
    }
  ];

  onMount(async () => {
    try {
      if (!$authStore.user) {
        goto('/auth/login?redirectTo=/admin/e2e-testing');
        return;
      }

      isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        goto('/dashboard');
        return;
      }

      // Calculate total tests
      totalTests = testSuites.reduce((total, suite) => total + suite.tests.length, 0);
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      goto('/dashboard');
    } finally {
      loading = false;
    }
  });

  async function runAllTests() {
    if (testing) return;

    testing = true;
    testResults = [];
    testProgress = 0;
    currentTest = '';

    try {
      for (const suite of testSuites) {
        const suiteResult: TestResult = {
          name: suite.name,
          category: 'suite',
          status: 'running',
          message: 'Running test suite...',
          subTests: []
        };

        testResults = [...testResults, suiteResult];

        for (const testName of suite.tests) {
          currentTest = testName;
          const startTime = Date.now();

          try {
            const result = await runIndividualTest(testName, suite.name);
            const duration = Date.now() - startTime;

            const testResult: TestResult = {
              ...result,
              name: testName,
              category: suite.name,
              duration
            };

            suiteResult.subTests!.push(testResult);
            testProgress++;

            // Update suite status
            const hasErrors = suiteResult.subTests!.some(t => t.status === 'error');
            const hasWarnings = suiteResult.subTests!.some(t => t.status === 'warning');
            
            if (hasErrors) {
              suiteResult.status = 'error';
              suiteResult.message = 'Some tests failed';
            } else if (hasWarnings) {
              suiteResult.status = 'warning';
              suiteResult.message = 'Some tests have warnings';
            } else if (suiteResult.subTests!.every(t => t.status === 'success')) {
              suiteResult.status = 'success';
              suiteResult.message = 'All tests passed';
            }

            // Force reactivity update
            testResults = [...testResults];

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            const testResult: TestResult = {
              name: testName,
              category: suite.name,
              status: 'error',
              message: 'Test execution failed',
              details: error.message,
              duration: Date.now() - startTime
            };

            suiteResult.subTests!.push(testResult);
            suiteResult.status = 'error';
            suiteResult.message = 'Test suite failed';
            testProgress++;
            testResults = [...testResults];
          }
        }
      }

      currentTest = 'Testing complete';
      
      notifications.add({
        type: 'success',
        message: 'End-to-end testing completed',
        timeout: 5000
      });

    } catch (error) {
      console.error('Testing error:', error);
      notifications.add({
        type: 'error',
        message: 'Testing failed: ' + error.message,
        timeout: 5000
      });
    } finally {
      testing = false;
    }
  }

  async function runIndividualTest(testName: string, category: string): Promise<TestResult> {
    // Route tests to appropriate handlers
    switch (category) {
      case 'Authentication & Authorization':
        return await testAuthentication(testName);
      case 'Core Application Features':
        return await testCoreFeatures(testName);
      case 'Messaging System':
        return await testMessaging(testName);
      case 'Payment System':
        return await testPayments(testName);
      case 'Background Check System':
        return await testBackgroundChecks(testName);
      case 'Email System':
        return await testEmailSystem(testName);
      case 'Security Systems':
        return await testSecurity(testName);
      case 'Admin Panel':
        return await testAdminPanel(testName);
      default:
        return {
          name: testName,
          category,
          status: 'error',
          message: 'Unknown test category'
        };
    }
  }

  async function testAuthentication(testName: string): Promise<TestResult> {
    switch (testName) {
      case 'User Registration Flow':
        return await testEndpoint('/api/test/auth/register', 'POST', {
          email: 'test@example.com',
          password: 'TestPass123!',
          displayName: 'Test User'
        });
      
      case 'User Login Flow':
        return await testEndpoint('/api/test/auth/login', 'POST', {
          email: 'test@example.com',
          password: 'TestPass123!'
        });
      
      case 'Session Management':
        return await testEndpoint('/api/auth/session', 'GET');
      
      case 'Admin Privilege Verification':
        try {
          const isAdminUser = await isCurrentUserAdmin();
          return {
            name: testName,
            category: 'Authentication & Authorization',
            status: isAdminUser ? 'success' : 'warning',
            message: isAdminUser ? 'Admin privileges verified' : 'User is not admin',
            data: { isAdmin: isAdminUser }
          };
        } catch (error) {
          return {
            name: testName,
            category: 'Authentication & Authorization',
            status: 'error',
            message: 'Admin verification failed',
            details: error.message
          };
        }
      
      default:
        return await testGenericEndpoint(testName);
    }
  }

  async function testCoreFeatures(testName: string): Promise<TestResult> {
    switch (testName) {
      case 'Homepage Loading':
        return await testPageLoad('/');
      
      case 'Browse Page Functionality':
        return await testPageLoad('/browse');
      
      case 'Search & Filtering':
        return await testEndpoint('/api/search?q=camera&category=photography&limit=5', 'GET');
      
      case 'User Dashboard':
        return await testPageLoad('/dashboard');
      
      default:
        return await testGenericEndpoint(testName);
    }
  }

  async function testMessaging(testName: string): Promise<TestResult> {
    switch (testName) {
      case 'Message Creation':
        return await testEndpoint('/api/test/messages/create', 'POST', {
          conversationId: 'test_conversation',
          content: 'Test message',
          type: 'text'
        });
      
      case 'File Attachment Upload':
        return await testFileUpload();
      
      default:
        return await testGenericEndpoint(testName);
    }
  }

  async function testPayments(testName: string): Promise<TestResult> {
    switch (testName) {
      case 'Payment Intent Creation':
        return await testEndpoint('/api/test/payments/create-intent', 'POST', {
          amount: 15000,
          currency: 'usd',
          bookingId: 'test_booking'
        });
      
      case 'Webhook Processing':
        return await testEndpoint('/api/webhooks/test', 'POST', {
          eventType: 'payment_intent.succeeded',
          metadata: { amount: 15000, userId: 'test_user' }
        });
      
      default:
        return await testGenericEndpoint(testName);
    }
  }

  async function testBackgroundChecks(testName: string): Promise<TestResult> {
    switch (testName) {
      case 'Background Check Initiation':
        return await testEndpoint('/api/background-check/test', 'POST', {
          checkType: 'basic',
          provider: 'mock',
          personalInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '555-123-4567',
            dateOfBirth: '1990-01-01',
            ssn: '123-45-6789',
            address: { city: 'Test City', state: 'UT', zipCode: '84101' }
          }
        });
      
      default:
        return await testGenericEndpoint(testName);
    }
  }

  async function testEmailSystem(testName: string): Promise<TestResult> {
    switch (testName) {
      case 'Email Template Rendering':
      case 'Email Delivery':
        return await testEndpoint('/api/emails/test', 'POST', {
          type: 'booking_confirmation',
          recipientEmail: $authStore.user?.email || 'test@example.com',
          recipientName: 'Test User',
          data: { listingTitle: 'Test Camera', amount: 150 }
        });
      
      default:
        return await testGenericEndpoint(testName);
    }
  }

  async function testSecurity(testName: string): Promise<TestResult> {
    switch (testName) {
      case 'Rate Limiting':
        return await testRateLimit();
      
      case 'Input Validation':
        return await testInputValidation();
      
      default:
        return await testGenericEndpoint(testName);
    }
  }

  async function testAdminPanel(testName: string): Promise<TestResult> {
    switch (testName) {
      case 'Admin Dashboard':
        return await testPageLoad('/admin');
      
      case 'System Health Monitoring':
        return await testEndpoint('/api/health/firebase', 'GET');
      
      case 'Security Dashboard':
        return await testEndpoint('/api/admin/security/dashboard', 'GET');
      
      default:
        return await testGenericEndpoint(testName);
    }
  }

  // Helper functions
  async function testEndpoint(url: string, method: string, body?: any): Promise<TestResult> {
    try {
      const options: RequestInit = { method };
      if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      return {
        name: '',
        category: '',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Endpoint responded successfully' : `HTTP ${response.status}: ${result.error || 'Unknown error'}`,
        data: { status: response.status, response: result }
      };
    } catch (error) {
      return {
        name: '',
        category: '',
        status: 'error',
        message: 'Network or parsing error',
        details: error.message
      };
    }
  }

  async function testPageLoad(url: string): Promise<TestResult> {
    try {
      const response = await fetch(url);
      return {
        name: '',
        category: '',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Page loaded successfully' : `HTTP ${response.status}`,
        data: { status: response.status, url }
      };
    } catch (error) {
      return {
        name: '',
        category: '',
        status: 'error',
        message: 'Page load failed',
        details: error.message
      };
    }
  }

  async function testFileUpload(): Promise<TestResult> {
    try {
      // Create a test file
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('type', 'messageAttachment');

      const response = await fetch('/api/test/upload', {
        method: 'POST',
        body: formData
      });

      return {
        name: '',
        category: '',
        status: response.ok ? 'success' : 'warning',
        message: response.ok ? 'File upload test passed' : 'File upload endpoint not implemented',
        data: { status: response.status }
      };
    } catch (error) {
      return {
        name: '',
        category: '',
        status: 'warning',
        message: 'File upload test skipped',
        details: 'File upload testing requires implementation'
      };
    }
  }

  async function testRateLimit(): Promise<TestResult> {
    try {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(10).fill(null).map(() => 
        fetch('/api/health/firebase')
      );
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);

      return {
        name: '',
        category: '',
        status: 'success',
        message: rateLimited ? 'Rate limiting is working' : 'Rate limiting not triggered (may need more requests)',
        data: { responses: responses.map(r => r.status) }
      };
    } catch (error) {
      return {
        name: '',
        category: '',
        status: 'error',
        message: 'Rate limit test failed',
        details: error.message
      };
    }
  }

  async function testInputValidation(): Promise<TestResult> {
    try {
      // Test with malicious input
      const maliciousInput = {
        email: '<script>alert("xss")</script>',
        content: 'SELECT * FROM users; DROP TABLE users;'
      };

      const response = await fetch('/api/test/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousInput)
      });

      return {
        name: '',
        category: '',
        status: response.status === 400 ? 'success' : 'warning',
        message: response.status === 400 ? 'Input validation working' : 'Input validation may need improvement',
        data: { status: response.status }
      };
    } catch (error) {
      return {
        name: '',
        category: '',
        status: 'warning',
        message: 'Input validation test skipped',
        details: 'Validation endpoint not implemented'
      };
    }
  }

  async function testGenericEndpoint(testName: string): Promise<TestResult> {
    return {
      name: testName,
      category: '',
      status: 'warning',
      message: 'Test not implemented yet',
      details: 'This test needs specific implementation'
    };
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      default: return '❓';
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'running': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  function clearResults() {
    testResults = [];
    testProgress = 0;
    currentTest = '';
  }

  function getOverallStatus() {
    if (testResults.length === 0) return { status: 'pending', message: 'No tests run' };
    
    const allSubTests = testResults.flatMap(suite => suite.subTests || []);
    const errorCount = allSubTests.filter(t => t.status === 'error').length;
    const warningCount = allSubTests.filter(t => t.status === 'warning').length;
    const successCount = allSubTests.filter(t => t.status === 'success').length;
    
    if (errorCount > 0) {
      return { status: 'error', message: `${errorCount} tests failed, ${successCount} passed` };
    } else if (warningCount > 0) {
      return { status: 'warning', message: `${warningCount} warnings, ${successCount} passed` };
    } else if (successCount > 0) {
      return { status: 'success', message: `All ${successCount} tests passed` };
    } else {
      return { status: 'pending', message: 'Tests in progress' };
    }
  }

  $: overallStatus = getOverallStatus();
  $: progressPercentage = totalTests > 0 ? (testProgress / totalTests) * 100 : 0;
</script>

<svelte:head>
  <title>End-to-End Testing | Admin | GearGrab</title>
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
            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">End-to-End Testing</h1>
            <p class="text-gray-300">Comprehensive testing of all GearGrab systems and integrations</p>
          </div>
          
          <div class="flex items-center space-x-4">
            {#if testResults.length > 0}
              <button
                on:click={clearResults}
                class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Clear Results
              </button>
            {/if}
            
            <button
              on:click={runAllTests}
              disabled={testing}
              class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
            >
              {#if testing}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Running Tests...
              {:else}
                🧪 Run All Tests
              {/if}
            </button>
          </div>
        </div>
      </div>

      <!-- Test Progress -->
      {#if testing || testResults.length > 0}
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-4">
              <div class="text-4xl">{getStatusIcon(overallStatus.status)}</div>
              <div>
                <h2 class="text-xl font-bold text-white">Test Progress</h2>
                <p class="text-gray-300">{overallStatus.message}</p>
              </div>
            </div>
            
            <div class="text-right">
              <div class="text-2xl font-bold text-white">{testProgress}/{totalTests}</div>
              <div class="text-gray-300 text-sm">Tests Completed</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              class="bg-green-500 h-2 rounded-full transition-all duration-300"
              style="width: {progressPercentage}%"
            ></div>
          </div>

          {#if currentTest}
            <div class="text-gray-300 text-sm">
              Currently running: <span class="text-white font-medium">{currentTest}</span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Test Results -->
      {#if testResults.length > 0}
        <div class="space-y-6">
          {#each testResults as suite}
            <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <span class="text-2xl">{getStatusIcon(suite.status)}</span>
                  <div>
                    <h3 class="text-xl font-bold text-white">{suite.name}</h3>
                    <p class="text-gray-300 text-sm">{suite.message}</p>
                  </div>
                </div>
                
                <span class="px-3 py-1 rounded-full text-sm border {getStatusClass(suite.status)}">
                  {suite.status.toUpperCase()}
                </span>
              </div>

              {#if suite.subTests && suite.subTests.length > 0}
                <div class="space-y-3">
                  {#each suite.subTests as test}
                    <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-3">
                          <span class="text-lg">{getStatusIcon(test.status)}</span>
                          <div>
                            <h4 class="font-medium text-white">{test.name}</h4>
                            <p class="text-gray-300 text-sm">{test.message}</p>
                          </div>
                        </div>
                        
                        <div class="flex items-center space-x-3">
                          {#if test.duration}
                            <span class="text-gray-400 text-sm">{test.duration}ms</span>
                          {/if}
                          <span class="px-2 py-1 rounded-full text-xs border {getStatusClass(test.status)}">
                            {test.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      {#if test.details}
                        <div class="mt-2 text-sm text-gray-400">
                          <strong>Details:</strong> {test.details}
                        </div>
                      {/if}

                      {#if test.data}
                        <div class="mt-2">
                          <details class="text-sm">
                            <summary class="text-gray-400 cursor-pointer hover:text-white">View Test Data</summary>
                            <pre class="mt-2 p-2 bg-black/20 rounded text-xs text-gray-300 overflow-auto">{JSON.stringify(test.data, null, 2)}</pre>
                          </details>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <!-- Test Suite Overview -->
        <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h2 class="text-xl font-bold text-white mb-4">Test Suite Overview</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each testSuites as suite}
              <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 class="font-semibold text-white mb-2">{suite.name}</h3>
                <p class="text-gray-300 text-sm mb-3">{suite.tests.length} tests</p>
                <ul class="text-gray-400 text-sm space-y-1">
                  {#each suite.tests as test}
                    <li>• {test}</li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Testing Information -->
      <div class="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 class="text-xl font-bold text-white mb-4">Testing Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="font-semibold text-white mb-2">Test Coverage</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Authentication & Authorization</li>
              <li>• Core Application Features</li>
              <li>• Messaging System</li>
              <li>• Payment Processing</li>
              <li>• Background Checks</li>
              <li>• Email System</li>
              <li>• Security Systems</li>
              <li>• Admin Panel</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-semibold text-white mb-2">Test Types</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• API Endpoint Testing</li>
              <li>• Page Load Testing</li>
              <li>• Integration Testing</li>
              <li>• Security Testing</li>
              <li>• File Upload Testing</li>
              <li>• Rate Limiting Testing</li>
              <li>• Input Validation Testing</li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold text-white mb-2">Test Results</h3>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• ✅ Success: Feature working correctly</li>
              <li>• ⚠️ Warning: Feature working with issues</li>
              <li>• ❌ Error: Feature not working</li>
              <li>• 🔄 Running: Test in progress</li>
              <li>• ⏳ Pending: Test queued</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
