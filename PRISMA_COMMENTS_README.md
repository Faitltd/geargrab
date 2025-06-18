# Prisma Article & Comment System

A comprehensive, secure implementation of Article and Comment models using Prisma with TypeScript. This system includes proper validation, sanitization, rate limiting, and security measures to safely handle user-generated content.

## 🏗️ Architecture Overview

```
prisma/
├── schema.prisma              # Database schema with relationships
src/lib/
├── types/
│   └── prisma.ts             # TypeScript types and interfaces
├── services/
│   └── comment.service.ts    # Business logic and database operations
├── utils/
│   ├── validators.ts         # Input validation utilities
│   ├── sanitizer.ts          # HTML/content sanitization
│   └── rate-limiter.ts       # Rate limiting protection
├── components/
│   └── CommentSection.svelte # Frontend component example
└── routes/api/
    └── comments/
        └── +server.ts        # API endpoints
```

## 📊 Database Schema

### Core Models

- **User**: Authentication and user management
- **Article**: Blog posts/articles with SEO fields
- **Comment**: Nested comments with moderation
- **Like**: Polymorphic likes for articles/comments
- **Report**: Content moderation system

### Key Features

- **Nested Comments**: Self-referential relationships for replies
- **Content Moderation**: Status-based approval system
- **Polymorphic Relationships**: Likes and reports work on multiple models
- **SEO Optimization**: Meta fields and slug generation
- **Performance Indexes**: Optimized database queries

## 🔒 Security Features

### Input Validation
- Comprehensive field validation
- Type checking and format validation
- Length limits and content restrictions
- Spam detection patterns

### Content Sanitization
- HTML sanitization to prevent XSS
- URL validation and protocol filtering
- Filename sanitization for uploads
- Database input sanitization

### Rate Limiting
- Per-user action limits
- IP-based limiting for anonymous users
- Sliding window algorithms
- Configurable limits per action type

### Access Control
- Role-based permissions (USER, MODERATOR, ADMIN)
- Owner-based access control
- Time-based edit restrictions
- Content visibility rules

## 🚀 Quick Start

### 1. Database Setup

```bash
# Install Prisma
npm install prisma @prisma/client

# Initialize Prisma (if not already done)
npx prisma init

# Copy the schema to your prisma/schema.prisma file
# Then generate the client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 2. Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Optional: Redis for production rate limiting
REDIS_URL="redis://localhost:6379"
```

### 3. Basic Usage

```typescript
import CommentService from '$lib/services/comment.service';
import type { SecurityContext } from '$lib/types/prisma';

// Fetch comments safely
const context: SecurityContext = {
  userId: 'user123',
  userRole: 'USER',
  isAuthenticated: true
};

const comments = await CommentService.getCommentsByArticleId(
  'article123',
  { limit: 20, offset: 0 },
  context
);

// Create a comment
const newComment = await CommentService.createComment(
  {
    content: 'This is a great article!',
    articleId: 'article123'
  },
  context
);
```

## 📡 API Endpoints

### GET /api/comments
Fetch comments for an article with filtering and pagination.

**Query Parameters:**
- `articleId` (required): Article ID
- `status`: Filter by status (approved, pending, rejected)
- `parentId`: Filter by parent comment (null for top-level)
- `limit`: Number of comments (1-100, default: 20)
- `offset`: Skip comments for pagination
- `sortBy`: Sort field (createdAt, likeCount)
- `sortOrder`: Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment123",
      "content": "Great article!",
      "author": {
        "id": "user123",
        "username": "johndoe",
        "name": "John Doe",
        "avatar": "https://..."
      },
      "createdAt": "2023-01-01T00:00:00Z",
      "likeCount": 5,
      "canEdit": true,
      "canDelete": true,
      "isLiked": false,
      "replies": []
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### POST /api/comments
Create a new comment (requires authentication).

**Request Body:**
```json
{
  "content": "This is my comment",
  "articleId": "article123",
  "parentId": "comment456" // Optional for replies
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comment789",
    "content": "This is my comment",
    "status": "PENDING",
    "author": { ... }
  },
  "message": "Comment submitted for review"
}
```

## 🛡️ Security Best Practices

### 1. Always Validate Input
```typescript
import { validateCommentInput } from '$lib/utils/validators';

const errors = validateCommentInput(input);
if (errors.length > 0) {
  throw new Error('Validation failed');
}
```

### 2. Sanitize Content
```typescript
import { sanitizeHtml } from '$lib/utils/sanitizer';

const safeContent = sanitizeHtml(userInput);
```

### 3. Apply Rate Limiting
```typescript
import { applyRateLimit } from '$lib/utils/rate-limiter';

await applyRateLimit('COMMENT_CREATE', userId);
```

### 4. Check Permissions
```typescript
const canEdit = comment.authorId === userId || 
                userRole === 'ADMIN' || 
                userRole === 'MODERATOR';
```

## 🎨 Frontend Integration

### Svelte Component Usage
```svelte
<script>
  import CommentSection from '$lib/components/CommentSection.svelte';
</script>

<CommentSection 
  articleId="article123"
  currentUserId={$user?.id}
  userRole={$user?.role}
/>
```

### React/Vue Integration
The service layer and API endpoints work with any frontend framework. Just adapt the component patterns to your preferred framework.

## 🔧 Configuration

### Rate Limits
Customize rate limits in `src/lib/utils/rate-limiter.ts`:

```typescript
export const RateLimits = {
  COMMENT_CREATE: { limit: 10, windowSeconds: 60 },
  API_REQUEST: { limit: 100, windowSeconds: 60 },
  // ... other limits
};
```

### Validation Rules
Modify validation rules in `src/lib/utils/validators.ts`:

```typescript
// Comment length limits
if (trimmedContent.length > 5000) {
  errors.push({
    field: 'content',
    message: 'Comment cannot exceed 5000 characters',
    code: 'TOO_LONG'
  });
}
```

## 🚀 Production Considerations

### 1. Use Redis for Rate Limiting
Replace the in-memory store with Redis for production:

```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

### 2. Implement Proper Logging
Add structured logging for security events:

```typescript
import winston from 'winston';

logger.warn('Rate limit exceeded', {
  userId,
  action: 'COMMENT_CREATE',
  ip: clientIP
});
```

### 3. Add Content Moderation
Integrate with services like:
- AWS Comprehend for sentiment analysis
- Google Cloud Natural Language API
- OpenAI Moderation API

### 4. Database Optimization
- Add database indexes for performance
- Implement connection pooling
- Use read replicas for heavy read workloads

## 🧪 Testing

### Unit Tests
```typescript
import { validateCommentInput } from '$lib/utils/validators';

test('validates comment input', () => {
  const errors = validateCommentInput({
    content: '',
    articleId: 'invalid'
  });
  
  expect(errors).toHaveLength(2);
});
```

### Integration Tests
```typescript
import { CommentService } from '$lib/services/comment.service';

test('creates comment safely', async () => {
  const comment = await CommentService.createComment(
    validInput,
    validContext
  );
  
  expect(comment.status).toBe('PENDING');
});
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [OWASP XSS Prevention](https://owasp.org/www-community/xss-filter-evasion-cheatsheet)
- [Rate Limiting Strategies](https://blog.logrocket.com/rate-limiting-node-js/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 🤝 Contributing

1. Follow the established patterns for validation and sanitization
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Consider security implications of all changes

## 📄 License

This implementation is provided as an example. Adapt it to your specific needs and security requirements.
