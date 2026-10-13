import { NextResponse } from 'next/server';
import {
  checkAiGenerationRateLimit,
  createRateLimitResponse,
  extractClientIp,
  getRateLimitHeaders,
} from '@/lib/auth/rateLimiter';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { logSecurityEvent } from '@/lib/security/securityLogger';
import { sanitizeInput } from '@/lib/security';
import { verifyReCaptchaToken } from '@/lib/recaptcha';

export const runtime = 'nodejs';

// Known prompt injection and LLM jailbreak probe signatures
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /jailbreak/i,
  /system\s+prompt\s+override/i,
  /bypass\s+safety\s+filter/i,
];

/**
 * AI Generation Endpoint
 * Protected against abuse, token draining, and scraper bot flooding.
 * 
 * Abuse Protections:
 * 1. AI Rate Limiting: 5 requests per minute, 25 per hour per user/IP
 * 2. Prompt Length Restriction: 1,000 characters max
 * 3. Prompt Injection & Jailbreak Defense
 * 4. Bot & reCAPTCHA validation
 * 5. Structured security audit logging
 */
export async function POST(req: Request) {
  const ip = extractClientIp(req);

  // 1. Resolve caller identifier (authenticated user ID if logged in, or client IP)
  const authResult = await authenticateRequest(req, { requireEmailVerification: false });
  const identifier = authResult.authorized ? `user:${authResult.user.uid}` : `ip:${ip}`;

  // 2. Strict AI Generation Rate Limiting
  const rateLimitResult = checkAiGenerationRateLimit(identifier);
  if (!rateLimitResult.allowed) {
    await logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'HIGH',
      ip,
      userId: authResult.authorized ? authResult.user.uid : undefined,
      path: '/api/ai/generate',
      details: `AI generation rate limit exceeded for ${identifier}. Abuse prevention activated.`,
    });
    return createRateLimitResponse(rateLimitResult, 5);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const { prompt, type = 'assistant', recaptchaToken } = body;

  // 3. Prompt Validation & Length Guard
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'A valid text prompt is required.' }, { status: 400 });
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return NextResponse.json({ error: 'Prompt cannot be empty.' }, { status: 400 });
  }

  if (trimmedPrompt.length > 1000) {
    return NextResponse.json(
      { error: 'Prompt exceeds maximum allowed length of 1,000 characters.' },
      { status: 400 }
    );
  }

  // 4. Prompt Injection & Exploit Signature Filter
  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(trimmedPrompt))) {
    await logSecurityEvent({
      type: 'EXPLOIT_PROBE_BLOCKED',
      severity: 'HIGH',
      ip,
      userId: authResult.authorized ? authResult.user.uid : undefined,
      path: '/api/ai/generate',
      details: `Blocked adversarial prompt injection attempt: "${trimmedPrompt.slice(0, 100)}"`,
    });
    return NextResponse.json(
      { error: 'Prompt rejected by security policy.' },
      { status: 400 }
    );
  }

  // 5. Unauthenticated Guest reCAPTCHA Verification
  if (!authResult.authorized && recaptchaToken) {
    const captcha = await verifyReCaptchaToken(recaptchaToken, 'ai_generate', 0.5);
    if (!captcha.success) {
      return NextResponse.json(
        { error: 'reCAPTCHA bot verification failed. Please refresh and try again.' },
        { status: 403 }
      );
    }
  }

  // 6. Clean input
  const cleanPrompt = sanitizeInput(trimmedPrompt);

  // 7. Generation Logic (e.g. Sabrang Festival Schedule, Event Recommendations, FAQ Assistance)
  const festivalFaqKeywords = [
    { key: 'date', response: 'Sabrang 2026 takes place on October 23-25, 2026 at JK Lakshmipat University, Jaipur.' },
    { key: 'venue', response: 'The festival is hosted at the JKLU Campus, near Mahindra World City, Jaipur, Rajasthan.' },
    { key: 'registration', response: 'You can register for individual events, team competitions, or general entry passes directly on the Register page.' },
    { key: 'pass', response: 'Your digital entry pass is sent to your registered email upon payment verification, and can also be downloaded from your Dashboard.' },
    { key: 'rules', response: 'All participants must present their college ID card or valid government photo ID at the security scanner check-in gates.' },
  ];

  let generatedText = `Thank you for asking about Sabrang 2026! Here is the latest festival information regarding "${cleanPrompt.slice(0, 60)}":\n\n`;
  const matched = festivalFaqKeywords.find((item) => cleanPrompt.toLowerCase().includes(item.key));
  if (matched) {
    generatedText += matched.response;
  } else {
    generatedText += 'Sabrang is the annual cultural, technical, and sports fest of JKLU. Please check the Events page for full schedules, rulebooks, and registration categories.';
  }

  return NextResponse.json(
    {
      success: true,
      result: generatedText,
      type,
      remainingQuota: rateLimitResult.remainingAttempts,
    },
    {
      status: 200,
      headers: getRateLimitHeaders(rateLimitResult, 5),
    }
  );
}
