import { NextRequest, NextResponse } from "next/server";
import { verifyReCaptchaToken } from "@/lib/recaptcha";
import { checkApiEndpointRateLimit, createRateLimitResponse, extractClientIp } from "@/lib/auth/rateLimiter";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(254, "Email too long"),
  subject: z.string().trim().min(1, "Please select a subject").max(150, "Subject too long"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message too long"),
  recaptchaToken: z.string().max(2048).optional(),
  honeypot: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = extractClientIp(req);
    const rateLimit = checkApiEndpointRateLimit(ip, true);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, 15);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 },
      );
    }

    const { name, email, subject, message, recaptchaToken, honeypot } = parsed.data;

    if (honeypot) {
      return NextResponse.json({ error: "Automated submission rejected" }, { status: 400 });
    }

    // Verify Google reCAPTCHA v3
    if (recaptchaToken) {
      const captchaResult = await verifyReCaptchaToken(
        recaptchaToken,
        "contact_form",
        0.5,
      );

      if (!captchaResult.success) {
        return NextResponse.json(
          { error: "Security check failed. Please refresh and try again." },
          { status: 403 },
        );
      }
    } else if (process.env.NODE_ENV === "production" && process.env.RECAPTCHA_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing reCAPTCHA token." },
        { status: 400 },
      );
    }

    // Sanitize message strings against script and HTML injection
    const { sanitizeInput } = await import('@/lib/security');
    const cleanName = sanitizeInput(name);
    const cleanSubject = sanitizeInput(subject);
    const cleanMessage = sanitizeInput(message);

    // Process contact submission (e.g. logging, database, or notification)
    console.info(`[Contact Form] Submission received from ${cleanName} <${email}> [${cleanSubject}]`);

    return NextResponse.json({
      success: true,
      message: "Thank you! Your message has been received.",
    });
  } catch (error: unknown) {
    console.error("[Contact API Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
