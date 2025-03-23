"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaCheckCircle, FaHome, FaSpinner } from "react-icons/fa";
import { doc, getFirestore, onSnapshot, getDoc, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";

interface CheckoutSession {
  status: string;
  payment_status?: string;
  error?: { message: string };
  subscription?: string;
}

interface SubscriptionData {
  id: string;
  status: string;
  // Add any other necessary properties
}

// Componenta client care utilizează useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Processing your payment...");
  const [sessionData, setSessionData] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Definim funcția checkSubscriptions folosind useCallback pentru a evita re-crearea sa la fiecare randare
  const checkSubscriptions = useCallback(async () => {
    if (!user) return false;
    
    try {
      console.log("Checking subscriptions as fallback");
      const db = getFirestore(app);
      
      // Verificăm colecția de abonamente
      const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
      const subscriptionsSnapshot = await getDocs(subscriptionsRef);
      
      if (subscriptionsSnapshot.empty) {
        console.log("No subscriptions found");
        return false;
      }
      
      // Verificăm dacă există un abonament activ
      const activeSubscription = subscriptionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionData))
        .find(sub => sub.status === 'active' || sub.status === 'trialing');
      
      if (activeSubscription) {
        setSessionData({
          status: 'complete',
          payment_status: 'paid',
          subscription: activeSubscription.id
        });
        setMessage("Active subscription found! Your account has been upgraded to Premium.");
        setIsLoading(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking subscriptions:", error);
      return false;
    }
  }, [user]); // Dependența doar de user

  // Function to retry verification
  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setMessage("Rechecking subscription status...");
    
    // Verificăm direct abonamentele
    const hasSubscription = await checkSubscriptions();
    
    if (!hasSubscription) {
      setError("No active subscription found");
      setMessage("We couldn't find an active subscription. Please contact support if you believe this is an error.");
    }
    
    setIsRetrying(false);
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      setError("Session ID is missing");
      setMessage("Could not identify the payment session. Please contact support if you were charged.");
      setIsLoading(false);
      return;
    }

    if (!user) {
      return; // Wait for user authentication
    }
    
    console.log(`Success page loaded with session ID: ${sessionId} for user ${user.uid}`);
    
    // Check session status directly from Firestore
    const verifyPayment = async () => {
      try {
        console.log(`Verifying session: ${sessionId}`);
        const db = getFirestore(app);
        
        // Verificăm mai întâi dacă documentul există
        const sessionDoc = await doc(db, 'customers', user.uid, 'checkout_sessions', sessionId);
        
        // Încercăm să găsim sesiunea de mai multe ori în caz de întârziere
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 2000; // 2 secunde între încercări
        
        const checkSession = async () => {
          try {
            const sessionSnapshot = await getDoc(sessionDoc);
            
            if (sessionSnapshot.exists()) {
              console.log("Session found, setting up listener");
              setupListener(); // Continuăm cu ascultătorul normal
              return;
            }
            
            retryCount++;
            console.log(`Session not found. Retry ${retryCount}/${maxRetries}`);
            
            if (retryCount < maxRetries) {
              setMessage(`Searching for payment information... (attempt ${retryCount}/${maxRetries})`);
              setTimeout(checkSession, retryDelay);
            } else {
              console.error("Max retries reached, session not found");
              
              // Verificăm abonamentele ca mecanism de rezervă
              const hasSubscription = await checkSubscriptions();
              
              if (!hasSubscription) {
                setError("Session not found after multiple attempts");
                setMessage("Could not find the payment session after multiple attempts. Please contact support and provide your session ID.");
                setIsLoading(false);
              }
            }
          } catch (err) {
            console.error("Error checking session:", err);
            setError("Error checking session");
            setMessage("An error occurred while checking the payment session. Please contact support.");
            setIsLoading(false);
          }
        };
        
        // Setup listener once we know the document exists
        const setupListener = () => {
          // Listen for changes in the checkout session
          const unsubscribe = onSnapshot(
            doc(db, 'customers', user.uid, 'checkout_sessions', sessionId),
            (snapshot) => {
              if (!snapshot.exists()) {
                setError("Session not found");
                setMessage("Could not find the payment session. Please contact support.");
                setIsLoading(false);
                return;
              }
              
              const data = snapshot.data() as CheckoutSession;
              console.log("Session data:", data);
              setSessionData(data);
              
              if (data.error) {
                setError(data.error.message);
                setMessage("An error occurred while processing the payment. Please contact support.");
                setIsLoading(false);
                unsubscribe();
              } else if (data.status === 'complete') {
                setMessage("Subscription registration has been completed. Your account has been upgraded to Premium.");
                setIsLoading(false);
                
                // We can usually stop listening after the session is complete
                // but we'll keep it to show updated data
                setTimeout(() => {
                  unsubscribe();
                }, 5000);
              } else if (data.payment_status === 'paid') {
                setMessage("Payment has been processed. Setting up your account...");
              } else {
                setMessage(`Payment status: ${data.payment_status || 'pending'}. Please wait...`);
              }
            },
            (err) => {
              console.error("Error monitoring session:", err);
              setError("Error monitoring session");
              setMessage("An error occurred while monitoring the payment. Please contact support.");
              setIsLoading(false);
            }
          );

          // Cleanup
          return () => {
            unsubscribe();
          };
        };
        
        // Start the process
        checkSession();
        
      } catch (error) {
        console.error("Error verifying payment:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setMessage("An error occurred while processing the payment. Please contact support.");
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, user, checkSubscriptions]);

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {isLoading || isRetrying ? (
              <FaSpinner className="animate-spin text-blue-500" size={30} />
            ) : error ? (
              <FaCheckCircle className="text-yellow-500" size={30} />
            ) : (
              <FaCheckCircle className="text-green-500" size={30} />
            )}
            <span>Thank you for your purchase!</span>
          </CardTitle>
          <CardDescription>
            Premium subscription gives you access to all platform features
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`py-6 ${isLoading || isRetrying ? 'animate-pulse' : ''}`}>
            <p className="text-lg">{message}</p>
            
            {sessionData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md text-left">
                <p className="text-sm mb-1"><strong>Session status:</strong> {sessionData.status}</p>
                <p className="text-sm mb-1"><strong>Payment status:</strong> {sessionData.payment_status || 'pending'}</p>
                {sessionData.subscription && (
                  <p className="text-sm"><strong>Subscription ID:</strong> {sessionData.subscription}</p>
                )}
              </div>
            )}
            
            {error && (
              <div className="mt-4">
                <p className="text-red-500 text-sm mb-4">
                  Error: {error}
                </p>
                
                <div className="flex flex-col gap-2 items-center">
                  <Button 
                    onClick={handleRetry} 
                    variant="outline"
                    disabled={isRetrying}
                    className="flex items-center gap-2"
                  >
                    {isRetrying ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                    Recheck Subscription
                  </Button>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    If you believe your payment was successful, please try rechecking or contact our support team.
                  </p>
                </div>
              </div>
            )}
            
            {!isLoading && !error && (
              <p className="mt-4">
                You can now access all premium features and generate your personalized career path.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => router.push("/dashboard")} 
            className="flex items-center gap-2"
          >
            <FaHome /> Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Componenta principală care încadrează SuccessContent într-un boundary Suspense
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 