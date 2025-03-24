"use client";

import { ReactNode, useEffect, useState, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PremiumLayoutProps {
  children: ReactNode;
}

// Client component that uses client hooks
function PremiumLayoutClient({ children }: PremiumLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Don't redirect if we're on a success or cancel page
    // and there's a session_id in query parameters
    const isSuccessPage = pathname === "/premium/success";
    const isCancelPage = pathname === "/premium/cancel";
    const sessionId = searchParams.get("session_id");

    const checkAuth = async () => {
      // Wait for authentication check to complete
      if (isLoading) return;

      // If we're on success or cancel page and have a session_id, allow page display
      // regardless of authentication status
      if ((isSuccessPage || isCancelPage) && sessionId) {
        setIsCheckingAuth(false);
        return;
      }

      // If we're not authenticated and not on a special page, redirect to login
      if (!user) {
        router.push("/auth");
        return;
      }

      // Finished authentication check
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [user, isLoading, router, pathname, searchParams]);

  // Show loader while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="bg-gray-900/50 p-8 rounded-xl border border-gray-800 flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-purple-500 border-b-purple-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-gray-300">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-purple-900/10 via-transparent to-blue-900/10 opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-l from-indigo-900/10 via-transparent to-purple-900/10 opacity-40 pointer-events-none"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Main component that wraps PremiumLayoutClient in a Suspense boundary
export default function PremiumLayout({ children }: PremiumLayoutProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="bg-gray-900/50 p-8 rounded-xl border border-gray-800 flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-purple-500 border-b-purple-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-gray-300">Loading...</span>
        </div>
      </div>
    }>
      <PremiumLayoutClient>{children}</PremiumLayoutClient>
    </Suspense>
  );
} 