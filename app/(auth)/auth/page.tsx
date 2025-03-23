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
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white">
      {/* Left side with image/illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-4xl font-bold text-white mb-6">Welcome to BLia AI</h1>
          <p className="text-blue-100 mb-6 text-lg">
            Your educational AI platform to advance your career through personalized learning paths and skill assessments.
          </p>
          
          <div className="space-y-4 mt-12">
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <FaUser className="text-white h-5 w-5" />
              </div>
              <div>
                <h3 className="text-white font-medium">Personalized Learning</h3>
                <p className="text-blue-100 text-sm">AI-generated career paths tailored to your needs and goals</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <FaLock className="text-white h-5 w-5" />
              </div>
              <div>
                <h3 className="text-white font-medium">Premium Content</h3>
                <p className="text-blue-100 text-sm">Exclusive resources and advanced features for subscribers</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDEwKSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIj48L3JlY3Q+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIj48L3JlY3Q+PC9zdmc+')] opacity-50 z-0"></div>
        
        <div className="z-10 text-white/40 text-sm">
          © 2024 BLia AI. All rights reserved.
        </div>
      </div>
      
      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-8">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isRegister ? "Create an Account" : "Sign In to BLia AI"}
            </CardTitle>
            <CardDescription className="text-center">
              {isRegister 
                ? "Enter your information to create a new account" 
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FaUser className="text-gray-500 mr-2" />
                    <label htmlFor="fullName" className="text-sm font-medium">
                      Full Name
                    </label>
                  </div>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required={isRegister}
                    className="bg-gray-50 border border-gray-100"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-500 mr-2" />
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="bg-gray-50 border border-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <FaLock className="text-gray-500 mr-2" />
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-gray-50 border border-gray-100"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all" 
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
                {!isLoading && <FaArrowRight className="ml-2" />}
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-gray-200 hover:bg-gray-50 transition-all" 
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
                  <FaGoogle className="mr-2 text-red-500" />
                  {isRegister ? "Sign up with Google" : "Sign in with Google"}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="link"
              className="w-full text-blue-600"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
