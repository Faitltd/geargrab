// Comment Service - Safe database operations for comments
// Implements proper validation, sanitization, and access control

import { PrismaClient } from '@prisma/client';
import type {
  CommentWithAuthor,
  CommentWithReplies,
  CommentFilters,
  CreateCommentInput,
  UpdateCommentInput,
  SecurityContext,
  PaginatedResponse,
  CommentResponse,
  ValidationError
} from '$lib/types/prisma';
import { sanitizeHtml } from '$lib/utils/sanitizer';
import { validateCommentInput } from '$lib/utils/validators';
import { checkRateLimit } from '$lib/utils/rate-limiter';

const prisma = new PrismaClient();

export class CommentService {
  /**
   * Safely fetch comments by articleId with proper filtering and pagination
   */
  static async getCommentsByArticleId(
    articleId: string,
    filters: Omit<CommentFilters, 'articleId'> = {},
    context: SecurityContext
  ): Promise<PaginatedResponse<CommentResponse>> {
    try {
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
        },
        select: { id: true, authorId: true, isPublished: true }
      });

      if (!article) {
        throw new Error('Article not found or not accessible');
      }

      // Set up filters with defaults
      const {
        status = 'APPROVED',
        parentId = null,
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Validate pagination parameters
      const safeLimit = Math.min(Math.max(1, limit), 100); // Max 100 comments per request
      const safeOffset = Math.max(0, offset);

      // Build where clause
      const whereClause: any = {
        articleId,
        parentId,
        status: context.userRole === 'ADMIN' || context.userRole === 'MODERATOR' 
          ? undefined // Admins can see all statuses
          : status
      };

      // If user is comment author, they can see their own pending comments
      if (context.userId && status === 'PENDING') {
        whereClause.OR = [
          { status: 'APPROVED' },
          { authorId: context.userId, status: 'PENDING' }
        ];
        delete whereClause.status;
      }

      // Get total count for pagination
      const total = await prisma.comment.count({ where: whereClause });

      // Fetch comments with relations
      const comments = await prisma.comment.findMany({
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
          replies: {
            where: {
              status: context.userRole === 'ADMIN' || context.userRole === 'MODERATOR' 
                ? undefined 
                : 'APPROVED'
            },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'asc' },
            take: 10 // Limit replies per comment
          },
          likes: context.userId ? {
            where: { userId: context.userId },
            select: { id: true }
          } : false
        },
        orderBy: { [sortBy]: sortOrder },
        take: safeLimit,
        skip: safeOffset
      });

      // Transform comments with security context
      const transformedComments: CommentResponse[] = comments.map(comment => ({
        ...comment,
        canEdit: this.canEditComment(comment, context),
        canDelete: this.canDeleteComment(comment, context),
        isLiked: context.userId ? comment.likes.length > 0 : false,
        replies: comment.replies?.map(reply => ({
          ...reply,
          canEdit: this.canEditComment(reply, context),
          canDelete: this.canDeleteComment(reply, context),
          isLiked: false // Simplified for replies
        }))
      }));

      // Calculate pagination info
      const totalPages = Math.ceil(total / safeLimit);
      const currentPage = Math.floor(safeOffset / safeLimit) + 1;

      return {
        data: transformedComments,
        pagination: {
          total,
          page: currentPage,
          limit: safeLimit,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      };

    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  /**
   * Create a new comment with proper validation and sanitization
   */
  static async createComment(
    input: CreateCommentInput,
    context: SecurityContext
  ): Promise<CommentWithAuthor> {
    try {
      // Check authentication
      if (!context.isAuthenticated || !context.userId) {
        throw new Error('Authentication required');
      }

      // Check rate limiting
      await checkRateLimit(`comment:${context.userId}`, 10, 60); // 10 comments per minute

      // Validate input
      const validationErrors = validateCommentInput(input);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      // Sanitize content
      const sanitizedContent = sanitizeHtml(input.content);
      if (!sanitizedContent || sanitizedContent.trim().length === 0) {
        throw new Error('Comment content cannot be empty');
      }

      // Verify article exists and is accessible
      const article = await prisma.article.findFirst({
        where: {
          id: input.articleId,
          isPublished: true
        },
        select: { id: true, authorId: true }
      });

      if (!article) {
        throw new Error('Article not found or not published');
      }

      // If replying to a comment, verify parent exists
      if (input.parentId) {
        const parentComment = await prisma.comment.findFirst({
          where: {
            id: input.parentId,
            articleId: input.articleId,
            status: 'APPROVED'
          },
          select: { id: true }
        });

        if (!parentComment) {
          throw new Error('Parent comment not found');
        }
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          content: sanitizedContent,
          articleId: input.articleId,
          authorId: context.userId,
          parentId: input.parentId || null,
          status: context.userRole === 'ADMIN' || context.userRole === 'MODERATOR' 
            ? 'APPROVED' 
            : 'PENDING' // Regular users need approval
        },
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

      // Update article comment count if approved
      if (comment.status === 'APPROVED') {
        await prisma.article.update({
          where: { id: input.articleId },
          data: { commentCount: { increment: 1 } }
        });
      }

      return comment;

    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Check if user can edit a comment
   */
  private static canEditComment(comment: any, context: SecurityContext): boolean {
    if (!context.isAuthenticated) return false;
    
    // Author can edit their own comments within 24 hours
    if (comment.authorId === context.userId) {
      const hoursSinceCreated = (Date.now() - comment.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreated < 24;
    }
    
    // Admins and moderators can always edit
    return context.userRole === 'ADMIN' || context.userRole === 'MODERATOR';
  }

  /**
   * Check if user can delete a comment
   */
  private static canDeleteComment(comment: any, context: SecurityContext): boolean {
    if (!context.isAuthenticated) return false;
    
    // Author can delete their own comments
    if (comment.authorId === context.userId) return true;
    
    // Admins and moderators can delete any comment
    return context.userRole === 'ADMIN' || context.userRole === 'MODERATOR';
  }
}

export default CommentService;
