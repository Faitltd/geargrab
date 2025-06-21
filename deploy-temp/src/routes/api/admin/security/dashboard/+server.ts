import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { auditLog } from '$lib/security/audit';
import { adminFirestore } from '$firebase/server';

export const GET: RequestHandler = createSecureHandler(
  async ({ getClientAddress }, { auth }) => {
    try {
      // Get security overview data
      const overview = await getSecurityOverview();
      
      // Get recent security events
      const recentEvents = await auditLog.getRecentSecurityEvents(24, undefined);
      
      // Get suspicious activity
      const suspiciousActivity = await auditLog.detectSuspiciousActivity();
      
      // Get active sessions
      const activeSessions = await getActiveSessions();
      
      // Log admin access to security dashboard
      await auditLog.logAdminAction({
        adminUserId: auth!.userId,
        action: 'view_security_dashboard',
        timestamp: new Date(),
        ip: getClientAddress()
      });

      return json({
        success: true,
        overview,
        recentEvents: recentEvents.slice(0, 20), // Limit to 20 most recent
        suspiciousActivity,
        activeSessions: activeSessions.slice(0, 50), // Limit to 50 most recent
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error loading security dashboard:', error);
      return json({ 
        error: 'Failed to load security dashboard data' 
      }, { status: 500 });
    }
  },
  {
    requireAdmin: true,
    rateLimit: 'admin'
  }
);

// Get security overview statistics
async function getSecurityOverview(): Promise<{
  totalEvents: number;
  highRiskEvents: number;
  blockedIPs: number;
  activeSessions: number;
}> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count total security events in last 24 hours
    const totalEventsSnapshot = await adminFirestore
      .collection('securityEvents')
      .where('timestamp', '>=', last24Hours)
      .get();

    // Count high risk events
    const highRiskEventsSnapshot = await adminFirestore
      .collection('securityEvents')
      .where('timestamp', '>=', last24Hours)
      .where('severity', 'in', ['high', 'critical'])
      .get();

    // Count blocked IPs (this would be from a blocklist collection)
    const blockedIPsSnapshot = await adminFirestore
      .collection('blockedIPs')
      .where('isActive', '==', true)
      .get();

    // Count active sessions
    const activeSessionsSnapshot = await adminFirestore
      .collection('userSessions')
      .where('isActive', '==', true)
      .where('expiresAt', '>', new Date())
      .get();

    return {
      totalEvents: totalEventsSnapshot.size,
      highRiskEvents: highRiskEventsSnapshot.size,
      blockedIPs: blockedIPsSnapshot.size,
      activeSessions: activeSessionsSnapshot.size
    };

  } catch (error) {
    console.error('Error getting security overview:', error);
    return {
      totalEvents: 0,
      highRiskEvents: 0,
      blockedIPs: 0,
      activeSessions: 0
    };
  }
}

// Get active user sessions
async function getActiveSessions(): Promise<any[]> {
  try {
    const snapshot = await adminFirestore
      .collection('userSessions')
      .where('isActive', '==', true)
      .where('expiresAt', '>', new Date())
      .orderBy('lastActivity', 'desc')
      .limit(100)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        sessionId: doc.id,
        userId: data.userId,
        email: data.email,
        ip: data.ip,
        userAgent: data.userAgent,
        deviceInfo: data.deviceInfo,
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
        lastActivity: data.lastActivity?.toDate?.()?.toISOString(),
        expiresAt: data.expiresAt?.toISOString()
      };
    });

  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

// Terminate user session (admin action)
export const DELETE: RequestHandler = createSecureHandler(
  async ({ url, getClientAddress }, { auth }) => {
    try {
      const sessionId = url.searchParams.get('sessionId');
      
      if (!sessionId) {
        return json({ error: 'Session ID is required' }, { status: 400 });
      }

      // Get session info before terminating
      const sessionDoc = await adminFirestore
        .collection('userSessions')
        .doc(sessionId)
        .get();

      if (!sessionDoc.exists) {
        return json({ error: 'Session not found' }, { status: 404 });
      }

      const sessionData = sessionDoc.data();

      // Terminate session
      await sessionDoc.ref.update({
        isActive: false,
        terminatedAt: new Date(),
        terminatedBy: auth!.userId,
        terminationReason: 'admin_action'
      });

      // Log admin action
      await auditLog.logAdminAction({
        adminUserId: auth!.userId,
        action: 'terminate_user_session',
        targetUserId: sessionData?.userId,
        timestamp: new Date(),
        ip: getClientAddress(),
        details: {
          sessionId,
          targetUserEmail: sessionData?.email,
          sessionIP: sessionData?.ip
        },
        justification: 'Security admin action'
      });

      // Log security event
      await auditLog.logSecurityEvent({
        type: 'admin_privilege_granted',
        userId: sessionData?.userId,
        ip: getClientAddress(),
        timestamp: new Date(),
        details: {
          action: 'session_terminated_by_admin',
          adminUserId: auth!.userId,
          sessionId
        },
        severity: 'medium'
      });

      return json({
        success: true,
        message: 'Session terminated successfully'
      });

    } catch (error) {
      console.error('Error terminating session:', error);
      return json({ 
        error: 'Failed to terminate session' 
      }, { status: 500 });
    }
  },
  {
    requireAdmin: true,
    rateLimit: 'admin'
  }
);

// Block IP address (admin action)
export const POST: RequestHandler = createSecureHandler(
  async ({ getClientAddress }, { auth, body }) => {
    try {
      const { ipAddress, reason, duration } = body;

      if (!ipAddress) {
        return json({ error: 'IP address is required' }, { status: 400 });
      }

      // Validate IP address format
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(ipAddress)) {
        return json({ error: 'Invalid IP address format' }, { status: 400 });
      }

      // Calculate expiration time
      const durationMs = duration ? duration * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // Default 24 hours
      const expiresAt = new Date(Date.now() + durationMs);

      // Add to blocked IPs collection
      await adminFirestore.collection('blockedIPs').add({
        ipAddress,
        reason: reason || 'Admin blocked',
        blockedBy: auth!.userId,
        blockedAt: new Date(),
        expiresAt,
        isActive: true
      });

      // Log admin action
      await auditLog.logAdminAction({
        adminUserId: auth!.userId,
        action: 'block_ip_address',
        timestamp: new Date(),
        ip: getClientAddress(),
        details: {
          blockedIP: ipAddress,
          reason,
          duration: `${duration || 24} hours`
        },
        justification: reason || 'Security threat mitigation'
      });

      return json({
        success: true,
        message: `IP address ${ipAddress} has been blocked`,
        expiresAt: expiresAt.toISOString()
      });

    } catch (error) {
      console.error('Error blocking IP address:', error);
      return json({ 
        error: 'Failed to block IP address' 
      }, { status: 500 });
    }
  },
  {
    requireAdmin: true,
    rateLimit: 'admin',
    inputSchema: {
      ipAddress: { required: true, type: 'string' as const, pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/ },
      reason: { required: false, type: 'string' as const, maxLength: 200 },
      duration: { required: false, type: 'number' as const, min: 1, max: 168 } // Max 1 week
    }
  }
);
