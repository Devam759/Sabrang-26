import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { sendRegistrationPassEmail } from "@/lib/brevo";
import { verifyReCaptchaToken } from "@/lib/recaptcha";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      toEmail,
      toName,
      registrationId,
      eventName,
      collegeName,
      eventDate,
      eventVenue,
      recaptchaToken,
    } = body;

    if (!toEmail || !toName || !registrationId || !eventName) {
      return NextResponse.json(
        { error: "Missing required registration fields" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA token if supplied
    if (recaptchaToken) {
      const captchaResult = await verifyReCaptchaToken(
        recaptchaToken,
        "send_ticket",
        0.5,
      );
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: "Security check failed. Please refresh and try again." },
          { status: 403 },
        );
      }
    }

    // Generate QR code data URL from registration ID payload
    const qrData = JSON.stringify({
      id: registrationId,
      name: toName,
      email: toEmail,
      event: eventName,
      fest: "SABRANG_2026",
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0a0714",
        light: "#ffffff",
      },
    });

    // Send styled pass via Brevo
    const result = await sendRegistrationPassEmail({
      toEmail,
      toName,
      registrationId,
      eventName,
      collegeName,
      qrCodeDataUrl,
      eventDate,
      eventVenue,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Ticket pass sent successfully via ${result.provider || 'email'}`,
      messageId: result.messageId,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error("[Send Ticket API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
