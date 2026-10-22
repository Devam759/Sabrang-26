/**
 * Transactional Email Service for Sabrang 2026
 *
 * Implements direct transactional email delivery exclusively via Brevo (Sendinblue) REST API.
 *
 * Features:
 * - Direct REST transport interface supporting recipients, HTML, text, attachments
 * - Confirmed acceptance verification via messageId
 * - Ambiguous timeout protection against duplicate ticket delivery
 * - Sanitized error reporting preventing credential leakage
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  content?: string; // Base64 encoded string
  url?: string;
  name: string;
  contentType?: string;
}

export interface EmailSender {
  email: string;
  name: string;
}

export interface EmailPayload {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: EmailSender;
  replyTo?: EmailSender;
  attachment?: EmailAttachment[];
  allowAmbiguousFallback?: boolean;
}

export type EmailProviderName = 'brevo' | 'none';

export interface EmailSendResult {
  success: boolean;
  provider: EmailProviderName;
  messageId?: string;
  error?: string;
  attemptedProviders: string[];
  isAmbiguous?: boolean;
}

/**
 * Sanitizes sensitive credentials, tokens, and authorization headers from error messages.
 */
export function sanitizeEmailError(msg: string | null | undefined): string {
  if (!msg || typeof msg !== 'string') return '';
  return msg
    .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, 'Basic [REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED]')
    .replace(/xkeysib-[A-Za-z0-9-_]+/gi, '[REDACTED_BREVO_KEY]')
    .replace(/(["']?(?:apiKey|api_key|secret|password|clientSecret)["']?\s*[:=]\s*["']?)([^"',\s&}]+)(["']?)/gi, '$1[REDACTED]$3');
}

/**
 * Helper to get active Brevo configuration.
 */
export function getBrevoConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL || "sabrang@jklu.edu.in",
    senderName: process.env.BREVO_SENDER_NAME || "Sabrang 2026 | JKLU",
    endpoint: process.env.BREVO_API_URL || "https://api.brevo.com/v3/smtp/email",
  };
}

/**
 * In-memory cache for Brevo available credits to prevent silent background queue drops
 */
let cachedBrevoCredits: { credits: number; expiresAt: number } | null = null;

export async function getBrevoAvailableCredits(apiKey: string): Promise<number | null> {
  const now = Date.now();
  if (cachedBrevoCredits && cachedBrevoCredits.expiresAt > now) {
    return cachedBrevoCredits.credits;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const freePlan = data.plan?.find((p: any) => p.creditsType === 'sendLimit' || p.type === 'free');
    const credits = freePlan ? freePlan.credits : (data.plan?.[0]?.credits ?? null);

    if (typeof credits === 'number') {
      cachedBrevoCredits = { credits, expiresAt: now + 60 * 1000 };
      return credits;
    }
    return null;
  } catch (_err) {
    return null;
  }
}

export function setBrevoCreditsExhausted() {
  cachedBrevoCredits = { credits: 0, expiresAt: Date.now() + 15 * 60 * 1000 };
}

export function resetBrevoCreditsCache() {
  cachedBrevoCredits = null;
}

/**
 * Dispatches an email through Brevo REST API v3.
 * Returns success only when Brevo confirms acceptance (messageId returned).
 */
