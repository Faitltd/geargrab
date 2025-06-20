<!--
  Comment Section Component
  
  This component demonstrates safe comment fetching and display using the
  Prisma-based comment service with proper error handling and user permissions.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import type { CommentResponse, PaginatedResponse } from '$lib/types/prisma';
  
  // Props
  export let articleId: string;
  export let currentUserId: string | undefined = undefined;
  export let userRole: 'USER' | 'MODERATOR' | 'ADMIN' = 'USER';
  export let isAuthenticated: boolean = false;

  // State
  let comments: CommentResponse[] = [];
  let pagination: PaginatedResponse<CommentResponse>['pagination'] | null = null;
  let loading = false;
  let error: string | null = null;
  let newCommentContent = '';
  let submittingComment = false;

  // Load comments on mount
  onMount(() => {
    loadComments();
  });

  /**
   * Load comments for the article
   */
  async function loadComments(cursor?: string) {
    if (loading) return;
    
    loading = true;
    error = null;

    try {
      const params = new URLSearchParams({
        limit: '20',
        includeReplies: 'true',
        maxReplyDepth: '3',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/comments/${articleId}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load comments');
      }

      if (data.success) {
        if (cursor) {
          // Append to existing comments (pagination)
          comments = [...comments, ...data.data];
        } else {
          // Replace comments (initial load)
          comments = data.data;
        }
        pagination = data.pagination;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      error = err instanceof Error ? err.message : 'Failed to load comments';
    } finally {
      loading = false;
    }
  }

  /**
   * Load more comments (pagination)
   */
  async function loadMoreComments() {
    if (!pagination?.hasMore || !pagination.nextCursor) return;
    await loadComments(pagination.nextCursor);
  }

  /**
   * Submit a new comment
   */
  async function submitComment() {
    if (!isAuthenticated || !newCommentContent.trim() || submittingComment) return;

    submittingComment = true;
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit comment');
      }

      if (data.success) {
        // Add new comment to the beginning of the list
        comments = [data.comment, ...comments];
        newCommentContent = '';
        
        // Show success message
        showSuccessMessage('Comment submitted successfully!');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      error = err instanceof Error ? err.message : 'Failed to submit comment';
    } finally {
      submittingComment = false;
    }
  }

  /**
   * Reply to a comment
   */
  async function replyToComment(parentId: string, content: string) {
    if (!isAuthenticated || !content.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          articleId,
          parentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reply');
      }

      if (data.success) {
        // Reload comments to show the new reply
        await loadComments();
        showSuccessMessage('Reply submitted successfully!');
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      error = err instanceof Error ? err.message : 'Failed to submit reply';
    }
  }

  /**
   * Show success message (implement based on your notification system)
   */
  function showSuccessMessage(message: string) {
    // Implement your success notification here
    console.log('Success:', message);
  }

  /**
   * Format date for display
   */
  function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Get comment status badge class
   */
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'REJECTED': return 'badge-error';
      default: return 'badge-neutral';
    }
  }
</script>

