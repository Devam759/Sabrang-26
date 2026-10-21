import { adminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { formatPhoneNumber, maskEmail } from './security';
import { extractRegistrationInfo } from './registrationDataHelper';



// ============================================================================
// PDF RECEIPT GENERATOR helper (A4 Layout with dynamic aspect scaling)
// ============================================================================
export async function generatePDF(data: any, id: string, paymentId: string, orderId: string, dateOfPayment?: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // Standard A4 Dimensions
  const { width, height } = page.getSize();
  
  // Brand Colors
  const primaryColor = rgb(0.051, 0.129, 0.867); // #0D21DD Bold Blue
  const darkColor = rgb(0.012, 0.016, 0.016);  // #030404 Ink Black
  const lightGray = rgb(0.961, 0.945, 0.898);  // #F5F1E5 Cloud White
  const greyColor = rgb(0.4, 0.4, 0.4);

  // 1. Left Logo: JKLU Logo (Colored PNG variant)
  let jkluScaledWidth = 0;
  let jkluScaledHeight = 0;
  let jkluLogoImage;
  try {
    const jkluLogoPath = path.join(
      process.cwd(),
      'public',
      'sabrang-logo',
      'jklu_logo.png'
    );
    const jkluLogoBytes = await fs.readFile(jkluLogoPath);
    jkluLogoImage = await pdfDoc.embedPng(jkluLogoBytes);
    const targetHeight = 46;
    const scaleFactor = targetHeight / jkluLogoImage.height;
    jkluScaledWidth = jkluLogoImage.width * scaleFactor;
    jkluScaledHeight = jkluLogoImage.height * scaleFactor;
  } catch (error) {
    console.warn('PDF Left Logo (JKLU) load failed:', error);
  }

  // 2. Right Logo: Festival Main Logo
  let festScaledWidth = 0;
  let festScaledHeight = 0;
  let festLogoImage;
  try {
    const festLogoPath = path.join(
      process.cwd(),
      'public',
      'sabrang-logo',
      'Sabrang_Logo.png'
    );
    const festLogoBytes = await fs.readFile(festLogoPath);
    festLogoImage = await pdfDoc.embedPng(festLogoBytes);
    const targetHeight = 35;
    const scaleFactor = targetHeight / festLogoImage.height;
    festScaledWidth = festLogoImage.width * scaleFactor;
    festScaledHeight = festLogoImage.height * scaleFactor;
  } catch (error) {
    // Optional logo watermark
  }

  // Draw Left Logo (JKLU Logo) directly on white background
  if (jkluLogoImage) {
    page.drawImage(jkluLogoImage, {
      x: 40,
      y: height - 95,
      width: jkluScaledWidth,
      height: jkluScaledHeight,
    });
  }

  // Draw Right Logo (Festival Logo) directly on white background
  if (festLogoImage) {
    page.drawImage(festLogoImage, {
      x: width - 40 - festScaledWidth,
      y: height - 90,
      width: festScaledWidth,
      height: festScaledHeight,
    });
  }

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const titleText = 'Registration Receipt';
  const titleSize = 20;
  const titleWidth = helveticaFont.widthOfTextAtSize(titleText, titleSize);

  const subtitleText = 'Sabrang 2026 Registration · JK Lakshmipat University';
  const subtitleSize = 8.5;
  const subtitleWidth = helveticaFont.widthOfTextAtSize(subtitleText, subtitleSize);

  // Center-aligned Header Title text on white background
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 70,
    size: titleSize,
    color: darkColor,
    font: helveticaFont,
  });
  page.drawText(subtitleText, {
    x: (width - subtitleWidth) / 2,
    y: height - 85,
    size: subtitleSize,
    color: greyColor,
    font: helveticaFont,
  });

  // Solid Black Divider line under header
  page.drawLine({
    start: { x: 40, y: height - 110 },
    end: { x: 555, y: height - 110 },
    thickness: 2,
    color: darkColor
  });

  // QR Code Verification Box
  const qrDataUrl = await QRCode.toDataURL(id, { margin: 1, width: 300 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  
  // Draw outer QR Card Border
  page.drawImage(qrImage, {
    x: 257,
    y: 647,
    width: 80,
    height: 80
  });

  // Metadata Row
  // Receipt No
  const rollNumberStr = data.rollNumber || data.registrationNumber || id.slice(-4).toUpperCase();
  page.drawText('Receipt No.'.toUpperCase(), { x: 40, y: 590, size: 7.5, color: greyColor });
  page.drawText(`SABRANG2026-${rollNumberStr}`, { x: 40, y: 575, size: 10.5, color: darkColor });

  // Date of Issue
  const issueDate = dateOfPayment || data.dateOfPayment || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  page.drawText('Date of Issue'.toUpperCase(), { x: 250, y: 590, size: 7.5, color: greyColor });
  page.drawText(issueDate, { x: 250, y: 575, size: 10.5, color: darkColor });

  // Payment Status
  page.drawText('Payment Status'.toUpperCase(), { x: 450, y: 590, size: 7.5, color: greyColor });
  page.drawRectangle({
    x: 450,
    y: 570,
    width: 50,
    height: 16,
    color: rgb(0.85, 0.95, 0.85),
    borderColor: rgb(0.1, 0.5, 0.2),
    borderWidth: 1
  });
  page.drawText('PAID', { x: 462, y: 574, size: 9, color: rgb(0.1, 0.5, 0.2) });

  // Horizontal separator line
  page.drawLine({
    start: { x: 40, y: 550 },
    end: { x: 555, y: 550 },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.94)
  });

  const clean = (text: string) => (text || '').replace(/[^\x20-\x7E]/g, '');

  // Helper function to draw a section header
  const drawSectionHeader = (title: string, y: number) => {
    page.drawText(title.toUpperCase(), { x: 40, y, size: 9.5, color: darkColor });
    page.drawLine({ start: { x: 40, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 1.5, color: darkColor });
  };

  // Helper function to draw grid cells with optional width constraint
  const drawField = (label: string, value: string, x: number, y: number, maxWidth: number = 245) => {
    page.drawText(label.toUpperCase(), { x, y, size: 7.5, color: greyColor });
    let valStr = clean(value);
    if (helveticaFont.widthOfTextAtSize(valStr, 10.5) > maxWidth) {
      while (valStr.length > 3 && helveticaFont.widthOfTextAtSize(valStr + '...', 10.5) > maxWidth) {
        valStr = valStr.slice(0, -1);
      }
      valStr += '...';
    }
    page.drawText(valStr, { x, y: y - 13, size: 10.5, color: darkColor });
  };

  // Extract unified registration attributes according to Team vs Solo specifications
  const regInfo = extractRegistrationInfo(data, id);

  // 1. PARTICIPANT INFORMATION Section
  drawSectionHeader('PARTICIPANT INFORMATION', 525);
  drawField('Full Name', regInfo.name, 40, 502);
  drawField('Registration ID', regInfo.rollNumber, 300, 502);
  
  drawField('College / Institution', regInfo.college, 40, 469);
  drawField('Event Type', regInfo.eventType, 300, 469);
  
  drawField('Email Address', regInfo.email, 40, 436);
  drawField('Mobile Number', regInfo.phone, 300, 436);

  drawField('Team Name', regInfo.teamName, 40, 403);
  drawField('Total Members (incl. Leader)', regInfo.isTeam ? regInfo.totalMembers : '1', 300, 403);

  // 2. ADDRESS Section
  drawSectionHeader('ADDRESS', 360);
  drawField('Street / Locality', regInfo.address, 40, 335, 500);

  // 3. PAYMENT SUMMARY Section
  drawSectionHeader('PAYMENT SUMMARY', 280);
  const rawAmount = data.paymentAmount !== undefined 
    ? data.paymentAmount 
    : (data.amount !== undefined 
        ? data.amount 
        : (data.receivedAmount !== undefined 
            ? data.receivedAmount 
            : (data.price !== undefined ? data.price : 0)));
  const amountStr = Number(rawAmount || 0).toFixed(2);

  drawField('Amount Paid', `Rs. ${amountStr}`, 40, 255);
  drawField('Mode of Payment', 'Online Transfer / UPI', 220, 255);
  
  page.drawText('TRANSACTION STATUS', { x: 410, y: 255, size: 7.5, color: greyColor });
  page.drawText('Confirmed', { x: 410, y: 242, size: 10.5, color: rgb(0.1, 0.5, 0.2) });

  // Disclaimer Notes
  page.drawText('This receipt confirms successful registration and payment for Sabrang 2026. Please retain this document for your records.', {
    x: 40,
    y: 155,
    size: 7,
    color: greyColor
  });
  page.drawText('For queries, contact the Sabrang organizing committee.', {
    x: 40,
    y: 143,
    size: 7,
    color: greyColor
  });

  // Bottom Footer Line
  page.drawLine({
    start: { x: 40, y: 80 },
    end: { x: 555, y: 80 },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.94)
  });

  // Footer Content
  page.drawText('JK Lakshmipat University · www.jklu.edu.in · +91-141-5117000', {
    x: 40,
    y: 65,
    size: 7.5,
    color: greyColor
  });
  page.drawText('This is a system-generated receipt.', {
    x: 420,
    y: 65,
    size: 7.5,
    color: greyColor
  });

  return await pdfDoc.save();
}


