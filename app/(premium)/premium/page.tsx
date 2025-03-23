"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { FaCrown, FaCheck, FaArrowRight } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { getCheckoutSession } from "@/lib/stripe";
import { app } from "@/lib/firebase";
import { toast } from "sonner";

// Define price IDs from environment variables
const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;

// Componenta client care utilizează hooks client
function PremiumPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});

  // Function to redirect to checkout session
  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      setIsLoading({ [plan]: true });
      
      // Corectez inversarea ID-urilor prețurilor - folosim yearly pentru monthly și invers
      const priceId = plan === 'monthly' ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;
      
      if (!priceId) {
        console.error('Price ID not found for plan:', plan);
        toast.error(`Could not find price ID for the ${plan} plan`);
        setIsLoading({ [plan]: false });
        return;
      }

      // Get checkout URL and redirect the user
      const url = await getCheckoutSession(app, priceId);
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('An error occurred while creating the checkout session');
      setIsLoading({ [plan]: false });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Enhance Your Learning Experience</h1>
        <p className="text-lg text-muted-foreground mx-auto max-w-2xl">
          Get access to premium features and advanced AI-generated career paths to accelerate your professional development.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        {/* Monthly Plan */}
        <Card className="border-2 hover:border-primary transition-all">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Monthly</span>
              <Badge className="bg-primary">$9.99/month</Badge>
            </CardTitle>
            <CardDescription>Perfect for short-term goals</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Unlimited career paths</li>
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Advanced skills assessment</li>
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Personalized learning suggestions</li>
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Access to premium badges</li>
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Monthly payment flexibility</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleCheckout('monthly')} 
              disabled={isLoading['monthly']} 
              className="w-full"
            >
              {isLoading['monthly'] ? 'Processing...' : 'Subscribe Monthly'}
              {!isLoading['monthly'] && <FaArrowRight className="ml-2" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Annual Plan */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-lg text-sm">
              Best Value
            </div>
            <CardTitle className="flex items-center justify-between">
              <span>Annual</span>
              <Badge className="bg-primary">$99.99/year</Badge>
            </CardTitle>
            <CardDescription>Save over 16% compared to monthly</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> All monthly features</li>
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Priority skill assessments</li>
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Exclusive annual member badges</li>
              <li className="flex items-center"><FaCheck className="text-green-500 mr-2" /> Career progress analytics</li>
              <li className="flex items-center"><FaCrown className="text-yellow-500 mr-2" /> <strong>Save over $20 annually</strong></li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleCheckout('yearly')} 
              disabled={isLoading['yearly']} 
              className="w-full"
              variant="default"
            >
              {isLoading['yearly'] ? 'Processing...' : 'Subscribe Annually'}
              {!isLoading['yearly'] && <FaArrowRight className="ml-2" />}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 text-center text-muted-foreground">
        <p>All plans include a 7-day money-back guarantee. No questions asked.</p>
        <p className="mt-2">Need help? <a href="mailto:support@blia-ai.com" className="text-primary hover:underline">Contact support</a></p>
      </div>
    </div>
  );
}

// Componenta principală care încadrează PremiumPageContent într-un boundary Suspense
export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-6xl mx-auto py-8 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă opțiunile premium...</p>
        </div>
      </div>
    }>
      <PremiumPageContent />
    </Suspense>
  );
} 