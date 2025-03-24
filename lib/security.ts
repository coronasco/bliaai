/**
 * Utilități pentru securitatea aplicației
 */

import { auth, db } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Verifică dacă un utilizator are drepturi de admin
 * @param user Utilizatorul curent
 * @returns Promise care rezolvă true dacă utilizatorul este admin
 */
export const isAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    const userDoc = await getDoc(doc(db, 'customers', user.uid));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    
    // Verifică ambele posibilități: role și roles
    const hasAdminRole = userData?.role === 'admin';
    const hasAdminRoleInArray = userData?.roles?.includes('admin') || false;
    
    return hasAdminRole || hasAdminRoleInArray;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};

/**
 * Verifică dacă un utilizator are drepturi premium
 * @param user Utilizatorul curent
 * @returns Promise care rezolvă true dacă utilizatorul are abonament premium
 */
export const isPremiumUser = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    const userDocRef = doc(db, 'customers', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) return false;
    
    // Verificăm subcollection-ul subscriptions pentru abonamente active
    const subscriptionsRef = collection(userDocRef, "subscriptions");
    const subscriptionsSnapshot = await getDocs(subscriptionsRef);
    
    // Un utilizator este premium dacă are cel puțin un abonament cu status "active"
    const isPremium = subscriptionsSnapshot.docs.some(doc => doc.data().status === "active");
    
    // Pentru debugging
    console.log("[DEBUG] Premium check from isPremiumUser:", {
      userId: user.uid,
      isPremium,
      numSubscriptions: subscriptionsSnapshot.size,
      subscriptions: subscriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        status: doc.data().status
      }))
    });
    
    return isPremium;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

/**
 * Verifică dacă un utilizator este proprietarul unei resurse
 * @param user Utilizatorul curent
 * @param resourceId ID-ul resursei
 * @param collectionName Numele colecției (roadmaps, paths, etc.)
 * @returns Promise care rezolvă true dacă utilizatorul este proprietarul resursei
 */
export const isResourceOwner = async (
  user: User | null, 
  resourceId: string, 
  collectionName: string
): Promise<boolean> => {
  if (!user || !resourceId) return false;
  
  try {
    const resourceDoc = await getDoc(doc(db, collectionName, resourceId));
    if (!resourceDoc.exists()) return false;
    
    const resourceData = resourceDoc.data();
    return resourceData?.userId === user.uid || resourceData?.createdBy === user.uid;
  } catch (error) {
    console.error(`Error checking owner for ${collectionName}:`, error);
    return false;
  }
};

/**
 * CSP Headers recomandate pentru aplicație
 */
export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebase.com https://*.firebaseio.com https://*.firebaseapp.com https://*.stripe.com https://*.googleapis.com https://www.googletagmanager.com; connect-src 'self' https://*.firebase.com https://*.firebaseio.com https://*.firebaseapp.com https://api.stripe.com https://*.googleapis.com https://securetoken.googleapis.com https://firebase.googleapis.com https://*.google-analytics.com https://region1.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.firebaseusercontent.com https://*.google-analytics.com https://*.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://*.firebaseapp.com https://*.stripe.com; object-src 'none'"
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

// Tipul pentru funcții de handler API
export type ApiHandler = (req: Request, ...args: unknown[]) => Promise<Response>;

/**
 * Wrapper pentru a verifica securitatea pe rute API
 * @param handler Funcția handler pentru API
 * @param checkAuth Verifică dacă utilizatorul este autentificat
 * @param checkAdmin Verifică dacă utilizatorul este admin
 * @param checkPremium Verifică dacă utilizatorul are premium
 */
export const withAuthCheck = (
  handler: ApiHandler,
  { 
    checkAuth = true, 
    checkAdmin = false, 
    checkPremium = false 
  } = {}
) => {
  return async (req: Request, ...args: unknown[]) => {
    // Aici ar trebui implementată logica de verificare a autentificării
    // bazată pe cum este gestionată autentificarea în NextJS
    
    // Exemplu de implementare simplificată:
    if (checkAuth) {
      // Verificare autentificare
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (checkAdmin) {
        // Verificare admin
        const adminStatus = await isAdmin(currentUser);
        if (!adminStatus) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      if (checkPremium) {
        // Verificare premium
        const premiumStatus = await isPremiumUser(currentUser);
        if (!premiumStatus) {
          return new Response(JSON.stringify({ error: 'Premium required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    // Apelăm handler-ul original dacă toate verificările trec
    return handler(req, ...args);
  };
}; 