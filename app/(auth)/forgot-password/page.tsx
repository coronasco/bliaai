"use client";
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa";
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Email validation
  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!isEmailValid(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      
      // Handle different Firebase error codes
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        toast.error("No account found with this email address");
      } else if (firebaseError.code === 'auth/invalid-email') {
        toast.error("Invalid email format");
      } else if (firebaseError.code === 'auth/too-many-requests') {
        toast.error("Too many attempts. Please try again later");
      } else {
        toast.error("Failed to send reset email. Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl border-gray-800 bg-gray-800 shadow-xl">
      <CardHeader className="space-y-1 border-b border-gray-700">
        <CardTitle className="text-2xl font-bold text-center text-white">Reset Your Password</CardTitle>
        <CardDescription className="text-center text-gray-300">
          {emailSent 
            ? "Check your email for a reset link" 
            : "Enter your email address to receive a password reset link"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {emailSent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto my-4 bg-gray-700 text-blue-300 p-4 rounded-lg border border-gray-600">
              <p>We&apos;ve sent an email to <span className="font-semibold text-white">{email}</span></p>
              <p className="text-sm mt-2">Click the link in the email to reset your password.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Send to a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <FaEnvelope />
                </div>
                <Input 
                  id="email" 
                  placeholder="Email address" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="pl-10 bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Reset Password"}
            </Button>
          </form>
        )}
      </CardContent>
      
      <CardFooter className="justify-center border-t border-gray-700 pt-4">
        <Link 
          href="/auth" 
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
        >
          <FaArrowLeft className="mr-2" size={12} />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}