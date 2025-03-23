import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getFirestore, onSnapshot } from "firebase/firestore";
import { FirebaseApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
/**
 * Crează o sesiune de checkout Stripe prin intermediul extensiei Firebase pentru Stripe
 * @param app Instanța Firebase
 * @param priceId ID-ul prețului Stripe (lunar sau anual)
 * @returns URL-ul sesiunii de checkout Stripe
 */
export const getCheckoutSession = async (app: FirebaseApp, priceId: string): Promise<string> => {
    const auth = getAuth(app);
    const userId = auth.currentUser?.uid;
    if (!userId) {
        throw new Error('User not found');
    }

    const db = getFirestore(app);
    const checkoutSessionRef = collection(db, 'customers', userId, 'checkout_sessions');

    // Creăm sesiunea de checkout - extensia Firebase va genera automat sesiunea în Stripe
    const docRef = await addDoc(checkoutSessionRef, {
        price: priceId,
        success_url: `${window.location.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/premium/cancel`,
        // Opțional: mode: 'subscription' este setat implicit de extensie
    });
    

    // Așteptăm URL-ul sesiunii de checkout de la extensia Firebase
    return new Promise<string>((resolve, reject) => {
        const unsubscribe = onSnapshot(doc(db, 'customers', userId, 'checkout_sessions', docRef.id), (snapshot) => {
            const data = snapshot.data();
            const { error, url } = data as { error?: { message: string }, url?: string };
            if (error) {
                console.error(`Checkout session error:`, error);
                unsubscribe();
                reject(new Error(error.message));
            } else if (url) {
                unsubscribe();
                resolve(url);
            }
        });
    });  
}

export async function getPortalUrl(app: FirebaseApp): Promise<{ url: string }> {
  const auth = getAuth(app);
  const user = auth.currentUser;

  let dataWithUrl: { url: string };

  try {
    // Aici e rezolvarea - setează explicit regiunea corectă a extensiei Stripe:
    const functions = getFunctions(app, "europe-west1"); // <- Schimbă regiunea dacă este alta!
    const functionRef = httpsCallable(
      functions,
      "ext-firestore-stripe-payments-createPortalLink"
    );

    // Apelul către cloud function
    const { data } = await functionRef({
      customerId: user?.uid,
      returnUrl: window.location.origin,
    });

    dataWithUrl = data as { url: string };
  } catch (error) {
    console.error("Error creating portal link:", error);
    throw error;
  }

  return new Promise<{ url: string }>((resolve, reject) => {
    if (dataWithUrl.url) {
      resolve({ url: dataWithUrl.url });
    } else {
      reject(new Error("No portal URL was returned from Stripe"));
    }
  });
}


// Funcție pentru anularea abonamentului
export function cancelSubscription(app: FirebaseApp) {
  // Utilizăm getPortalUrl pentru a redirecționa către portalul de gestionare Stripe
  return getPortalUrl(app);
}