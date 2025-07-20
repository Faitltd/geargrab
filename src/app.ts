// Modern SvelteKit v2 Application Entry Point
// This file is imported by SvelteKit and should contain minimal initialization code

import './app.css';

// Initialize Firebase only on client side
if (typeof window !== 'undefined') {
  // Import Firebase configuration to initialize it
  import('$lib/firebase').then(() => {
    console.log('🔥 Firebase initialized for client-side');
  }).catch((error) => {
    console.warn('Firebase initialization failed:', error);
  });

  // Suppress common Firebase Auth message channel errors
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error?.message?.includes('message channel closed') ||
        error?.message?.includes('listener indicated an asynchronous response')) {
      // These are harmless Firebase Auth popup communication errors
      event.preventDefault();
      return;
    }
  });
}

// Export any global types or utilities if needed
export type {};
