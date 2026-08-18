import admin from 'firebase-admin';
import { randomInt } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

// Generate a random numeric password of N digits using cryptographically secure PRNG
const generatePassword = (length) => {
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += randomInt(0, 10).toString();
  }
  return pass;
};

const accounts = [
  { email: 'adminsabrang@jklu.edu.in', role: 'admin', passLen: 12, name: 'Sabrang Super Admin' },
  { email: 'scanner1@jklu.edu.in', role: 'scanner', passLen: 10, name: 'Scanner 1' },
  { email: 'scanner2@jklu.edu.in', role: 'scanner', passLen: 10, name: 'Scanner 2' },
  { email: 'scanner3@jklu.edu.in', role: 'scanner', passLen: 10, name: 'Scanner 3' },
  { email: 'scanner4@jklu.edu.in', role: 'scanner', passLen: 10, name: 'Scanner 4' },
  { email: 'scanner5@jklu.edu.in', role: 'scanner', passLen: 10, name: 'Scanner 5' },
];

async function setup() {
  console.log("--- STARTING SETUP ---");
  
  for (const acc of accounts) {
    const password = generatePassword(acc.passLen);
    
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(acc.email);
        console.log(`User ${acc.email} exists, updating...`);
        await auth.updateUser(userRecord.uid, { password });
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: acc.email,
            password,
            displayName: acc.name,
          });
          console.log(`Created user: ${acc.email}`);
        } else {
          throw e;
        }
      }
      
      console.log(`Saving to Firestore: ${acc.email}...`);
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        name: acc.name,
        email: acc.email,
        role: acc.role,
        createdAt: new Date(),
      }, { merge: true });
      
      console.log(`[OK] ${acc.email} | Pass: ${password} | Role: ${acc.role}`);
    } catch (err) {
      console.error(`[ERROR] ${acc.email}:`, err);
    }
  }
}

setup().catch(console.error);
