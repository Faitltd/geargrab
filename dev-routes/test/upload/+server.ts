import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';

// Test endpoint for file upload
export const POST: RequestHandler = createSecureHandler(
  async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;
      
      if (!file) {
        return json({ error: 'No file provided' }, { status: 400 });
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return json({ error: 'File too large' }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        return json({ error: 'File type not allowed' }, { status: 400 });
      }

      // Simulate successful upload
      return json({
        success: true,
        message: 'File upload test passed',
        fileData: {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadType: type,
          url: `https://test-storage.com/files/test_${Date.now()}_${file.name}`
        }
      });

    } catch (error) {
      return json({ 
        error: 'File upload test failed',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    rateLimit: 'upload',
    validateCSRF: false // Skip CSRF for testing
  }
);
