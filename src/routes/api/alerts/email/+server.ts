import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/services/email';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { to, subject, error } = await request.json();

    if (!to || !subject || !error) {
      return json({ error: 'Missing required fields: to, subject, error' }, { status: 400 });
    }

    // Create alert email template
    const alertEmail = {
      to,
      subject,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>🚨 Critical Error Alert</h1>
            <p>GearGrab System Alert</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2>Error Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Message:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${error.message}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Category:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${error.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Severity:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${error.severity}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${error.timestamp}</td>
              </tr>
              ${error.url ? `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">URL:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${error.url}</td>
              </tr>
              ` : ''}
              ${error.userId ? `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">User ID:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${error.userId}</td>
              </tr>
              ` : ''}
            </table>
            
            ${error.stack ? `
            <h3>Stack Trace</h3>
            <pre style="background-color: #1f2937; color: #f9fafb; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">${error.stack}</pre>
            ` : ''}
            
            ${error.metadata ? `
            <h3>Additional Metadata</h3>
            <pre style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">${JSON.stringify(error.metadata, null, 2)}</pre>
            ` : ''}
          </div>
          
          <div style="padding: 20px; background-color: #1f2937; color: white; text-align: center;">
            <p>This is an automated alert from the GearGrab monitoring system.</p>
            <p>Please investigate and resolve this issue as soon as possible.</p>
          </div>
        </div>
      `,
      text: `
        🚨 CRITICAL ERROR ALERT - GearGrab System
        
        Error Details:
        - Message: ${error.message}
        - Category: ${error.category}
        - Severity: ${error.severity}
        - Timestamp: ${error.timestamp}
        ${error.url ? `- URL: ${error.url}` : ''}
        ${error.userId ? `- User ID: ${error.userId}` : ''}
        
        ${error.stack ? `Stack Trace:\n${error.stack}` : ''}
        
        ${error.metadata ? `Additional Metadata:\n${JSON.stringify(error.metadata, null, 2)}` : ''}
        
        This is an automated alert from the GearGrab monitoring system.
        Please investigate and resolve this issue as soon as possible.
      `
    };

    // Send the alert email
    const emailSent = await sendEmail(alertEmail);

    if (emailSent) {
      return json({ 
        success: true, 
        message: 'Alert email sent successfully' 
      });
    } else {
      return json({ 
        error: 'Failed to send alert email' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Alert email error:', error);
    return json({ 
      error: 'Failed to process alert email request',
      details: error.message 
    }, { status: 500 });
  }
};
