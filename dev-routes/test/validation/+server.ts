import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Test endpoint for input validation
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, content } = body;

    // Basic validation
    if (!email || !content) {
      return json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Check for malicious patterns
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /SELECT.*FROM/i,
      /DROP.*TABLE/i,
      /INSERT.*INTO/i,
      /DELETE.*FROM/i
    ];

    const isMalicious = maliciousPatterns.some(pattern =>
      pattern.test(email) || pattern.test(content)
    );

    if (isMalicious) {
      return json({
        error: 'Malicious input detected'
      }, { status: 400 });
    }

    return json({
      success: true,
      message: 'Input validation test passed',
      sanitizedData: { email, content }
    });

  } catch (error) {
    return json({
      error: 'Invalid JSON'
    }, { status: 400 });
  }
};
