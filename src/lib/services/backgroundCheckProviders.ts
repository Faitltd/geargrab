import { dev } from '$app/environment';

export interface BackgroundCheckRequest {
  userId: string;
  checkType: 'basic' | 'standard' | 'comprehensive';
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    ssn: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  requestId: string;
}

export interface BackgroundCheckResult {
  externalId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: {
    criminalHistory?: {
      status: 'clear' | 'records_found' | 'pending';
      details?: string;
      recordsFound?: Array<{
        type: 'felony' | 'misdemeanor' | 'infraction';
        description: string;
        date: Date;
        jurisdiction: string;
        disposition: string;
      }>;
    };
    sexOffenderRegistry?: {
      status: 'clear' | 'found' | 'pending';
      details?: string;
    };
    globalWatchlist?: {
      status: 'clear' | 'found' | 'pending';
      details?: string;
    };
    identityVerification?: {
      status: 'verified' | 'failed' | 'pending';
      ssnTrace?: boolean;
      addressHistory?: boolean;
    };
    motorVehicleRecords?: {
      status: 'clear' | 'violations_found' | 'pending';
      violations?: Array<{
        type: string;
        date: Date;
        description: string;
      }>;
    };
    professionalLicenses?: {
      status: 'verified' | 'not_found' | 'pending';
      licenses?: Array<{
        type: string;
        number: string;
        state: string;
        status: 'active' | 'inactive' | 'suspended';
        expirationDate: Date;
      }>;
    };
  };
  riskLevel?: 'low' | 'medium' | 'high';
  overallStatus?: 'pass' | 'fail' | 'review_required';
  completedAt?: Date;
  expiresAt?: Date;
}

export abstract class BackgroundCheckProvider {
  abstract name: string;
  abstract id: string;

  abstract initiateBackgroundCheck(request: BackgroundCheckRequest): Promise<string>;
  abstract getBackgroundCheckStatus(externalId: string): Promise<BackgroundCheckResult>;
  abstract cancelBackgroundCheck(externalId: string): Promise<void>;
  abstract getEstimatedCompletion(checkType: string): string;
}

