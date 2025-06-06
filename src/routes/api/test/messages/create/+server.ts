import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';

// Test endpoint for message creation
export const POST: RequestHandler = createSecureHandler(
  async (event, { body }) => {
    const { conversationId, content, type } = body;
    
    // Simulate message creation
    return json({
      success: true,
      message: 'Message creation test passed',
      messageData: {
        id: `test_message_${Date.now()}`,
        conversationId,
        content,
        type,
        timestamp: new Date().toISOString(),
        senderId: 'test_user'
      }
    });
  },
  {
    rateLimit: 'api',
    validateCSRF: false, // Skip CSRF for testing
    inputSchema: {
      conversationId: { required: true, type: 'string' as const },
      content: { required: true, type: 'string' as const, minLength: 1, maxLength: 1000 },
      type: { required: true, type: 'string' as const, allowedValues: ['text', 'image', 'file'] }
    }
  }
);
