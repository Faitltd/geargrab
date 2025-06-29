import type { EmailTemplate, EmailConfig, EmailResult } from './types';

// Email sender service
export class EmailSender {
  private config: EmailConfig;

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.RESEND_API_KEY,
      fromEmail: config?.fromEmail || 'noreply@geargrab.co',
      fromName: config?.fromName || 'GearGrab',
      isDevelopment: config?.isDevelopment ?? (process.env.NODE_ENV === 'development')
    };
  }

  async send(template: EmailTemplate): Promise<EmailResult> {
    try {
      // In development, just log the email
      if (this.config.isDevelopment || !this.config.apiKey) {
        return this.logEmail(template);
      }

      // Production email sending with Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${this.config.fromName} <${this.config.fromEmail}>`,
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Email sending failed:', error);
        return {
          success: false,
          error: `Email sending failed: ${error}`
        };
      }

      const result = await response.json();
      console.log('✅ Email sent successfully:', {
        to: template.to,
        subject: template.subject,
        messageId: result.id
      });

      return {
        success: true,
        messageId: result.id
      };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private logEmail(template: EmailTemplate): EmailResult {
    console.log('📧 Email would be sent (Development Mode):');
    console.log('To:', template.to);
    console.log('Subject:', template.subject);
    console.log('Text preview:', template.text?.substring(0, 200) + '...');
    console.log('HTML length:', template.html.length, 'characters');
    console.log('---');

    return {
      success: true,
      messageId: `dev-${Date.now()}`
    };
  }

  // Batch send emails
  async sendBatch(templates: EmailTemplate[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const template of templates) {
      const result = await this.send(template);
      results.push(result);
      
      // Add small delay between emails to avoid rate limiting
      if (!this.config.isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // Validate email template
  validateTemplate(template: EmailTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.to || !this.isValidEmail(template.to)) {
      errors.push('Invalid or missing recipient email');
    }

    if (!template.subject || template.subject.trim().length === 0) {
      errors.push('Missing email subject');
    }

    if (!template.html || template.html.trim().length === 0) {
      errors.push('Missing email HTML content');
    }

    if (template.subject && template.subject.length > 200) {
      errors.push('Subject line too long (max 200 characters)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get email statistics (for monitoring)
  getStats(): { sent: number; failed: number; lastSent?: Date } {
    // In a real implementation, this would track actual statistics
    // For now, return placeholder data
    return {
      sent: 0,
      failed: 0,
      lastSent: undefined
    };
  }
}

// Default email sender instance
export const emailSender = new EmailSender();

// Convenience function for sending emails
export async function sendEmail(template: EmailTemplate): Promise<EmailResult> {
  const validation = emailSender.validateTemplate(template);
  
  if (!validation.valid) {
    console.error('❌ Email template validation failed:', validation.errors);
    return {
      success: false,
      error: `Template validation failed: ${validation.errors.join(', ')}`
    };
  }

  return emailSender.send(template);
}

// Convenience function for sending multiple emails
export async function sendEmails(templates: EmailTemplate[]): Promise<EmailResult[]> {
  return emailSender.sendBatch(templates);
}
