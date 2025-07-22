// HTTP Compression and Caching Middleware
// Optimizes response delivery with compression and proper cache headers

import { config } from '$lib/config/production';
import type { Handle } from '@sveltejs/kit';

// MIME types that should be compressed
const COMPRESSIBLE_TYPES = new Set([
  'text/html',
  'text/css',
  'text/javascript',
  'text/plain',
  'text/xml',
  'application/javascript',
  'application/json',
  'application/xml',
  'application/rss+xml',
  'application/atom+xml',
  'image/svg+xml'
]);

// Static asset patterns for long-term caching
const STATIC_ASSET_PATTERNS = [
  /\/_app\/immutable\/.+/,
  /\/favicon\.ico$/,
  /\/robots\.txt$/,
  /\/sitemap\.xml$/,
  /\.(css|js|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)$/
];

// API patterns for short-term caching
const API_PATTERNS = [
  /^\/api\//,
  /^\/health$/
];

/**
 * Determines if a response should be compressed
 */
function shouldCompress(contentType: string | null, contentLength: number): boolean {
  if (!contentType) return false;
  if (contentLength < config.performance.compression.threshold) return false;
  
  const mimeType = contentType.split(';')[0].trim().toLowerCase();
  return COMPRESSIBLE_TYPES.has(mimeType);
}

/**
 * Determines cache settings for a given URL
 */
function getCacheSettings(url: string): {
  maxAge: number;
  immutable: boolean;
  mustRevalidate: boolean;
  staleWhileRevalidate?: number;
} {
  // Static assets - long-term caching
  if (STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url))) {
    return {
      maxAge: config.performance.caching.staticAssets.maxAge,
      immutable: config.performance.caching.staticAssets.immutable,
      mustRevalidate: false
    };
  }

  // API endpoints - short-term caching
  if (API_PATTERNS.some(pattern => pattern.test(url))) {
    return {
      maxAge: config.performance.caching.api.maxAge,
      immutable: false,
      mustRevalidate: true,
      staleWhileRevalidate: config.performance.caching.api.staleWhileRevalidate
    };
  }

  // Default - no caching for dynamic content
  return {
    maxAge: 0,
    immutable: false,
    mustRevalidate: true
  };
}

/**
 * Builds Cache-Control header value
 */
function buildCacheControlHeader(settings: ReturnType<typeof getCacheSettings>): string {
  const directives: string[] = [];

  if (settings.maxAge > 0) {
    directives.push(`max-age=${settings.maxAge}`);
    
    if (settings.immutable) {
      directives.push('immutable');
    }
    
    if (settings.staleWhileRevalidate) {
      directives.push(`stale-while-revalidate=${settings.staleWhileRevalidate}`);
    }
    
    directives.push('public');
  } else {
    directives.push('no-cache');
    
    if (settings.mustRevalidate) {
      directives.push('must-revalidate');
    }
  }

  return directives.join(', ');
}

/**
 * Adds security headers to response
 */
function addSecurityHeaders(response: Response, url: string): void {
  const headers = response.headers;

  // X-Content-Type-Options
  headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  headers.set('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (basic) - Disabled for now to fix image loading issues
  // if (url.endsWith('.html') || !url.includes('.')) {
  //   const csp = [
  //     "default-src 'self'",
  //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.gstatic.com https://apis.google.com https://accounts.google.com",
  //     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  //     "font-src 'self' https://fonts.gstatic.com",
  //     "img-src * data: https: http: blob:",
  //     "connect-src 'self' https://api.stripe.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
  //     "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://www.google.com",
  //     "object-src 'none'",
  //     "base-uri 'self'"
  //   ].join('; ');

  //   headers.set('Content-Security-Policy', csp);
  // }

  // Permissions Policy
  headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );
}

/**
 * Compression and caching middleware
 */
export const compressionMiddleware: Handle = async ({ event, resolve }) => {
  const { url, request } = event;
  const pathname = url.pathname;

  // Get response from SvelteKit
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => {
      // Minify HTML in production
      if (config.app.environment === 'production') {
        return html
          .replace(/>\s+</g, '><') // Remove whitespace between tags
          .replace(/\s+/g, ' ') // Collapse multiple spaces
          .trim();
      }
      return html;
    }
  });

  // Clone response to modify headers
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });

  // Add cache headers
  const cacheSettings = getCacheSettings(pathname);
  const cacheControl = buildCacheControlHeader(cacheSettings);
  modifiedResponse.headers.set('Cache-Control', cacheControl);

  // Add ETag for static assets
  if (config.performance.caching.staticAssets.etag && cacheSettings.maxAge > 0) {
    const etag = `"${Date.now()}-${pathname.length}"`;
    modifiedResponse.headers.set('ETag', etag);
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }
  }

  // Add Vary header for content negotiation
  modifiedResponse.headers.set('Vary', 'Accept-Encoding, Accept');

  // Add security headers
  addSecurityHeaders(modifiedResponse, pathname);

  // Add performance headers
  modifiedResponse.headers.set('X-Response-Time', Date.now().toString());

  // Compression is handled by Cloud Run/nginx in production
  // But we can add the header to indicate compression support
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  if (acceptEncoding.includes('gzip')) {
    const contentType = modifiedResponse.headers.get('content-type');
    const contentLength = parseInt(modifiedResponse.headers.get('content-length') || '0', 10);
    
    if (shouldCompress(contentType, contentLength)) {
      modifiedResponse.headers.set('Content-Encoding', 'gzip');
    }
  }

  return modifiedResponse;
};

/**
 * Static file serving with optimized headers
 */
export function serveStaticFile(filePath: string, contentType: string): Response {
  const cacheSettings = getCacheSettings(filePath);
  const cacheControl = buildCacheControlHeader(cacheSettings);

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff'
  });

  // Add ETag for static files
  if (config.performance.caching.staticAssets.etag) {
    const etag = `"static-${Date.now()}"`;
    headers.set('ETag', etag);
  }

  // For immutable assets, add immutable directive
  if (cacheSettings.immutable) {
    headers.set('Cache-Control', `${cacheControl}, immutable`);
  }

  return new Response(null, { headers });
}

/**
 * Preload critical resources
 */
export function addPreloadHeaders(response: Response, resources: Array<{
  href: string;
  as: string;
  type?: string;
  crossorigin?: boolean;
}>): void {
  const preloadLinks = resources.map(resource => {
    let link = `<${resource.href}>; rel=preload; as=${resource.as}`;
    
    if (resource.type) {
      link += `; type=${resource.type}`;
    }
    
    if (resource.crossorigin) {
      link += '; crossorigin';
    }
    
    return link;
  });

  if (preloadLinks.length > 0) {
    response.headers.set('Link', preloadLinks.join(', '));
  }
}

export default compressionMiddleware;
