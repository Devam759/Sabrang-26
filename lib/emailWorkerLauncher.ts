import { adminDb, adminApp } from './firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { generatePDF, sendEmail } from './registrationHelper';

let unsubscribe: (() => void) | null = null;

// In-memory set to prevent double-processing in the same Node process
const processingDocs = new Set<string>();

// Delay before the worker retries a newly created doc (gives inline email pipeline time to finish)
const WORKER_RETRY_DELAY_MS = 3 * 60 * 1000; // 3 minutes

export function startEmailWorker() {
  // Prevent double-start in dev hot reloads or duplicate module loads
  if ((global as any).__emailWorkerStarted) {
    console.log('[EmailWorker] Already running - skipping initialization.');
    return;
  }

  if (!adminDb || adminApp?.name === 'client-admin-fallback' || adminApp?.name === 'build-fallback') {
    console.log('[EmailWorker] Firebase Admin DB not initialized with real credentials - skipping email worker.');
    return;
  }

  try {
    (global as any).__emailWorkerStarted = true;

    console.log('[EmailWorker] === Starting real-time email worker ===');

    const registrationsRef = adminDb.collection('registrations');

    // Listen for NEW docs added where emailSent is false (boolean).
    // Records marked emailSent: 'failed' (string) are excluded by this query.
    const queryRef = registrationsRef.where('emailSent', '==', false);

    unsubscribe = queryRef.onSnapshot(
      async (snapshot) => {
        const changes = snapshot.docChanges();

        for (const change of changes) {
          // Only react to genuinely new documents - not field modifications
          if (change.type !== 'added') continue;

          const doc = change.doc;
          const docId = doc.id;
          const data = doc.data();

          // Guard: already in-flight in this process
          if (processingDocs.has(docId)) continue;

          // Guard: skip blank/corrupted records
          if (!data.name?.trim() || !data.email?.trim()) continue;

          // Guard: give the inline registration pipeline 3 minutes to finish its own
          // email attempt before the worker steps in as a fallback.
          // NOTE: server-side Timestamps may be null immediately after write;
          // if registeredAt is missing or not yet resolved, defer by the full delay.
          const registeredAt = data.registeredAt as Timestamp | null | undefined;
          let deferMs = WORKER_RETRY_DELAY_MS;

          if (registeredAt && typeof registeredAt.toMillis === 'function') {
            const ageMs = Date.now() - registeredAt.toMillis();
            deferMs = Math.max(0, WORKER_RETRY_DELAY_MS - ageMs);
          }

          if (deferMs > 0) {
            console.log(
              `[EmailWorker] Doc ${docId} - deferring ${Math.round(deferMs / 1000)}s ` +
              `before fallback attempt.`
            );
            setTimeout(() => processDoc(registrationsRef, docId), deferMs + 5000);
          } else {
            // Doc is old enough - process immediately
            processDoc(registrationsRef, docId);
          }
        }
      },
      (error) => {
        // Listener errors are non-fatal - log and continue
        console.error('[EmailWorker] Firestore listener error:', error);
      }
    );

    console.log('[EmailWorker] Listener attached. Waiting for new registrations...');
  } catch (err) {
    // Any startup error must NEVER crash the Next.js server
    console.error('[EmailWorker] Failed to start - site continues normally:', err);
    (global as any).__emailWorkerStarted = false;
  }
}

async function processDoc(
  registrationsRef: FirebaseFirestore.CollectionReference,
  docId: string
) {
  // Prevent concurrent processing in the same process
  if (processingDocs.has(docId)) return;
  processingDocs.add(docId);

  try {
    // Re-fetch the current document state to ensure it still needs an email
    const snap = await registrationsRef.doc(docId).get();
    if (!snap.exists) {
      console.log(`[EmailWorker] Doc ${docId} no longer exists. Skipping.`);
      return;
    }

    const data = snap.data()!;

    // Final check: already sent (either true or 'failed') → skip
    if (data.emailSent === true || data.emailSent === 'failed') {
      console.log(`[EmailWorker] Doc ${docId} emailSent=${data.emailSent}. Skipping.`);
      return;
    }

    // Guard: skip blank/corrupted records
    if (!data.name?.trim() || !data.email?.trim()) {
      console.log(`[EmailWorker] Doc ${docId} has no name/email. Skipping.`);
      return;
    }

    console.log(`[EmailWorker] Processing: ${data.name} (${data.email}) - ID: ${docId}`);

    // Generate the PDF receipt
    const pdfBytes = await generatePDF(
      data,
      docId,
      data.paymentId || 'N/A',
      data.orderId || 'N/A',
      data.dateOfPayment
    );

    // Send the email
    const emailResult = await sendEmail(data.email, data.name, pdfBytes);

    // Mark as sent in Firestore
    await registrationsRef.doc(docId).update({
      emailSent: true,
      emailSentAt: FieldValue.serverTimestamp(),
      emailError: null,
      emailProvider: emailResult.provider,
      emailProviderMessageId: emailResult.messageId || null,
      emailAttemptCount: FieldValue.increment(1),
      lastEmailAttemptAt: FieldValue.serverTimestamp(),
    });

    console.log(`[EmailWorker] Email sent successfully to ${data.email} via ${emailResult.provider} (Doc: ${docId})`);
  } catch (err: any) {
    console.error(`[EmailWorker] Failed to process doc ${docId}:`, err);

    // Mark as failed so we stop retrying and avoid email floods
    await registrationsRef.doc(docId).update({
      emailSent: 'failed',
      emailError: err.message || 'SMTP or PDF generation error',
      emailProvider: 'none',
      emailAttemptCount: FieldValue.increment(1),
      lastEmailAttemptAt: FieldValue.serverTimestamp(),
    }).catch((dbErr) =>
      console.error(`[EmailWorker] Could not write failure status for ${docId}:`, dbErr)
    );
  } finally {
    processingDocs.delete(docId);
  }
}

export function stopEmailWorker() {
  if (unsubscribe) {
    console.log('[EmailWorker] Stopping listener...');
    unsubscribe();
    unsubscribe = null;
    (global as any).__emailWorkerStarted = false;
  }
}
