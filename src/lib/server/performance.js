// Performance optimization middleware for Express/SvelteKit
import compression from 'compression';

/**
 * Performance middleware for optimal caching and compression
 */
export function createPerformanceMiddleware() {
  return [
    // Enable GZIP/Brotli compression
    compression({
      level: 6, // Good balance of compression vs CPU
      threshold: 1024, // Only compress files > 1KB
      filter: (req, res) => {
        // Don't compress if client doesn't support it
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use compression for all compressible content
        return compression.filter(req, res);
      }
    }),

    // Cache headers middleware
    (req, res, next) => {
      const url = req.url;
      
      // Immutable assets (with hash in filename) - cache for 1 year
      if (url.includes('/_app/immutable/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Static assets - cache for 1 day
      else if (url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
      // HTML pages - cache for 1 hour with revalidation
      else if (url.endsWith('.html') || !url.includes('.')) {
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      }
      
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Performance headers
      res.setHeader('X-DNS-Prefetch-Control', 'on');
      
      next();
    },

    // HTTPS redirect middleware (301 for caching)
    (req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
        res.redirect(301, `https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    }
  ];
}

/**
 * Image optimization headers
 */
export function imageOptimizationHeaders(req, res, next) {
  if (req.url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
    // Enable browser image optimization
    res.setHeader('Accept-CH', 'DPR, Viewport-Width, Width');
    res.setHeader('Vary', 'Accept, DPR, Viewport-Width, Width');
    
    // Aggressive caching for images
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable'); // 30 days
  }
  next();
}
