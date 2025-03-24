"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { FaCrown, FaCheck, FaTimes, FaArrowRight, FaGem, FaShieldAlt, FaRocket, FaAward, FaBolt } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Function to redirect to checkout session
  const handleCheckout = async (plan: 'monthly' | 'yearly' = selectedPlan) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      setIsLoading({ [plan]: true });
      
      // Inversăm ID-urile de preț - asociem YEARLY_PRICE_ID cu planul anual și MONTHLY_PRICE_ID cu planul lunar
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
    <div className="container mx-auto py-12 px-4 md:px-8 max-w-6xl">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl mb-16 p-8 md:p-12 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/40 border border-gray-800">
        <div className="absolute inset-0 bg-[url('/images/mesh-pattern.png')] opacity-5"></div>
        <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
          <div className="w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 transform -translate-x-1/3 translate-y-1/3">
          <div className="w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-block mb-4 p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full">
            <FaCrown className="h-8 w-8 text-yellow-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400">
            Upgrade to Premium
          </h1>
          <p className="text-lg text-gray-300 mx-auto max-w-2xl mb-6">
            Unlock advanced AI-powered career roadmaps, personalized recommendations, and exclusive features to accelerate your professional development.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500/30">
              <div className="flex items-center gap-2">
                <FaRocket className="text-purple-400 h-4 w-4" />
                <span className="text-white">Multiple Roadmaps</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-500/30">
              <div className="flex items-center gap-2">
                <FaBolt className="text-blue-400 h-4 w-4" />
                <span className="text-white">AI-Powered Features</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-500/30">
              <div className="flex items-center gap-2">
                <FaAward className="text-amber-400 h-4 w-4" />
                <span className="text-white">Exclusive Badges</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Choose Your Premium Plan</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Select the plan that best fits your needs. Both plans include all premium features.
          </p>
        </div>

        {/* Pricing Tabs */}
        <Tabs defaultValue="yearly" className="w-full" onValueChange={(value) => setSelectedPlan(value as 'monthly' | 'yearly')}>
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-800/50 p-1">
              <TabsTrigger 
                value="monthly" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                Monthly
              </TabsTrigger>
              <TabsTrigger 
                value="yearly" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                Yearly 
                <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-300 border-yellow-500/30">Save 17%</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Monthly Plan Tab */}
          <TabsContent value="monthly" className="w-full">
            <div className="relative">
              <Card className="bg-gray-900 border-gray-700 shadow-xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-purple-500/5">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <CardTitle className="text-2xl text-white">Premium Monthly</CardTitle>
                      <CardDescription className="text-gray-400">Flexible payment, full features</CardDescription>
                    </div>
                    <div className="bg-gradient-to-r from-purple-900/70 to-indigo-900/70 backdrop-blur-sm rounded-lg px-5 py-2 border border-purple-700/40">
                      <p className="text-sm text-gray-300 mb-1">Monthly payment</p>
                      <p className="text-2xl font-bold text-white">$9.99 <span className="text-sm font-normal text-gray-400">/month</span></p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center">
                        <FaGem className="mr-2 text-purple-400" /> What&apos;s included:
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Create up to 4 career roadmaps</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Generate personalized roadmaps with AI</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Generate details for each subtask</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Skill assessments and recommendations</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center">
                        <FaShieldAlt className="mr-2 text-blue-400" /> Premium benefits:
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Exclusive premium badges</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Detailed analytics and insights</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Flexible monthly payments</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Cancel anytime</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleCheckout('monthly')} 
                    disabled={isLoading['monthly']} 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isLoading['monthly'] ? 'Processing...' : 'Subscribe Monthly'}
                    {!isLoading['monthly'] && <FaArrowRight className="ml-2" />}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Yearly Plan Tab */}
          <TabsContent value="yearly" className="w-full">
            <div className="relative">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white border-0 px-3 py-1">
                  <FaCrown className="mr-2" /> BEST VALUE
                </Badge>
              </div>
              <Card className="bg-gray-900 border-gray-700 shadow-xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-purple-500/5 border-t-yellow-500/50 border-t-2">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <CardTitle className="text-2xl text-white">Premium Yearly</CardTitle>
                      <CardDescription className="text-gray-400">Our most popular option</CardDescription>
                    </div>
                    <div className="bg-gradient-to-r from-amber-900/70 to-yellow-900/70 backdrop-blur-sm rounded-lg px-5 py-2 border border-amber-700/40">
                      <p className="text-sm text-gray-300 mb-1">Annual payment</p>
                      <div>
                        <p className="text-2xl font-bold text-white">$99.90 <span className="text-sm font-normal text-gray-400">/year</span></p>
                        <p className="text-xs text-green-400">Save $19.98 (2 months free)</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center">
                        <FaGem className="mr-2 text-purple-400" /> What&apos;s included:
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Create up to 4 career roadmaps</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Generate personalized roadmaps with AI</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Generate details for each subtask</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Skill assessments and recommendations</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center">
                        <FaShieldAlt className="mr-2 text-blue-400" /> Premium benefits:
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Everything in monthly plan</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Exclusive annual-only badges</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">Priority support</span>
                        </li>
                        <li className="flex items-start">
                          <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-yellow-300 font-medium">Two months free</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleCheckout('yearly')} 
                    disabled={isLoading['yearly']} 
                    className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white"
                  >
                    {isLoading['yearly'] ? 'Processing...' : 'Subscribe Yearly'}
                    {!isLoading['yearly'] && <FaArrowRight className="ml-2" />}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Comparison Table */}
        <div className="mt-20 mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center text-white">Standard vs Premium Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b border-gray-800 text-white">Feature</th>
                  <th className="p-4 border-b border-gray-800 text-gray-400">Standard</th>
                  <th className="p-4 border-b border-gray-800 text-white bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
                    <div className="flex items-center justify-center">
                      <FaCrown className="mr-2 text-yellow-400" /> Premium
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-900/50">
                  <td className="p-4 border-b border-gray-800 text-white">Career Roadmaps</td>
                  <td className="p-4 border-b border-gray-800 text-center text-gray-400">1</td>
                  <td className="p-4 border-b border-gray-800 text-center text-white bg-gradient-to-r from-purple-900/20 to-indigo-900/20">Up to 4</td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-800 text-white">View Public Roadmaps</td>
                  <td className="p-4 border-b border-gray-800 text-center">
                    <FaCheck className="mx-auto text-green-500" />
                  </td>
                  <td className="p-4 border-b border-gray-800 text-center bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
                    <FaCheck className="mx-auto text-green-500" />
                  </td>
                </tr>
                <tr className="bg-gray-900/50">
                  <td className="p-4 border-b border-gray-800 text-white">AI-Generated Roadmaps</td>
                  <td className="p-4 border-b border-gray-800 text-center">
                    <FaTimes className="mx-auto text-red-500" />
                  </td>
                  <td className="p-4 border-b border-gray-800 text-center bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
                    <FaCheck className="mx-auto text-green-500" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-800 text-white">Subtask Details</td>
                  <td className="p-4 border-b border-gray-800 text-center">
                    <FaTimes className="mx-auto text-red-500" />
                  </td>
                  <td className="p-4 border-b border-gray-800 text-center bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
                    <FaCheck className="mx-auto text-green-500" />
                  </td>
                </tr>
                <tr className="bg-gray-900/50">
                  <td className="p-4 border-b border-gray-800 text-white">Progress Tracking</td>
                  <td className="p-4 border-b border-gray-800 text-center text-gray-400">Basic</td>
                  <td className="p-4 border-b border-gray-800 text-center text-white bg-gradient-to-r from-purple-900/20 to-indigo-900/20">Advanced</td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-gray-800 text-white">Premium Badges</td>
                  <td className="p-4 border-b border-gray-800 text-center">
                    <FaTimes className="mx-auto text-red-500" />
                  </td>
                  <td className="p-4 border-b border-gray-800 text-center bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
                    <FaCheck className="mx-auto text-green-500" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Guarantee and Support */}
        <div className="mt-12 text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 rounded-full mb-4">
              <FaShieldAlt className="text-blue-400 h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">100% Satisfaction Guarantee</h3>
            <p className="text-gray-400 max-w-xl">
              All plans include a 7-day money-back guarantee. No questions asked.
            </p>
          </div>
          
          <p className="mt-6 text-gray-400">
            Need help? <a href="mailto:support@blia-ai.com" className="text-purple-400 hover:underline">Contact support</a>
          </p>
        </div>
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading premium options...</p>
        </div>
      </div>
    }>
      <PremiumPageContent />
    </Suspense>
  );
} 