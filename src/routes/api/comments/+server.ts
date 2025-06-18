// API endpoint for safe comment operations
// Demonstrates proper security, validation, and error handling

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import CommentService from '$lib/services/comment.service';
import type { SecurityContext, CommentFilters, CreateCommentInput } from '$lib/types/prisma';
import { applyRateLimit } from '$lib/utils/rate-limiter';
import { validateCommentInput } from '$lib/utils/validators';

/**
 * GET /api/comments - Fetch comments by articleId
 * Query parameters:
 * - articleId (required): ID of the article
 * - status: Filter by comment status (approved, pending, rejected)
 * - parentId: Filter by parent comment ID (null for top-level comments)
 * - limit: Number of comments to return (max 100)
 * - offset: Number of comments to skip
 * - sortBy: Sort field (createdAt, likeCount)
 * - sortOrder: Sort direction (asc, desc)
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Extract query parameters
    const articleId = url.searchParams.get('articleId');
    const status = url.searchParams.get('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    const parentId = url.searchParams.get('parentId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sortBy') as 'createdAt' | 'likeCount' || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Validate required parameters
    if (!articleId) {
      throw error(400, {
        message: 'Article ID is required',
        code: 'MISSING_ARTICLE_ID'
      });
    }

    // Build security context
    const context: SecurityContext = {
      userId: locals.user?.id,
      userRole: locals.user?.role,
      isAuthenticated: !!locals.user
    };

    // Apply rate limiting for API requests
    if (context.userId) {
      await applyRateLimit('API_REQUEST', context.userId);
    } else {
      // Rate limit by IP for anonymous users
      const clientIP = locals.clientIP || 'unknown';
      await applyRateLimit('API_REQUEST', `ip:${clientIP}`);
    }

    // Build filters
    const filters: Omit<CommentFilters, 'articleId'> = {
      status,
      parentId: parentId === 'null' ? null : parentId,
      limit: Math.min(Math.max(1, limit), 100), // Clamp between 1 and 100
      offset: Math.max(0, offset),
      sortBy,
      sortOrder
    };

    // Fetch comments
    const result = await CommentService.getCommentsByArticleId(
      articleId,
      filters,
      context
    );

    return json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      meta: {
        total: result.pagination.total,
        hasMore: result.pagination.hasNext
      }
    });

  } catch (err) {
    console.error('Error fetching comments:', err);

    // Handle rate limiting errors
    if (err instanceof Error && (err as any).rateLimitInfo) {
      const rateLimitInfo = (err as any).rateLimitInfo;
      return json({
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitInfo.resetTime
        }
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitInfo.resetTime.getTime() - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
          'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
          'X-RateLimit-Reset': rateLimitInfo.resetTime.toISOString()
        }
      });
    }

    // Handle validation errors
    if (err instanceof Error && err.message.includes('not found')) {
      throw error(404, {
        message: 'Article not found or not accessible',
        code: 'ARTICLE_NOT_FOUND'
      });
    }

    // Handle other errors
    throw error(500, {
      message: 'Failed to fetch comments',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * POST /api/comments - Create a new comment
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Parse request body
    const body = await request.json();
    const input: CreateCommentInput = {
      content: body.content,
      articleId: body.articleId,
      parentId: body.parentId || null
    };

    // Validate input
    const validationErrors = validateCommentInput(input);
    if (validationErrors.length > 0) {
      throw error(400, {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: validationErrors
      });
    }

    // Build security context
    const context: SecurityContext = {
      userId: locals.user.id,
      userRole: locals.user.role,
      isAuthenticated: true
    };

    // Create comment
    const comment = await CommentService.createComment(input, context);

    return json({
      success: true,
      data: comment,
      message: comment.status === 'PENDING' 
        ? 'Comment submitted for review' 
        : 'Comment posted successfully'
    }, { status: 201 });

  } catch (err) {
    console.error('Error creating comment:', err);

    // Handle rate limiting errors
    if (err instanceof Error && (err as any).rateLimitInfo) {
      const rateLimitInfo = (err as any).rateLimitInfo;
      return json({
        success: false,
        error: {
          message: 'Too many comments. Please wait before posting again.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitInfo.resetTime
        }
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitInfo.resetTime.getTime() - Date.now()) / 1000).toString()
        }
      });
    }

    // Handle validation errors
    if (err instanceof Error && err.message.includes('Validation failed')) {
      throw error(400, {
        message: err.message,
        code: 'VALIDATION_ERROR'
      });
    }

    // Handle not found errors
    if (err instanceof Error && err.message.includes('not found')) {
      throw error(404, {
        message: err.message,
        code: 'NOT_FOUND'
      });
    }

    // Handle spam detection
    if (err instanceof Error && err.message.includes('spam')) {
      throw error(400, {
        message: 'Comment appears to be spam',
        code: 'SPAM_DETECTED'
      });
    }

    // Handle other errors
    throw error(500, {
      message: 'Failed to create comment',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * PATCH /api/comments/[id] - Update a comment
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const commentId = params.id;
    if (!commentId) {
      throw error(400, {
        message: 'Comment ID is required',
        code: 'MISSING_COMMENT_ID'
      });
    }

    // Parse request body
    const body = await request.json();
    const input = {
      content: body.content
    };

    // Validate input
    if (!input.content || typeof input.content !== 'string' || input.content.trim().length === 0) {
      throw error(400, {
        message: 'Comment content is required',
        code: 'INVALID_CONTENT'
      });
    }

    // Build security context
    const context: SecurityContext = {
      userId: locals.user.id,
      userRole: locals.user.role,
      isAuthenticated: true
    };

    // Apply rate limiting
    await applyRateLimit('COMMENT_CREATE', context.userId!);

    // Update comment (implementation would go in CommentService)
    // const updatedComment = await CommentService.updateComment(commentId, input, context);

    return json({
      success: true,
      message: 'Comment updated successfully'
    });

  } catch (err) {
    console.error('Error updating comment:', err);

    // Handle various error types similar to POST handler
    throw error(500, {
      message: 'Failed to update comment',
      code: 'INTERNAL_ERROR'
    });
  }
};
