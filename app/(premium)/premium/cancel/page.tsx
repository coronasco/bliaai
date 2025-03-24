"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

// Client component that uses useRouter
function CancelContent() {
  const router = useRouter();

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="relative">
        {/* Background gradient glow effect */}
        <div className="absolute -z-10 inset-0 opacity-30 blur-3xl">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-r from-red-600/30 via-orange-600/30 to-amber-600/30 rounded-full"></div>
        </div>
        
        <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-red-600/10 to-transparent rounded-full blur-3xl -z-0"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-t from-orange-600/10 to-transparent rounded-full blur-3xl -z-0"></div>
          
          <CardHeader className="text-center relative z-10 border-b border-gray-800 pb-8 pt-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-full flex items-center justify-center mb-4 border border-gray-700">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
              Payment Canceled
            </CardTitle>
            
            <CardDescription className="text-gray-400 mt-2 text-lg">
              The payment process has been canceled
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10 py-8 px-6">
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center">
                <p className="text-white text-lg">You have canceled the payment process. No amount has been withdrawn from your account.</p>
              </div>
              
              <div className="bg-gradient-to-r from-amber-900/20 to-red-900/20 rounded-xl p-5 border border-amber-800/30">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-white font-medium">What happens next?</h3>
                  <p className="text-gray-300 text-sm">
                    You can continue using the standard features of your account. If you change your mind, you can upgrade to Premium at any time.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                <h3 className="text-white font-medium mb-3">Having trouble?</h3>
                <p className="text-gray-300 text-sm">
                  If you encountered problems during the payment process or have questions about our premium features, please contact our support team.
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t border-gray-800 pt-6 pb-8 px-6 flex flex-col sm:flex-row gap-4 relative z-10">
            <Button 
              onClick={() => router.push("/premium")} 
              variant="outline" 
              className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Premium Page
            </Button>
            <Button 
              onClick={() => router.push("/dashboard")} 
              className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Home className="h-4 w-4 mr-2" /> Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Need help? <Link href="mailto:support@blia-ai.com" className="text-purple-400 hover:underline">Contact our support team</Link>
        </p>
      </div>
    </div>
  );
}

// Main component that wraps CancelContent in a Suspense boundary
export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="h-20 w-20 mx-auto border-4 border-t-red-500 border-b-red-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
} 