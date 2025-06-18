// TypeScript types for Prisma models
// These types provide compile-time safety and better IDE support

import type { Prisma } from '@prisma/client';

// Base types from Prisma
export type User = Prisma.UserGetPayload<{}>;
export type Article = Prisma.ArticleGetPayload<{}>;
export type Comment = Prisma.CommentGetPayload<{}>;
export type Like = Prisma.LikeGetPayload<{}>;
export type Report = Prisma.ReportGetPayload<{}>;

// Extended types with relations
export type ArticleWithAuthor = Prisma.ArticleGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        name: true;
        avatar: true;
      };
    };
  };
}>;

export type ArticleWithComments = Prisma.ArticleGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        name: true;
        avatar: true;
      };
    };
    comments: {
      include: {
        author: {
          select: {
            id: true;
            username: true;
            name: true;
            avatar: true;
          };
        };
        replies: {
          include: {
            author: {
              select: {
                id: true;
                username: true;
                name: true;
                avatar: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        name: true;
        avatar: true;
      };
    };
  };
}>;

export type CommentWithReplies = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        name: true;
        avatar: true;
      };
    };
    replies: {
      include: {
        author: {
          select: {
            id: true;
            username: true;
            name: true;
            avatar: true;
          };
        };
      };
    };
  };
}>;

// Input types for creating/updating
export type CreateArticleInput = {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  isPublished?: boolean;
  publishedAt?: Date;
};

export type UpdateArticleInput = Partial<CreateArticleInput>;

export type CreateCommentInput = {
  content: string;
  articleId: string;
  parentId?: string;
};

export type UpdateCommentInput = {
  content: string;
};

// Query options and filters
export type CommentFilters = {
  articleId: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  parentId?: string | null;
  authorId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
};

export type ArticleFilters = {
  authorId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublished?: boolean;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'viewCount' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
};

// Response types for API
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type CommentResponse = CommentWithAuthor & {
  replies?: CommentWithAuthor[];
  canEdit?: boolean;
  canDelete?: boolean;
  isLiked?: boolean;
};

export type ArticleResponse = ArticleWithAuthor & {
  canEdit?: boolean;
  canDelete?: boolean;
  isLiked?: boolean;
  comments?: CommentResponse[];
};

// Error types
export type DatabaseError = {
  code: string;
  message: string;
  field?: string;
};

export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

// Security context
export type SecurityContext = {
  userId?: string;
  userRole?: 'USER' | 'MODERATOR' | 'ADMIN';
  isAuthenticated: boolean;
};

// Rate limiting types
export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetTime: Date;
};
