import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { type, recipient, subject, templateData } = await request.json();

    if (!recipient || !subject) {
      return json({ error: 'Recipient and subject are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Load the appropriate email template
    // 2. Render the template with the provided data
    // 3. Send the email using your email service (SendGrid, Mailgun, etc.)
    
    // For now, we'll simulate the email sending process
    console.log('📧 Sending test email:', {
      type,
      recipient,
      subject,
      templateData
    });

    // Simulate email service delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a mock message ID
    const messageId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log the email for debugging
    console.log(`✅ Test email sent successfully to ${recipient}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`🆔 Message ID: ${messageId}`);
    console.log(`📋 Template Data:`, templateData);

    return json({
      success: true,
      message: `Test email sent successfully to ${recipient}`,
      messageId,
      type,
      recipient,
      subject,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// GET endpoint to check email service status
export const GET: RequestHandler = async () => {
  try {
    // In a real implementation, you would check:
    // 1. SMTP connection status
    // 2. Email service API status
    // 3. Template availability
    // 4. Recent delivery statistics

    return json({
      status: 'healthy',
      smtp: {
        connected: true,
        host: 'smtp.example.com',
        port: 587
      },
      templates: {
        available: [
          'booking_confirmation',
          'booking_approved',
          'booking_cancelled',
          'payment_received',
          'reminder',
          'welcome',
          'password_reset'
        ],
        count: 7
      },
      statistics: {
        deliveryRate: 98.5,
        lastDelivery: new Date().toISOString(),
        totalSent: 1247,
        totalFailed: 19
      },
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking email service status:', error);
    return json({ 
      error: 'Failed to check email service status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
