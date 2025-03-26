import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, query, limit, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
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

console.log("[DEBUG FIREBASE] Initializing Firebase with config:", {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain
});

// Initialize Firebase if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Log successful initialization
console.log("[DEBUG FIREBASE] Firebase initialized successfully");

// Check if we're running in development mode and need to connect to emulators
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  console.log("[DEBUG FIREBASE] Connecting to Firestore emulator");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log("[DEBUG FIREBASE] Connected to Firebase emulators");
}

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

export { app, auth, db, functions, analytics };