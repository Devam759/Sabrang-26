import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
// Check if API key is a validly formatted Firebase API key (typically starts with AIzaSy)
const isValidKey = Boolean(apiKey && apiKey.startsWith("AIzaSy") && apiKey.length > 20);

const firebaseConfig = {
  apiKey: isValidKey ? apiKey! : "AIzaSyDummyApiKeyForLocalDevelopment01",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sabrang-demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sabrang-demo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sabrang-demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:1234567890abcdef",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Safely get or initialize default Firebase app
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
let db: Firestore;

try {
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase Auth init warning (Configure .env.local for live auth):", e);
  const fallbackApp = getApps().find(a => a.name === 'fallback') || initializeApp({
    apiKey: "AIzaSyDummyApiKeyForLocalDevelopment01",
    projectId: "sabrang-demo"
  }, 'fallback');
  auth = getAuth(fallbackApp);
}

try {
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase Firestore init warning:", e);
  const fallbackApp = getApps().find(a => a.name === 'fallback') || initializeApp({
    apiKey: "AIzaSyDummyApiKeyForLocalDevelopment01",
    projectId: "sabrang-demo"
  }, 'fallback');
  db = getFirestore(fallbackApp);
}

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
