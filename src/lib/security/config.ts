// Security configuration for GearGrab
export const SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    sessionDuration: 5 * 24 * 60 * 60 * 1000, // 5 days in milliseconds
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8,
    requireStrongPassword: true,
    requireEmailVerification: true,
    enableTwoFactor: false, // TODO: Implement 2FA
    sessionCookieName: '__session',
    sessionIdCookieName: '__session_id'
  },

  // Rate limiting configuration
  rateLimit: {
    // Authentication endpoints
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      skipSuccessfulRequests: true
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registrations per hour per IP
      skipSuccessfulRequests: false
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 reset attempts per hour
      skipSuccessfulRequests: true
    },

    // API endpoints
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      skipSuccessfulRequests: false
    },
    search: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 searches per minute
      skipSuccessfulRequests: false
    },
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 uploads per hour
      skipSuccessfulRequests: false
    },
    payment: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // 20 payment attempts per hour
      skipSuccessfulRequests: true
    },

    // Admin endpoints
    admin: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // 200 requests per window
      skipSuccessfulRequests: false
    }
  },

  // File upload security
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB default
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedDocumentTypes: ['application/pdf', 'text/plain'],
    allowedVideoTypes: [], // No video uploads for now
    scanForMalware: false, // TODO: Implement malware scanning
    quarantineDirectory: 'quarantine/',
    virusScanTimeout: 30000, // 30 seconds
    
    // File type specific limits
    profileImage: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    },
    listingImage: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    },
    messageAttachment: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'text/plain'
      ]
    },
    verificationDocument: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    }
  },

  // Input validation
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxObjectDepth: 5,
    sanitizeHtml: true,
    stripScriptTags: true,
    allowedHtmlTags: [], // No HTML allowed by default
    
    // Specific field limits
    email: {
      maxLength: 254,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    name: {
      minLength: 1,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/
    },
    phone: {
      pattern: /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
    },
    zipCode: {
      pattern: /^\d{5}(-\d{4})?$/
    }
  },

  // Security headers
  headers: {
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // TODO: Remove and use nonces
        "https://js.stripe.com",
        "https://www.gstatic.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // TODO: Remove and use nonces
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com"
      ],
      frameSrc: [
        "https://js.stripe.com"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: true
    },
    
    // Other security headers
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload'
  },

  // Audit logging
  audit: {
    retentionDays: 365, // Keep audit logs for 1 year
    logLevels: ['info', 'warning', 'error', 'critical'],
    enableRealTimeAlerts: true,
    alertThresholds: {
      failedLogins: 5, // Alert after 5 failed logins from same IP
      suspiciousActivity: 3, // Alert after 3 suspicious events
      adminActions: 1 // Alert on all admin actions
    },
    
    // Events to always log
    criticalEvents: [
      'unauthorized_access_attempt',
      'admin_privilege_granted',
      'admin_privilege_revoked',
      'data_export',
      'data_deletion',
      'system_configuration_changed',
      'security_scan_detected'
    ]
  },

  // IP blocking and geolocation
  ipSecurity: {
    enableGeoBlocking: false, // TODO: Implement geolocation blocking
    blockedCountries: [], // ISO country codes
    allowedCountries: [], // If specified, only these countries are allowed
    enableVPNDetection: false, // TODO: Implement VPN/proxy detection
    blockKnownVPNs: false,
    blockTorNodes: true,
    
    // Automatic blocking thresholds
    autoBlock: {
      enabled: true,
      failedLoginThreshold: 10, // Block IP after 10 failed logins
      suspiciousActivityThreshold: 5, // Block IP after 5 suspicious events
      blockDuration: 24 * 60 * 60 * 1000, // 24 hours
      maxBlockDuration: 7 * 24 * 60 * 60 * 1000 // 7 days max
    }
  },

  // Encryption and hashing
  crypto: {
    hashRounds: 12, // bcrypt rounds
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'change-me-in-production',
    
    // Sensitive data encryption
    encryptSensitiveData: true,
    encryptedFields: [
      'ssn',
      'driverLicense',
      'bankAccount',
      'creditCard'
    ]
  },

  // Monitoring and alerting
  monitoring: {
    enableHealthChecks: true,
    healthCheckInterval: 5 * 60 * 1000, // 5 minutes
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    
    // Alert channels
    alerts: {
      email: process.env.SECURITY_ALERT_EMAIL || 'security@geargrab.co',
      slack: process.env.SLACK_WEBHOOK_URL,
      sms: process.env.TWILIO_PHONE_NUMBER
    },
    
    // Metrics to track
    metrics: [
      'request_rate',
      'error_rate',
      'response_time',
      'failed_logins',
      'security_events',
      'active_sessions'
    ]
  },

  // Development vs Production settings
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    
    // Development-specific settings
    development: {
      enableDebugLogging: true,
      allowInsecureConnections: true,
      skipCertificateValidation: false,
      enableTestEndpoints: true
    },
    
    // Production-specific settings
    production: {
      enableDebugLogging: false,
      allowInsecureConnections: false,
      skipCertificateValidation: false,
      enableTestEndpoints: false,
      requireHTTPS: true,
      enableHSTS: true
    }
  }
};

// Helper functions
export function getSecurityConfig() {
  return SECURITY_CONFIG;
}

export function isProduction() {
  return SECURITY_CONFIG.environment.isProduction;
}

export function isDevelopment() {
  return SECURITY_CONFIG.environment.isDevelopment;
}

export function getCSPHeader(): string {
  const csp = SECURITY_CONFIG.headers.contentSecurityPolicy;
  
  const directives = [
    `default-src ${csp.defaultSrc.join(' ')}`,
    `script-src ${csp.scriptSrc.join(' ')}`,
    `style-src ${csp.styleSrc.join(' ')}`,
    `font-src ${csp.fontSrc.join(' ')}`,
    `img-src ${csp.imgSrc.join(' ')}`,
    `connect-src ${csp.connectSrc.join(' ')}`,
    `frame-src ${csp.frameSrc.join(' ')}`,
    `object-src ${csp.objectSrc.join(' ')}`,
    `base-uri ${csp.baseUri.join(' ')}`
  ];
  
  if (csp.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }
  
  return directives.join('; ');
}

export function getRateLimitConfig(endpoint: string) {
  return SECURITY_CONFIG.rateLimit[endpoint as keyof typeof SECURITY_CONFIG.rateLimit] || 
         SECURITY_CONFIG.rateLimit.api;
}
