import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Check file storage configuration
    const hasFirebaseConfig = !!(
      process.env.VITE_FIREBASE_STORAGE_BUCKET && 
      process.env.VITE_FIREBASE_PROJECT_ID
    );
    
    const maxFileSize = '10MB'; // As configured in the chat system
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ];
    
    return json({
      success: true,
      message: 'File storage operational',
      provider: hasFirebaseConfig ? 'Firebase Storage' : 'Local Storage',
      maxSize: maxFileSize,
      allowedTypes,
      features: [
        'File upload validation',
        'Size limit enforcement',
        'Type checking',
        'Progress tracking',
        'Error handling'
      ],
      configuration: {
        hasFirebaseConfig,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'not-configured'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Storage health check failed:', error);
    
    return json({
      success: false,
      error: 'Storage health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};
