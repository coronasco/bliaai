"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaTimesCircle, FaArrowLeft } from "react-icons/fa";

// Componenta client care utilizează useRouter
function CancelContent() {
  const router = useRouter();

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <FaTimesCircle className="text-red-500" size={30} />
            <span>Payment Canceled</span>
          </CardTitle>
          <CardDescription>
            The payment process has been canceled
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="py-6">
            <p className="text-lg">You have canceled the payment process. No amount has been withdrawn from your account.</p>
            <p className="mt-4">
              If you encountered problems during the payment process or have questions, 
              please contact our support team.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button 
            onClick={() => router.push("/premium")} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaArrowLeft /> Back to Premium page
          </Button>
          <Button 
            onClick={() => router.push("/dashboard")} 
            variant="default"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Componenta principală care încadrează CancelContent într-un boundary Suspense
export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
} 