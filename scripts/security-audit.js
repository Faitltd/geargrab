#!/usr/bin/env node

/**
 * Security Audit Script for GearGrab
 * 
 * This script performs comprehensive security checks:
 * - Environment variable security
 * - Authentication flow validation
 * - API endpoint security
 * - Data access controls
 * - Payment security measures
 * - File upload security
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

class SecurityAudit {
  constructor() {
    this.findings = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };
  }

  async runSecurityAudit() {
    console.log('🔒 Starting Security Audit for GearGrab\n');

    try {
      await this.auditEnvironmentSecurity();
      await this.auditAuthenticationSecurity();
      await this.auditAPIEndpointSecurity();
      await this.auditDataAccessControls();
      await this.auditPaymentSecurity();
      await this.auditFileUploadSecurity();
      await this.auditWebhookSecurity();

      this.generateSecurityReport();

    } catch (error) {
      console.error('❌ Security audit failed:', error);
      process.exit(1);
    }
  }

  async auditEnvironmentSecurity() {
    console.log('🔐 Auditing Environment Security...');

    // Check for exposed secrets
    const sensitivePatterns = [
      { pattern: /sk_live_/, name: 'Stripe Live Secret Key', severity: 'critical' },
      { pattern: /sk_test_/, name: 'Stripe Test Secret Key', severity: 'medium' },
      { pattern: /AIza[0-9A-Za-z\\-_]{35}/, name: 'Google API Key', severity: 'high' },
      { pattern: /[0-9a-f]{32}/, name: 'Potential API Key', severity: 'medium' }
    ];

    // Check environment files
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { pattern, name, severity } of sensitivePatterns) {
          if (pattern.test(content)) {
            this.addFinding(severity, `${name} found in ${file}`, 
              'Ensure sensitive keys are properly secured and not committed to version control');
          }
        }
      }
    }

    // Check for default/weak values
    const criticalEnvVars = [
      'FIREBASE_ADMIN_PRIVATE_KEY',
      'STRIPE_SECRET_KEY',
      'CHECKR_API_KEY',
      'RESEND_API_KEY'
    ];

    for (const envVar of criticalEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        this.addFinding('critical', `${envVar} not set`, 'Critical environment variable missing');
      } else if (value.includes('test_') || value.includes('demo_') || value.includes('your_')) {
        this.addFinding('high', `${envVar} appears to be a placeholder`, 'Replace with production values');
      }
    }
  }

  async auditAuthenticationSecurity() {
    console.log('🔑 Auditing Authentication Security...');

    try {
      // Test unauthenticated access to protected routes
      const protectedRoutes = [
        '/admin',
        '/dashboard',
        '/api/admin/users',
        '/api/admin/system'
      ];

      for (const route of protectedRoutes) {
        try {
          const response = await fetch(`${BASE_URL}${route}`);
          
          if (response.status === 200) {
            this.addFinding('critical', `Protected route ${route} accessible without authentication`,
              'Implement proper authentication middleware');
          } else if (response.status === 401 || response.status === 403) {
            this.addFinding('info', `Protected route ${route} properly secured`);
          }
        } catch (error) {
          // Route might not exist, which is fine
        }
      }

      // Check for secure session handling
      const authResponse = await fetch(`${BASE_URL}/api/auth/status`);
      const headers = authResponse.headers;
      
      if (!headers.get('set-cookie')?.includes('Secure')) {
        this.addFinding('medium', 'Authentication cookies not marked as Secure',
          'Add Secure flag to authentication cookies in production');
      }

      if (!headers.get('set-cookie')?.includes('HttpOnly')) {
        this.addFinding('medium', 'Authentication cookies not marked as HttpOnly',
          'Add HttpOnly flag to authentication cookies');
      }

    } catch (error) {
      this.addFinding('medium', 'Authentication security audit incomplete',
        'Unable to fully test authentication security');
    }
  }

  async auditAPIEndpointSecurity() {
    console.log('🌐 Auditing API Endpoint Security...');

    // Test for common vulnerabilities
    const testCases = [
      {
        name: 'SQL Injection',
        endpoint: '/api/search',
        payload: { query: "'; DROP TABLE users; --" },
        severity: 'critical'
      },
      {
        name: 'XSS Prevention',
        endpoint: '/api/listings',
        payload: { title: '<script>alert("xss")</script>' },
        severity: 'high'
      },
      {
        name: 'Path Traversal',
        endpoint: '/api/files',
        payload: { path: '../../../etc/passwd' },
        severity: 'high'
      }
    ];

    for (const test of testCases) {
      try {
        const response = await fetch(`${BASE_URL}${test.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.payload)
        });

        // Check if dangerous payload was processed
        const responseText = await response.text();
        
        if (responseText.includes(test.payload.query) || 
            responseText.includes(test.payload.title) ||
            responseText.includes('root:')) {
          this.addFinding(test.severity, `Potential ${test.name} vulnerability`,
            `Endpoint ${test.endpoint} may be vulnerable to ${test.name}`);
        }

      } catch (error) {
        // Endpoint might not exist or be properly protected
      }
    }

    // Check for proper CORS configuration
    try {
      const corsResponse = await fetch(`${BASE_URL}/api/health/system`, {
        headers: { 'Origin': 'https://malicious-site.com' }
      });

      const corsHeader = corsResponse.headers.get('access-control-allow-origin');
      if (corsHeader === '*') {
        this.addFinding('medium', 'Overly permissive CORS policy',
          'Restrict CORS to specific trusted domains');
      }
    } catch (error) {
      // CORS test failed, which might be good
    }
  }

  async auditDataAccessControls() {
    console.log('🗄️ Auditing Data Access Controls...');

    // Check Firebase security rules (if accessible)
    try {
      const rulesResponse = await fetch(`${BASE_URL}/api/admin/firebase-rules`);
      
      if (rulesResponse.ok) {
        const rules = await rulesResponse.json();
        
        // Check for overly permissive rules
        const rulesText = JSON.stringify(rules);
        if (rulesText.includes('allow read, write: if true')) {
          this.addFinding('critical', 'Overly permissive Firebase security rules',
            'Implement proper row-level security rules');
        }
      }
    } catch (error) {
      this.addFinding('info', 'Firebase security rules not accessible for audit');
    }

    // Test user data isolation
    try {
      const testUserId = 'test-user-123';
      const otherUserId = 'other-user-456';

      // Try to access other user's data
      const response = await fetch(`${BASE_URL}/api/users/${otherUserId}/profile`, {
        headers: { 'Authorization': `Bearer fake-token-for-${testUserId}` }
      });

      if (response.status === 200) {
        this.addFinding('critical', 'User data isolation failure',
          'Users can access other users\' data');
      } else if (response.status === 401 || response.status === 403) {
        this.addFinding('info', 'User data properly isolated');
      }

    } catch (error) {
      // Test endpoint might not exist
    }
  }

  async auditPaymentSecurity() {
    console.log('💳 Auditing Payment Security...');

    // Check for PCI compliance measures
    const pciChecks = [
      {
        name: 'Stripe integration',
        check: () => process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('test_'),
        severity: 'high',
        message: 'Using production Stripe keys'
      },
      {
        name: 'Webhook signature verification',
        check: () => process.env.STRIPE_WEBHOOK_SECRET,
        severity: 'critical',
        message: 'Stripe webhook signature verification configured'
      }
    ];

    for (const { name, check, severity, message } of pciChecks) {
      if (check()) {
        this.addFinding('info', `${name}: ${message}`);
      } else {
        this.addFinding(severity, `${name}: Missing security measure`, message);
      }
    }

    // Test payment endpoint security
    try {
      const paymentResponse = await fetch(`${BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: -1000 }) // Negative amount
      });

      if (paymentResponse.ok) {
        this.addFinding('high', 'Payment validation insufficient',
          'Payment endpoints accept invalid amounts');
      }
    } catch (error) {
      // Payment endpoint might be properly protected
    }
  }

  async auditFileUploadSecurity() {
    console.log('📁 Auditing File Upload Security...');

    // Test file upload restrictions
    const maliciousFiles = [
      { name: 'test.php', content: '<?php echo "malicious"; ?>', type: 'application/x-php' },
      { name: 'test.exe', content: 'MZ...', type: 'application/x-msdownload' },
      { name: '../../../etc/passwd', content: 'root:x:0:0:', type: 'text/plain' }
    ];

    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        formData.append('file', new Blob([file.content], { type: file.type }), file.name);

        const uploadResponse = await fetch(`${BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          this.addFinding('high', `Malicious file upload accepted: ${file.name}`,
            'Implement proper file type and content validation');
        }

      } catch (error) {
        // Upload endpoint might not exist or be properly protected
      }
    }
  }

  async auditWebhookSecurity() {
    console.log('🔗 Auditing Webhook Security...');

    // Test webhook signature verification
    const webhookEndpoints = [
      '/api/webhooks/stripe',
      '/api/webhooks/background-check'
    ];

    for (const endpoint of webhookEndpoints) {
      try {
        // Test without signature
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        });

        if (response.ok) {
          this.addFinding('critical', `Webhook endpoint ${endpoint} accepts unsigned requests`,
            'Implement proper webhook signature verification');
        } else if (response.status === 401 || response.status === 403) {
          this.addFinding('info', `Webhook endpoint ${endpoint} properly secured`);
        }

      } catch (error) {
        // Webhook endpoint might not exist
      }
    }
  }

  addFinding(severity, title, description = '') {
    const finding = {
      severity,
      title,
      description,
      timestamp: new Date().toISOString()
    };

    this.findings[severity].push(finding);

    const icon = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: '💡',
      info: 'ℹ️'
    }[severity];

    console.log(`  ${icon} [${severity.toUpperCase()}] ${title}`);
    if (description) {
      console.log(`    ${description}`);
    }
  }

  generateSecurityReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY AUDIT REPORT');
    console.log('='.repeat(60));

    const totalFindings = Object.values(this.findings).reduce((sum, arr) => sum + arr.length, 0);

    console.log(`🚨 Critical: ${this.findings.critical.length}`);
    console.log(`⚠️  High: ${this.findings.high.length}`);
    console.log(`⚡ Medium: ${this.findings.medium.length}`);
    console.log(`💡 Low: ${this.findings.low.length}`);
    console.log(`ℹ️  Info: ${this.findings.info.length}`);
    console.log(`📝 Total Findings: ${totalFindings}`);

    if (this.findings.critical.length === 0 && this.findings.high.length === 0) {
      console.log('\n✅ No critical or high-severity security issues found!');
    } else {
      console.log('\n🚨 Critical and high-severity issues must be resolved before production deployment.');
    }

    // Save detailed report
    const reportFile = path.join(process.cwd(), 'security-audit-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(this.findings, null, 2));
    console.log(`\n📄 Detailed security report saved to: ${reportFile}`);

    // Exit with error code if critical issues found
    if (this.findings.critical.length > 0) {
      process.exit(1);
    }
  }
}

// Run the security audit
const auditor = new SecurityAudit();
auditor.runSecurityAudit().catch(console.error);
