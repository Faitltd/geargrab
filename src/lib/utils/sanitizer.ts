// HTML sanitization utilities for secure content handling
// Prevents XSS attacks and ensures safe content rendering

/**
 * Sanitize HTML content to prevent XSS attacks
 * This is a basic implementation - consider using DOMPurify for production
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, ''); // onclick, onload, etc.
  sanitized = sanitized.replace(/\s*javascript\s*:/gi, ''); // javascript: protocol
  sanitized = sanitized.replace(/\s*vbscript\s*:/gi, ''); // vbscript: protocol
  sanitized = sanitized.replace(/\s*data\s*:/gi, ''); // data: protocol (can be dangerous)
  
  // Remove dangerous tags
  const dangerousTags = [
    'script', 'object', 'embed', 'link', 'style', 'meta', 'iframe', 
    'frame', 'frameset', 'applet', 'base', 'form', 'input', 'button',
    'textarea', 'select', 'option'
  ];
  
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Allow only safe HTML tags for comments
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'code', 'pre', 'blockquote'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // For allowed tags, still remove any attributes to be extra safe
      return `<${tagName.toLowerCase()}>`;
    }
    return ''; // Remove disallowed tags
  });

  // Clean up any remaining dangerous patterns
  sanitized = sanitized.replace(/&lt;script/gi, '');
  sanitized = sanitized.replace(/&lt;\/script/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize plain text content (for comments that don't allow HTML)
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove any HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (trimmed.startsWith('javascript:') || 
      trimmed.startsWith('vbscript:') || 
      trimmed.startsWith('data:') ||
      trimmed.startsWith('file:')) {
    return '';
  }

  // Only allow http, https, and relative URLs
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('/') &&
      !trimmed.startsWith('./') &&
      !trimmed.startsWith('../')) {
    return '';
  }

  return url.trim();
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\.+/, '')
    .trim();

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0));
    sanitized = ext ? `${name}.${ext}` : name;
  }

  return sanitized || 'untitled';
}

/**
 * Sanitize search query to prevent injection attacks
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove special characters that could be used for injection
  let sanitized = query
    .replace(/[<>'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  return sanitized;
}

/**
 * Sanitize user input for database queries
 */
export function sanitizeDbInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove SQL injection patterns
  let sanitized = input
    .replace(/['";]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/\bUNION\b/gi, '')
    .replace(/\bSELECT\b/gi, '')
    .replace(/\bINSERT\b/gi, '')
    .replace(/\bUPDATE\b/gi, '')
    .replace(/\bDELETE\b/gi, '')
    .replace(/\bDROP\b/gi, '')
    .replace(/\bCREATE\b/gi, '')
    .replace(/\bALTER\b/gi, '')
    .trim();

  return sanitized;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Basic email sanitization
  const sanitized = email
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '');

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Comprehensive content sanitization for user-generated content
 */
export function sanitizeUserContent(content: string, allowHtml: boolean = false): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  if (allowHtml) {
    return sanitizeHtml(content);
  } else {
    return sanitizeText(content);
  }
}

/**
 * Rate limiting key sanitization
 */
export function sanitizeRateLimitKey(key: string): string {
  if (!key || typeof key !== 'string') {
    return 'unknown';
  }

  return key
    .replace(/[^a-zA-Z0-9:_-]/g, '')
    .substring(0, 100);
}
