import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Inițializează Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Inițializează Analytics doar în browser
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Eroare la inițializarea Analytics:", error);
  }
}

// Funcție pentru verificarea permisiunilor la knowledge_base
export async function checkKnowledgeBaseAccess() {
  try {
    // Încercăm să accesăm un document din knowledge_base
    const knowledgeRef = collection(db, "knowledge_base");
    const testQuery = query(knowledgeRef, limit(1));
    await getDocs(testQuery);
    return true; // Dacă nu avem erori, avem acces
  } catch (error) {
    console.error("Eroare la verificarea accesului la knowledge_base:", error);
    return false; // Nu avem acces
  }
}

export { app, auth, db, analytics };