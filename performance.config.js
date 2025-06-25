// Performance optimization configuration
export const performanceConfig = {
  // Cache settings
  cache: {
    immutableAssets: 31536000, // 1 year for hashed assets
    staticAssets: 86400,       // 1 day for images/fonts
    htmlPages: 3600,           // 1 hour for HTML with revalidation
    apiResponses: 300          // 5 minutes for API responses
  },
  
  // Compression settings
  compression: {
    level: 6,                  // Good balance of compression vs CPU
    threshold: 1024,           // Only compress files > 1KB
    types: [
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'text/xml',
      'application/xml',
      'image/svg+xml'
    ]
  },
  
  // Image optimization
  images: {
    formats: ['avif', 'webp', 'jpg'],
    quality: 80,
    sizes: [320, 640, 768, 1024, 1280, 1920],
    lazyLoading: true,
    placeholder: 'blur'
  },
  
  // Bundle optimization
  bundle: {
    splitChunks: true,
    vendorChunk: true,
    minify: true,
    treeshake: true,
    removeConsole: true // Remove console.logs in production
  },
  
  // Performance thresholds (Web Vitals)
  thresholds: {
    lcp: { good: 2500, poor: 4000 },      // Largest Contentful Paint (ms)
    fid: { good: 100, poor: 300 },        // First Input Delay (ms)
    cls: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
    fcp: { good: 1800, poor: 3000 },      // First Contentful Paint (ms)
    ttfb: { good: 800, poor: 1800 }       // Time to First Byte (ms)
  },
  
  // Resource hints
  preload: [
    'fonts/inter.woff2',
    '_app/immutable/entry/start.js',
    '_app/immutable/entry/app.js'
  ],
  
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://firestore.googleapis.com',
    'https://js.stripe.com'
  ],
  
  // Security headers
  security: {
    contentTypeOptions: 'nosniff',
    frameOptions: 'DENY',
    xssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    dnsPrefetchControl: 'on'
  }
};

export default performanceConfig;
