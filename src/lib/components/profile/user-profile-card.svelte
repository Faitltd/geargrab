<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let user: {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    isVerified?: boolean;
    joinDate?: Date;
    rating?: number;
    reviewCount?: number;
    bio?: string;
    location?: {
      city: string;
      state: string;
    };
    verificationStatus?: {
      email: boolean;
      phone: boolean;
      identity: boolean;
      background: boolean;
    };
  };
  
  export let isOwner = false;
  export let showEditButton = false;
  
  const dispatch = createEventDispatcher<{
    edit: void;
    verify: string;
    message: void;
  }>();
  
  function formatJoinDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  }
  
  function getVerificationBadges() {
    if (!user.verificationStatus) return [];
    
    const badges = [];
    if (user.verificationStatus.email) badges.push({ type: 'email', label: 'Email Verified' });
    if (user.verificationStatus.phone) badges.push({ type: 'phone', label: 'Phone Verified' });
    if (user.verificationStatus.identity) badges.push({ type: 'identity', label: 'ID Verified' });
    if (user.verificationStatus.background) badges.push({ type: 'background', label: 'Background Check' });
    
    return badges;
  }
  
  function renderStars(rating: number) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars.join('');
  }
</script>

<div class="profile-card">
  <!-- Profile Header -->
  <div class="profile-header">
    <div class="avatar-section">
      {#if user.photoURL}
        <img src={user.photoURL} alt={user.displayName} class="avatar" />
      {:else}
        <div class="avatar-placeholder">
          {user.displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      {/if}
      
      {#if user.isVerified}
        <div class="verified-badge" title="Verified User">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
        </div>
      {/if}
    </div>
    
    <div class="profile-info">
      <h2>{user.displayName}</h2>
      
      {#if user.location}
        <p class="location">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {user.location.city}, {user.location.state}
        </p>
      {/if}
      
      {#if user.joinDate}
        <p class="join-date">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
          Joined {formatJoinDate(user.joinDate)}
        </p>
      {/if}
      
      {#if user.rating && user.reviewCount}
        <div class="rating">
          <span class="stars">{renderStars(user.rating)}</span>
          <span class="rating-text">{user.rating.toFixed(1)} ({user.reviewCount} reviews)</span>
        </div>
      {/if}
    </div>
    
    <div class="profile-actions">
      {#if showEditButton && isOwner}
        <button class="edit-btn" on:click={() => dispatch('edit')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Edit Profile
        </button>
      {:else if !isOwner}
        <button class="message-btn" on:click={() => dispatch('message')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          Message
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Bio Section -->
  {#if user.bio}
    <div class="bio-section">
      <h3>About</h3>
      <p>{user.bio}</p>
    </div>
  {/if}
  
  <!-- Verification Badges -->
  {#if getVerificationBadges().length > 0}
    <div class="verification-section">
      <h3>Verifications</h3>
      <div class="verification-badges">
        {#each getVerificationBadges() as badge}
          <div class="verification-badge {badge.type}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            {badge.label}
          </div>
        {/each}
      </div>
      
      {#if isOwner && showEditButton}
        <div class="verification-actions">
          <button class="verify-btn" on:click={() => dispatch('verify', 'phone')}>
            Verify Phone
          </button>
          <button class="verify-btn" on:click={() => dispatch('verify', 'identity')}>
            Verify ID
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .profile-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
  }

  .profile-header {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    align-items: flex-start;
  }

  .avatar-section {
    position: relative;
    flex-shrink: 0;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #f8f9fa;
  }

  .avatar-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    border: 3px solid #f8f9fa;
  }

  .verified-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    background: #28a745;
    color: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  .profile-info {
    flex: 1;
  }

  .profile-info h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }

  .location, .join-date {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0;
    color: #666;
    font-size: 14px;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  .stars {
    color: #ffc107;
    font-size: 18px;
  }

  .rating-text {
    color: #666;
    font-size: 14px;
  }

  .profile-actions {
    flex-shrink: 0;
  }

  .edit-btn, .message-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .edit-btn {
    background: #f8f9fa;
    color: #495057;
    border: 1px solid #dee2e6;
  }

  .edit-btn:hover {
    background: #e9ecef;
  }

  .message-btn {
    background: #007bff;
    color: white;
  }

  .message-btn:hover {
    background: #0056b3;
  }

  .bio-section, .verification-section {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e9ecef;
  }

  .bio-section h3, .verification-section h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .bio-section p {
    margin: 0;
    color: #666;
    line-height: 1.6;
  }

  .verification-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }

  .verification-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: white;
  }

  .verification-badge.email {
    background: #17a2b8;
  }

  .verification-badge.phone {
    background: #28a745;
  }

  .verification-badge.identity {
    background: #ffc107;
    color: #333;
  }

  .verification-badge.background {
    background: #6f42c1;
  }

  .verification-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .verify-btn {
    padding: 8px 16px;
    border: 1px solid #007bff;
    background: white;
    color: #007bff;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .verify-btn:hover {
    background: #007bff;
    color: white;
  }

  @media (max-width: 768px) {
    .profile-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .verification-badges {
      justify-content: center;
    }
    
    .verification-actions {
      justify-content: center;
    }
  }
</style>
