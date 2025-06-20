/**
 * TypeScript types for Prisma-based comment system
 * 
 * This file defines all the types used in the comment system,
 * including request/response types, filters, and security contexts.
 */

import type { User, Article, Comment, CommentStatus, UserRole } from '@prisma/client';

// Security and authentication types
export interface SecurityContext {
  userId?: string;
  userRole: UserRole;
  isAuthenticated: boolean;
  permissions?: string[];
}

// Comment-related types with relations
export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'username' | 'name' | 'avatar'>;
}

export interface CommentWithReplies extends CommentWithAuthor {
  replies: CommentWithAuthor[];
  _count: {
    replies: number;
    likes: number;
  };
}

export interface CommentResponse extends CommentWithAuthor {
  replies?: CommentWithAuthor[];
  replyCount: number;
  likeCount: number;
  isLikedByUser?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
}

// Request types
export interface CreateCommentRequest {
  content: string;
  articleId: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content?: string;
  status?: CommentStatus;
}

// Filter and pagination types
export interface CommentFilters {
  articleId: string;
  status?: CommentStatus | CommentStatus[];
  parentId?: string | null; // null for top-level comments
  authorId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface SortOptions {
  sortBy?: 'createdAt' | 'updatedAt' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CommentQueryOptions extends PaginationOptions, SortOptions {
  includeReplies?: boolean;
  maxReplyDepth?: number;
}

// Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    nextCursor?: string;
  };
  meta?: {
    totalTopLevel?: number;
    totalReplies?: number;
  };
}

// Article-related types
export interface ArticleWithCommentCount extends Article {
  _count: {
    comments: number;
  };
}

// Validation types
export interface CommentValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedContent?: string;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  isLimited: boolean;
}

// Moderation types
export interface ModerationAction {
  action: 'approve' | 'reject' | 'delete' | 'flag';
  reason?: string;
  moderatorId: string;
  timestamp: Date;
}

export interface CommentModerationLog {
  commentId: string;
  actions: ModerationAction[];
}

// Error types
export interface CommentError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// Bulk operation types
export interface BulkCommentOperation {
  commentIds: string[];
  action: 'approve' | 'reject' | 'delete';
  reason?: string;
}

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{
    commentId: string;
    error: string;
  }>;
}

// Analytics types
export interface CommentAnalytics {
  totalComments: number;
  commentsByStatus: Record<CommentStatus, number>;
  averageCommentsPerArticle: number;
  topCommenters: Array<{
    userId: string;
    username: string;
    commentCount: number;
  }>;
  engagementMetrics: {
    totalLikes: number;
    averageLikesPerComment: number;
    replyRate: number;
  };
}
