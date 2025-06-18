// Input validation utilities for secure data handling
// Provides comprehensive validation for all user inputs

import type { CreateCommentInput, CreateArticleInput, ValidationError } from '$lib/types/prisma';

/**
 * Validate comment input data
 */
export function validateCommentInput(input: CreateCommentInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate content
  if (!input.content || typeof input.content !== 'string') {
    errors.push({
      field: 'content',
      message: 'Comment content is required',
      code: 'REQUIRED'
    });
  } else {
    const trimmedContent = input.content.trim();
    
    if (trimmedContent.length === 0) {
      errors.push({
        field: 'content',
        message: 'Comment content cannot be empty',
        code: 'EMPTY'
      });
    } else if (trimmedContent.length < 3) {
      errors.push({
        field: 'content',
        message: 'Comment must be at least 3 characters long',
        code: 'TOO_SHORT'
      });
    } else if (trimmedContent.length > 5000) {
      errors.push({
        field: 'content',
        message: 'Comment cannot exceed 5000 characters',
        code: 'TOO_LONG'
      });
    }

    // Check for spam patterns
    if (isSpamContent(trimmedContent)) {
      errors.push({
        field: 'content',
        message: 'Comment appears to be spam',
        code: 'SPAM_DETECTED'
      });
    }
  }

  // Validate articleId
  if (!input.articleId || typeof input.articleId !== 'string') {
    errors.push({
      field: 'articleId',
      message: 'Article ID is required',
      code: 'REQUIRED'
    });
  } else if (!isValidId(input.articleId)) {
    errors.push({
      field: 'articleId',
      message: 'Invalid article ID format',
      code: 'INVALID_FORMAT'
    });
  }

  // Validate parentId if provided
  if (input.parentId !== undefined) {
    if (input.parentId !== null && (!input.parentId || typeof input.parentId !== 'string')) {
      errors.push({
        field: 'parentId',
        message: 'Invalid parent comment ID',
        code: 'INVALID_FORMAT'
      });
    } else if (input.parentId && !isValidId(input.parentId)) {
      errors.push({
        field: 'parentId',
        message: 'Invalid parent comment ID format',
        code: 'INVALID_FORMAT'
      });
    }
  }

  return errors;
}

/**
 * Validate article input data
 */
