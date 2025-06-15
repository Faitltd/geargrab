# Security Guide

This document outlines the security measures implemented in GearGrab and provides guidelines for maintaining security.

## Security Features Implemented

### 1. Authentication & Authorization

- **Firebase Authentication**: Secure user authentication with email/password and Google OAuth
- **Session Management**: HTTP-only cookies with secure flags and proper expiration
- **JWT Verification**: Server-side token verification for all protected routes
- **Role-based Access Control**: User and admin role separation

### 2. Input Validation & Sanitization

- **Comprehensive Validation**: All user inputs are validated using custom validation functions
- **XSS Prevention**: HTML sanitization to prevent cross-site scripting attacks
- **SQL Injection Prevention**: Firestore queries use parameterized queries
- **File Upload Security**: File type and size validation for uploads

### 3. Rate Limiting

- **API Rate Limiting**: Different limits for different endpoint types
- **Authentication Rate Limiting**: Stricter limits for auth endpoints
- **Payment Rate Limiting**: Special limits for payment operations
- **IP-based Tracking**: Rate limits tracked per IP address

### 4. Security Headers

- **Content Security Policy (CSP)**: Strict CSP to prevent XSS and injection attacks
- **HSTS**: HTTP Strict Transport Security for HTTPS enforcement
- **X-Frame-Options**: Prevent clickjacking attacks
- **X-Content-Type-Options**: Prevent MIME type sniffing
- **Referrer Policy**: Control referrer information leakage

### 5. Data Protection

- **Sensitive Data Sanitization**: Automatic removal of sensitive data from logs
- **Environment Variable Security**: Proper handling of secrets and API keys
- **Database Security Rules**: Firestore security rules for data access control
- **Encryption**: All data in transit encrypted with TLS

### 6. Payment Security

- **Stripe Integration**: PCI-compliant payment processing
- **Payment Intent Verification**: Server-side verification of payment intents
- **Customer Data Protection**: Secure handling of payment information
- **Manual Capture**: Payments captured only after booking confirmation

## Environment Variables

### Required Production Variables

```bash
# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key

# Security
SESSION_SECRET=your_32_character_secret_key
CORS_ORIGINS=https://geargrab.co,https://www.geargrab.co

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Rate Limiting (Optional)
RATE_LIMITING_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging (Optional)
LOG_LEVEL=info
LOG_CONSOLE=true
LOG_FILE=false
```

### Development Variables

```bash
# Firebase Client (for browser)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Stripe Client
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Security Best Practices

### 1. API Endpoints

- Always use the `asyncHandler` wrapper for error handling
- Apply rate limiting with `rateLimit()` middleware
- Validate all inputs with validation functions
- Use `requireAuth()` for protected endpoints
- Sanitize data before database operations

```typescript
export const POST: RequestHandler = asyncHandler(async ({ request, locals, ...event }) => {
  const rateLimitResponse = rateLimit('api')(event);
  if (rateLimitResponse) return rateLimitResponse;
  
  const authResponse = requireAuth({ locals } as any);
  if (authResponse) return authResponse;
  
  // Your endpoint logic here
});
```

### 2. Input Validation

Always validate and sanitize user inputs:

```typescript
const emailValidation = validateEmail(input.email);
if (!emailValidation.isValid) {
  throw new ValidationError(emailValidation.error!);
}

const sanitizedTitle = sanitizeString(input.title, {
  required: true,
  maxLength: 100
});
```

### 3. Error Handling

Use custom error classes for consistent error handling:

```typescript
// Validation errors
throw new ValidationError('Invalid input data');

// Authentication errors
throw new AuthenticationError('Login required');

// Authorization errors
throw new AuthorizationError('Insufficient permissions');

// Not found errors
throw new NotFoundError('Resource not found');
```

### 4. Logging

Sanitize sensitive data before logging:

```typescript
import { sanitizeForLogging } from '$lib/server/config';

const sanitizedData = sanitizeForLogging(userData);
console.log('User data:', sanitizedData);
```

## Security Monitoring

### Health Checks

Monitor application health with the `/api/health` endpoint:

```bash
curl https://your-domain.com/api/health
```

### Rate Limiting Monitoring

Monitor rate limiting effectiveness:
- Check for 429 responses in logs
- Monitor request patterns
- Adjust limits based on legitimate usage

### Error Monitoring

Monitor for security-related errors:
- Authentication failures
- Authorization violations
- Validation errors
- Rate limit violations

## Incident Response

### 1. Security Incident Detection

Monitor for:
- Unusual authentication patterns
- High error rates
- Rate limit violations
- Suspicious payment activity

### 2. Response Procedures

1. **Immediate Response**:
   - Block suspicious IP addresses
   - Revoke compromised sessions
   - Disable affected accounts if necessary

2. **Investigation**:
   - Review logs for attack patterns
   - Identify affected users/data
   - Document incident details

3. **Recovery**:
   - Fix security vulnerabilities
   - Update security measures
   - Notify affected users if required

## Security Updates

### Regular Maintenance

1. **Dependency Updates**: Regularly update npm packages
2. **Security Audits**: Run `npm audit` regularly
3. **Firestore Rules**: Review and update security rules
4. **Environment Variables**: Rotate secrets periodically

### Security Testing

1. **Input Validation Testing**: Test all input validation
2. **Authentication Testing**: Verify auth flows work correctly
3. **Authorization Testing**: Ensure proper access controls
4. **Rate Limiting Testing**: Verify rate limits are effective

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do not** create a public GitHub issue
2. Email security concerns to: security@geargrab.co
3. Include detailed information about the vulnerability
4. Allow reasonable time for response and fix

## Compliance

This application implements security measures to comply with:

- **PCI DSS**: For payment card data protection
- **GDPR**: For user data protection (where applicable)
- **CCPA**: For California consumer privacy (where applicable)

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SvelteKit Security](https://kit.svelte.dev/docs/security)
