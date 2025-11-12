import { adminFirestore } from '$lib/firebase/server';

interface AuditEvent {
  type: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  error?: string;
  timestamp?: Date;
}

const COLLECTION = 'securityAuditLogs';

async function writeEvent(event: AuditEvent) {
  if (!adminFirestore) {
    console.warn('Audit log (Firebase Admin unavailable):', event);
    return;
  }

  try {
    await adminFirestore.collection(COLLECTION).add({
      ...event,
      createdAt: adminFirestore.Timestamp?.now?.() ?? new Date()
    });
  } catch (error) {
    console.error('Failed to write security audit log:', error);
  }
}

export const auditLog = {
  async logSecurityEvent(event: AuditEvent) {
    await writeEvent(event);
  }
};
