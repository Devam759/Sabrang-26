import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const eventsSnapshot = await adminDb
      .collection("events")
      .orderBy("dateTime", "asc")
      .get();
    const events = eventsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check if user is admin
    const userDoc = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    if (userDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const eventData = await req.json();
    const eventRef = await adminDb.collection("events").add({
      ...eventData,
      createdAt: new Date(),
      dateTime: new Date(eventData.dateTime),
    });

    return NextResponse.json({ id: eventRef.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
