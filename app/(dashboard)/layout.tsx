"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/shared/Navbar";
import { ErrorProvider } from "@/context/ErrorContext";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import AppTutorial from "@/components/shared/AppTutorial";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  // Error handler that can be used in child components
  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    // Auto-reset after 10 seconds
    setTimeout(() => setErrorMessage(null), 10000);
  }, []);

  useEffect(() => {
    // Check if user is not authenticated and redirect to login page
    if (!authLoading && user === null) {
      router.push("/auth");
    }
    
    // Set a timeout to display a message if loading takes too long
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        setLoadingTimeout(true);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [user, router, authLoading]);

  // Track page loading with a simple effect
  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  // Display a loading state until authentication status is verified
  if (authLoading || user === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 relative">
        <div className="w-full max-w-md flex justify-center">
          <LoadingSpinner text="Verifying authentication" variant="ai" size="large" />
        </div>
        
        <AnimatePresence>
          {loadingTimeout && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="fixed bottom-10 left-1/2 transform -translate-x-1/2 p-6 bg-gray-800/90 backdrop-blur-sm rounded-xl max-w-md w-11/12 border border-gray-700/50 shadow-xl"
            >
              <p className="text-sm text-gray-300 mb-4">
                Loading is taking longer than usual. There might be a connection problem 
                with the server or Firebase. Try refreshing the page.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
                className="mt-2 w-full"
              >
                Refresh page
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <ErrorProvider value={{ handleError }}>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        {/* Page loading indicator */}
        {pageLoading && <LoadingSpinner variant="minimal" size="medium" />}
        
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-4 bg-red-900/20 border-l-4 border-red-500 rounded-md"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className="text-sm text-red-300">{errorMessage}</p>
                  </div>
                  <button 
                    onClick={() => setErrorMessage(null)} 
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {children}
        </main>
        
        {/* Interactive tutorial for new users */}
        <AppTutorial />
      </div>
    </ErrorProvider>
  );
}
