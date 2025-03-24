"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, RotateCcw, AlertTriangle, ChevronRight } from "lucide-react";
import { FaCrown, FaRocket } from "react-icons/fa";
import { doc, getFirestore, onSnapshot, getDoc, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

// Client component that uses useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Processing your payment...");
  const [sessionData, setSessionData] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Define checkSubscriptions using useCallback to avoid recreation on each render
  const checkSubscriptions = useCallback(async () => {
    if (!user) return false;
    
    try {
      console.log("Checking subscriptions as fallback");
      const db = getFirestore(app);
      
      // Check subscriptions collection
      const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
      const subscriptionsSnapshot = await getDocs(subscriptionsRef);
      
      if (subscriptionsSnapshot.empty) {
        console.log("No subscriptions found");
        return false;
      }
      
      // Check if there's an active subscription
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
  }, [user]); // Only depends on user

  // Function to retry verification
  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setMessage("Rechecking subscription status...");
    
    // Check subscriptions directly
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
        
        // First check if document exists
        const sessionDoc = await doc(db, 'customers', user.uid, 'checkout_sessions', sessionId);
        
        // Try to find the session multiple times in case of delay
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 2000; // 2 seconds between attempts
        
        const checkSession = async () => {
          try {
            const sessionSnapshot = await getDoc(sessionDoc);
            
            if (sessionSnapshot.exists()) {
              console.log("Session found, setting up listener");
              setupListener(); // Continue with normal listener
              return;
            }
            
            retryCount++;
            console.log(`Session not found. Retry ${retryCount}/${maxRetries}`);
            
            if (retryCount < maxRetries) {
              setMessage(`Searching for payment information... (attempt ${retryCount}/${maxRetries})`);
              setTimeout(checkSession, retryDelay);
            } else {
              console.error("Max retries reached, session not found");
              
              // Check subscriptions as fallback mechanism
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
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="relative">
        {/* Background gradient glow effect */}
        <div className="absolute -z-10 inset-0 opacity-30 blur-3xl">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-indigo-600/30 rounded-full"></div>
        </div>
        
        <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-purple-600/10 to-transparent rounded-full blur-3xl -z-0"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-t from-blue-600/10 to-transparent rounded-full blur-3xl -z-0"></div>
          
          <CardHeader className="text-center relative z-10 border-b border-gray-800 pb-8 pt-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mb-4 border border-gray-700">
              {isLoading || isRetrying ? (
                <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
              ) : error ? (
                <AlertTriangle className="h-10 w-10 text-amber-400" />
              ) : (
                <CheckCircle className="h-10 w-10 text-green-400" />
              )}
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {error ? "Payment Processing" : "Subscription Successful!"}
            </CardTitle>
            
            <CardDescription className="text-gray-400 mt-2 text-lg">
              {error ? "We're looking into your subscription" : "Your account has been upgraded to Premium"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10 py-8 px-6">
            <div className={`space-y-6 ${isLoading || isRetrying ? 'opacity-80' : ''}`}>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center">
                <p className="text-white text-lg">{message}</p>
              </div>
              
              {!isLoading && !error && !isRetrying && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-4 border border-purple-800/30 flex flex-col items-center justify-center">
                      <FaCrown className="text-yellow-400 text-2xl mb-2" />
                      <h3 className="text-white font-medium">Premium Access</h3>
                      <p className="text-gray-400 text-sm text-center">Unlocked all premium features</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-800/30 flex flex-col items-center justify-center">
                      <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-300 mb-2">
                        NEW
                      </Badge>
                      <h3 className="text-white font-medium">Multiple Roadmaps</h3>
                      <p className="text-gray-400 text-sm text-center">Create up to 4 career paths</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl p-4 border border-indigo-800/30 flex flex-col items-center justify-center">
                      <FaRocket className="text-purple-400 text-2xl mb-2" />
                      <h3 className="text-white font-medium">AI Power</h3>
                      <p className="text-gray-400 text-sm text-center">Generate detailed subtasks</p>
                    </div>
                  </div>
                  
                  {sessionData && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                      <h3 className="text-white font-medium mb-3">Subscription Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-400">Status</p>
                          <p className="text-white font-medium flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            {sessionData.status}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-400">Payment</p>
                          <p className="text-white font-medium">
                            {sessionData.payment_status || 'processing'}
                          </p>
                        </div>
                        {sessionData.subscription && (
                          <>
                            <div className="space-y-1 col-span-2">
                              <p className="text-gray-400">Subscription ID</p>
                              <p className="text-white font-medium font-mono text-xs truncate">
                                {sessionData.subscription}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="border-t border-gray-800 pt-6 pb-8 px-6 flex flex-col sm:flex-row gap-4 relative z-10">
            {error ? (
              <>
                <Button 
                  onClick={handleRetry} 
                  disabled={isRetrying} 
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                      Checking...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" /> 
                      Retry Check
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => router.push("/premium")} 
                  variant="outline" 
                  className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Back to Premium Page
                </Button>
                <Button
                  onClick={() => window.location.href = "mailto:support@blia-ai.com"} 
                  variant="outline"
                  className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Contact Support
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Go to Dashboard
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={() => router.push("/dashboard/profile")}
                  variant="outline"
                  className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Home className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Need help? <Link href="mailto:support@blia-ai.com" className="text-purple-400 hover:underline">Contact our support team</Link>
        </p>
      </div>
    </div>
  );
}

// Main component that wraps SuccessContent in a Suspense boundary
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="h-20 w-20 mx-auto border-4 border-t-purple-500 border-b-purple-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-lg">Loading subscription details...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 