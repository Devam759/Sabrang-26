/**
 * Unified Transactional Email Service for Sabrang 2026
 *
 * Implements primary email delivery via Brevo (Sendinblue) REST API with
 * automatic fallback to Mailjet v3.1 Send API.
 *
 * Features:
 * - Common transport interface supporting recipients, HTML, text, attachments
 * - Confirmed acceptance verification for both providers
 * - Automatic failover when Brevo quota is reached, rate-limited, or unavailable
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
  /**
   * If true, allows fallback even if primary provider returned an ambiguous timeout.
   * Default is false to prevent duplicate email delivery.
   */
  allowAmbiguousFallback?: boolean;
}

export type EmailProviderName = 'brevo' | 'mailjet' | 'none';

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
 * Helper to get active Mailjet configuration.
 */
export function getMailjetConfig() {
  return {
    apiKey: process.env.MAILJET_API_KEY,
    apiSecret: process.env.MAILJET_API_SECRET,
    senderEmail: process.env.MAILJET_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || "sabrang@jklu.edu.in",
    senderName: process.env.MAILJET_SENDER_NAME || process.env.BREVO_SENDER_NAME || "Sabrang 2026 | JKLU",
    endpoint: process.env.MAILJET_API_URL || "https://api.mailjet.com/v3.1/send",
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
 * Dispatches an email through Mailjet Send API v3.1.
 * Returns success only when Mailjet confirms acceptance (Status === 'success').
 */
export async function sendMailjetProvider(
  payload: EmailPayload,
  timeoutMs: number = 10000
): Promise<{ success: boolean; messageId?: string; error?: string; isAmbiguous?: boolean }> {
  const config = getMailjetConfig();

  if (!config.apiKey || !config.apiSecret) {
    return {
      success: false,
      error: "MAILJET_API_KEY or MAILJET_API_SECRET not configured",
      isAmbiguous: false,
    };
  }

  const sender = payload.sender || {
    email: config.senderEmail,
    name: config.senderName,
  };

  // Extract any inline data:image base64 URLs into Mailjet InlinedAttachments (cid:)
  // This prevents Gmail from clipping the email or dropping base64 data URIs.
  let processedHtml = payload.htmlContent;
  const inlinedAttachments: Array<{
    ContentType: string;
    Filename: string;
    ContentID: string;
    Base64Content: string;
  }> = [];

  const dataUriRegex = /<img([^>]+)src=["']data:image\/([a-zA-Z0-9+]+);base64,([A-Za-z0-9+/=\s]+)["']([^>]*)>/gi;
  let inlineIndex = 1;
  processedHtml = processedHtml.replace(dataUriRegex, (_match, prefix, format, base64Data, suffix) => {
    const cleanBase64 = base64Data.replace(/\s+/g, '');
    const contentId = `inline_img_${inlineIndex++}`;
    const filename = `image_${inlineIndex}.${format === 'jpeg' ? 'jpg' : format}`;
    inlinedAttachments.push({
      ContentType: `image/${format}`,
      Filename: filename,
      ContentID: contentId,
      Base64Content: cleanBase64,
    });
    return `<img${prefix}src="cid:${contentId}"${suffix}>`;
  });

  const mailjetMessage: Record<string, any> = {
    From: {
      Email: sender.email,
      Name: sender.name,
    },
    To: payload.to.map((r) => ({
      Email: r.email,
      Name: r.name || r.email,
    })),
    Subject: payload.subject,
    HTMLPart: processedHtml,
    TextPart: payload.textContent || "",
  };

  if (inlinedAttachments.length > 0) {
    mailjetMessage.InlinedAttachments = inlinedAttachments;
  }

  if (payload.replyTo) {
    mailjetMessage.ReplyTo = {
      Email: payload.replyTo.email,
      Name: payload.replyTo.name,
    };
  }

  if (payload.attachment && payload.attachment.length > 0) {
    mailjetMessage.Attachments = payload.attachment.map((att) => ({
      ContentType:
        att.contentType ||
        (att.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      Filename: att.name,
      Base64Content: att.content || "",
    }));
  }

  const basicAuth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ Messages: [mailjetMessage] }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const topLevelError =
        data.ErrorMessage ||
        data.message ||
        (data.Messages && data.Messages[0]?.Errors?.[0]?.ErrorMessage) ||
        `Mailjet HTTP ${response.status}`;
      return { success: false, error: sanitizeEmailError(topLevelError), isAmbiguous: false };
    }

    const firstMsg = data.Messages?.[0];
    if (!firstMsg) {
      return { success: false, error: "Mailjet returned empty message response", isAmbiguous: false };
    }

    if (firstMsg.Status !== "success") {
      const errMsg =
        firstMsg.Errors?.map((e: any) => e.ErrorMessage).join("; ") ||
        `Mailjet delivery rejected with status: ${firstMsg.Status}`;
      return { success: false, error: sanitizeEmailError(errMsg), isAmbiguous: false };
    }

    // Extract MessageID from first recipient confirmation
    const messageId =
      firstMsg.To?.[0]?.MessageID !== undefined
        ? String(firstMsg.To[0].MessageID)
        : firstMsg.To?.[0]?.MessageUUID || "mailjet-delivered";

    return { success: true, messageId };
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
        error: `Mailjet request timed out after ${timeoutMs}ms`,
        isAmbiguous: true,
      };
    }

    return {
      success: false,
      error: sanitizeEmailError(err.message || 'Mailjet network error'),
      isAmbiguous: false,
    };
  }
}

