/**
 * FCRA-Compliant iProspectCheck API Client
 * Implements background check functionality with proper FCRA compliance
 */

// Using native fetch instead of axios for better compatibility

class IProspectCheckClient {
  constructor() {
    this.baseURL = 'https://api.iprospectcheck.com/v1';
    this.client = null;
    this.initialized = false;
  }

  // Lazy initialization to avoid build-time errors
  initialize() {
    if (this.initialized) return;

    this.apiKey = process.env.IPROSPECT_API_KEY;
    this.apiSecret = process.env.IPROSPECT_API_SECRET;

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('IPROSPECT_API_KEY and IPROSPECT_API_SECRET environment variables are required');
    }

    // Create Basic Auth header
    this.authHeader = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

    // Create a simple fetch-based client
    this.client = {
      post: async (url, data) => {
        const response = await fetch(`${this.baseURL}${url}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Content-Type': 'application/json',
            'User-Agent': 'GearGrab/1.0'
          },
          body: JSON.stringify(data)
        });

        return {
          status: response.status,
          statusText: response.statusText,
          data: response.ok ? await response.json() : null
        };
      },

      get: async (url) => {
        const response = await fetch(`${this.baseURL}${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Content-Type': 'application/json',
            'User-Agent': 'GearGrab/1.0'
          }
        });

        return {
          status: response.status,
          statusText: response.statusText,
          data: response.ok ? await response.json() : null
        };
      }
    };

    this.initialized = true;
  }

  /**
   * Create a background check report with iProspectCheck
   * @param {Object} candidateData - Candidate information
   * @param {string} candidateData.firstName - First name
   * @param {string} candidateData.lastName - Last name
   * @param {string} candidateData.email - Email address
   * @param {string} candidateData.phone - Phone number
   * @param {string} candidateData.dob - Date of birth (YYYY-MM-DD)
   * @param {string} candidateData.ssn - Social Security Number
   * @param {string} candidateData.address - Full address string
   * @param {Object} metadata - Additional metadata (IP, User-Agent, etc.)
   * @returns {Promise<Object>} Report object
   */
  async createReport(candidateData, metadata = {}) {
    this.initialize();
    try {
      const payload = {
        candidate: {
          first_name: candidateData.firstName,
          last_name: candidateData.lastName,
          dob: candidateData.dob,
          ssn: candidateData.ssn,
          address: candidateData.address, // Full address string
          email: candidateData.email,
          metadata: {
            ip: metadata.ip,
            ua: metadata.userAgent,
            source: 'geargrab_registration',
            timestamp: new Date().toISOString(),
            ...metadata
          }
        },
        package_code: 'BASIC_CRIMINAL', // iProspectCheck's basic criminal + SSN trace package
        permissible_purpose: 'LICENSE_SCREENING'
      };

      console.log('Creating iProspectCheck report:', {
        email: payload.candidate.email,
        name: `${payload.candidate.first_name} ${payload.candidate.last_name}`
      });

      const response = await this.client.post('/reports', payload);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }

      console.log('iProspectCheck report created successfully:', response.data.report_id);
      return response.data;

    } catch (error) {
      console.error('Error creating iProspectCheck report:', error.response?.data || error.message);

      if (error.response?.status === 400) {
        throw new Error(`Invalid request data: ${error.response.data?.message || 'Bad request'}`);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed - check API credentials');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden - insufficient permissions');
      } else {
        throw new Error(`Failed to create report: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  /**
   * Fetch a background check report by ID
   * @param {string} reportId - iProspectCheck report ID
   * @returns {Promise<Object>} Report object with status and results
   */
  async fetchReport(reportId) {
    this.initialize();
    try {
      const response = await this.client.get(`/reports/${reportId}`);

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }

      return response.data;

    } catch (error) {
      console.error('Error fetching iProspectCheck report:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Report not found: ${reportId}`);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed - check API credentials');
      } else {
        throw new Error(`Failed to fetch report: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  /**
   * Get report PDF URL for FCRA notices
   * @param {string} reportId - iProspectCheck report ID
   * @returns {Promise<string>} PDF URL
   */
  async getReportPdfUrl(reportId) {
    this.initialize();
    try {
      const report = await this.fetchReport(reportId);
      return report.pdf_url || `https://portal.iprospectcheck.com/reports/${reportId}`;
    } catch (error) {
      console.error('Error fetching report PDF:', error.response?.data || error.message);
      // Fallback to portal URL
      return `https://portal.iprospectcheck.com/reports/${reportId}`;
    }
  }

  /**
   * Poll report status until completion
   * @param {string} reportId - iProspectCheck report ID
   * @param {number} maxAttempts - Maximum polling attempts
   * @param {number} intervalMs - Polling interval in milliseconds
   * @returns {Promise<Object>} Completed report object
   */
  async pollReportCompletion(reportId, maxAttempts = 120, intervalMs = 5000) {
    this.initialize();
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const report = await this.fetchReport(reportId);

        console.log(`Report ${reportId} status: ${report.status} (attempt ${attempts + 1})`);

        // Check if report is completed (iProspectCheck status values)
        if (['complete', 'completed'].includes(report.status?.toLowerCase())) {
          console.log(`Report ${reportId} completed with status: ${report.status}`);
          return report;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;

      } catch (error) {
        console.error(`Error polling report ${reportId}:`, error.message);
        attempts++;

        if (attempts >= maxAttempts) {
          throw new Error(`Report polling failed after ${maxAttempts} attempts`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(`Report ${reportId} did not complete within ${maxAttempts} attempts`);
  }

  /**
   * Determine if report results require adverse action
   * @param {Object} report - iProspectCheck report object
   * @returns {Object} Decision object with action and reasoning
   */
  determineAdverseAction(report) {
    const decision = {
      requiresAdverseAction: false,
      action: 'approve',
      reasoning: [],
      riskLevel: 'low'
    };

    // Check if report is complete
    if (report.status !== 'complete') {
      decision.requiresAdverseAction = false;
      decision.action = 'pending';
      decision.reasoning.push(`Report still pending: ${report.status}`);
      return decision;
    }

    // Check clear flag (iProspectCheck specific)
    if (report.adjudication && report.adjudication.clear_flag === false) {
      decision.requiresAdverseAction = true;
      decision.action = 'adverse';
      decision.riskLevel = 'high';
      decision.reasoning.push('Background check flagged for review');
    }

    // Check summary clear flag
    if (report.summary && report.summary.clear_flag === false) {
      decision.requiresAdverseAction = true;
      decision.action = 'adverse';
      decision.riskLevel = 'high';
      decision.reasoning.push('Summary indicates adverse findings');
    }

    if (!decision.requiresAdverseAction) {
      decision.action = 'approve';
      decision.reasoning.push('Background check passed - clear flag is true');
    }

    return decision;
  }

}

// Create singleton instance
const client = new IProspectCheckClient();

// Export the main functions as specified
export async function createReport(candidateData) {
  return await client.createReport(candidateData);
}

export async function fetchReport(reportId) {
  return await client.fetchReport(reportId);
}

// Export additional utility functions
export async function getReportPdfUrl(reportId) {
  return await client.getReportPdfUrl(reportId);
}

export function determineAdverseAction(report) {
  return client.determineAdverseAction(report);
}

export async function pollReportCompletion(reportId, maxAttempts = 120, intervalMs = 5000) {
  return await client.pollReportCompletion(reportId, maxAttempts, intervalMs);
}

// Export the client instance as well
export const iProspectCheckClient = client;
export default client;
