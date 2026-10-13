import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/auth/serverAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Enforce administrator authentication and authorization
    const authCheck = await verifyAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalRegistrations = 0;
    let todayRegistrations = 0;
    let totalEntriesToday = 0;
    let totalEntries = 0;
    let totalRevenue = 0;
    let todayRevenue = 0;

    if (!adminDb) {
      return NextResponse.json({
        success: true,
        totalRegistrations: 0,
        todayRegistrations: 0,
        totalEntriesToday: 0,
        totalEntries: 0,
        totalRevenue: 0,
        todayRevenue: 0,
      });
    }

    try {
      const regsSnap = await adminDb.collection('registrations').get();
      const allRegs = regsSnap.docs.map(doc => doc.data());
      const validRegs = allRegs.filter((reg: any) => reg.name && reg.name.trim() !== '' && reg.isTest !== true);
      totalRegistrations = validRegs.length;

      validRegs.forEach((reg: any) => {
        const amountNum = parseFloat(reg.receivedAmount || reg.paymentAmount || reg.amount || reg.price || '0') || 0;
        totalRevenue += amountNum;

        if (reg.registeredAt || reg.createdAt) {
          const regDate = reg.registeredAt?.toDate ? reg.registeredAt.toDate() : new Date(reg.registeredAt || reg.createdAt);
          if (regDate >= today) {
            todayRegistrations++;
            todayRevenue += amountNum;
          }
        }
      });

      totalEntries = validRegs.filter((reg: any) => reg.hasEntered === true || reg.attended === true).length;
    } catch (err) {
      console.warn("Stats route regs error:", err);
    }

    try {
      const scansSnap = await adminDb.collection('scanLogs')
        .where('timestamp', '>=', today)
        .where('result', '==', 'accepted')
        .get();
      totalEntriesToday = scansSnap.size;
    } catch (err) {
      // Non-fatal if scanLogs collection is empty
    }

    return NextResponse.json({
      success: true,
      totalRegistrations,
      todayRegistrations,
      totalEntriesToday,
      totalEntries,
      totalRevenue,
      todayRevenue,
    });
  } catch (error: any) {
    console.error("Admin stats API error:", error);
    return NextResponse.json({
      success: false,
      totalRegistrations: 0,
      todayRegistrations: 0,
      totalEntriesToday: 0,
      totalEntries: 0,
      totalRevenue: 0,
      todayRevenue: 0,
    });
  }
}
