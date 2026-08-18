import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { sendRegistrationPassEmail } from "@/lib/brevo";

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
    } = body;

    if (!toEmail || !toName || !registrationId || !eventName) {
      return NextResponse.json(
        { error: "Missing required registration fields" },
        { status: 400 }
      );
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
      message: "Ticket pass sent successfully via Brevo",
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