// ============================================================================
// TRANSACTIONAL EMAIL NOTIFICATION helper (Primary Brevo + Fallback Mailjet)
// ============================================================================

export async function sendEmail(to: string, name: string, pdfBytes: Uint8Array) {
  const { sendTransactionalEmail } = await import('./emailService');

  // Use absolute URLs for images to prevent Gmail from clipping the email (Base64 strings are too large)
  const sabrangLogoTag = `<img src="https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto,w_250/v1788091530/sabrang-2026/sabrang-logo/sabrang-logo.png" alt="Sabrang '26 Logo" style="max-height: 70px; width: auto; display: block;" />`;
  const jkluLogoTag = `<img src="https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto,w_200/v1787060374/sabrang-2026/sabrang-logo/white_jklu_logo.png" alt="JKLU Logo" style="max-height: 55px; width: auto; display: block;" />`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        .header { background-color: #ffffff; padding: 40px 20px 20px 20px; text-align: center; border-bottom: 1px solid #eeeeee; }
        .content { padding: 40px 30px; background-color: #ffffff; color: #333; line-height: 1.6; }
        .success-badge { display: inline-block; padding: 6px 12px; background-color: #dcfce7; color: #166534; border-radius: 4px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
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
          <div class="success-badge">Registration Confirmed</div>
          <h2 style="margin-top: 0;">Dear ${name},</h2>
          <p>Congratulations!</p>
          <p>Your registration for <strong>SABRANG 2026</strong>, the Annual Festival at JK Lakshmipat University, has been successfully completed.</p>
          <p>Please find your Registration Receipt attached to this email. This will serve as your entry pass and will be required during the check-in process on campus.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Important:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
              <li>Save this email for future reference.</li>
              <li>Keep your pass QR code safe and easily accessible.</li>
              <li>You may carry a digital copy on your mobile or a printed copy during fest entry.</li>
            </ul>
          </div>
          <p>We look forward to welcoming you to Sabrang 2026!</p>
          <p>Warm regards,<br/><strong>SABRANG 2026 Team</strong><br/>JK Lakshmipat University</p>
        </div>
        <div class="footer">
          <div class="social-icons">
            <a href="https://www.instagram.com/jklusabrang">Instagram</a> &bull;
            <a href="https://www.linkedin.com/school/jklujaipur/">LinkedIn</a> &bull;
            <a href="https://x.com/jklujaipur">X (Twitter)</a> &bull;
            <a href="https://www.facebook.com/share/1Hsdb57Jcf/">Facebook</a>
          </div>
          <p style="margin-bottom: 5px;">JK Lakshmipat University, Jaipur</p>
          <p style="margin-top: 0;"><a href="https://sabrang.jklu.edu.in" class="footer-link">sabrang.jklu.edu.in</a></p>
          <p style="margin-top: 15px; font-size: 11px; opacity: 0.7;">&copy; 2026 Sabrang Festival Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

  const result = await sendTransactionalEmail({
    to: [{ email: to, name }],
    subject: 'Welcome to Sabrang 2026 - Registration Confirmed!',
    htmlContent,
    textContent: `Hi ${name}, your registration for Sabrang 2026 is confirmed! Your receipt is attached.`,
    attachment: [
      {
        content: pdfBase64,
        name: 'Sabrang_Registration_Receipt.pdf',
        contentType: 'application/pdf',
      },
    ],
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to send confirmation email via configured email providers');
  }

  console.log(`[EmailService] Registration email delivered via ${result.provider}. MessageId: ${result.messageId}`);
  return result;
}

export async function sendSystemErrorEmail(performedBy: string, targetEntity: string, details: string) {
  try {
    const { logSystemError } = await import('./errorAlertService');
    await logSystemError({
      message: details,
      type: 'Registration Pipeline Exception',
      path: targetEntity,
      performedBy,
    });
  } catch (err) {
    console.error("Failed to route system error alert:", err);
  }
}

// ============================================================================
// REGISTRATION COMPLETION PIPELINE (reconciles DB, Webhooks, Receipts, Emails)
// ============================================================================
export async function finalizeRegistration(formData: any, paymentId: string, orderId: string, skipBackgroundTasks: boolean = false) {
  console.log("Saving registration to Firestore...");
  const eventTarget = formData.eventId || formData.event || formData.eventName || formData.eventTitle || '';
  const eventList = Array.isArray(formData.selectedEvents) && formData.selectedEvents.length > 0
    ? formData.selectedEvents
    : (formData.eventId ? [formData.eventId] : []);

  const { calculateTotalRegistrationFee } = await import('@/lib/eventPricing');
  let isEarlyBird = formData.isEarlyBird;
  if (isEarlyBird === undefined) {
    const settingsSnap = await adminDb.collection('settings').doc('earlyBird').get();
    isEarlyBird = settingsSnap.exists ? settingsSnap.data()?.active === true : false;
  }

  let authoritativePrice = calculateTotalRegistrationFee(eventList, formData.teamMembers, formData.visitorConfig, isEarlyBird);
  if (authoritativePrice <= 0 && typeof formData.amount === 'number' && formData.amount > 0) {
    authoritativePrice = formData.amount;
  }
  const basePrice = (eventList.length > 0 && authoritativePrice >= 0)
    ? authoritativePrice
    : (typeof formData.amount === 'number' && !isNaN(formData.amount)
        ? formData.amount
        : Number(formData.price ?? formData.originalPrice ?? 500));
  let paymentAmount = basePrice;
  const couponCode = (formData.coupon || '').trim().toLowerCase();
  let couponDocRef: any = null;

  if (couponCode) {
    try {
      let docSnap = await adminDb.collection('coupons').doc(couponCode).get();
      if (!docSnap.exists) {
        docSnap = await adminDb.collection('coupons').doc(couponCode.toUpperCase()).get();
      }
      if (docSnap.exists) {
        const { calculateCouponDiscount } = await import('@/lib/couponHelper');
        const res = calculateCouponDiscount(docSnap.data(), basePrice, eventTarget, {
          selectedEvents: eventList,
          teamMembers: formData.teamMembers,
          visitorConfig: formData.visitorConfig,
          isEarlyBird,
        });
        if (res.valid) {
          paymentAmount = res.finalPrice;
          couponDocRef = docSnap.ref;
        }
      }
    } catch (err) {
      console.error("Error fetching coupon during finalizeRegistration:", err);
    }
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Convert server time to IST (Asia/Kolkata, UTC+5:30) to prevent date mismatch
  const istDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
  const day = istDate.getUTCDate();
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear().toString().slice(-2);
  
  const dateOfPayment = `${day}-${month}-${year}`; // e.g., "24-May-26"
  const dateGroup = `${day}-${month}`; // e.g., "24-May"
  if (formData.mobile) formData.mobile = formatPhoneNumber(formData.mobile);
  if (formData.fatherMobile) formData.fatherMobile = formatPhoneNumber(formData.fatherMobile);
  if (formData.motherMobile) formData.motherMobile = formatPhoneNumber(formData.motherMobile);
  if (formData.parentPhone) formData.parentPhone = formatPhoneNumber(formData.parentPhone);

  const parentName = (formData.parentName || formData.fatherName || formData.motherName || 'N/A').trim() || 'N/A';
  const parentPhone = (formData.parentPhone || formData.fatherMobile || formData.motherMobile || 'N/A').trim() || 'N/A';
  const parentEmail = (formData.parentEmail || formData.fatherEmail || formData.motherEmail || 'N/A').trim() || 'N/A';
  
  // 1. Establish or retrieve canonical registration ID for this order
  const lockRef = adminDb.collection('registrationLocks').doc(orderId);
  const pendingRef = adminDb.collection('pendingRegistrations').doc(orderId);

  let docId = "";

  // Fast check: has this order already been finalized?
  const existingLockSnap = await lockRef.get();
  if (existingLockSnap.exists && existingLockSnap.data()?.registrationId) {
    docId = existingLockSnap.data()!.registrationId;
    console.log(`Order ${orderId} already finalized with registration ID: ${docId}`);
  }

  if (!docId) {
    const existingPendingSnap = await pendingRef.get();
    if (existingPendingSnap.exists && existingPendingSnap.data()?.status === 'completed' && existingPendingSnap.data()?.registrationId) {
      docId = existingPendingSnap.data()!.registrationId;
      console.log(`Order ${orderId} already completed in pendingRegistrations with ID: ${docId}`);
      // Backfill lock for consistency
      await lockRef.set({
        lockedAt: FieldValue.serverTimestamp(),
        registrationId: docId,
        status: 'completed'
      }, { merge: true });
    }
  }

  if (!docId) {
    // Backward compatibility: check if existing registration already exists in `registrations` with this orderId
    const existingQuery = await adminDb.collection('registrations').where('orderId', '==', orderId).limit(1).get();
    if (!existingQuery.empty) {
      docId = existingQuery.docs[0].id;
      console.log(`Order ${orderId} found in existing registrations query with ID: ${docId}. Linking lock.`);
      await lockRef.set({
        lockedAt: FieldValue.serverTimestamp(),
        registrationId: docId,
        status: 'completed'
      }, { merge: true });
      const existingPendingSnap = await pendingRef.get();
      if (existingPendingSnap.exists) {
        await pendingRef.update({
          status: 'completed',
          registrationId: docId,
          completedAt: FieldValue.serverTimestamp()
        });
      }
    }
  }

  // If already finalized and skipBackgroundTasks is requested, return early
  if (docId && skipBackgroundTasks) {
    return docId;
  }

  // Robust resolution of primary idCard from formData top level or team members
  let resolvedIdCard = typeof formData.idCard === 'string' && formData.idCard.trim() ? formData.idCard.trim() : null;
  if (!resolvedIdCard && formData.teamMembers && typeof formData.teamMembers === 'object') {
    for (const group of Object.keys(formData.teamMembers)) {
      const members = Array.isArray(formData.teamMembers[group]) ? formData.teamMembers[group] : [];
      for (const m of members) {
        if (m && typeof m.idCard === 'string' && m.idCard.trim()) {
          resolvedIdCard = m.idCard.trim();
          break;
        }
      }
      if (resolvedIdCard) break;
    }
  }

  // Clean up team member idCard fields so Firestore never stores `{}` as an empty object
  const cleanedTeamMembers = formData.teamMembers ? { ...formData.teamMembers } : {};
  if (typeof cleanedTeamMembers === 'object') {
    for (const group of Object.keys(cleanedTeamMembers)) {
      if (Array.isArray(cleanedTeamMembers[group])) {
        cleanedTeamMembers[group] = cleanedTeamMembers[group].map((m: any) => {
          if (!m) return m;
          const cardVal = typeof m.idCard === 'string' && m.idCard.trim() ? m.idCard.trim() : (m.idCard?.url || null);
          return {
            ...m,
            idCard: cardVal,
          };
        });
      }
    }
  }

  // If document does not exist yet, atomically create it
  if (!docId) {
    const newRegRef = adminDb.collection('registrations').doc();
    const newRegId = newRegRef.id;

    // Perform atomic claim and document creation inside a Firestore transaction
    await adminDb.runTransaction(async (transaction) => {
      // 1. ALL READS FIRST (Firestore requirement: all reads must precede any writes)
      const lockDoc = await transaction.get(lockRef);
      if (lockDoc.exists && lockDoc.data()?.registrationId) {
        docId = lockDoc.data()!.registrationId;
        return;
      }

      const pendingDoc = await transaction.get(pendingRef);
      if (pendingDoc.exists && pendingDoc.data()?.status === 'completed' && pendingDoc.data()?.registrationId) {
        docId = pendingDoc.data()!.registrationId;
        return;
      }

      let couponDocSnap: FirebaseFirestore.DocumentSnapshot | null = null;
      if (couponDocRef) {
        couponDocSnap = await transaction.get(couponDocRef as FirebaseFirestore.DocumentReference);
      }

      const regData = {
        ...formData,
        idCard: resolvedIdCard,
        teamMembers: cleanedTeamMembers,
        name: formData.name,
        email: formData.email,
        phone: formData.mobile,
        rollNumber: formData.registrationNumber,
        gender: formData.gender || 'N/A',
        course: formData.course || 'N/A',
        pincode: formData.pincode || (formData.address ? (formData.address.match(/\b\d{6}\b/)?.[0] || 'N/A') : 'N/A'),
        region: formData.region || 'N/A',
        city: formData.city || 'N/A',
        parentName: parentName,
        parentPhone: parentPhone,
        parentEmail: parentEmail,
        paymentAmount: paymentAmount,
        receivedAmount: paymentAmount,
        dateOfPayment: dateOfPayment,
        dateGroup: dateGroup,
        hasEntered: false,
        paymentId: paymentId,
        orderId: orderId,
        sheetSynced: false,
        emailSent: false,
        emailSentAt: null,
        emailError: null,
        emailProvider: null,
        emailProviderMessageId: null,
        emailAttemptCount: 0,
        lastEmailAttemptAt: null,
        registeredAt: FieldValue.serverTimestamp(),
      };

      // 2. ALL WRITES AFTER READS
      transaction.set(newRegRef, regData);
      transaction.set(lockRef, {
        lockedAt: FieldValue.serverTimestamp(),
        registrationId: newRegId,
        status: 'completed'
      });

      if (pendingDoc.exists) {
        transaction.update(pendingRef, {
          status: 'completed',
          registrationId: newRegId,
          completedAt: FieldValue.serverTimestamp()
        });
      }

      if (couponDocSnap && couponDocSnap.exists) {
        transaction.update(couponDocRef as FirebaseFirestore.DocumentReference, {
          usedCount: FieldValue.increment(1)
        });
      }

      docId = newRegId;
    });

    if (!docId) {
      // Bounded fallback in the rare event transaction returned without setting docId
      const finalCheck = await adminDb.collection('registrations').where('orderId', '==', orderId).limit(1).get();
      if (!finalCheck.empty) {
        docId = finalCheck.docs[0].id;
      } else {
        throw new Error(`Failed to establish or retrieve canonical registration for order ${orderId}`);
      }
    }
  }

  console.log("Canonical registration finalized. Firestore ID:", docId);


  // 2. Delegate background tasks
  if (skipBackgroundTasks) {
    console.log("Skipping background tasks (delegating to Webhook). Returning instantly.");
    return docId;
  }

  // 3. Ensure background tasks run exactly once
  const taskLockRef = adminDb.collection('backgroundTaskLocks').doc(orderId);
  try {
    await taskLockRef.create({ startedAt: FieldValue.serverTimestamp() });
  } catch (err: any) {
    if (err.code === 6 || err.message?.includes('ALREADY_EXISTS')) {
      console.log(`Background tasks for order ${orderId} already handled by another process.`);
      return docId;
    }
    throw err;
  }

  // 2. Generate PDF Receipt & Send Email using SMTP
  const emailAndPdfPromise = (async () => {
    try {
      console.log("Generating PDF receipt...");
      const pdfBytes = await generatePDF({ ...formData, paymentAmount }, docId, paymentId, orderId, dateOfPayment);
      console.log("PDF receipt generated.");

      const isProduction = process.env.NODE_ENV === 'production' || 
                           (process.env.NEXT_PUBLIC_CASHFREE_ENV || '').trim().toUpperCase() === 'PRODUCTION';
      console.log("Attempting to send confirmation email to:", isProduction ? maskEmail(formData.email) : formData.email);
      const emailResult = await sendEmail(formData.email, formData.name, pdfBytes);
      console.log(`Email sent successfully via ${emailResult.provider}.`);

      if (docId) {
        await adminDb.collection('registrations').doc(docId).update({
          emailSent: true,
          emailSentAt: FieldValue.serverTimestamp(),
          emailError: null,
          emailProvider: emailResult.provider,
          emailProviderMessageId: emailResult.messageId || null,
          emailAttemptCount: FieldValue.increment(1),
          lastEmailAttemptAt: FieldValue.serverTimestamp(),
        }).catch(err => console.error("Failed to update emailSent status in Firestore:", err));
      }
    } catch (emailError: any) {
      console.error("Email generation/delivery failed:", emailError);
      
      if (docId) {
        // Prevent concurrent race overwriting a successful delivery with stale failure
        try {
          const freshSnap = await adminDb.collection('registrations').doc(docId).get();
          if (freshSnap.exists && freshSnap.data()?.emailSent === true) {
            console.log(`[RegistrationHelper] Doc ${docId} already has emailSent=true; skipping overwrite.`);
          } else {
            await adminDb.collection('registrations').doc(docId).update({
              emailSent: false,
              emailError: emailError.message || String(emailError),
              emailProvider: 'none',
              emailAttemptCount: FieldValue.increment(1),
              lastEmailAttemptAt: FieldValue.serverTimestamp(),
            });
          }
        } catch (dbErr) {
          console.error("Failed to update emailError status in Firestore:", dbErr);
        }
      }



      sendSystemErrorEmail(
        'System (Email/PDF)',
        `registration/${docId}`,
        `Failed to generate PDF or send email to ${formData.email}: ${emailError.message}`
      ).catch(() => {});
    }
  })();

  // 4. Create Audit Log using Admin SDK
  const auditLogPromise = (async () => {
    try {
      console.log("Recording audit log...");
      await adminDb.collection('auditLogs').add({
        timestamp: FieldValue.serverTimestamp(),
        action: 'REGISTRATION_COMPLETE',
        performedBy: formData.email,
        targetEntity: `registration/${docId}`,
        details: `New registration for ${formData.name} (${formData.registrationNumber}) completed via ${paymentId === 'mock_payment_id' ? 'MOCK' : 'CASHFREE'}`
      });
      console.log("Audit log recorded.");
    } catch (auditError) {
      console.error("Audit logging failed:", auditError);
    }
  })();

  // 5. Automatic Google Sheet Sync
  const sheetSyncPromise = (async () => {
    try {
      const excelWebhook = process.env.EXCEL_SYNC_WEBHOOK_URL;
      if (!excelWebhook) return;
      
      console.log("Automatically syncing registration to Google Sheet...");
      const escapeForSheets = (val: string) => (typeof val === 'string' && val.startsWith('+')) ? `'${val}` : (val || 'N/A');
      
      const dbDate = new Date();
      const istDate = new Date(dbDate.getTime() + (5.5 * 60 * 60 * 1000));
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const dateGroup = `${istDate.getUTCDate()}-${months[istDate.getUTCMonth()]}`;

      // Format Events using official catalog
      const { OFFICIAL_EVENTS } = await import('@/lib/eventPricing');
      const getEventTitle = (id: string) => {
        const found = OFFICIAL_EVENTS.find(e => e.id === id || e.title.toLowerCase() === id.toLowerCase());
        if (found) return found.title;
        return id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      let eventIds: string[] = [];
      if (Array.isArray(formData.selectedEvents)) eventIds = formData.selectedEvents;
      else if (Array.isArray(formData.events)) eventIds = formData.events;
      else if (formData.eventId) eventIds = [formData.eventId];
      else if (formData.event) eventIds = [formData.event];
      else if (formData.eventName) eventIds = [formData.eventName];

      const eventTitlesList = eventIds.length > 0
        ? eventIds.map(getEventTitle)
        : (formData.eventName || formData.eventTitle || formData.event
            ? [getEventTitle(formData.eventName || formData.eventTitle || formData.event)]
            : ['General']);
      
      const eventsList = eventTitlesList.join(', ');

      const { extractRegistrationInfo } = await import('@/lib/registrationDataHelper');
      const unifiedData = extractRegistrationInfo(formData, docId);

      const extractAmount = (data: any) => {
        const val = data?.receivedAmount ?? data?.paymentAmount ?? data?.amount ?? data?.price ?? paymentAmount ?? 2500;
        if (typeof val === 'number' && !isNaN(val)) return val;
        const parsed = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? 2500 : parsed;
      };

      const payload = {
        id: docId,
        name: unifiedData.name,
        phone: escapeForSheets(unifiedData.phone),
        email: unifiedData.email,
        college: unifiedData.college,
        event: eventsList,
        events: eventTitlesList,
        eventType: unifiedData.eventType,
        teamName: unifiedData.teamName,
        members: unifiedData.eventType === 'Team' ? Number(unifiedData.totalMembers || 1) : 1,
        amtPaid: String(extractAmount(formData)),
        paymentId: paymentId || 'N/A',
        orderId: orderId || 'N/A',
        date: dbDate.toISOString(),
      };

      const res = await fetch(excelWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok && docId) {
        await adminDb.collection('registrations').doc(docId).update({ sheetSynced: true });
        console.log("Successfully synced to Google Sheet.");
      }
    } catch (sheetError) {
      console.error("Auto sheet sync failed:", sheetError);
    }
  })();

  // Wait for all tasks to complete so Vercel doesn't kill the function early
  try {
    await Promise.all([emailAndPdfPromise, auditLogPromise, sheetSyncPromise]);
    console.log("All post-registration tasks resolved successfully.");
  } catch (bgError: any) {
    console.error("Error in post-registration tasks:", bgError);


    sendSystemErrorEmail(
      'System (Background Tasks)',
      `registration/${docId}`,
      `Unexpected error in background pipeline: ${bgError.message}`
    ).catch(() => {});
  }

  return docId;
}
