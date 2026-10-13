if (typeof window !== 'undefined') {
  throw new Error('SECURITY VIOLATION: lib/recaptcha.ts is a server-only module and must never be loaded on the client.');
}

/**
 * Google reCAPTCHA v3 Server-Side Verification Utility
 */

export interface ReCaptchaVerifyResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  error?: string;
}

/**
 * Verifies a client-side reCAPTCHA v3 token against Google's siteverify API.
 *
 * @param token - The response token obtained from client-side grecaptcha.execute
 * @param expectedAction - Optional expected action name (e.g., 'contact_form', 'login')
 * @param minScore - Minimum acceptable score between 0.0 and 1.0 (default: 0.5)
 */
export async function verifyReCaptchaToken(
  token: string,
  expectedAction?: string,
  minScore = 0.5,
): Promise<ReCaptchaVerifyResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // In development without configured secret key, permit gracefully with a log
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[reCAPTCHA] RECAPTCHA_SECRET_KEY is not configured in .env. Allowing request in development mode.",
      );
      return { success: true, score: 1.0 };
    }
    return {
      success: false,
      error: "reCAPTCHA server secret key is not configured.",
    };
  }

  if (!token) {
    return {
      success: false,
      error: "Missing reCAPTCHA response token.",
    };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", token);

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: `reCAPTCHA API responded with HTTP status ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      const errorCodes = data["error-codes"]?.join(", ") || "Verification failed";
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${errorCodes}`,
      };
    }

    // Verify minimum score (v3 returns a score from 0.0 to 1.0)
    if (typeof data.score === "number" && data.score < minScore) {
      return {
        success: false,
        score: data.score,
        error: `reCAPTCHA score too low (${data.score} < ${minScore})`,
      };
    }

    // Verify action match if specified
    if (expectedAction && data.action && data.action !== expectedAction) {
      return {
        success: false,
        score: data.score,
        action: data.action,
        error: `reCAPTCHA action mismatch (expected: ${expectedAction}, got: ${data.action})`,
      };
    }

    return {
      success: true,
      score: data.score,
      action: data.action,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown verification error";
    return {
      success: false,
      error: `Network error verifying reCAPTCHA: ${message}`,
    };
  }
}
