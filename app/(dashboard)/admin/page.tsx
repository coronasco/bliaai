"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaBug, FaBook, FaUsers, FaCreditCard } from "react-icons/fa";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        console.log("Checking admin status - user:", user?.email);
        
        if (!user || !user.uid) {
          console.log("No authenticated user");
          router.push("/dashboard");
          return;
        }

        // Check role in Firestore
        console.log("Checking Firestore document for user:", user.uid);
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        
        if (!userDoc.exists()) {
          console.log("User document doesn't exist in Firestore");
          router.push("/dashboard");
          return;
        }

        const userData = userDoc.data();
        console.log("User data in Firestore:", userData);
        
        // Check if user has admin role (supports both roles and role)
        const hasAdminRoleInArray = userData.roles?.includes('admin') || false;
        const hasAdminRoleField = userData.role === 'admin';
        const isUserAdmin = hasAdminRoleInArray || hasAdminRoleField;
        
        console.log("Admin check result:", {
          hasAdminRoleInArray,
          hasAdminRoleField,
          isUserAdmin
        });

        if (!isUserAdmin) {
          console.log("User doesn't have admin role");
          router.push("/dashboard");
          return;
        }

        console.log("User confirmed as admin!");
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
    return null; // Shouldn't get here, but for safety
  }

  const adminModules = [
    {
      title: "Knowledge Base",
      description: "Manage documents and articles in the knowledge base.",
      href: "/admin/knowledge",
      icon: <FaBook className="text-2xl text-blue-500" />,
    },
    {
      title: "Users",
      description: "Manage users and their roles.",
      href: "/admin/users",
      icon: <FaUsers className="text-2xl text-green-500" />,
    },
    {
      title: "Subscriptions",
      description: "Manage plans and user subscriptions.",
      href: "/admin/subscriptions",
      icon: <FaCreditCard className="text-2xl text-purple-500" />,
    },
    {
      title: "Feedback",
      description: "Manage feedback and issues reported by users.",
      href: "/admin/feedback",
      icon: <FaBug className="text-2xl text-red-500" />,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Administration</h1>
        <p className="text-muted-foreground">
          Manage all administrative functions of the application.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminModules.map((module) => (
          <Card key={module.href} className="flex flex-col hover:shadow-lg transition-shadow duration-300 cursor-pointer bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span>{module.icon}</span>
                <CardTitle className="text-white">{module.title}</CardTitle>
              </div>
              <CardDescription className="text-gray-400">{module.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Link href={module.href} className="w-full">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                  Manage
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 