// Checkr Provider Implementation
class CheckrProvider extends BackgroundCheckProvider {
  name = 'Checkr';
  id = 'checkr';
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.CHECKR_API_KEY || 'test_key';
    this.baseUrl = dev ? 'https://api.checkr.com/v1' : 'https://api.checkr.com/v1';
  }

  async initiateBackgroundCheck(request: BackgroundCheckRequest): Promise<string> {
    try {
      // Validate API key
      if (!this.apiKey || this.apiKey === 'test_key') {
        throw new Error('Checkr API key not configured. Please set CHECKR_API_KEY environment variable.');
      }

      console.log(`Initiating Checkr background check for request: ${request.requestId}`);

      // Create candidate
      const candidatePayload = {
        first_name: request.personalInfo.firstName,
        last_name: request.personalInfo.lastName,
        email: request.personalInfo.email,
        phone: request.personalInfo.phone,
        dob: request.personalInfo.dateOfBirth,
        ssn: request.personalInfo.ssn,
        zipcode: request.personalInfo.address.zipCode,
        driver_license_number: '', // Optional
        driver_license_state: request.personalInfo.address.state
      };

      const candidateResponse = await fetch(`${this.baseUrl}/candidates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GearGrab/1.0'
        },
        body: JSON.stringify(candidatePayload)
      });

      if (!candidateResponse.ok) {
        const errorData = await candidateResponse.json().catch(() => ({}));
        console.error('Checkr candidate creation failed:', {
          status: candidateResponse.status,
          statusText: candidateResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to create candidate: ${candidateResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      const candidate = await candidateResponse.json();
      console.log(`Checkr candidate created: ${candidate.id}`);

      // Create report
      const reportPackage = this.getReportPackage(request.checkType);
      const reportPayload = {
        candidate_id: candidate.id,
        package: reportPackage,
        tags: [`geargrab_${request.requestId}`],
        consider: 'all' // Consider all records for comprehensive screening
      };

      const reportResponse = await fetch(`${this.baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GearGrab/1.0'
        },
        body: JSON.stringify(reportPayload)
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json().catch(() => ({}));
        console.error('Checkr report creation failed:', {
          status: reportResponse.status,
          statusText: reportResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to create report: ${reportResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      const report = await reportResponse.json();
      console.log(`Checkr report created: ${report.id} for request: ${request.requestId}`);

      return report.id;

    } catch (error) {
      console.error('Checkr API error:', error);
      // Log error for monitoring
      await this.logBackgroundCheckError(request.requestId, error);
      throw new Error(`Failed to initiate background check: ${error.message}`);
    }
  }

  async getBackgroundCheckStatus(externalId: string): Promise<BackgroundCheckResult> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/${externalId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Checkr API error: ${response.statusText}`);
      }

      const report = await response.json();
      return this.parseCheckrReport(report);

    } catch (error) {
      console.error('Checkr status check error:', error);
      throw error;
    }
  }

  async cancelBackgroundCheck(externalId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/${externalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Checkr cancellation error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Checkr cancellation error:', error);
      throw error;
    }
  }

  getEstimatedCompletion(checkType: string): string {
    switch (checkType) {
      case 'basic': return '1-2 business days';
      case 'standard': return '2-3 business days';
      case 'comprehensive': return '3-5 business days';
      default: return '2-3 business days';
    }
  }

  private getReportPackage(checkType: string): string {
    switch (checkType) {
      case 'basic': return 'tasker_basic';
      case 'standard': return 'tasker_standard';
      case 'comprehensive': return 'tasker_pro';
      default: return 'tasker_standard';
    }
  }

  private parseCheckrReport(report: any): BackgroundCheckResult {
    const result: BackgroundCheckResult = {
      externalId: report.id,
      status: this.mapCheckrStatus(report.status),
      completedAt: report.completed_at ? new Date(report.completed_at) : undefined
    };

    if (report.status === 'complete') {
      result.results = {
        criminalHistory: {
          status: report.adjudication === 'engaged' ? 'records_found' : 'clear',
          details: report.adjudication === 'engaged' ? 'Records found requiring review' : 'No criminal records found'
        },
        identityVerification: {
          status: 'verified',
          ssnTrace: true,
          addressHistory: true
        }
      };

      result.riskLevel = report.adjudication === 'engaged' ? 'high' : 'low';
      result.overallStatus = report.adjudication === 'engaged' ? 'review_required' : 'pass';
      result.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }

    return result;
  }

  private mapCheckrStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'failed' {
    switch (status) {
      case 'pending': return 'pending';
      case 'consider': return 'in_progress';
      case 'complete': return 'completed';
      case 'disputed': return 'failed';
      default: return 'pending';
    }
  }

  private async logBackgroundCheckError(requestId: string, error: any): Promise<void> {
    try {
      // In production, this would send to monitoring service
      console.error('Background check error logged:', {
        requestId,
        provider: 'checkr',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Could integrate with services like Sentry, DataDog, etc.
      // await monitoringService.logError('background_check_error', { requestId, error });
    } catch (logError) {
      console.error('Failed to log background check error:', logError);
    }
  }
}

// Sterling Provider Implementation
class SterlingProvider extends BackgroundCheckProvider {
  name = 'Sterling';
  id = 'sterling';
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.STERLING_API_KEY || 'test_key';
    this.baseUrl = dev ? 'https://api-sandbox.sterlingcheck.com/v2' : 'https://api.sterlingcheck.com/v2';
  }

  async initiateBackgroundCheck(request: BackgroundCheckRequest): Promise<string> {
    // Sterling API implementation
    // This would be similar to Checkr but with Sterling's specific API format
    
    // For demo purposes, return a mock external ID
    const mockId = `sterling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, implement actual Sterling API calls here
    console.log('Sterling background check initiated:', mockId);
    
    return mockId;
  }

  async getBackgroundCheckStatus(externalId: string): Promise<BackgroundCheckResult> {
    // Sterling status check implementation
    return {
      externalId,
      status: 'in_progress'
    };
  }

  async cancelBackgroundCheck(externalId: string): Promise<void> {
    // Sterling cancellation implementation
    console.log('Sterling background check cancelled:', externalId);
  }

  getEstimatedCompletion(checkType: string): string {
    switch (checkType) {
      case 'basic': return '2-3 business days';
      case 'standard': return '3-4 business days';
      case 'comprehensive': return '4-6 business days';
      default: return '3-4 business days';
    }
  }
}

// Mock Provider for Development
class MockProvider extends BackgroundCheckProvider {
  name = 'Mock Provider';
  id = 'mock';

  async initiateBackgroundCheck(request: BackgroundCheckRequest): Promise<string> {
    const mockId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Mock background check initiated:', mockId);
    return mockId;
  }

  async getBackgroundCheckStatus(externalId: string): Promise<BackgroundCheckResult> {
    // Simulate different statuses for demo
    const statuses = ['pending', 'in_progress', 'completed'] as const;
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const result: BackgroundCheckResult = {
      externalId,
      status: randomStatus
    };

    if (randomStatus === 'completed') {
      result.results = {
        criminalHistory: { status: 'clear', details: 'No criminal records found' },
        sexOffenderRegistry: { status: 'clear', details: 'Not found in registry' },
        globalWatchlist: { status: 'clear', details: 'No matches found' },
        identityVerification: { status: 'verified', ssnTrace: true, addressHistory: true }
      };
      result.riskLevel = 'low';
      result.overallStatus = 'pass';
      result.completedAt = new Date();
      result.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    return result;
  }

  async cancelBackgroundCheck(externalId: string): Promise<void> {
    console.log('Mock background check cancelled:', externalId);
  }

  getEstimatedCompletion(checkType: string): string {
    return '1-2 business days (mock)';
  }
}

// Provider Registry
class BackgroundCheckProviders {
  private providers: Map<string, BackgroundCheckProvider> = new Map();

  constructor() {
    // Register providers
    this.registerProvider(new CheckrProvider());
    this.registerProvider(new SterlingProvider());
    
    // Use mock provider in development
    if (dev) {
      this.registerProvider(new MockProvider());
    }
  }

  registerProvider(provider: BackgroundCheckProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): BackgroundCheckProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): BackgroundCheckProvider[] {
    return Array.from(this.providers.values());
  }

  getDefaultProvider(): BackgroundCheckProvider {
    return dev ? this.getProvider('mock')! : this.getProvider('checkr')!;
  }
}

export const backgroundCheckProviders = new BackgroundCheckProviders();
