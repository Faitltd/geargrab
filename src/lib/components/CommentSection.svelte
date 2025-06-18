<!-- Comment Section Component - Safe comment display and interaction -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { CommentResponse, PaginatedResponse } from '$lib/types/prisma';
  import { sanitizeHtml } from '$lib/utils/sanitizer';
  
  // Props
  export let articleId: string;
  export let currentUserId: string | null = null;
  export let userRole: 'USER' | 'MODERATOR' | 'ADMIN' | null = null;

  // State
  let comments: CommentResponse[] = [];
  let loading = false;
  let error: string | null = null;
  let newCommentContent = '';
  let submitting = false;
  let pagination = {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  };

  // Reactive statements
  $: canComment = !!currentUserId;
  $: isAuthenticated = !!currentUserId;

  /**
   * Safely fetch comments from the API
   */
  async function fetchComments(page = 1) {
    if (!articleId) return;
    
    loading = true;
    error = null;

    try {
      const params = new URLSearchParams({
        articleId,
        limit: pagination.limit.toString(),
        offset: ((page - 1) * pagination.limit).toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        parentId: 'null' // Only fetch top-level comments initially
      });

      const response = await fetch(`/api/comments?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch comments');
      }

      const data: { 
        success: boolean; 
        data: CommentResponse[]; 
        pagination: typeof pagination 
      } = await response.json();

      if (data.success) {
        comments = page === 1 ? data.data : [...comments, ...data.data];
        pagination = data.pagination;
      } else {
        throw new Error('Failed to fetch comments');
      }

    } catch (err) {
      console.error('Error fetching comments:', err);
      error = err instanceof Error ? err.message : 'Failed to load comments';
    } finally {
      loading = false;
    }
  }

  /**
   * Safely submit a new comment
   */
  async function submitComment() {
    if (!canComment || !newCommentContent.trim()) return;

    submitting = true;
    error = null;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newCommentContent.trim(),
          articleId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear form
        newCommentContent = '';
        
        // Show success message
        const message = data.message || 'Comment posted successfully';
        showNotification(message, 'success');
        
        // Refresh comments if comment was approved immediately
        if (data.data.status === 'APPROVED') {
          await fetchComments(1);
        }
      } else {
        // Handle API errors
        if (response.status === 429) {
          throw new Error('You are posting comments too quickly. Please wait a moment.');
        } else if (response.status === 400 && data.error?.code === 'VALIDATION_ERROR') {
          const errorMessages = data.error.errors?.map((e: any) => e.message).join(', ');
          throw new Error(errorMessages || 'Please check your comment content');
        } else {
          throw new Error(data.error?.message || 'Failed to post comment');
        }
      }

    } catch (err) {
      console.error('Error submitting comment:', err);
      error = err instanceof Error ? err.message : 'Failed to post comment';
      showNotification(error, 'error');
    } finally {
      submitting = false;
    }
  }

  /**
   * Load more comments (pagination)
   */
  async function loadMore() {
    if (!pagination.hasNext || loading) return;
    await fetchComments(pagination.page + 1);
  }

  /**
   * Show notification (implement based on your notification system)
   */
  function showNotification(message: string, type: 'success' | 'error') {
    // Implement your notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  /**
   * Format date for display
   */
  function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Safely render comment content
   */
  function renderCommentContent(content: string): string {
    // Content is already sanitized on the server, but double-check
    return sanitizeHtml(content);
  }

  // Load comments on mount
  onMount(() => {
    fetchComments();
  });
</script>

<!-- Comment Section Template -->
<section class="comment-section" aria-label="Comments">
  <div class="comment-header">
    <h3>Comments ({pagination.total})</h3>
  </div>

  <!-- Comment Form -->
  {#if canComment}
    <form on:submit|preventDefault={submitComment} class="comment-form">
      <div class="form-group">
        <label for="new-comment" class="sr-only">Write a comment</label>
        <textarea
          id="new-comment"
          bind:value={newCommentContent}
          placeholder="Write your comment..."
          rows="3"
          maxlength="5000"
          disabled={submitting}
          required
          aria-describedby="comment-help"
        ></textarea>
        <div id="comment-help" class="form-help">
          {5000 - newCommentContent.length} characters remaining
        </div>
      </div>
      
      <div class="form-actions">
        <button 
          type="submit" 
          disabled={submitting || !newCommentContent.trim()}
          class="btn btn-primary"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  {:else if !isAuthenticated}
    <div class="auth-prompt">
      <p>Please <a href="/auth/login">sign in</a> to post a comment.</p>
    </div>
  {/if}

  <!-- Error Display -->
  {#if error}
    <div class="error-message" role="alert">
      {error}
    </div>
  {/if}

  <!-- Comments List -->
  <div class="comments-list">
    {#if loading && comments.length === 0}
      <div class="loading" aria-live="polite">Loading comments...</div>
    {:else if comments.length === 0}
      <div class="no-comments">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    {:else}
      {#each comments as comment (comment.id)}
        <article class="comment" data-comment-id={comment.id}>
          <div class="comment-header">
            <div class="comment-author">
              {#if comment.author.avatar}
                <img 
                  src={comment.author.avatar} 
                  alt={comment.author.name || comment.author.username}
                  class="author-avatar"
                  loading="lazy"
                >
              {/if}
              <span class="author-name">
                {comment.author.name || comment.author.username}
              </span>
            </div>
            
            <div class="comment-meta">
              <time datetime={comment.createdAt.toString()}>
                {formatDate(comment.createdAt)}
              </time>
              
              {#if comment.isEdited}
                <span class="edited-indicator" title="This comment has been edited">
                  (edited)
                </span>
              {/if}
              
              {#if comment.status === 'PENDING'}
                <span class="status-badge pending">Pending Review</span>
              {/if}
            </div>
          </div>

          <div class="comment-content">
            {@html renderCommentContent(comment.content)}
          </div>

          <div class="comment-actions">
            <button class="action-btn like-btn" class:liked={comment.isLiked}>
              👍 {comment.likeCount || 0}
            </button>
            
            <button class="action-btn reply-btn">
              Reply
            </button>
            
            {#if comment.canEdit}
              <button class="action-btn edit-btn">
                Edit
              </button>
            {/if}
            
            {#if comment.canDelete}
              <button class="action-btn delete-btn">
                Delete
              </button>
            {/if}
          </div>

          <!-- Replies -->
          {#if comment.replies && comment.replies.length > 0}
            <div class="comment-replies">
              {#each comment.replies as reply (reply.id)}
                <article class="comment reply" data-comment-id={reply.id}>
                  <div class="comment-header">
                    <div class="comment-author">
                      {#if reply.author.avatar}
                        <img 
                          src={reply.author.avatar} 
                          alt={reply.author.name || reply.author.username}
                          class="author-avatar small"
                          loading="lazy"
                        >
                      {/if}
                      <span class="author-name">
                        {reply.author.name || reply.author.username}
                      </span>
                    </div>
                    
                    <time datetime={reply.createdAt.toString()}>
                      {formatDate(reply.createdAt)}
                    </time>
                  </div>

                  <div class="comment-content">
                    {@html renderCommentContent(reply.content)}
                  </div>
                </article>
              {/each}
            </div>
          {/if}
        </article>
      {/each}

      <!-- Load More Button -->
      {#if pagination.hasNext}
        <div class="load-more">
          <button 
            on:click={loadMore} 
            disabled={loading}
            class="btn btn-secondary"
          >
            {loading ? 'Loading...' : 'Load More Comments'}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .comment-section {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .comment-form textarea {
    width: 100%;
    min-height: 100px;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
  }

  .comment {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    background: white;
  }

  .comment.reply {
    margin-left: 2rem;
    margin-top: 0.5rem;
    background: #f9f9f9;
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .comment-author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .author-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .author-avatar.small {
    width: 24px;
    height: 24px;
  }

  .comment-actions {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .action-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .action-btn:hover {
    color: #333;
  }

  .like-btn.liked {
    color: #007bff;
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .status-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    background: #ffc107;
    color: #000;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
