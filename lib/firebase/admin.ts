/**
 * Firebase Admin SDK bridge
 * Re-exports the unified Firebase Admin singletons from lib/firebaseAdmin.ts
 */
import { adminApp, adminDb, adminAuth } from "../firebaseAdmin";

export { adminApp, adminDb, adminAuth };
export default adminApp;