export function validateArticleInput(input: CreateArticleInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate title
  if (!input.title || typeof input.title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Article title is required',
      code: 'REQUIRED'
    });
  } else {
    const trimmedTitle = input.title.trim();
    
    if (trimmedTitle.length === 0) {
      errors.push({
        field: 'title',
        message: 'Article title cannot be empty',
        code: 'EMPTY'
      });
    } else if (trimmedTitle.length < 5) {
      errors.push({
        field: 'title',
        message: 'Article title must be at least 5 characters long',
        code: 'TOO_SHORT'
      });
    } else if (trimmedTitle.length > 200) {
      errors.push({
        field: 'title',
        message: 'Article title cannot exceed 200 characters',
        code: 'TOO_LONG'
      });
    }
  }

  // Validate content
  if (!input.content || typeof input.content !== 'string') {
    errors.push({
      field: 'content',
      message: 'Article content is required',
      code: 'REQUIRED'
    });
  } else {
    const trimmedContent = input.content.trim();
    
    if (trimmedContent.length === 0) {
      errors.push({
        field: 'content',
        message: 'Article content cannot be empty',
        code: 'EMPTY'
      });
    } else if (trimmedContent.length < 50) {
      errors.push({
        field: 'content',
        message: 'Article content must be at least 50 characters long',
        code: 'TOO_SHORT'
      });
    } else if (trimmedContent.length > 100000) {
      errors.push({
        field: 'content',
        message: 'Article content cannot exceed 100,000 characters',
        code: 'TOO_LONG'
      });
    }
  }

  // Validate excerpt if provided
  if (input.excerpt !== undefined && input.excerpt !== null) {
    if (typeof input.excerpt !== 'string') {
      errors.push({
        field: 'excerpt',
        message: 'Article excerpt must be a string',
        code: 'INVALID_TYPE'
      });
    } else if (input.excerpt.length > 500) {
      errors.push({
        field: 'excerpt',
        message: 'Article excerpt cannot exceed 500 characters',
        code: 'TOO_LONG'
      });
    }
  }

  // Validate cover image URL if provided
  if (input.coverImage !== undefined && input.coverImage !== null) {
    if (typeof input.coverImage !== 'string') {
      errors.push({
        field: 'coverImage',
        message: 'Cover image must be a valid URL',
        code: 'INVALID_TYPE'
      });
    } else if (!isValidUrl(input.coverImage)) {
      errors.push({
        field: 'coverImage',
        message: 'Cover image must be a valid URL',
        code: 'INVALID_URL'
      });
    }
  }

  // Validate tags if provided
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be an array',
        code: 'INVALID_TYPE'
      });
    } else {
      if (input.tags.length > 10) {
        errors.push({
          field: 'tags',
          message: 'Cannot have more than 10 tags',
          code: 'TOO_MANY'
        });
      }

      input.tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push({
            field: `tags[${index}]`,
            message: 'Each tag must be a string',
            code: 'INVALID_TYPE'
          });
        } else if (tag.trim().length === 0) {
          errors.push({
            field: `tags[${index}]`,
            message: 'Tags cannot be empty',
            code: 'EMPTY'
          });
        } else if (tag.length > 50) {
          errors.push({
            field: `tags[${index}]`,
            message: 'Each tag cannot exceed 50 characters',
            code: 'TOO_LONG'
          });
        }
      });
    }
  }

  // Validate meta fields if provided
  if (input.metaTitle !== undefined && input.metaTitle !== null) {
    if (typeof input.metaTitle !== 'string') {
      errors.push({
        field: 'metaTitle',
        message: 'Meta title must be a string',
        code: 'INVALID_TYPE'
      });
    } else if (input.metaTitle.length > 60) {
      errors.push({
        field: 'metaTitle',
        message: 'Meta title should not exceed 60 characters for SEO',
        code: 'TOO_LONG'
      });
    }
  }

  if (input.metaDescription !== undefined && input.metaDescription !== null) {
    if (typeof input.metaDescription !== 'string') {
      errors.push({
        field: 'metaDescription',
        message: 'Meta description must be a string',
        code: 'INVALID_TYPE'
      });
    } else if (input.metaDescription.length > 160) {
      errors.push({
        field: 'metaDescription',
        message: 'Meta description should not exceed 160 characters for SEO',
        code: 'TOO_LONG'
      });
    }
  }

  return errors;
}

/**
 * Check if a string is a valid ID format (CUID)
 */
function isValidId(id: string): boolean {
  // CUID format: starts with 'c' followed by 24 alphanumeric characters
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Basic spam detection for content
 */
function isSpamContent(content: string): boolean {
  const spamPatterns = [
    /(.)\1{10,}/i, // Repeated characters
    /(https?:\/\/[^\s]+){3,}/i, // Multiple URLs
    /\b(buy now|click here|free money|make money fast|guaranteed|limited time)\b/i,
    /[A-Z]{20,}/, // Excessive caps
    /(.{1,10})\1{5,}/ // Repeated phrases
  ];

  return spamPatterns.some(pattern => pattern.test(content));
}

/**
 * Sanitize and validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validate username format
 */
export function validateUsername(username: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!username || typeof username !== 'string') {
    errors.push({
      field: 'username',
      message: 'Username is required',
      code: 'REQUIRED'
    });
    return errors;
  }

  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    errors.push({
      field: 'username',
      message: 'Username must be at least 3 characters long',
      code: 'TOO_SHORT'
    });
  }
  
  if (trimmed.length > 30) {
    errors.push({
      field: 'username',
      message: 'Username cannot exceed 30 characters',
      code: 'TOO_LONG'
    });
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    errors.push({
      field: 'username',
      message: 'Username can only contain letters, numbers, underscores, and hyphens',
      code: 'INVALID_CHARACTERS'
    });
  }

  return errors;
}
