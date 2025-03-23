"use client";

import { ReactNode, useEffect, useState, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PremiumLayoutProps {
  children: ReactNode;
}

// Componenta client care utilizează hooks de client
function PremiumLayoutClient({ children }: PremiumLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Nu redirecționa dacă suntem pe o pagină de succes sau anulare
    // și există un session_id în query parameters
    const isSuccessPage = pathname === "/premium/success";
    const isCancelPage = pathname === "/premium/cancel";
    const sessionId = searchParams.get("session_id");

    const checkAuth = async () => {
      // Așteptăm finalizarea verificării autentificării
      if (isLoading) return;

      // Dacă suntem pe success sau cancel și avem un session_id, permitem afișarea paginii
      // indiferent de statusul autentificării
      if ((isSuccessPage || isCancelPage) && sessionId) {
        setIsCheckingAuth(false);
        return;
      }

      // Dacă nu suntem autentificați și nu suntem pe o pagină specială, redirecționăm către login
      if (!user) {
        router.push("/auth");
        return;
      }

      // Am terminat verificarea autentificării
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [user, isLoading, router, pathname, searchParams]);

  // Arătăm un loader în timp ce verificăm autentificarea
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Se verifică sesiunea...</span>
      </div>
    );
  }

  return <>{children}</>;
}

// Componenta principală care încadrează PremiumLayoutClient într-un boundary Suspense
export default function PremiumLayout({ children }: PremiumLayoutProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Se încarcă...</span>
      </div>
    }>
      <PremiumLayoutClient>{children}</PremiumLayoutClient>
    </Suspense>
  );
} 