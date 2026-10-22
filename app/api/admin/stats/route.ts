import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getStartOfTodayIST, getEndOfTodayIST, parseDateValue } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const startOfToday = getStartOfTodayIST();
    const endOfToday = getEndOfTodayIST();

    let totalRegistrations = 0;
    let todayRegistrations = 0;
    let totalEntriesToday = 0;
    let totalEntries = 0;
    let totalRevenue = 0;
    let todayRevenue = 0;
    let staffPassesCount = 0;
    let teamSabrangPassesCount = 0;

    try {
      const regsSnap = await adminDb.collection('registrations').get();
      const allRegs = regsSnap.docs.map(doc => doc.data());
      const staffPasses = allRegs.filter((reg: any) => reg.isStaff === true || reg.category === 'Faculty / Staff Pass');
      const teamSabrangPasses = allRegs.filter((reg: any) => reg.isTeamSabrang === true || reg.isCoreOH === true || reg.category === 'Team Sabrang Pass');
      const validRegs = allRegs.filter((reg: any) => 
        reg.name && 
        reg.name.trim() !== '' && 
        reg.isTest !== true && 
        !reg.isDeleted && 
        reg.status !== 'deleted' &&
        reg.isStaff !== true &&
        reg.category !== 'Faculty / Staff Pass' &&
        reg.isTeamSabrang !== true &&
        reg.isCoreOH !== true &&
        reg.category !== 'Team Sabrang Pass'
      );
      totalRegistrations = validRegs.length;
      staffPassesCount = staffPasses.length;
      teamSabrangPassesCount = teamSabrangPasses.length;

      validRegs.forEach((reg: any) => {
        const amountNum = parseFloat(reg.receivedAmount || reg.paymentAmount || reg.amount || reg.price || '0') || 0;
        totalRevenue += amountNum;

        const regDate = parseDateValue(reg.registeredAt) || parseDateValue(reg.createdAt);
        if (regDate && regDate >= startOfToday && regDate <= endOfToday) {
          todayRegistrations++;
          todayRevenue += amountNum;
        }
      });

      totalEntries = validRegs.filter((reg: any) => reg.hasEntered === true || reg.attended === true).length;
    } catch (err) {
      console.warn("Stats route regs error:", err);
    }

    try {
      const scansSnap = await adminDb.collection('scanLogs')
        .where('timestamp', '>=', startOfToday)
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
      staffPassesCount,
      teamSabrangPassesCount,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
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
      staffPassesCount: 0,
      teamSabrangPassesCount: 0,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  }
}
