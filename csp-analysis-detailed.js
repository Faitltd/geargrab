#!/usr/bin/env node

/**
 * Detailed CSP Analysis Script
 * Analyzes Content Security Policy directives in detail
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import { URL } from 'url';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[type];
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        ok: false,
        status: 0,
        statusText: error.message,
        headers: {},
        data: ''
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ok: false,
        status: 0,
        statusText: 'Request timeout',
        headers: {},
        data: ''
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Parse CSP header into structured format
function parseCSP(cspHeader) {
  if (!cspHeader) return null;
  
  const directives = cspHeader.split(';').map(d => d.trim()).filter(d => d);
  const parsed = {};
  
  for (const directive of directives) {
    const [name, ...values] = directive.split(/\s+/);
    parsed[name] = values;
  }
  
  return parsed;
}

// Analyze CSP security
function analyzeCSPSecurity(parsedCSP) {
  const analysis = {
    strengths: [],
    weaknesses: [],
    recommendations: [],
    riskLevel: 'low'
  };
  
  // Check default-src
  if (parsedCSP['default-src']) {
    if (parsedCSP['default-src'].includes("'self'")) {
      analysis.strengths.push("default-src restricts to same origin");
    }
    if (parsedCSP['default-src'].includes('*')) {
      analysis.weaknesses.push("default-src allows all origins (*)");
      analysis.riskLevel = 'high';
    }
  } else {
    analysis.weaknesses.push("Missing default-src directive");
    analysis.riskLevel = 'medium';
  }
  
  // Check script-src
  if (parsedCSP['script-src']) {
    if (parsedCSP['script-src'].includes("'unsafe-inline'")) {
      analysis.weaknesses.push("script-src allows unsafe-inline");
      analysis.recommendations.push("Replace 'unsafe-inline' with nonces or hashes");
      if (analysis.riskLevel === 'low') analysis.riskLevel = 'medium';
    }
    if (parsedCSP['script-src'].includes("'unsafe-eval'")) {
      analysis.weaknesses.push("script-src allows unsafe-eval");
      analysis.riskLevel = 'high';
    }
    if (parsedCSP['script-src'].includes('*')) {
      analysis.weaknesses.push("script-src allows all origins (*)");
      analysis.riskLevel = 'high';
    }
    
    // Check for specific allowed domains
    const allowedDomains = parsedCSP['script-src'].filter(src => 
      src.startsWith('https://') && !src.includes('*')
    );
    if (allowedDomains.length > 0) {
      analysis.strengths.push(`script-src allows specific trusted domains: ${allowedDomains.join(', ')}`);
    }
  }
  
  // Check style-src
  if (parsedCSP['style-src']) {
    if (parsedCSP['style-src'].includes("'unsafe-inline'")) {
      analysis.weaknesses.push("style-src allows unsafe-inline");
      analysis.recommendations.push("Consider using nonces for inline styles");
    }
  }
  
  // Check object-src
  if (parsedCSP['object-src']) {
    if (parsedCSP['object-src'].includes("'none'")) {
      analysis.strengths.push("object-src properly disabled");
    }
  } else {
    analysis.recommendations.push("Add object-src 'none' directive");
  }
  
  // Check base-uri
  if (parsedCSP['base-uri']) {
    if (parsedCSP['base-uri'].includes("'self'")) {
      analysis.strengths.push("base-uri restricted to same origin");
    }
  } else {
    analysis.recommendations.push("Add base-uri 'self' directive");
  }
  
  // Check img-src
  if (parsedCSP['img-src']) {
    if (parsedCSP['img-src'].includes('data:')) {
      analysis.weaknesses.push("img-src allows data: URIs (potential XSS vector)");
      analysis.recommendations.push("Consider restricting data: URIs if not needed");
    }
    if (parsedCSP['img-src'].includes('https:')) {
      analysis.weaknesses.push("img-src allows all HTTPS sources");
      analysis.recommendations.push("Consider restricting to specific domains");
    }
  }
  
  return analysis;
}

// Check for missing security directives
function checkMissingDirectives(parsedCSP) {
  const recommendedDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'img-src',
    'connect-src',
    'font-src',
    'object-src',
    'base-uri',
    'frame-ancestors'
  ];
  
  const missing = recommendedDirectives.filter(directive => !parsedCSP[directive]);
  return missing;
}

// Analyze external domains
function analyzeExternalDomains(parsedCSP) {
  const externalDomains = new Set();
  
  for (const [directive, sources] of Object.entries(parsedCSP)) {
    for (const source of sources) {
      if (source.startsWith('https://') && !source.includes('*')) {
        try {
          const domain = new URL(source).hostname;
          externalDomains.add(domain);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }
  }
  
  return Array.from(externalDomains);
}

// Main analysis function
async function analyzeCSP() {
  log('🔍 Starting Detailed CSP Analysis');
  log(`Analyzing: ${BASE_URL}`);
  
  try {
    // Get CSP from main page
    const response = await makeRequest(BASE_URL);
    const cspHeader = response.headers['content-security-policy'];
    
    if (!cspHeader) {
      log('No CSP header found!', 'error');
      return;
    }
    
    log('CSP header found, analyzing...', 'success');
    
    // Parse CSP
    const parsedCSP = parseCSP(cspHeader);
    log(`Parsed ${Object.keys(parsedCSP).length} CSP directives`, 'debug');
    
    // Analyze security
    const securityAnalysis = analyzeCSPSecurity(parsedCSP);
    
    // Check missing directives
    const missingDirectives = checkMissingDirectives(parsedCSP);
    
    // Analyze external domains
    const externalDomains = analyzeExternalDomains(parsedCSP);
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    log('🔍 DETAILED CSP ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    // CSP Header
    console.log('\n📋 CSP HEADER:');
    console.log(cspHeader);
    
    // Parsed Directives
    console.log('\n📋 PARSED DIRECTIVES:');
    for (const [directive, sources] of Object.entries(parsedCSP)) {
      console.log(`  ${directive}: ${sources.join(' ')}`);
    }
    
    // Security Analysis
    console.log('\n🔒 SECURITY ANALYSIS:');
    console.log(`Risk Level: ${securityAnalysis.riskLevel.toUpperCase()}`);
    
    if (securityAnalysis.strengths.length > 0) {
      console.log('\n✅ STRENGTHS:');
      securityAnalysis.strengths.forEach(strength => {
        console.log(`  • ${strength}`);
      });
    }
    
    if (securityAnalysis.weaknesses.length > 0) {
      console.log('\n⚠️  WEAKNESSES:');
      securityAnalysis.weaknesses.forEach(weakness => {
        console.log(`  • ${weakness}`);
      });
    }
    
    if (securityAnalysis.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      securityAnalysis.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    
    // Missing Directives
    if (missingDirectives.length > 0) {
      console.log('\n❌ MISSING DIRECTIVES:');
      missingDirectives.forEach(directive => {
        console.log(`  • ${directive}`);
      });
    }
    
    // External Domains
    if (externalDomains.length > 0) {
      console.log('\n🌐 EXTERNAL DOMAINS ALLOWED:');
      externalDomains.forEach(domain => {
        console.log(`  • ${domain}`);
      });
    }
    
    // Specific Directive Analysis
    console.log('\n📊 DIRECTIVE-SPECIFIC ANALYSIS:');
    
    // Script-src analysis
    if (parsedCSP['script-src']) {
      console.log('\n🔧 script-src Analysis:');
      const scriptSrc = parsedCSP['script-src'];
      console.log(`  Sources: ${scriptSrc.join(', ')}`);
      
      if (scriptSrc.includes("'self'")) {
        console.log('  ✅ Allows same-origin scripts');
      }
      if (scriptSrc.includes("'unsafe-inline'")) {
        console.log('  ⚠️  Allows inline scripts (security risk)');
      }
      if (scriptSrc.includes("'unsafe-eval'")) {
        console.log('  🚨 Allows eval() (high security risk)');
      }
      
      const externalScriptDomains = scriptSrc.filter(src => src.startsWith('https://'));
      if (externalScriptDomains.length > 0) {
        console.log(`  🌐 External script domains: ${externalScriptDomains.join(', ')}`);
      }
    }
    
    // Style-src analysis
    if (parsedCSP['style-src']) {
      console.log('\n🎨 style-src Analysis:');
      const styleSrc = parsedCSP['style-src'];
      console.log(`  Sources: ${styleSrc.join(', ')}`);
      
      if (styleSrc.includes("'unsafe-inline'")) {
        console.log('  ⚠️  Allows inline styles');
      }
    }
    
    // Connect-src analysis
    if (parsedCSP['connect-src']) {
      console.log('\n🔗 connect-src Analysis:');
      const connectSrc = parsedCSP['connect-src'];
      console.log(`  Sources: ${connectSrc.join(', ')}`);
      
      const apiDomains = connectSrc.filter(src => src.startsWith('https://'));
      if (apiDomains.length > 0) {
        console.log(`  🌐 API domains: ${apiDomains.join(', ')}`);
      }
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      cspHeader,
      parsedDirectives: parsedCSP,
      securityAnalysis,
      missingDirectives,
      externalDomains,
      riskLevel: securityAnalysis.riskLevel
    };
    
    const reportPath = 'csp-detailed-analysis.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    log(`📄 Detailed CSP analysis saved to: ${reportPath}`, 'success');
    
    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT:');
    if (securityAnalysis.riskLevel === 'low') {
      log('CSP configuration is secure with minor improvements possible', 'success');
    } else if (securityAnalysis.riskLevel === 'medium') {
      log('CSP configuration has some security concerns that should be addressed', 'warning');
    } else {
      log('CSP configuration has significant security risks that need immediate attention', 'error');
    }
    
  } catch (error) {
    log(`Analysis error: ${error.message}`, 'error');
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeCSP().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { analyzeCSP };
