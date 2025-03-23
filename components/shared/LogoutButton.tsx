"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FaSignOutAlt } from "react-icons/fa";

interface LogoutButtonProps {
  onClick?: () => void;
  variant?: "icon" | "text" | "full";
}

export function LogoutButton({ onClick, variant = "icon" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      
      // Call the onClick callback if provided
      if (onClick) {
        onClick();
      }
      
      router.push("/auth");
    } catch (error) {
      console.error("Error logging out", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "full") {
    return (
      <Button 
        variant="outline" 
        onClick={handleLogout}
        disabled={isLoading}
        className="w-full flex items-center text-gray-300 hover:text-red-400 bg-gray-800 hover:bg-gray-700 border-gray-700"
      >
        <FaSignOutAlt className="mr-2" />
        <span>Logout</span>
      </Button>
    );
  }

  if (variant === "text") {
    return (
      <Button 
        variant="ghost" 
        onClick={handleLogout}
        disabled={isLoading}
        className="flex items-center text-gray-300 hover:text-red-400 hover:bg-gray-700"
      >
        <FaSignOutAlt className="mr-2" />
        <span>Logout</span>
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center text-gray-300 hover:text-red-400 hover:bg-gray-700"
    >
      <FaSignOutAlt />
    </Button>
  );
} 