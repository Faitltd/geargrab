import { adminFirestore } from '$lib/firebase/server';
import admin from 'firebase-admin';

// Use admin.firestore.FieldValue instead of direct import
const FieldValue = admin.firestore.FieldValue;

// Audit event types
export type AuditEventType = 
  | 'user_login'
  | 'user_logout'
  | 'user_registration'
  | 'password_reset'
  | 'admin_privilege_granted'
  | 'admin_privilege_revoked'
  | 'booking_created'
  | 'booking_cancelled'
  | 'payment_processed'
  | 'payment_failed'
  | 'background_check_initiated'
  | 'background_check_completed'
  | 'file_uploaded'
  | 'message_sent'
  | 'listing_created'
  | 'listing_updated'
  | 'listing_deleted'
  | 'unauthorized_access_attempt'
  | 'admin_access_denied'
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'csrf_attempt'
  | 'suspicious_activity'
  | 'data_export'
  | 'data_deletion'
  | 'system_configuration_changed'
  | 'webhook_received'
  | 'api_key_used'
  | 'security_scan_detected';

// Security event interface
export interface SecurityEvent {
  type: AuditEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  timestamp: Date;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  riskScore?: number;
}

// User activity interface
export interface UserActivity {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

// Admin action interface
export interface AdminAction {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  targetResource?: string;
  targetResourceId?: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  justification?: string;
}

// Audit logging class
export class AuditLogger {
  private static readonly COLLECTIONS = {
    SECURITY_EVENTS: 'securityEvents',
    USER_ACTIVITIES: 'userActivities',
    ADMIN_ACTIONS: 'adminActions',
    SYSTEM_LOGS: 'systemLogs'
  };

  // Log security event
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Calculate risk score if not provided
      if (event.riskScore === undefined) {
        event.riskScore = this.calculateRiskScore(event);
      }

      // Set severity if not provided
      if (event.severity === undefined) {
        event.severity = this.determineSeverity(event);
      }

      await adminFirestore
        .collection(this.COLLECTIONS.SECURITY_EVENTS)
        .add({
          ...event,
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp()
        });

      // Log high-risk events to console for immediate attention
      if (event.riskScore >= 7 || event.severity === 'critical') {
        console.warn('HIGH RISK SECURITY EVENT:', {
          type: event.type,
          userId: event.userId,
          ip: event.ip,
          riskScore: event.riskScore,
          severity: event.severity
        });
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failures shouldn't break the application
    }
  }

  // Log user activity
  static async logUserActivity(activity: UserActivity): Promise<void> {
    try {
      await adminFirestore
        .collection(this.COLLECTIONS.USER_ACTIVITIES)
        .add({
          ...activity,
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp()
        });

    } catch (error) {
      console.error('Failed to log user activity:', error);
    }
  }

  // Log admin action
  static async logAdminAction(action: AdminAction): Promise<void> {
    try {
      await adminFirestore
        .collection(this.COLLECTIONS.ADMIN_ACTIONS)
        .add({
          ...action,
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp()
        });

      // Always log admin actions to console
      console.log('ADMIN ACTION:', {
        admin: action.adminUserId,
        action: action.action,
        target: action.targetUserId || action.targetResourceId,
        ip: action.ip
      });

    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // Log system event
  static async logSystemEvent(
    event: string,
    details: Record<string, any> = {},
    severity: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    try {
      await adminFirestore
        .collection(this.COLLECTIONS.SYSTEM_LOGS)
        .add({
          event,
          details,
          severity,
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp()
        });

    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  // Calculate risk score based on event characteristics
  private static calculateRiskScore(event: SecurityEvent): number {
    let score = 0;

    // Base scores by event type
    const eventScores: Record<string, number> = {
      'unauthorized_access_attempt': 8,
      'admin_access_denied': 7,
      'csrf_attempt': 9,
      'suspicious_activity': 8,
      'rate_limit_exceeded': 5,
      'invalid_input': 3,
      'user_login': 1,
      'user_logout': 1,
      'user_registration': 2,
      'password_reset': 3,
      'admin_privilege_granted': 6,
      'admin_privilege_revoked': 6,
      'data_export': 5,
      'data_deletion': 7,
      'system_configuration_changed': 6,
      'security_scan_detected': 9
    };

    score = eventScores[event.type] || 2;

    // Increase score for repeated events from same IP
    if (event.ip) {
      // This would require checking recent events - simplified for now
      score += 1;
    }

    // Increase score for suspicious user agents
    if (event.userAgent) {
      const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i];
      if (suspiciousPatterns.some(pattern => pattern.test(event.userAgent!))) {
        score += 2;
      }
    }

    // Increase score for admin-related events
    if (event.type.includes('admin')) {
      score += 2;
    }

    return Math.min(10, score); // Cap at 10
  }

  // Determine severity based on event type and risk score
  private static determineSeverity(event: SecurityEvent): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = event.riskScore || this.calculateRiskScore(event);

    if (riskScore >= 9) return 'critical';
    if (riskScore >= 7) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  // Get recent security events for analysis
  static async getRecentSecurityEvents(
    hours: number = 24,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<SecurityEvent[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      let query = adminFirestore
        .collection(this.COLLECTIONS.SECURITY_EVENTS)
        .where('timestamp', '>=', cutoffTime)
        .orderBy('timestamp', 'desc');

      if (severity) {
        query = query.where('severity', '==', severity);
      }

      const snapshot = await query.limit(100).get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          timestamp: data.timestamp,
          ...data
        } as SecurityEvent;
      });

    } catch (error) {
      console.error('Failed to get recent security events:', error);
      return [];
    }
  }

