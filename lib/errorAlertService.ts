import { adminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export interface ErrorAlertPayload {
  errorId?: string;
  message: string;
  type?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  stack?: string;
  userAgent?: string;
  userId?: string;
  metadata?: Record<string, any>;
  environment?: string;
  timestamp?: string | Date;
}

// In-memory deduplication set to avoid sending duplicate emails for the same error ID or rapid identical spikes
const recentAlertHashes = new Set<string>();

// Loop prevention flag for recursive error alert attempts
let isInsideAlertExecution = false;

/**
 * Sanitizes sensitive credentials, tokens, passwords, and private keys from error messages and stack traces.
 */
export function sanitizeErrorDetails(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Redact JWT and Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_JWT_TOKEN]')
    .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_BEARER_TOKEN]')
    // Redact Private Keys
    .replace(/-----BEGIN [A-Z ]+KEY-----[\s\S]*?-----END [A-Z ]+KEY-----/gi, '[REDACTED_PRIVATE_KEY]')
    // Redact Password fields in JSON / query strings
    .replace(/(["']?(?:password|passwd|pass|secret|apiKey|api_key|clientSecret|client_secret|token|sessionSecret)["']?\s*[:=]\s*["']?)([^"',\s&}]+)(["']?)/gi, '$1[REDACTED]$3')
    // Redact Cookie strings
    .replace(/cookie:\s*[^;\r\n]+/gi, 'cookie: [REDACTED_COOKIES]')
    // Redact Credit Card / CVV references
    .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED_CARD_NUMBER]')
    .replace(/(["']?(?:cvv|cvc|securityCode)["']?\s*[:=]\s*["']?)(\d{3,4})(["']?)/gi, '$1[REDACTED_CVV]$3');
}

/**
 * Sends an error alert email via Brevo.
 */
async function sendAlertEmail(to: { email: string; name?: string }[], subject: string, htmlContent: string, textContent: string): Promise<string> {
  const { sendTransactionalEmail } = await import('./emailService');
  const result = await sendTransactionalEmail({
    to,
    subject,
    htmlContent,
    textContent,
  });
  if (!result.success) {
    throw new Error(result.error || 'Alert email dispatch failed');
  }
  return result.provider;
}

/**
 * Main error alert dispatcher.
 * Safely sends email to devamgupta@jklu.edu.in after an error is recorded in Error Log.
 */
export async function sendErrorNotificationAlert(payload: ErrorAlertPayload): Promise<boolean> {
  // 1. Check if email alerts are globally enabled (defaults to true)
  if (process.env.ERROR_EMAIL_ENABLED === 'false') {
    console.log("Error email alerts are disabled via ERROR_EMAIL_ENABLED=false.");
    return false;
  }

  // 2. Loop & Recursion Protection: Prevent infinite error -> email -> error loops
  if (isInsideAlertExecution) {
    console.warn("Recursive error alert execution detected and suppressed.");
    return false;
  }

  // 3. Deduplication Check
  const dedupKey = payload.errorId || `${payload.type}_${payload.path}_${payload.message.substring(0, 50)}`;
  if (recentAlertHashes.has(dedupKey)) {
    console.log(`Duplicate error alert suppressed for key: ${dedupKey}`);
    return false;
  }

  // Register deduplication key with automatic 2-minute expiration
  recentAlertHashes.add(dedupKey);
  setTimeout(() => {
    recentAlertHashes.delete(dedupKey);
  }, 2 * 60 * 1000);

  isInsideAlertExecution = true;

  try {
    const rawRecipients = process.env.ERROR_ALERT_EMAIL || 'devamgupta@jklu.edu.in';
    const recipientEmails = rawRecipients.split(',').map(e => e.trim()).filter(Boolean);
    const toList = recipientEmails.map(email => ({ email, name: 'Sabrang Dev Team' }));
    const recipientSummary = recipientEmails.join(', ');
    const fromAddress = process.env.BREVO_SENDER_EMAIL || 'sabrang@jklu.edu.in';
    const environment = payload.environment || process.env.NODE_ENV || 'development';

    // Sanitize message and stack trace to prevent credential leaks
    const cleanMessage = sanitizeErrorDetails(payload.message || 'Unknown Application Error');
    const cleanStack = sanitizeErrorDetails(payload.stack || 'No stack trace available');
    const cleanPath = sanitizeErrorDetails(payload.path || '/');
    const errorType = payload.type || 'Application Error';
    const errorId = payload.errorId || 'N/A';

    // Current formatted IST timestamp
    const istTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    const subject = `[SABRANG ERROR] ${errorType}: ${cleanMessage.substring(0, 50)}${cleanMessage.length > 50 ? '...' : ''}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; color: #1e293b;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 24px 28px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85; margin-bottom: 6px;">
            🚨 Sabrang Monitoring Alert
          </div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; line-height: 1.3;">
            New Error Recorded in Error Log
          </h1>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px;">
          <p style="font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 20px; color: #475569;">
            An application error was intercepted and successfully logged in the Sabrang Error Log. Below are the diagnostic details:
          </p>

          <!-- Core Details Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #64748b; width: 140px;">Error Type:</td>
                <td style="padding: 10px 0; font-weight: 700; color: #dc2626;">${errorType}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #64748b;">Error Message:</td>
                <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">${cleanMessage}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #64748b;">Error ID:</td>
                <td style="padding: 10px 0; font-family: monospace; font-size: 12px; color: #6366f1;">${errorId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #64748b;">Route / API:</td>
                <td style="padding: 10px 0; font-family: monospace; font-size: 12px; color: #0f172a;">
                  ${payload.method ? `[${payload.method}] ` : ''}${cleanPath}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #64748b;">Timestamp (IST):</td>
                <td style="padding: 10px 0; color: #334155;">${istTime}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #64748b;">Environment:</td>
                <td style="padding: 10px 0;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: ${environment === 'production' ? '#fee2e2; color: #991b1b;' : '#e0e7ff; color: #3730a3;'}">
                    ${environment}
                  </span>
                </td>
              </tr>
              ${payload.userId ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #64748b;">User Context:</td>
                <td style="padding: 10px 0; color: #334155;">${sanitizeErrorDetails(payload.userId)}</td>
              </tr>` : ''}
              ${payload.userAgent ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 700; color: #64748b;">Client Agent:</td>
                <td style="padding: 10px 0; font-size: 11px; color: #64748b; font-family: monospace;">${payload.userAgent.substring(0, 120)}</td>
              </tr>` : ''}
            </tbody>
          </table>

          <!-- Stack Trace Box -->
          <div style="margin-top: 10px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px;">
              Sanitized Stack Trace
            </div>
            <pre style="background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; font-family: 'Courier New', Courier, monospace; font-size: 11.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; margin: 0; overflow-x: auto; max-height: 280px;">${cleanStack.substring(0, 1500)}</pre>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
          Sabrang 2026 Automated System Reliability & Error Alert Service • Delivered to ${recipientSummary}
        </div>
      </div>
    `;

    const textContent = `
[SABRANG ERROR ALERT]
Error Type: ${errorType}
Error Message: ${cleanMessage}
Error ID: ${errorId}
Route / Path: ${cleanPath}
Timestamp: ${istTime}
Environment: ${environment}

Stack Trace:
${cleanStack.substring(0, 1000)}
    `.trim();

    const provider = await sendAlertEmail(toList, subject, htmlContent, textContent);
    console.log(`[ErrorAlertService] Error notification email sent successfully via ${provider} to ${recipientSummary} for Error ID: ${errorId}`);

    // Update Firestore error record notification status if errorId exists
    if (errorId !== 'N/A' && adminDb) {
      adminDb.collection('systemErrors').doc(errorId).update({
        notificationStatus: 'SENT',
        notifiedTo: recipientSummary,
        notifiedAt: FieldValue.serverTimestamp(),
      }).catch(() => {});
    }

    return true;
  } catch (sendErr) {
    // Secondary failure should NEVER crash the main app or error logging
    console.error("[ErrorAlertService] Non-fatal: Failed to dispatch error alert email:", sendErr);

    if (payload.errorId && payload.errorId !== 'N/A' && adminDb) {
      adminDb.collection('systemErrors').doc(payload.errorId).update({
        notificationStatus: 'FAILED',
        notificationError: (sendErr as any)?.message || 'Email alert dispatch failed',
      }).catch(() => {});
    }

    return false;
  } finally {
    isInsideAlertExecution = false;
  }
}

/**
 * Unified server-side system error logger.
 * 1. Writes solely to the `systemErrors` collection (NEVER `auditLogs`).
 * 2. Immediately dispatches an email alert to the dev team via Brevo ("haatho haath").
 */
export async function logSystemError(params: {
  message: string;
  stack?: string;
  path?: string;
  type?: string;
  method?: string;
  statusCode?: number;
  performedBy?: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  try {
    if (!adminDb) {
      console.warn("[logSystemError] Firebase Admin DB not initialized.");
      return null;
    }

    const cleanMessage = sanitizeErrorDetails(params.message || 'Unknown Server Error');
    const cleanStack = sanitizeErrorDetails(params.stack ? params.stack.substring(0, 1500) : 'No stack trace provided');
    const cleanPath = sanitizeErrorDetails(params.path || '/');
    const type = params.type || 'Server API Error';

    const errorDetails = `[${type}] ${cleanMessage}\n\nStack:\n${cleanStack}`;

    const errorRecord: any = {
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      action: 'SYSTEM_ERROR',
      performedBy: params.performedBy || 'System API',
      targetEntity: cleanPath,
      details: errorDetails,
      message: cleanMessage,
      stack: cleanStack,
      type: type,
      method: params.method || 'SERVER',
      statusCode: params.statusCode || 500,
      userAgent: 'Server Runtime',
      userId: 'Server',
      environment: process.env.NODE_ENV || 'development',
      notificationStatus: 'PENDING',
    };

    if (params.metadata && typeof params.metadata === 'object') {
      errorRecord.metadata = params.metadata;
    }

    // Record SOLELY in systemErrors collection - NEVER in auditLogs
    const errorDocRef = await adminDb.collection('systemErrors').add(errorRecord);
    const errorId = errorDocRef.id;

    // Trigger email alert asynchronously ("haatho haath")
    sendErrorNotificationAlert({
      errorId,
      message: cleanMessage,
      type,
      path: cleanPath,
      method: params.method || 'SERVER',
      statusCode: params.statusCode || 500,
      stack: cleanStack,
      metadata: params.metadata,
      environment: process.env.NODE_ENV || 'development',
    }).catch(alertErr => console.error("[logSystemError] Failed to dispatch automated alert email:", alertErr));

    return errorId;
  } catch (err) {
    console.error("[logSystemError] Critical: Failed to log system error:", err);
    return null;
  }
}
