import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Admin or Scanner check
    const userDoc = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    const userRole = userDoc.data()?.role;
    if (userRole !== "admin" && userRole !== "scanner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { qrCode } = await req.json();
    if (!qrCode) {
      return NextResponse.json(
        { error: "QR Code is required" },
        { status: 400 },
      );
    }

    // Find registration by QR Code
    const regQuery = await adminDb
      .collection("registrations")
      .where("qrCode", "==", qrCode)
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