  // Get user activity history
  static async getUserActivityHistory(
    userId: string,
    days: number = 30
  ): Promise<UserActivity[]> {
    try {
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const snapshot = await adminFirestore
        .collection(this.COLLECTIONS.USER_ACTIVITIES)
        .where('userId', '==', userId)
        .where('timestamp', '>=', cutoffTime)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          action: data.action,
          timestamp: data.timestamp,
          success: data.success,
          ...data
        } as UserActivity;
      });

    } catch (error) {
      console.error('Failed to get user activity history:', error);
      return [];
    }
  }

  // Get admin action history
  static async getAdminActionHistory(
    adminUserId?: string,
    days: number = 30
  ): Promise<AdminAction[]> {
    try {
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let query = adminFirestore
        .collection(this.COLLECTIONS.ADMIN_ACTIONS)
        .where('timestamp', '>=', cutoffTime)
        .orderBy('timestamp', 'desc');

      if (adminUserId) {
        query = query.where('adminUserId', '==', adminUserId);
      }

      const snapshot = await query.limit(100).get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          adminUserId: data.adminUserId,
          action: data.action,
          timestamp: data.timestamp,
          ...data
        } as AdminAction;
      });

    } catch (error) {
      console.error('Failed to get admin action history:', error);
      return [];
    }
  }

  // Detect suspicious patterns
  static async detectSuspiciousActivity(): Promise<{
    suspiciousIPs: string[];
    repeatedFailures: { userId: string; count: number }[];
    unusualAdminActivity: AdminAction[];
  }> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get recent security events
      const securityEvents = await this.getRecentSecurityEvents(24);

      // Analyze suspicious IPs (multiple failed attempts)
      const ipCounts: Record<string, number> = {};
      securityEvents
        .filter(event => event.severity === 'high' || event.severity === 'critical')
        .forEach(event => {
          if (event.ip) {
            ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
          }
        });

      const suspiciousIPs = Object.entries(ipCounts)
        .filter(([_, count]) => count >= 5)
        .map(([ip, _]) => ip);

      // Analyze repeated failures by user
      const userFailures: Record<string, number> = {};
      securityEvents
        .filter(event => event.type.includes('failed') || event.type.includes('denied'))
        .forEach(event => {
          if (event.userId) {
            userFailures[event.userId] = (userFailures[event.userId] || 0) + 1;
          }
        });

      const repeatedFailures = Object.entries(userFailures)
        .filter(([_, count]) => count >= 3)
        .map(([userId, count]) => ({ userId, count }));

      // Get unusual admin activity (outside business hours, etc.)
      const adminActions = await this.getAdminActionHistory(undefined, 1);
      const unusualAdminActivity = adminActions.filter(action => {
        const hour = new Date(action.timestamp).getHours();
        return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
      });

      return {
        suspiciousIPs,
        repeatedFailures,
        unusualAdminActivity
      };

    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
      return {
        suspiciousIPs: [],
        repeatedFailures: [],
        unusualAdminActivity: []
      };
    }
  }

  // Clean up old audit logs (for GDPR compliance and storage management)
  static async cleanupOldLogs(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const collections = Object.values(this.COLLECTIONS);
      
      for (const collection of collections) {
        const snapshot = await adminFirestore
          .collection(collection)
          .where('timestamp', '<', cutoffTime)
          .limit(500) // Process in batches
          .get();

        if (!snapshot.empty) {
          const batch = adminFirestore.batch();
          snapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();

          console.log(`Cleaned up ${snapshot.size} old records from ${collection}`);
        }
      }

    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

// Export singleton instance
export const auditLog = AuditLogger;

// Convenience functions for common audit events
export const auditEvents = {
  userLogin: (userId: string, ip: string, userAgent: string, success: boolean) =>
    auditLog.logUserActivity({
      userId,
      action: 'login',
      timestamp: new Date(),
      ip,
      userAgent,
      success
    }),

  userRegistration: (userId: string, ip: string, userAgent: string) =>
    auditLog.logUserActivity({
      userId,
      action: 'registration',
      timestamp: new Date(),
      ip,
      userAgent,
      success: true
    }),

  adminPrivilegeGranted: (adminUserId: string, targetUserId: string, ip: string) =>
    auditLog.logAdminAction({
      adminUserId,
      action: 'grant_admin_privileges',
      targetUserId,
      timestamp: new Date(),
      ip
    }),

  bookingCreated: (userId: string, bookingId: string, ip: string) =>
    auditLog.logUserActivity({
      userId,
      action: 'booking_created',
      resource: 'booking',
      resourceId: bookingId,
      timestamp: new Date(),
      ip,
      success: true
    }),

  paymentProcessed: (userId: string, amount: number, paymentIntentId: string, ip: string) =>
    auditLog.logUserActivity({
      userId,
      action: 'payment_processed',
      resource: 'payment',
      resourceId: paymentIntentId,
      timestamp: new Date(),
      ip,
      success: true,
      details: { amount }
    })
};
