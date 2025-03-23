import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from "firebase-admin";

// Verificăm dacă Firebase Admin este deja inițializat
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Exportăm instanța Firestore
export const db = getFirestore();

// Exportăm instanțele pentru Firestore și Authentication
export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();

// Helper pentru verificarea și validarea tokenurilor JWT
export const verifyIdToken = async (token: string) => {
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Eroare la verificarea token-ului:", error);
    throw new Error("Token invalid sau expirat");
  }
}; 