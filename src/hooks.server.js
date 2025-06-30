/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const start = Date.now();

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

  const duration = Date.now() - start;

  // Log slow requests
  if (duration > 1000) {
    console.warn(`⚠️ Slow request: ${event.url.pathname} took ${duration}ms`);
  }

  // Add performance and security headers
  const headers = new Headers(response.headers);
  headers.set('X-Response-Time', `${duration}ms`);
  headers.set('X-Powered-By', 'GearGrab');

  // Cache control based on content type
  const url = event.url.pathname;

  // API routes - no cache
  if (url.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  }
  // Immutable assets - cache for 1 year
  else if (url.includes('/_app/immutable/')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Static assets - cache for 1 day
  else if (url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/)) {
    headers.set('Cache-Control', 'public, max-age=86400');
  }
  // HTML pages - cache for 1 hour with revalidation
  else if (url.endsWith('.html') || !url.includes('.')) {
    headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  }

  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-DNS-Prefetch-Control', 'on');

  // Image optimization headers
  if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
    headers.set('Accept-CH', 'DPR, Viewport-Width, Width');
    headers.set('Vary', 'Accept, DPR, Viewport-Width, Width');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