export async function sendBrevoProvider(
  payload: EmailPayload,
  timeoutMs: number = 10000
): Promise<{ success: boolean; messageId?: string; error?: string; isAmbiguous?: boolean }> {
  const config = getBrevoConfig();

  if (!config.apiKey) {
    return { success: false, error: "BREVO_API_KEY not configured", isAmbiguous: false };
  }

  const sender = payload.sender || {
    email: config.senderEmail,
    name: config.senderName,
  };

  const body: Record<string, any> = {
    sender,
    to: payload.to,
    subject: payload.subject,
    htmlContent: payload.htmlContent,
    textContent: payload.textContent || undefined,
    replyTo: payload.replyTo || sender,
  };

  if (payload.attachment && payload.attachment.length > 0) {
    body.attachment = payload.attachment.map((att) => ({
      name: att.name,
      content: att.content,
      url: att.url,
    }));
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "api-key": config.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const data = await response.json().catch(() => ({}));

    // Check for HTTP errors
    if (!response.ok) {
      const errorMsg = data.message || data.code || `Brevo HTTP ${response.status}`;
      return { success: false, error: sanitizeEmailError(errorMsg), isAmbiguous: false };
    }

    // Require verified acceptance (messageId presence)
    if (!data.messageId) {
      return {
        success: false,
        error: "Brevo responded with HTTP 200/201 but omitted messageId confirmation",
        isAmbiguous: false,
      };
    }

    return { success: true, messageId: String(data.messageId) };
  } catch (err: any) {
    const isTimeout =
      err.name === 'AbortError' ||
      err.name === 'TimeoutError' ||
      err.code === 'ABORT_ERR' ||
      err.message?.includes('timeout') ||
      err.message?.includes('aborted');

    if (isTimeout) {
      return {
        success: false,
        error: `Brevo request timed out after ${timeoutMs}ms`,
        isAmbiguous: true,
      };
    }

    return {
      success: false,
      error: sanitizeEmailError(err.message || 'Brevo network error'),
      isAmbiguous: false,
    };
  }
}

/**
 * Main transactional email dispatcher via Brevo.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const attemptedProviders: string[] = [];
  const brevoConfig = getBrevoConfig();

  // Validate recipients
  if (!payload.to || payload.to.length === 0) {
    return {
      success: false,
      provider: 'none',
      error: 'No email recipients provided',
      attemptedProviders,
    };
  }

  if (!brevoConfig.apiKey) {
    return {
      success: false,
      provider: 'none',
      error: 'BREVO_API_KEY not configured',
      attemptedProviders,
    };
  }

  // Proactively verify Brevo available sending credits
  const availableCredits = await getBrevoAvailableCredits(brevoConfig.apiKey);
  if (availableCredits !== null && availableCredits <= 0) {
    console.error(`[EmailService] Brevo account has 0 credits remaining.`);
    return {
      success: false,
      provider: 'none',
      error: 'Brevo daily credits exhausted (0 remaining)',
      attemptedProviders: ['brevo'],
    };
  }

  attemptedProviders.push('brevo');
  console.log(`[EmailService] Dispatching transactional email via Brevo to ${payload.to.map(r => r.email).join(', ')}...`);

  const brevoResult = await sendBrevoProvider(payload);

  if (brevoResult.success) {
    console.log(`[EmailService] Brevo accepted message. MessageID: ${brevoResult.messageId}`);
    return {
      success: true,
      provider: 'brevo',
      messageId: brevoResult.messageId,
      attemptedProviders,
    };
  }

  const brevoError = brevoResult.error || 'Unknown Brevo failure';
  console.error(`[EmailService] Brevo delivery failed: ${brevoError}`);

  if (brevoError.toLowerCase().includes('credit') || brevoError.toLowerCase().includes('quota')) {
    setBrevoCreditsExhausted();
  }

  return {
    success: false,
    provider: 'none',
    error: sanitizeEmailError(`Brevo delivery failed: ${brevoError}`),
    attemptedProviders,
    isAmbiguous: brevoResult.isAmbiguous,
  };
}

/**
 * Backward compatibility wrapper matching previous sendBrevoEmail signature.
 */
export async function sendBrevoEmail(params: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: { email: string; name: string };
  replyTo?: { email: string; name: string };
  attachment?: { url?: string; content?: string; name: string; contentType?: string }[];
}): Promise<{ success: boolean; messageId?: string; provider?: EmailProviderName; error?: string }> {
  const result = await sendTransactionalEmail(params);
  return {
    success: result.success,
    messageId: result.messageId,
    provider: result.provider,
    error: result.error,
  };
}
