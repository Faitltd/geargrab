import { createPerformanceMiddleware, imageOptimizationHeaders } from '$lib/server/performance.js';

// Apply performance middleware
const performanceMiddleware = createPerformanceMiddleware();

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Apply performance middleware
  for (const middleware of performanceMiddleware) {
    await new Promise((resolve) => {
      middleware(event.request, event, resolve);
    });
  }
  
  // Apply image optimization headers
  await new Promise((resolve) => {
    imageOptimizationHeaders(event.request, event, resolve);
  });
  
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => {
      // Minify HTML in production
      if (process.env.NODE_ENV === 'production') {
        return html
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .trim();
      }
      return html;
    }
  });
  
  return response;
}
