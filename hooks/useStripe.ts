import { useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

// Inițializăm Stripe cu cheia publică
let stripePromise: Promise<Stripe | null>;

/**
 * Hook pentru gestionarea funcționalităților Stripe
 */
export const useStripe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inițializare Stripe
  const getStripe = () => {
    if (!stripePromise) {
      stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);
    }
    return stripePromise;
  };
  
  // Creare sesiune de checkout
  const createCheckoutSession = async (priceId: string, mode: 'subscription' | 'payment' = 'subscription') => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificăm dacă utilizatorul este autentificat
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Trebuie să fiți autentificat pentru a continua.');
      }
      
      // Apelăm API-ul pentru a crea sesiunea de checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          userEmail: user.email,
          mode
        }),
      });
      
      const { sessionId, error: apiError } = await response.json();
      
      if (apiError) {
        throw new Error(apiError);
      }
      
      // Redirecționăm către pagina de checkout Stripe
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe could not be loaded.');
      }
      
      const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
      
      if (redirectError) {
        throw new Error(redirectError.message || 'An error occurred during redirection.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Eroare la crearea sesiunii de checkout:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Creare portal client pentru gestionarea abonamentelor
  const createCustomerPortal = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificăm dacă utilizatorul este autentificat
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Trebuie să fiți autentificat pentru a continua.');
      }
      
      // Apelăm API-ul pentru a crea portalul client
      const response = await fetch('/api/create-customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid
        }),
      });
      
      const { url, error: apiError } = await response.json();
      
      if (apiError) {
        throw new Error(apiError);
      }
      
      // Redirecționăm către portalul Stripe
      window.location.href = url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Eroare la crearea portalului client:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    createCheckoutSession,
    createCustomerPortal
  };
}; 