<div class="comment-section">
  <h3 class="section-title">
    Comments
    {#if pagination}
      <span class="comment-count">({pagination.total})</span>
    {/if}
  </h3>

  <!-- Error Display -->
  {#if error}
    <div class="error-message">
      <p>⚠️ {error}</p>
      <button on:click="{()" => loadComments()} class="retry-button">
        Try Again
      </button>
    </div>
  {/if}

  <!-- Comment Form (for authenticated users) -->
  {#if isAuthenticated}
    <form on:submit|preventDefault="{submitComment}" class="comment-form">
      <textarea
        bind:value="{newCommentContent}"
        placeholder="Write your comment..."
        rows="3"
        maxlength="2000"
        disabled="{submittingComment}"
        class="comment-input"
      ></textarea>
      
      <div class="form-actions">
        <span class="character-count">
          {newCommentContent.length}/2000
        </span>
        <button 
          type="submit" 
          disabled="{!newCommentContent.trim()" || submittingComment}
          class="submit-button"
        >
          {submittingComment ? 'Submitting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  {:else}
    <div class="auth-prompt">
      <p>Please <a href="/auth/login">log in</a> to post a comment.</p>
    </div>
  {/if}

  <!-- Comments List -->
  <div class="comments-list">
    {#if loading && comments.length === 0}
      <div class="loading-state">
        <p>Loading comments...</p>
      </div>
    {:else if comments.length === 0}
      <div class="empty-state">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    {:else}
      {#each comments as comment (comment.id)}
        <article class="comment" class:pending="{comment.status" === 'PENDING'}>
          <div class="comment-header">
            <div class="author-info">
              {#if comment.author.avatar}
                <img src="{comment.author.avatar}" alt="{comment.author.name" || comment.author.username} class="avatar" />
              {:else}
                <div class="avatar-placeholder">
                  {(comment.author.name || comment.author.username).charAt(0).toUpperCase()}
                </div>
              {/if}
              
              <div class="author-details">
                <span class="author-name">{comment.author.name || comment.author.username}</span>
                <time class="comment-date">{formatDate(comment.createdAt)}</time>
                {#if comment.isEdited}
                  <span class="edited-indicator">(edited)</span>
                {/if}
              </div>
            </div>

            <!-- Status badge for moderators -->
            {#if (userRole === 'ADMIN' || userRole === 'MODERATOR') && comment.status !== 'APPROVED'}
              <span class="status-badge {getStatusBadgeClass(comment.status)}">
                {comment.status}
              </span>
            {/if}
          </div>

          <div class="comment-content">
            <p>{comment.content}</p>
          </div>

          <div class="comment-actions">
            <button class="action-button like-button" class:liked="{comment.isLikedByUser}">
              👍 {comment.likeCount}
            </button>
            
            {#if comment.canReply}
              <button class="action-button reply-button">
                Reply
              </button>
            {/if}
            
            {#if comment.canEdit}
              <button class="action-button edit-button">
                Edit
              </button>
            {/if}
            
            {#if comment.canDelete}
              <button class="action-button delete-button">
                Delete
              </button>
            {/if}
          </div>

          <!-- Replies -->
          {#if comment.replies && comment.replies.length > 0}
            <div class="replies">
              {#each comment.replies as reply (reply.id)}
                <article class="comment reply">
                  <div class="comment-header">
                    <div class="author-info">
                      {#if reply.author.avatar}
                        <img src="{reply.author.avatar}" alt="{reply.author.name" || reply.author.username} class="avatar small" />
                      {:else}
                        <div class="avatar-placeholder small">
                          {(reply.author.name || reply.author.username).charAt(0).toUpperCase()}
                        </div>
                      {/if}
                      
                      <div class="author-details">
                        <span class="author-name">{reply.author.name || reply.author.username}</span>
                        <time class="comment-date">{formatDate(reply.createdAt)}</time>
                      </div>
                    </div>
                  </div>

                  <div class="comment-content">
                    <p>{reply.content}</p>
                  </div>

                  <div class="comment-actions">
                    <button class="action-button like-button" class:liked="{reply.isLikedByUser}">
                      👍 {reply.likeCount}
                    </button>
                  </div>
                </article>
              {/each}
            </div>
          {/if}
        </article>
      {/each}
    {/if}
  </div>

  <!-- Load More Button -->
  {#if pagination?.hasMore}
    <div class="load-more-section">
      <button 
        on:click="{loadMoreComments}" 
        disabled="{loading}"
        class="load-more-button"
      >
        {loading ? 'Loading...' : 'Load More Comments'}
      </button>
    </div>
  {/if}
</div>

<style>
  .comment-section {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .comment-count {
    font-size: 1rem;
    color: #666;
    font-weight: normal;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .retry-button {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    margin-top: 0.5rem;
  }

  .comment-form {
    background: #f8f9fa;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .comment-input {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    padding: 0.75rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }

  .character-count {
    font-size: 0.875rem;
    color: #666;
  }

  .submit-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .submit-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .auth-prompt {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .comments-list {
    space-y: 1rem;
  }

  .comment {
    border: 1px solid #e9ecef;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .comment.pending {
    background: #fff3cd;
    border-color: #ffeaa7;
  }

  .comment.reply {
    margin-left: 2rem;
    margin-top: 0.5rem;
    border-left: 3px solid #007bff;
    background: #f8f9fa;
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .author-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar.small {
    width: 32px;
    height: 32px;
  }

  .avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #007bff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }

  .avatar-placeholder.small {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }

  .author-details {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .author-name {
    font-weight: 600;
    color: #333;
  }

  .comment-date {
    font-size: 0.875rem;
    color: #666;
  }

  .edited-indicator {
    font-size: 0.75rem;
    color: #999;
    font-style: italic;
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge-success { background: #d4edda; color: #155724; }
  .badge-warning { background: #fff3cd; color: #856404; }
  .badge-error { background: #f8d7da; color: #721c24; }
  .badge-neutral { background: #e2e3e5; color: #383d41; }

  .comment-content {
    margin: 0.5rem 0;
    line-height: 1.5;
  }

  .comment-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .action-button {
    background: none;
    border: 1px solid #ddd;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .action-button:hover {
    background: #f8f9fa;
  }

  .like-button.liked {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .replies {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
  }

  .load-more-section {
    text-align: center;
    margin-top: 2rem;
  }

  .load-more-button {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .load-more-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .loading-state,
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
</style>