/**
 * Main transactional email dispatcher.
 *
 * Sequence:
 * 1. Attempt delivery through Brevo.
 * 2. If Brevo confirms acceptance, return success with provider 'brevo'.
 * 3. If Brevo fails (e.g. quota limit, 4xx/5xx, network error, or missing credentials),
 *    and error is NOT an ambiguous timeout (or allowAmbiguousFallback is true), attempt Mailjet.
 * 4. If Mailjet confirms acceptance, return success with provider 'mailjet'.
 * 5. If both fail or are misconfigured, return failure with sanitized errors.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const attemptedProviders: string[] = [];
  const brevoConfig = getBrevoConfig();
  const mailjetConfig = getMailjetConfig();

  // Validate recipients
  if (!payload.to || payload.to.length === 0) {
    return {
      success: false,
      provider: 'none',
      error: 'No email recipients provided',
      attemptedProviders,
    };
  }

  // 1. Primary Attempt: Brevo
  let brevoError = '';
  if (brevoConfig.apiKey) {
    // Proactively verify Brevo available sending credits to prevent silent background queue drops
    const availableCredits = await getBrevoAvailableCredits(brevoConfig.apiKey);
    if (availableCredits !== null && availableCredits <= 0) {
      console.warn(`[EmailService] Brevo account has 0 credits remaining. Proactively skipping directly to Mailjet.`);
      brevoError = 'Brevo daily credits exhausted (0 remaining)';
    } else {
      attemptedProviders.push('brevo');
      console.log(`[EmailService] Attempting primary delivery via Brevo to ${payload.to.map(r => r.email).join(', ')}...`);

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

      brevoError = brevoResult.error || 'Unknown Brevo failure';
      console.warn(`[EmailService] Brevo delivery failed: ${brevoError}`);

      if (brevoError.toLowerCase().includes('credit') || brevoError.toLowerCase().includes('quota')) {
        setBrevoCreditsExhausted();
      }

      // Conservative Duplicate Email Prevention:
      // If Brevo timed out waiting for an HTTP response, the message may already have been
      // accepted by Brevo's queue. To prevent duplicate ticket delivery, do not immediately
      // blast the fallback provider unless allowAmbiguousFallback is explicitly true.
      if (brevoResult.isAmbiguous && !payload.allowAmbiguousFallback) {
        console.warn(
          `[EmailService] Ambiguous Brevo timeout detected. Withholding immediate fallback to prevent duplicate email delivery.`
        );
        return {
          success: false,
          provider: 'none',
          error: `Brevo delivery timeout (ambiguous acceptance; fallback withheld to prevent duplicate): ${brevoError}`,
          attemptedProviders,
          isAmbiguous: true,
        };
      }
    }
  } else {
    brevoError = 'BREVO_API_KEY not configured';
    console.warn(`[EmailService] Brevo API key not configured. Proceeding directly to secondary provider.`);
  }

  // 2. Secondary / Fallback Attempt: Mailjet
  if (mailjetConfig.apiKey && mailjetConfig.apiSecret) {
    attemptedProviders.push('mailjet');
    console.log(`[EmailService] Attempting fallback delivery via Mailjet...`);

    const mailjetResult = await sendMailjetProvider(payload);

    if (mailjetResult.success) {
      console.log(`[EmailService] Mailjet accepted message. MessageID: ${mailjetResult.messageId}`);
      return {
        success: true,
        provider: 'mailjet',
        messageId: mailjetResult.messageId,
        attemptedProviders,
      };
    }

    const mailjetError = mailjetResult.error || 'Unknown Mailjet failure';
    console.error(`[EmailService] Mailjet delivery failed: ${mailjetError}`);

    return {
      success: false,
      provider: 'none',
      error: sanitizeEmailError(`All providers failed. Brevo: [${brevoError}]; Mailjet: [${mailjetError}]`),
      attemptedProviders,
      isAmbiguous: mailjetResult.isAmbiguous,
    };
  } else {
    const mailjetError = 'MAILJET_API_KEY or MAILJET_API_SECRET not configured';
    console.warn(`[EmailService] Mailjet fallback not configured (${mailjetError}).`);

    return {
      success: false,
      provider: 'none',
      error: sanitizeEmailError(`Primary provider failed (${brevoError}), and fallback provider is unconfigured.`),
      attemptedProviders,
    };
  }
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
