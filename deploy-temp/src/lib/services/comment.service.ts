/**
 * Comment Service
 *
 * This service provides safe and secure methods for fetching, creating,
 * and managing comments with proper authorization and validation.
 */

import { prisma } from '$lib/database/prisma';
import type {
  SecurityContext,
  CommentFilters,
  CommentQueryOptions,
  CommentResponse,
  PaginatedResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentValidationResult
} from '$lib/types/prisma';
import type { CommentStatus } from '@prisma/client';

export class CommentService {
  /**
   * Safely fetch comments by article ID with proper authorization
   */
  static async getCommentsByArticleId(
    articleId: string,
    filters: Omit<CommentFilters, 'articleId'> = {},
    options: CommentQueryOptions = {},
    context: SecurityContext
  ): Promise<PaginatedResponse<CommentResponse>> {
    // Validate articleId
    if (!articleId || typeof articleId !== 'string' || articleId.length < 1) {
      throw new Error('Invalid article ID');
    }

    // Verify article exists and is accessible
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        OR: [
          { isPublished: true },
          { authorId: context.userId }, // Author can see their own drafts
          ...(context.userRole === 'ADMIN' || context.userRole === 'MODERATOR'
            ? [{}] // Admins/moderators can see all
            : []
          )
        ]
      }
    });

    if (!article) {
      throw new Error('Article not found or access denied');
    }

    // Build where clause based on filters and permissions
    const whereClause = this.buildCommentWhereClause(articleId, filters, context);

    // Set pagination defaults
    const limit = Math.min(options.limit || 20, 100); // Max 100 comments per request
    const offset = options.offset || 0;

    // Build order by clause
    const orderBy = this.buildOrderByClause(options);

    // Fetch comments with author information
    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          _count: {
            select: {
              replies: true,
              likes: true
            }
          },
          ...(options.includeReplies && {
            replies: {
              where: {
                status: this.getAllowedCommentStatuses(context)
              },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    avatar: true
                  }
                },
                _count: {
                  select: {
                    likes: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' },
              take: options.maxReplyDepth || 5
            }
          })
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.comment.count({ where: whereClause })
    ]);

    // Get user's likes if authenticated
    const userLikes = context.isAuthenticated && context.userId
      ? await this.getUserLikes(
          comments.map(c => c.id).concat(
            comments.flatMap(c => c.replies?.map(r => r.id) || [])
          ),
          context.userId
        )
      : new Set<string>();

    // Transform comments to response format
    const transformedComments = comments.map(comment =>
      this.transformCommentToResponse(comment, context, userLikes)
    );

    return {
      data: transformedComments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
        nextCursor: offset + limit < totalCount
          ? Buffer.from(`${offset + limit}`).toString('base64')
          : undefined
      }
    };
  }

  /**
   * Create a new comment with validation and authorization
   */
  static async createComment(
    data: CreateCommentRequest,
    context: SecurityContext
  ): Promise<CommentResponse> {
    if (!context.isAuthenticated || !context.userId) {
      throw new Error('Authentication required');
    }

    // Validate comment content
    const validation = this.validateCommentContent(data.content);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Verify article exists and allows comments
    const article = await prisma.article.findFirst({
      where: {
        id: data.articleId,
        isPublished: true
      }
    });

    if (!article) {
      throw new Error('Article not found or comments not allowed');
    }

    // If replying to a comment, verify parent exists
    if (data.parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: data.parentId,
          articleId: data.articleId,
          status: { in: ['APPROVED', 'PENDING'] }
        }
      });

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
    }

    // Create comment with appropriate status
    const commentStatus = this.getInitialCommentStatus(context);

    const comment = await prisma.comment.create({
      data: {
        content: validation.sanitizedContent!,
        articleId: data.articleId,
        authorId: context.userId,
        parentId: data.parentId || null,
        status: commentStatus
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            replies: true,
            likes: true
          }
        }
      }
    });

    // Update article comment count
    await prisma.article.update({
      where: { id: data.articleId },
      data: { commentCount: { increment: 1 } }
    });

    return this.transformCommentToResponse(comment, context, new Set());
  }

  /**
   * Update an existing comment
   */
  static async updateComment(
    commentId: string,
    data: UpdateCommentRequest,
    context: SecurityContext
  ): Promise<CommentResponse> {
    if (!context.isAuthenticated || !context.userId) {
      throw new Error('Authentication required');
    }

    // Find the comment and verify permissions
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    // Check permissions
    const canEdit = context.userId === existingComment.authorId ||
                   context.userRole === 'ADMIN' ||
                   context.userRole === 'MODERATOR';

    if (!canEdit) {
      throw new Error('Permission denied');
    }

    // Validate content if provided
    let sanitizedContent: string | undefined;
    if (data.content !== undefined) {
      const validation = this.validateCommentContent(data.content);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      sanitizedContent = validation.sanitizedContent;
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(sanitizedContent && {
          content: sanitizedContent,
          isEdited: true,
          editedAt: new Date()
        }),
        ...(data.status && { status: data.status })
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            replies: true,
            likes: true
          }
        }
      }
    });

    return this.transformCommentToResponse(updatedComment, context, new Set());
  }

  /**
   * Delete a comment (soft delete by setting status to DELETED)
   */
  static async deleteComment(
    commentId: string,
    context: SecurityContext
  ): Promise<void> {
    if (!context.isAuthenticated || !context.userId) {
      throw new Error('Authentication required');
    }

    // Find the comment and verify permissions
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check permissions
    const canDelete = context.userId === comment.authorId ||
                     context.userRole === 'ADMIN' ||
                     context.userRole === 'MODERATOR';

    if (!canDelete) {
      throw new Error('Permission denied');
    }

    // Soft delete the comment
    await prisma.comment.update({
      where: { id: commentId },
      data: { status: 'DELETED' }
    });

    // Update article comment count
    await prisma.article.update({
      where: { id: comment.articleId },
      data: { commentCount: { decrement: 1 } }
    });
  }

  /**
   * Build WHERE clause for comment queries based on filters and permissions
   */
  private static buildCommentWhereClause(
    articleId: string,
    filters: Omit<CommentFilters, 'articleId'>,
    context: SecurityContext
  ) {
    const baseWhere = {
      articleId,
      parentId: filters.parentId !== undefined ? filters.parentId : null
    };

    // Apply status filter based on permissions
    const allowedStatuses = this.getAllowedCommentStatuses(context);
    const statusFilter = filters.status
      ? (Array.isArray(filters.status) ? filters.status : [filters.status])
      : allowedStatuses;

    return {
      ...baseWhere,
      status: { in: statusFilter.filter(s => allowedStatuses.includes(s)) },
      ...(filters.authorId && { authorId: filters.authorId }),
      ...(filters.search && {
        content: { contains: filters.search, mode: 'insensitive' as const }
      }),
      ...(filters.dateFrom && { createdAt: { gte: filters.dateFrom } }),
      ...(filters.dateTo && { createdAt: { lte: filters.dateTo } })
    };
  }

  /**
   * Get allowed comment statuses based on user permissions
   */
  private static getAllowedCommentStatuses(context: SecurityContext): CommentStatus[] {
    if (context.userRole === 'ADMIN' || context.userRole === 'MODERATOR') {
      return ['PENDING', 'APPROVED', 'REJECTED'];
    }
    return ['APPROVED'];
  }

  /**
   * Build ORDER BY clause for comment queries
   */
  private static buildOrderByClause(options: CommentQueryOptions) {
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    return { [sortBy]: sortOrder };
  }

  /**
   * Get user's likes for a set of comments
   */
  private static async getUserLikes(commentIds: string[], userId: string): Promise<Set<string>> {
    const likes = await prisma.like.findMany({
      where: {
        userId,
        commentId: { in: commentIds }
      },
      select: { commentId: true }
    });

    return new Set(likes.map(like => like.commentId!));
  }

  /**
   * Transform comment data to response format
   */
  private static transformCommentToResponse(
    comment: any,
    context: SecurityContext,
    userLikes: Set<string>
  ): CommentResponse {
    const canEdit = context.userId === comment.authorId ||
                   context.userRole === 'ADMIN' ||
                   context.userRole === 'MODERATOR';

    const canDelete = canEdit;
    const canReply = context.isAuthenticated && comment.status === 'APPROVED';

    return {
      ...comment,
      replyCount: comment._count?.replies || 0,
      likeCount: comment._count?.likes || 0,
      isLikedByUser: userLikes.has(comment.id),
      canEdit,
      canDelete,
      canReply,
      replies: comment.replies?.map((reply: any) => ({
        ...reply,
        replyCount: 0, // Replies don't have nested replies in this response
        likeCount: reply._count?.likes || 0,
        isLikedByUser: userLikes.has(reply.id),
        canEdit: context.userId === reply.authorId ||
                context.userRole === 'ADMIN' ||
                context.userRole === 'MODERATOR',
        canDelete: context.userId === reply.authorId ||
                  context.userRole === 'ADMIN' ||
                  context.userRole === 'MODERATOR',
        canReply: false // No nested replies for now
      }))
    };
  }

  /**
   * Validate comment content
   */
  private static validateCommentContent(content: string): CommentValidationResult {
    const errors: string[] = [];

    if (!content || typeof content !== 'string') {
      errors.push('Comment content is required');
      return { isValid: false, errors };
    }

    const trimmed = content.trim();

    if (trimmed.length < 1) {
      errors.push('Comment cannot be empty');
    }

    if (trimmed.length > 2000) {
      errors.push('Comment cannot exceed 2000 characters');
    }

    // Basic content sanitization (you might want to use a proper sanitization library)
    const sanitized = trimmed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '');

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedContent: sanitized
    };
  }

  /**
   * Get initial comment status based on user role
   */
  private static getInitialCommentStatus(context: SecurityContext): CommentStatus {
    if (context.userRole === 'ADMIN' || context.userRole === 'MODERATOR') {
      return 'APPROVED';
    }
    return 'PENDING'; // Regular users need approval
  }
}