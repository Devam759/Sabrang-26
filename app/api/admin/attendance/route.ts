import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyScannerOrAdmin } from "@/lib/auth/serverAuth";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authCheck = await verifyScannerOrAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const decodedToken = authCheck.user.token;

    const body = await req.json().catch(() => ({}));
    const { qrCode } = body;
    if (!qrCode || typeof qrCode !== 'string' || !/^[a-zA-Z0-9_\-\.:]{1,256}$/.test(qrCode.trim())) {
      return NextResponse.json(
        { error: "Valid QR Code is required" },
        { status: 400 },
      );
    }
    const cleanQrCode = qrCode.trim();

    // Find registration by QR Code
    const regQuery = await adminDb
      .collection("registrations")
      .where("qrCode", "==", cleanQrCode)
      .get();

    if (regQuery.empty) {
      return NextResponse.json({ error: "Invalid QR Code" }, { status: 404 });
    }

    const regDoc = regQuery.docs[0];
    const regData = regDoc.data();

    if (regData.attended) {
      return NextResponse.json(
        { error: "Attendance already marked" },
        { status: 400 },
      );
    }

    // Mark as attended
    await regDoc.ref.update({
      attended: true,
      attendedAt: new Date(),
      checkedInBy: decodedToken.uid,
    });

    // Fetch user and event info for success response
    const userDocRef = await adminDb
      .collection("users")
      .doc(regData.userId)
      .get();
    const eventDocRef = await adminDb
      .collection("events")
      .doc(regData.eventId)
      .get();

    return NextResponse.json({
      success: true,
      userName: userDocRef.data()?.name,
      eventTitle: eventDocRef.data()?.title,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
