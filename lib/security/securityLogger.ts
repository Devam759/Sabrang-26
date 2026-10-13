import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { maskEmail } from '@/lib/security';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGIN_LOCKOUT'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'EMAIL_VERIFICATION_SENT'
  | 'IDOR_ATTEMPT_BLOCKED'
  | 'EXPLOIT_PROBE_BLOCKED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'WEBHOOK_SIGNATURE_MISMATCH'
  | 'UNAUTHORIZED_API_ACCESS';

export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEventPayload {
  type: SecurityEventType;
  severity: SecuritySeverity;
  ip: string;
  email?: string;
  userId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  details: string;
  metadata?: Record<string, any>;
}

// In-memory sliding tracker for rapid anomaly burst detection
const ipAnomalyTracker = new Map<string, { highSeverityCount: number; firstAt: number }>();

function trackAnomalyBurst(ip: string, severity: SecuritySeverity): boolean {
  if (severity !== 'HIGH' && severity !== 'CRITICAL') return false;

  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes

  let record = ipAnomalyTracker.get(ip);
  if (!record || now - record.firstAt > windowMs) {
    record = { highSeverityCount: 1, firstAt: now };
  } else {
    record.highSeverityCount++;
  }

  ipAnomalyTracker.set(ip, record);
  // Alert if 3+ high-severity events occur within 5 minutes from the same IP
  return record.highSeverityCount >= 3;
}

/**
 * Enterprise Security Logger: Records structured security events, authentication attempts,
 * and malicious probe attempts into Firestore audit trails and console logs.
 */
export async function logSecurityEvent(payload: SecurityEventPayload): Promise<void> {
  const timestamp = new Date().toISOString();
  const maskedUserEmail = payload.email ? maskEmail(payload.email) : undefined;

  const logEntry = {
    timestamp: FieldValue.serverTimestamp(),
    recordedAt: timestamp,
    type: payload.type,
    severity: payload.severity,
    ip: payload.ip,
    email: maskedUserEmail || 'N/A',
    rawEmailMasked: payload.email ? maskEmail(payload.email) : undefined,
    userId: payload.userId || 'N/A',
    path: payload.path || 'N/A',
    method: payload.method || 'N/A',
    userAgent: payload.userAgent ? payload.userAgent.slice(0, 200) : 'N/A',
    details: payload.details,
    metadata: payload.metadata || {},
  };

  // Structured security log output
  const prefix = `[SECURITY ${payload.severity}] ${payload.type}:`;
  if (payload.severity === 'CRITICAL' || payload.severity === 'HIGH') {
    console.error(prefix, payload.details, `IP: ${payload.ip}`);
  } else if (payload.severity === 'MEDIUM') {
    console.warn(prefix, payload.details, `IP: ${payload.ip}`);
  } else {
    console.info(prefix, payload.details);
  }

  // Check for high-volume anomaly bursts from the same IP
  const isAnomalyBurst = trackAnomalyBurst(payload.ip, payload.severity);
  if (isAnomalyBurst) {
    console.error(
      `🚨 [SECURITY ANOMALY DETECTED] IP ${payload.ip} has generated repeated high-severity security incidents within 5 minutes. Consider IP firewall blocking.`
    );
  }

  // Persist into Firestore auditLogs and systemErrors if database is available
  if (adminDb) {
    try {
      await adminDb.collection('auditLogs').add({
        ...logEntry,
        isAnomalyBurst,
      });

      // If high or critical, mirror to systemErrors so alert emails can dispatch
      if (payload.severity === 'CRITICAL' || payload.severity === 'HIGH') {
        await adminDb.collection('systemErrors').add({
          type: `Security: ${payload.type}`,
          message: payload.details,
          path: payload.path || '/',
          method: payload.method || 'N/A',
          statusCode: 403,
          ip: payload.ip,
          timestamp: FieldValue.serverTimestamp(),
          isSecurityAlert: true,
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[SecurityLogger] Failed to write event to Firestore:', err);
    }
  }
}
