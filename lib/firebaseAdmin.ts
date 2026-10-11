import { getApps, initializeApp, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

function initFirebaseAdmin(): App | null {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  try {
    dotenv.config({ path: path.join(process.cwd(), '.env.local') });
    dotenv.config();

    // 1. Check for Base64 or JSON FIREBASE_SERVICE_ACCOUNT
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let serviceAccount;
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      } catch {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      }
      
      const app = initializeApp({
        credential: cert(serviceAccount), storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin SDK initialized successfully via FIREBASE_SERVICE_ACCOUNT.');
      return app;
    }

    // 2. Check for individual FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL + FIREBASE_PROJECT_ID
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      function formatPrivateKey(rawKey: string | undefined): string | undefined {
        if (!rawKey) return undefined;
        let key = rawKey.trim();
        key = key.replace(/^[`"']+|[`"']+$/g, '');
        key = key.replace(/\\+n/g, '\n');
        key = key.replace(/\r/g, '');

        const begin = '-----BEGIN PRIVATE KEY-----';
        const end = '-----END PRIVATE KEY-----';

        if (!key.includes('\n') || !key.includes('-----END')) {
          if (key.includes(begin) && key.includes(end)) {
            const body = key.replace(begin, '').replace(end, '').replace(/\s+/g, '');
            const chunked = body.match(/.{1,64}/g)?.join('\n') || body;
            key = `${begin}\n${chunked}\n${end}\n`;
          }
        } else {
          key = key.replace(begin, '').replace(end, '').trim();
          const bodyLines = key.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
          key = `${begin}\n${bodyLines}\n${end}\n`;
        }
        return key;
      }

      const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
      
      if (privateKey && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        try {
          const app = initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey,
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
          console.log('Firebase Admin SDK initialized successfully via FIREBASE credentials.');
          return app;
        } catch (certErr: any) {
          console.warn('⚠️ Firebase Admin Warning: Failed to initialize with FIREBASE_PRIVATE_KEY:', certErr.message);
        }
      }
    }

    // 3. Try loading local service-account.json if present
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      const app = initializeApp({
        credential: cert(serviceAccount), storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin SDK initialized successfully via local service-account.json.');
      return app;
    }

    // 4. Fallback: Only attempt applicationDefault if running inside Google Cloud or GOOGLE_APPLICATION_CREDENTIALS is set
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'sabrang-26';
    const isGoogleCloudEnv = !!(
      process.env.GOOGLE_APPLICATION_CREDENTIALS || 
      process.env.K_SERVICE || 
      process.env.GAE_INSTANCE || 
      process.env.GCP_PROJECT
    );

    if (isGoogleCloudEnv) {
      try {
        const app = initializeApp({
          credential: applicationDefault(),
          projectId: projectId,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        });
        console.log("Firebase Admin SDK initialized using Default Application Credentials.");
        return app;
      } catch (err: any) {
        console.warn("ADC initialization failed:", err.message);
      }
    }

    // If no credentials found and not in GCP env, return null to avoid throwing credential errors locally
    console.warn("⚠️ Firebase Admin SDK: No credentials found. Admin DB will be disabled locally.");
    return null;
  } catch (error: any) {
    console.warn("Firebase Admin SDK initialization warning:", error.message || error);
    return (getApps()[0] as App) || null;
  }
}

const app = initFirebaseAdmin();
export const adminApp = app as App;
export const adminDb = app ? getFirestore(app) : (null as unknown as Firestore);
export const adminAuth = app ? getAuth(app) : (null as unknown as Auth);


export const adminStorage = app ? getStorage(app) : null;