"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        if (!user || !user.uid) {
          console.log("Admin Layout - No authenticated user");
          router.push("/dashboard");
          return;
        }

        // Check role in Firestore
        console.log("Admin Layout - Checking document for user:", user.uid);
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        
        if (!userDoc.exists()) {
          console.log("Admin Layout - User document doesn't exist");
          router.push("/dashboard");
          return;
        }

        const userData = userDoc.data();
        
        // Check if user has admin role (supports both roles and role)
        const hasAdminRoleInArray = userData.roles?.includes('admin') || false;
        const hasAdminRoleField = userData.role === 'admin';
        const isUserAdmin = hasAdminRoleInArray || hasAdminRoleField;
        
        console.log("Admin Layout - Admin check result:", {
          hasAdminRoleInArray,
          hasAdminRoleField,
          isUserAdmin
        });

        if (!isUserAdmin) {
          console.log("Admin Layout - User doesn't have admin role");
          router.push("/dashboard");
          return;
        }

        console.log("Admin Layout - User confirmed as admin!");
        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin role:", error);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // This will cause a redirect in the useEffect or show nothing
  }

  return <>{children}</>;
} 