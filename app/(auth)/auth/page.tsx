"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGoogle, FaLock, FaEnvelope, FaUser, FaArrowRight } from "react-icons/fa";
import { toast } from "sonner";
import Link from "next/link";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Simplified function for creating user in Firestore
  const createUserInFirestore = async (userId: string, userData: {
    fullName: string;
    email: string;
    createdAt: Date;
    [key: string]: string | Date | boolean | number | object | undefined;
  }) => {
    try {

      // Store all user data in the 'customers' collection for Stripe
      await setDoc(doc(db, "customers", userId), {
        email: userData.email,
        fullName: userData.fullName,
        name: userData.fullName, // Added for compatibility
        createdAt: userData.createdAt,
        points: 0,
        level: 1,
        roles: ["standard"],
        metadata: {
          fullName: userData.fullName
        }
      });
      
      return true;
    } catch (error) {
      console.error("Detailed error creating user in Firestore:", error);
      // Display more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return false;
    }
  };

  // Email and password authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Authentication successful!");
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Authentication error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error during authentication";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // New registration with better auth state handling
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!fullName) {
      toast.error("Full name is required");
      setIsLoading(false);
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Ensure the authentication token is updated by waiting for
      // an authentication state change event
      const authStatePromise = new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser && currentUser.uid === user.uid) {
            unsubscribe();
            resolve();
          }
        });
        
        // Safety timeout in case the event doesn't trigger
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 2000);
      });
      
      // Wait for the authentication process to complete
      await authStatePromise;
      
      // Create user in Firestore
      const userData = {
        fullName, 
        email,
        createdAt: new Date(),
        role: 'standard'
      };
      
      console.log("Triggering user creation in Firestore after complete authentication");
      const success = await createUserInFirestore(user.uid, userData);
      
      if (success) {
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        toast.warning("Account created, but profile data couldn't be saved");
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error during registration";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Google authentication with better auth state handling
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user.email) {
        toast.error("Could not get email from Google");
        setIsLoading(false);
        return;
      }
      
      // Ensure the authentication token is updated
      const authStatePromise = new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser && currentUser.uid === user.uid) {
            unsubscribe();
            resolve();
          }
        });
        
        // Safety timeout
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 2000);
      });
      
      // Wait for the authentication process to complete
      await authStatePromise;
      
      // Create user in Firestore if it doesn't exist
      const userData = {
        fullName: user.displayName || "Google User", 
        email: user.email,
        createdAt: new Date(),
        role: 'standard'
      };
      
      console.log("Triggering Google user creation in Firestore after complete authentication");
      const success = await createUserInFirestore(user.uid, userData);
      
      if (success) {
        toast.success("Google authentication successful!");
      } else {
        toast.warning("Authentication successful, but profile couldn't be saved");
      }
      
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Google authentication error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error during Google authentication";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0">
      {/* Left side with form */}
      <div className="bg-gray-800 p-6 md:p-10 rounded-l-lg border border-gray-700">
        <Card className="w-full border-gray-700 bg-gray-800 shadow-none">
          <CardHeader className="space-y-2 pb-6 border-b border-gray-700">
            <CardTitle className="text-2xl font-bold text-white text-center">
              {isRegister ? "Create an Account" : "Sign In to BLia AI"}
            </CardTitle>
            <CardDescription className="text-gray-300 text-center">
              {isRegister 
                ? "Enter your information to create a new account" 
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-5">
              {isRegister && (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <FaUser />
                    </div>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      required={isRegister}
                      className="pl-10 bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <FaEnvelope />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="pl-10 bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <FaLock />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="pl-10 bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
                {!isLoading && <FaArrowRight className="ml-2" />}
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-gray-600 text-gray-200 hover:bg-gray-700" 
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
                  <FaGoogle className="mr-2 text-red-400" />
                  {isRegister ? "Sign up with Google" : "Sign in with Google"}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-gray-700 pt-4">
            <Button
              variant="link"
              className="w-full text-blue-400 hover:text-blue-300"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "Don&apos;t have an account? Create one"}
            </Button>
            
            {!isRegister && (
              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-sm text-gray-400 hover:text-blue-400"
                  asChild
                >
                  <Link href="/forgot-password">Forgot your password?</Link>
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Right side with info */}
      <div className="hidden lg:block bg-gray-900 p-10 rounded-r-lg border border-gray-700">
        <div className="h-full flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-4">Welcome to BLia AI</h2>
          <p className="text-gray-300 mb-8">
            Your educational AI platform to advance your career through personalized learning paths and skill assessments.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="rounded-full bg-blue-600/20 p-3 mr-4">
                <FaUser className="text-blue-400 h-5 w-5" />
              </div>
              <div>
                <h3 className="text-white font-medium">Personalized Learning</h3>
                <p className="text-gray-400 mt-1">AI-generated career paths tailored to your needs and goals</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-blue-600/20 p-3 mr-4">
                <FaLock className="text-blue-400 h-5 w-5" />
              </div>
              <div>
                <h3 className="text-white font-medium">Premium Content</h3>
                <p className="text-gray-400 mt-1">Exclusive resources and advanced features for subscribers</p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-8 text-gray-500 text-sm">
            <p>© 2024 BLia AI. Secure login powered by Firebase Authentication.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
