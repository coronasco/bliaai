"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FaCrown } from "react-icons/fa";

interface PremiumButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PremiumButton({ 
  className = "", 
  variant = "default",
  size = "default" 
}: PremiumButtonProps) {
  const router = useRouter();

  return (
    <Button 
      onClick={() => router.push('/premium')} 
      className={`bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-amber-500 hover:to-yellow-500 ${className}`}
      variant={variant}
      size={size}
    >
      <FaCrown className="mr-2" /> Upgrade to Premium
    </Button>
  );
} 