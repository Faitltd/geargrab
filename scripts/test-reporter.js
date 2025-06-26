/**
 * Test Reporter for GearGrab
 * 
 * Generates comprehensive test reports with analytics and insights
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export class TestReporter {
  constructor(config = {}) {
    this.config = {
      outputDir: 'test-reports',
      includeScreenshots: true,
      includeVideos: false,
      includeCoverage: true,
      ...config
    };
    
    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    const reportDir = path.join(rootDir, this.config.outputDir);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  generateReport(testResults, metadata = {}) {
    const timestamp = new Date().toISOString();
    const reportData = {
      metadata: {
        timestamp,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...metadata
      },
      summary: this.generateSummary(testResults),
      details: testResults,
      analytics: this.generateAnalytics(testResults),
      recommendations: this.generateRecommendations(testResults)
    };

    // Generate JSON report
    this.saveJsonReport(reportData);
    
    // Generate HTML report
    this.saveHtmlReport(reportData);
    
    // Generate console summary
    this.printConsoleSummary(reportData);

    return reportData;
  }

  generateSummary(testResults) {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const jestTests = testResults.filter(r => r.type === 'jest');
    const cypressTests = testResults.filter(r => r.type === 'cypress');

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: Math.round(successRate * 100) / 100,
      breakdown: {
        jest: {
          total: jestTests.length,
          passed: jestTests.filter(r => r.success).length,
          failed: jestTests.filter(r => !r.success).length
        },
        cypress: {
          total: cypressTests.length,
          passed: cypressTests.filter(r => r.success).length,
          failed: cypressTests.filter(r => !r.success).length
        }
      }
    };
  }

  generateAnalytics(testResults) {
    const analytics = {
      executionTime: this.calculateExecutionTime(testResults),
      failurePatterns: this.analyzeFailurePatterns(testResults),
      performanceMetrics: this.extractPerformanceMetrics(testResults),
      trends: this.analyzeTrends(testResults)
    };

    return analytics;
  }

  calculateExecutionTime(testResults) {
    // This would need to be enhanced with actual timing data
    return {
      total: 'N/A',
      average: 'N/A',
      slowest: 'N/A',
      fastest: 'N/A'
    };
  }

  analyzeFailurePatterns(testResults) {
    const failedTests = testResults.filter(r => !r.success);
    const patterns = {};

    failedTests.forEach(test => {
      if (test.errorOutput) {
        // Simple pattern matching - could be enhanced
        if (test.errorOutput.includes('timeout')) {
          patterns.timeout = (patterns.timeout || 0) + 1;
        }
        if (test.errorOutput.includes('element not found')) {
          patterns.elementNotFound = (patterns.elementNotFound || 0) + 1;
        }
        if (test.errorOutput.includes('network')) {
          patterns.network = (patterns.network || 0) + 1;
        }
        if (test.errorOutput.includes('authentication')) {
          patterns.authentication = (patterns.authentication || 0) + 1;
        }
      }
    });

    return patterns;
  }

  extractPerformanceMetrics(testResults) {
    // Extract performance data from test outputs
    return {
      pageLoadTimes: [],
      apiResponseTimes: [],
      renderTimes: []
    };
  }

  analyzeTrends(testResults) {
    // This would compare with historical data
    return {
      successRateTrend: 'stable',
      performanceTrend: 'stable',
      newFailures: [],
      resolvedIssues: []
    };
  }

  generateRecommendations(testResults) {
    const recommendations = [];
    const failedTests = testResults.filter(r => !r.success);
    const summary = this.generateSummary(testResults);

    // Success rate recommendations
    if (summary.successRate < 80) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        title: 'Low Test Success Rate',
        description: `Current success rate is ${summary.successRate}%. Consider investigating failing tests.`,
        action: 'Review and fix failing tests'
      });
    }

    // Jest vs Cypress balance
    if (summary.breakdown.jest.total === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'coverage',
        title: 'Missing Unit Tests',
        description: 'No Jest unit tests found. Consider adding unit tests for better coverage.',
        action: 'Add unit tests for core functionality'
      });
    }

    if (summary.breakdown.cypress.total === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'coverage',
        title: 'Missing E2E Tests',
        description: 'No Cypress E2E tests found. Consider adding end-to-end tests.',
        action: 'Add E2E tests for critical user journeys'
      });
    }

    // Failure pattern recommendations
    const analytics = this.generateAnalytics(testResults);
    Object.entries(analytics.failurePatterns).forEach(([pattern, count]) => {
      if (count > 1) {
        recommendations.push({
          priority: 'medium',
          category: 'stability',
          title: `Recurring ${pattern} Issues`,
          description: `${count} tests failed due to ${pattern} issues.`,
          action: `Investigate and fix ${pattern} related problems`
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  saveJsonReport(reportData) {
    const filename = `test-report-${Date.now()}.json`;
    const filepath = path.join(rootDir, this.config.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`📄 JSON report saved: ${filepath}`);
  }

  saveHtmlReport(reportData) {
    const html = this.generateHtmlReport(reportData);
    const filename = `test-report-${Date.now()}.html`;
    const filepath = path.join(rootDir, this.config.outputDir, filename);
    fs.writeFileSync(filepath, html);
    console.log(`📄 HTML report saved: ${filepath}`);
  }

  generateHtmlReport(reportData) {
    const { summary, details, analytics, recommendations } = reportData;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GearGrab Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .section { margin-bottom: 30px; }
        .section h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .test-result { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 8px; }
        .recommendation { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 GearGrab Test Report</h1>
            <p>Generated: ${reportData.metadata.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${summary.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value success">${summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value danger">${summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value ${summary.successRate >= 80 ? 'success' : summary.successRate >= 60 ? 'warning' : 'danger'}">${summary.successRate}%</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Test Breakdown</h2>
            <div class="summary">
                <div class="metric">
                    <h3>Jest Tests</h3>
                    <div class="value">${summary.breakdown.jest.passed}/${summary.breakdown.jest.total}</div>
                </div>
                <div class="metric">
                    <h3>Cypress Tests</h3>
                    <div class="value">${summary.breakdown.cypress.passed}/${summary.breakdown.cypress.total}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Test Results</h2>
            ${details.map(test => `
                <div class="test-result ${test.success ? 'test-passed' : 'test-failed'}">
                    <strong>${test.success ? '✅' : '❌'} ${test.type.toUpperCase()} - ${test.suite || 'Unknown'}</strong>
                    ${test.errorOutput && !test.success ? `<pre style="margin-top: 10px; font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px;">${test.errorOutput.substring(0, 500)}...</pre>` : ''}
                </div>
            `).join('')}
        </div>
        
        ${recommendations.length > 0 ? `
        <div class="section">
            <h2>💡 Recommendations</h2>
            <div class="recommendations">
                ${recommendations.map(rec => `
                    <div class="recommendation priority-${rec.priority}">
                        <strong>${rec.title}</strong> (${rec.priority} priority)
                        <p>${rec.description}</p>
                        <em>Action: ${rec.action}</em>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
  }

  printConsoleSummary(reportData) {
    const { summary, recommendations } = reportData;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST REPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} | Failed: ${summary.failed}`);
    console.log(`Success Rate: ${summary.successRate}%`);
    console.log(`Jest: ${summary.breakdown.jest.passed}/${summary.breakdown.jest.total}`);
    console.log(`Cypress: ${summary.breakdown.cypress.passed}/${summary.breakdown.cypress.total}`);
    
    if (recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:');
      recommendations.slice(0, 3).forEach(rec => {
        console.log(`• ${rec.title} (${rec.priority}): ${rec.action}`);
      });
    }
    
    console.log('='.repeat(60));
  }
}

export default TestReporter;
