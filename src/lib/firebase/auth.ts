// Firebase Auth Client Functions
// Client-side Firebase auth functions that call server APIs for admin operations

import { browser } from '$app/environment';

/**
 * Make a user an admin by calling the server API
 */
export async function makeUserAdmin(uid: string): Promise<void> {
  if (!browser) {
    throw new Error('This function can only be called from the browser');
  }

  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'makeAdmin',
        uid
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to make user admin: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully made user ${uid} an admin:`, result.message);
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
}

/**
 * Remove admin privileges from a user by calling the server API
 */
export async function removeAdminPrivileges(uid: string): Promise<void> {
  if (!browser) {
    throw new Error('This function can only be called from the browser');
  }

  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'removeAdmin',
        uid
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to remove admin privileges: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully removed admin privileges from user ${uid}:`, result.message);
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    throw error;
  }
}

/**
 * Check if a user is an admin by calling the server API
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  if (!browser) {
    return false;
  }

  try {
    const response = await fetch(`/api/admin/users?uid=${uid}`);

    if (!response.ok) {
      console.error('Failed to check admin status:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.claims?.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get user's custom claims by calling the server API
 */
export async function getUserClaims(uid: string): Promise<Record<string, any> | undefined> {
  if (!browser) {
    return undefined;
  }

  try {
    const response = await fetch(`/api/admin/users?uid=${uid}`);

    if (!response.ok) {
      console.error('Failed to get user claims:', response.statusText);
      return undefined;
    }

    const result = await response.json();
    return result.claims;
  } catch (error) {
    console.error('Error getting user claims:', error);
    return undefined;
  }
}

/**
 * Set custom user claims (placeholder - would need server API implementation)
 */
export async function setUserClaims(uid: string, claims: Record<string, any>): Promise<void> {
  if (!browser) {
    throw new Error('This function can only be called from the browser');
  }

  // This would need a proper server API endpoint
  console.log(`Setting custom claims for user ${uid}:`, claims);
  throw new Error('setUserClaims not implemented - needs server API endpoint');
}

/**
 * Disable a user account by calling the server API
 */
export async function disableUser(uid: string): Promise<void> {
  if (!browser) {
    throw new Error('This function can only be called from the browser');
  }

  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'disable',
        uid
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to disable user: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully disabled user ${uid}:`, result.message);
  } catch (error) {
    console.error('Error disabling user:', error);
    throw error;
  }
}

/**
 * Enable a user account by calling the server API
 */
export async function enableUser(uid: string): Promise<void> {
  if (!browser) {
    throw new Error('This function can only be called from the browser');
  }

  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'enable',
        uid
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to enable user: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully enabled user ${uid}:`, result.message);
  } catch (error) {
    console.error('Error enabling user:', error);
    throw error;
  }
}

/**
 * Delete a user account by calling the server API
 */
export async function deleteUser(uid: string): Promise<void> {
  if (!browser) {
    throw new Error('This function can only be called from the browser');
  }

  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'delete',
        uid
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully deleted user ${uid}:`, result.message);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
