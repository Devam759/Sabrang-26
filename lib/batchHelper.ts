import { adminDb } from './firebaseAdmin';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import { getStudentCohort, getBatchForCohort, getCohortLeaderDetails } from './cohortData';

/**
 * Creates a dynamic minimal PDF schedule on the fly if the physical PDF doesn't exist yet.
 * This guarantees the system is fully functional without pre-existing files on disk.
 */
async function generateFallbackSchedulePDF(batchName: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  
  page.drawText('JK Lakshmipat University', { x: 50, y: 350, size: 18, color: rgb(0.01, 0.01, 0.01) });
  page.drawText(`Official Schedule: ${batchName}`, { x: 50, y: 310, size: 22, color: rgb(1, 0.6, 0) });
  page.drawText('Sabrang 2026 - Annual Cultural Festival', { x: 50, y: 280, size: 12, color: rgb(0.4, 0.4, 0.4) });
  
  page.drawText('Festival Schedule Outline:', { x: 50, y: 220, size: 14, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('• Day 1: Opening Ceremony, Tech Hackathons, Step-Up Prelims & DJ Night', { x: 50, y: 190, size: 10 });
  page.drawText('• Day 2: Business Quizzes, E-Sports, Panache Runway & Bandjam', { x: 50, y: 170, size: 10 });
  page.drawText('• Day 3: Panache Grand Finale, Prize Distribution & Celebrity Pro-Show', { x: 50, y: 150, size: 10 });
  
  page.drawLine({ start: { x: 50, y: 70 }, end: { x: 550, y: 70 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  page.drawText('This is a system-generated schedule document.', { x: 50, y: 55, size: 8, color: rgb(0.5, 0.5, 0.5) });

  return await pdfDoc.save();
}

/**
 * Resolves the batch allocation details for a student.
 * Checks Firestore collection 'studentBatches' first, then falls back to course rules.
 */
export async function getStudentBatchDetails(studentData: any, regId: string): Promise<{ batchName: string; pdfFileName: string }> {
  let resolvedBatch = 'General Pass';
  
  try {
    // 1. Check if there is a manual override document in Firestore for this registration ID
    const batchDoc = await adminDb.collection('studentBatches').doc(regId).get();
    if (batchDoc.exists) {
      const data = batchDoc.data();
      if (data && data.batchName) {
        resolvedBatch = data.batchName;
      }
    } else {
      // 2. Alternatively check by application/registration number
      const appNum = studentData.registrationNumber || studentData.rollNumber;
      if (appNum) {
        const batchQuery = await adminDb.collection('studentBatches')
          .where('registrationNumber', '==', appNum)
          .limit(1)
          .get();
        if (!batchQuery.empty) {
          const data = batchQuery.docs[0].data();
          resolvedBatch = data.batchName;
        } else {
          // 3. Fallback to static cohort data mapping
          const cohort = getStudentCohort(appNum);
          if (cohort) {
            resolvedBatch = getBatchForCohort(cohort).batchName;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error querying studentBatches collection:", err);
  }

  // Every student receives the same final schedule PDF
  return { 
    batchName: resolvedBatch, 
    pdfFileName: 'Sabrang_2026_Schedule.pdf' 
  };
}

/**
 * Minimal HTML escaper for values interpolated directly into email HTML.
 * Prevents HTML injection in case upstream sanitization was bypassed.
 */
function htmlEscape(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sends check-in confirmation email via Brevo.
 */
export async function sendCheckInEmail(
  toEmail: string,
  studentName: string,
  appNumber: string,
  batchName: string,
  pdfFileName?: string,
  subject: string = "Sabrang '26 Check-In Confirmation - Pass Details & Schedule"
) {
  console.log(`Preparing to send check-in email to ${toEmail} for batch ${batchName}...`);

  const { sendTransactionalEmail } = await import('./emailService');

  const cohort = getStudentCohort(appNumber);
  const leaderDetails = cohort ? getCohortLeaderDetails(cohort) : null;

  // Use absolute Cloudinary URLs for branding logos to prevent Gmail from clipping the email (Base64 strings are too large)
  const sabrangLogoTag = `<img src="https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto,w_250/v1788091530/sabrang-2026/sabrang-logo/sabrang-logo.png" alt="Sabrang '26 Logo" style="max-height: 70px; width: auto; display: block;" />`;
  const jkluLogoTag = `<img src="https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto,w_200/v1787060374/sabrang-2026/sabrang-logo/white_jklu_logo.png" alt="JKLU Logo" style="max-height: 55px; width: auto; display: block;" />`;

  const safeName = htmlEscape(studentName);
  const safeAppNum = htmlEscape(appNumber);
  const safeBatch = htmlEscape(batchName);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        .header { background-color: #ffffff; padding: 40px 20px 20px 20px; text-align: center; border-bottom: 1px solid #eeeeee; }
        .content { padding: 40px 30px; background-color: #ffffff; color: #333; line-height: 1.6; }
        .footer { background-color: #f9f9f9; padding: 30px 20px; text-align: center; color: #777; font-size: 13px; border-top: 1px solid #eeeeee; }
        .social-icons { margin: 15px 0; }
        .social-icons a { display: inline-block; margin: 0 6px; color: #555; text-decoration: none; font-weight: bold; font-size: 12px; }
        .footer-link { color: #0D21DD; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
            <tr>
              <td align="center" valign="middle" style="padding-right: 20px;">
                ${jkluLogoTag}
              </td>
              <td align="center" valign="middle" style="padding-left: 20px; border-left: 1px solid rgba(0,0,0,0.1);">
                ${sabrangLogoTag}
              </td>
            </tr>
          </table>
        </div>
        <div class="content">
          <h2 style="margin-top: 0;">Dear ${safeName},</h2>
          <p>Thank you for completing your Check-in.</p>
          <p>Your registration details are as follows:</p>
          <ul style="line-height: 1.8;">
            <li><strong>Participant Name:</strong> ${safeName}</li>
            <li><strong>Registration Number:</strong> ${safeAppNum}</li>
            <li><strong>Category / Batch:</strong> ${safeBatch}</li>
          </ul>
          <p>You can view and explore the complete 3-day schedule directly on our portal.</p>
          <div style="margin: 15px 0;">
            <a href="https://sabrang.jklu.edu.in/schedule" style="display: inline-block; padding: 10px 20px; background-color: #7C3AED; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
              View Event Timeline &amp; Schedule
            </a>
          </div>
          ${leaderDetails ? `
          <p>If you have any questions or require further assistance, please feel free to contact your Event Coordinator:</p>
          <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #cbd5e1; display: inline-block; font-size: 14px; line-height: 1.5;">
            <strong>Name:</strong> ${htmlEscape(leaderDetails.name)}<br/>
            <strong>Phone Number:</strong> <a href="tel:${htmlEscape(leaderDetails.phone.replace(/\s+/g, ''))}" style="color: #7C3AED; text-decoration: none; font-weight: bold;">+91 ${htmlEscape(leaderDetails.phone)}</a>
          </p>
          ` : `
          <p>If you have any questions or require assistance, please visit the helpdesk at the venue or contact our Organizing Team.</p>
          `}
          <p>We look forward to seeing you at Sabrang 2026!</p>
          <p>Best regards,<br/><strong>SABRANG Team</strong></p>
        </div>
        <div class="footer">
          <div class="social-icons">
            <a href="https://www.instagram.com/jklu_sabrang">Instagram</a> &bull;
            <a href="https://www.linkedin.com/school/jklujaipur/">LinkedIn</a> &bull;
            <a href="https://x.com/jklujaipur">X (Twitter)</a> &bull;
            <a href="https://www.facebook.com/share/1Hsdb57Jcf/">Facebook</a>
          </div>
          <p style="margin-bottom: 5px;">JK Lakshmipat University, Jaipur</p>
          <p style="margin-top: 0;"><a href="https://sabrang.jklu.edu.in" class="footer-link">sabrang.jklu.edu.in</a></p>
          <p style="margin-top: 15px; font-size: 11px; opacity: 0.7;">&copy; 2026 Sabrang Event Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendTransactionalEmail({
    to: [{ email: toEmail, name: studentName }],
    subject,
    htmlContent,
    textContent: `Hi ${studentName}, your check-in for Sabrang 2026 is confirmed! Registration: ${appNumber}, Batch: ${batchName}.`,
  });

  if (!result.success) {
    throw new Error(`[EmailService] Check-in email failed for ${toEmail}: ${result.error}`);
  }
  console.log(`[EmailService] Check-in email sent successfully to ${toEmail} via ${result.provider}.`);
}
