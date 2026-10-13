import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { sendRegistrationPassEmail } from "@/lib/brevo";
import { verifyReCaptchaToken } from "@/lib/recaptcha";
import { adminDb } from "@/lib/firebaseAdmin";
import { enforceResourceOwnership } from "@/lib/auth/ownership";
import { isRateLimited } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ip = rawIp.split(",")[0].trim();

    // Rate limit ticket resend requests to 5 per minute per IP
    if (isRateLimited(`${ip}:ticket`, 5, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many ticket delivery requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { registrationId, recaptchaToken } = body;

    if (!registrationId || typeof registrationId !== "string" || !/^[a-zA-Z0-9_\-\.:]{1,128}$/.test(registrationId.trim())) {
      return NextResponse.json(
        { error: "A valid Registration ID format is required." },
        { status: 400 }
      );
    }
    const cleanRegId = registrationId.trim();

    // Verify reCAPTCHA v3 token if supplied
    if (recaptchaToken) {
      const captchaResult = await verifyReCaptchaToken(
        recaptchaToken,
        "send_ticket",
        0.5
      );
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: "Security validation failed. Please refresh and try again." },
          { status: 403 }
        );
      }
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database service unavailable." },
        { status: 503 }
      );
    }

    // 1. Fetch Authoritative Registration Data from Firestore
    const regDoc = await adminDb.collection("registrations").doc(cleanRegId).get();
    if (!regDoc.exists) {
      return NextResponse.json(
        { error: "Registration record not found." },
        { status: 404 }
      );
    }

    const regData = regDoc.data() || {};

    // 2. IDOR Prevention: Enforce that requester owns this registration record or is an Admin/Scanner
    const ownershipCheck = await enforceResourceOwnership(req, registrationId, regData, "read");
    if (!ownershipCheck.authorized) {
      // If unauthenticated, require exact email match with the database ground-truth
      const requestedEmail = (body.toEmail || "").trim().toLowerCase();
      const actualEmail = (regData.email || "").trim().toLowerCase();

      if (!requestedEmail || requestedEmail !== actualEmail) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to dispatch passes for this registration." },
          { status: 403 }
        );
      }
    }

    // 3. Construct pass strictly using database ground-truth fields to prevent data tampering
    const targetEmail = regData.email;
    const targetName = regData.name || "Attendee";
    const eventName = regData.eventName || regData.eventTitle || "General Fest Entry";
    const collegeName = regData.college || regData.institutionName || "JK Lakshmipat University";
    const eventDate = regData.eventDate || "February 2026";
    const eventVenue = regData.eventVenue || "JKLU Campus, Jaipur";

    // Generate secure QR code data payload
    const qrPayload = JSON.stringify({
      id: registrationId,
      name: targetName,
      email: targetEmail,
      event: eventName,
      ticketId: regData.ticketId || regData.orderId || registrationId,
      fest: "SABRANG_2026",
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0a0714",
        light: "#ffffff",
      },
    });

    // 4. Dispatch pass strictly to the database-verified email
    const result = await sendRegistrationPassEmail({
      toEmail: targetEmail,
      toName: targetName,
      registrationId,
      eventName,
      collegeName,
      qrCodeDataUrl,
      eventDate,
      eventVenue,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to dispatch ticket pass email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Official festival pass dispatched to your verified email.",
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("[Send Ticket API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
