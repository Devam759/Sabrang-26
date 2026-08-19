import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length && process.env.FIREBASE_PROJECT_ID) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Safely format the private key
    if (privateKey) {
      privateKey = privateKey.replace(/"/g, "").replace(/\\n/g, "\n");
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } catch (error: any) {
    if (error.message?.includes('Failed to parse private key') || error.code === 'app/invalid-credential') {
      console.error("⚠️ Firebase Admin Warning: Failed to parse FIREBASE_PRIVATE_KEY. Please ensure the key in .env.local is correctly formatted as a PEM string.");
    } else {
      console.error("Firebase admin initialization error:", error);
    }
  }
}

export const adminAuth = getApps().length
  ? getAuth()
  : (null as unknown as ReturnType<typeof getAuth>);
export const adminDb = getApps().length
  ? getFirestore()
  : (null as unknown as ReturnType<typeof getFirestore>);
