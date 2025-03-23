// components/shared/AuthRedirect.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const AuthRedirect = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If user is authenticated and on auth page, redirect to dashboard
    if (user && (pathname === "/" || pathname.startsWith("/auth"))) {
      router.push("/dashboard");
    }

    // If user is not authenticated and tries to access dashboard, redirect to auth
    if (!user && pathname.startsWith("/dashboard")) {
      router.push("/auth");
    }
  }, [user, router, pathname]);

  return null;
};

export default AuthRedirect;
