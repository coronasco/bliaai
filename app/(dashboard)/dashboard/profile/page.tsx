"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, Calendar, Save, X, User, CreditCard, Settings, KeyRound, Eye, EyeOff } from "lucide-react";
import { FaCrown, FaTrophy, FaRegBell, FaLock, FaRegEnvelope, FaMobileAlt } from "react-icons/fa";
import { format } from "date-fns";
import { doc, getDoc, updateDoc, collection, getFirestore, onSnapshot } from "firebase/firestore";
import { db, app } from "@/lib/firebase";
import { toast } from "sonner";
import { getPortalUrl, cancelSubscription } from "@/lib/stripe";
import GamificationDashboard from "@/components/shared/gamification/GamificationDashboard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

// Temporary dialog while waiting for shadcn component
import { 
  Dialog as AlertDialog,
  DialogTrigger as AlertDialogTrigger,
  DialogContent as AlertDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogFooter as AlertDialogFooter,
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
} from "@/components/ui/dialog";

// Import Dialog components for password change
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Temporary components for AlertDialogAction and AlertDialogCancel
const AlertDialogAction = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => (
  <Button className={`${className}`} {...props} />
);

const AlertDialogCancel = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button variant="outline" {...props} />
);

// Extended User type with subscription properties
type UserWithSubscription = {
  uid: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionPlanType?: string;
  subscriptionCurrentPeriodEnd?: Date;
  [key: string]: string | number | boolean | Date | object | undefined;
};

// Type for subscription data from Firestore
interface SubscriptionItem {
  price?: {
    recurring?: {
      interval?: string;
    };
  };
}

interface FirestoreTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

interface SubscriptionData {
  id: string;
  status?: string;
  current_period_end?: FirestoreTimestamp | Date;
  cancel_at_period_end?: boolean;
  items?: SubscriptionItem[];
  [key: string]: string | number | boolean | FirestoreTimestamp | Date | SubscriptionItem[] | undefined;
}

interface UserProfileData {
  fullName: string;
  email: string;
  level: number;
  points: number;
  createdAt?: FirestoreTimestamp | Date;
  photo?: string;
  role?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [profileData, setProfileData] = useState<UserProfileData>({
    fullName: "",
    email: "",
    level: 1,
    points: 0,
    notificationPreferences: {
      email: true,
      push: true,
      marketing: false
    }
  });
  const [isCanceling, setIsCanceling] = useState(false);
  const [isSubscriptionCanceled, setIsSubscriptionCanceled] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize userData with user properties
  const userData = user as unknown as UserWithSubscription;

  // Check if subscription is canceled (cancel_at_period_end)
  useEffect(() => {
    if (subscriptionData?.cancel_at_period_end) {
      setIsSubscriptionCanceled(true);
    } else {
      setIsSubscriptionCanceled(false);
    }
  }, [subscriptionData]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfileData;
          setProfileData({
            fullName: data.fullName || data.fullName || user.displayName || "",
            email: data.email || user.email || "",
            level: data.level || 1,
            points: data.points || 0,
            createdAt: data.createdAt,
            photo: user.photoURL || undefined,
            role: data.role || "standard",
            notificationPreferences: data.notificationPreferences || {
              email: true,
              push: true, 
              marketing: false
            }
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError("Failed to load profile data. Please refresh and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Load subscription data directly from Firestore
  useEffect(() => {
    if (!userData?.uid) return;

    const db = getFirestore(app);
    const unsubscribe = onSnapshot(
      collection(db, 'customers', userData.uid, 'subscriptions'),
      (snapshot) => {
        // Find active subscription
        const activeSubscription = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionData))
          .find(sub => sub.status === 'active' || sub.status === 'trialing');
        
        if (activeSubscription) {
          setSubscriptionData(activeSubscription);
        }
      },
      (error) => {
        console.error("Error fetching subscription data:", error);
      }
    );

    return () => unsubscribe();
  }, [userData?.uid]);

  // Function to manage subscription via Stripe portal
  // const handleManageSubscription = async () => {
  //   if (!userData?.uid) return;

  //   setIsLoading(true);
  //   setError(null);
  //   setSuccess(null);
    
  //   try {
  //     const result = await getPortalUrl(app);
  //     // Redirecționăm către portalul Stripe
  //     if ('url' in result) {
  //       window.location.href = result.url;
  //     }
  //   } catch (error) {
  //     console.error("Error opening Stripe portal:", error);
  //     const errorMessage = error instanceof Error 
  //       ? error.message 
  //       : "An error occurred while accessing the subscription management portal.";
      
  //     setError(`Failed to access subscription portal: ${errorMessage}. Please try again later.`);
  //     setIsLoading(false);
  //     toast.error("Failed to access subscription portal");
  //   }
  // };

  // Function to cancel subscription
  const handleCancelSubscription = async () => {
    if (!userData?.uid) return;

    setIsCanceling(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await cancelSubscription(app);
      if ('url' in result) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An error occurred while canceling your subscription.";
      
      setError(`Failed to cancel subscription: ${errorMessage}. Please try again later.`);
      toast.error("Failed to cancel subscription");
      setIsCanceling(false);
    }
  };

  // Function to update profile
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await updateDoc(doc(db, "customers", user.uid), {
        fullName: profileData.fullName,
        notificationPreferences: profileData.notificationPreferences
      });
      
      setSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to format date
  const formatDate = (timestamp: FirestoreTimestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    // Convert Firestore timestamp to Date
    const date = timestamp && 'toDate' in timestamp ? timestamp.toDate() : timestamp as Date;
    return format(date, "MMMM dd, yyyy");
  };

  // Calculate progress to next level
  const progressToNextLevel = profileData.points % 100;

  const handleDeleteSubscription = async () => {
    const portalUrl = await getPortalUrl(app);
    if (portalUrl.url) {
      router.push(portalUrl.url);
    }
  }

  // Add this new function for handling password changes
  const handleChangePassword = async () => {
    // Reset states
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsChangingPassword(true);
    
    try {
      // Validation
      if (!currentPassword) {
        throw new Error("Current password is required");
      }
      
      if (!newPassword) {
        throw new Error("New password is required");
      }
      
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long");
      }
      
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }
      
      if (currentPassword === newPassword) {
        throw new Error("New password must be different from current password");
      }
      
      if (!user) {
        throw new Error("You must be logged in to change your password");
      }
      
      if (!user.email) {
        throw new Error("Your account doesn't have an email associated with it");
      }
      
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update the password
      await updatePassword(user, newPassword);
      
      // Success
      setPasswordSuccess("Your password has been updated successfully!");
      
      // Clear the form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Close the dialog after a delay
      setTimeout(() => {
        setIsPasswordDialogOpen(false);
        setPasswordSuccess(null);
      }, 2000);
      
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      
      // Handle specific Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        // This is a Firebase error with a code property
        const firebaseError = error as { code: string; message?: string };
        
        if (firebaseError.code === "auth/wrong-password") {
          setPasswordError("The current password you entered is incorrect");
        } else if (firebaseError.code === "auth/too-many-requests") {
          setPasswordError("Too many unsuccessful attempts. Please try again later");
        } else if (firebaseError.code === "auth/requires-recent-login") {
          setPasswordError("This operation requires a recent login. Please sign out and sign in again before retrying");
        } else {
          setPasswordError(firebaseError.message || "An error occurred. Please try again");
        }
      } else {
        // Handle generic Error objects
        setPasswordError(error instanceof Error ? error.message : "An error occurred. Please try again");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // If user is not authenticated, redirect
  if (!userData) {
    router.push("/auth");
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Profile Card with Tabs */}
      <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden rounded-xl">
        {/* Hero banner and avatar at the top */}
        <div className="relative">
          {/* Decorative banner background */}
          <div className="h-32 w-full bg-gradient-to-r from-purple-900/90 via-indigo-800/90 to-blue-900/90 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/mesh-pattern.png')] opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-gray-900 to-transparent"></div>
          </div>
          
          {/* Avatar and basic info - positioned to overlap the banner */}
          <div className="absolute -bottom-10 w-full px-8 flex justify-between items-end">
            <div className="flex items-end gap-5">
              <div className="relative">
                <div className="rounded-full p-1 bg-gradient-to-r from-purple-500 to-blue-500 shadow-xl">
                  <Avatar className="h-20 w-20 border-4 border-gray-900">
                    <AvatarImage src={profileData.photo || ""} />
                    <AvatarFallback className="bg-gray-800 text-white text-xl">
                      {profileData.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {isPremium && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full p-1.5 shadow-lg">
                    <FaCrown className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="mb-2 hidden md:block">
                <h2 className="text-2xl font-bold text-white">
                  {profileData.fullName}
                </h2>
                <p className="text-gray-400">{profileData.email}</p>
              </div>
            </div>
            
            <div className="gap-2 mb-2 hidden md:flex">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 py-1.5 px-3">
                <FaTrophy className="mr-1.5 h-3 w-3" /> Level {profileData.level}
              </Badge>
              {isPremium && (
                <Badge className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-300 border-yellow-500/30 py-1.5 px-3">
                  <FaCrown className="mr-1.5 h-3 w-3" /> Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile view name - only shows on small screens */}
        <div className="md:hidden px-6 pt-12 pb-4">
          <h2 className="text-xl font-bold text-white">
            {profileData.fullName}
          </h2>
          <p className="text-gray-400 text-sm">{profileData.email}</p>
          
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 py-1">
              <FaTrophy className="mr-1 h-3 w-3" /> Level {profileData.level}
            </Badge>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-300 border-yellow-500/30 py-1">
                <FaCrown className="mr-1 h-3 w-3" /> Premium
              </Badge>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <Tabs defaultValue="personal" className="w-full mt-6">
          <div className="border-b border-gray-800 px-6">
            <TabsList className="bg-transparent h-14 p-0 gap-2">
              <TabsTrigger 
                value="personal" 
                className="rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-purple-500 text-gray-400 px-4"
              >
                <User className="mr-2 h-4 w-4" /> Personal
              </TabsTrigger>
              <TabsTrigger 
                value="subscription" 
                className="rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-purple-500 text-gray-400 px-4"
              >
                <CreditCard className="mr-2 h-4 w-4" /> Subscription
              </TabsTrigger>
              <TabsTrigger 
                value="preferences" 
                className="rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-purple-500 text-gray-400 px-4"
              >
                <Settings className="mr-2 h-4 w-4" /> Preferences
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="p-6 pt-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Statistics */}
              <div>
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-medium text-white flex items-center mb-5">
                    <FaTrophy className="mr-2 text-purple-400" /> User Progress
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Points */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/80">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Total Points</span>
                        <span className="text-2xl font-bold text-purple-400">{profileData.points}</span>
                      </div>
                      <Progress value={progressToNextLevel} className="h-2" />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Current Level: {profileData.level}</span>
                        <span className="text-xs text-gray-500">
                          {profileData.points} / {(profileData.level * 100) + 100} for next level
                        </span>
                      </div>
                    </div>
                    
                    {/* Activity Overview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/80">
                        <div className="text-sm text-gray-400 mb-1">Member Since</div>
                        <div className="text-white font-medium flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-blue-400" />
                          {profileData.createdAt ? formatDate(profileData.createdAt) : "N/A"}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/80">
                        <div className="text-sm text-gray-400 mb-1">Account Type</div>
                        <div className="text-white font-medium flex items-center">
                          {isPremium ? (
                            <>
                              <FaCrown className="mr-2 h-4 w-4 text-yellow-400" />
                              Premium
                            </>
                          ) : (
                            <>
                              <User className="mr-2 h-4 w-4 text-gray-400" />
                              Standard
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Edit Profile */}
              <div>
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-medium text-white flex items-center mb-5">
                    <User className="mr-2 text-blue-400" /> Edit Profile
                  </h3>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                        placeholder="Your full name"
                        className="bg-gray-700/50 border-gray-600 text-white focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                      <Input 
                        id="email" 
                        value={profileData.email}
                        disabled
                        placeholder="Your email address"
                        className="bg-gray-700/50 border-gray-600 text-gray-400"
                      />
                      <p className="text-xs text-gray-500">
                        Email address cannot be changed as it is linked to your account
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleUpdateProfile} 
                      disabled={isSaving}
                      className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 w-full"
                    >
                      {isSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="p-6 pt-8">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <CreditCard className="mr-2 text-blue-400" /> Subscription Details
                </h3>
                
                {subscriptionData?.status === "active" ? (
                  <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 py-1.5 px-3">
                    <CheckCircle className="mr-1.5 h-3 w-3" /> Active
                  </Badge>
                ) : subscriptionData?.status === "trialing" ? (
                  <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30 py-1.5 px-3">
                    <CheckCircle className="mr-1.5 h-3 w-3" /> Trial
                  </Badge>
                ) : subscriptionData?.cancel_at_period_end ? (
                  <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30 py-1.5 px-3">
                    <AlertCircle className="mr-1.5 h-3 w-3" /> Canceled
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-gray-500/20 to-gray-400/20 text-gray-300 border-gray-500/30 py-1.5 px-3">
                    Standard
                  </Badge>
                )}
              </div>

              {subscriptionData ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Plan Type */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/80">
                      <div className="text-sm text-gray-400 mb-1">Plan Type</div>
                      <div className="text-white font-medium flex items-center">
                        <FaCrown className="mr-2 h-4 w-4 text-yellow-400" />
                        {subscriptionData.items?.[0]?.price?.recurring?.interval === "year" 
                          ? "Premium Yearly" 
                          : "Premium Monthly"}
                      </div>
                    </div>
                    
                    {/* Subscription ID */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/80">
                      <div className="text-sm text-gray-400 mb-1">Subscription ID</div>
                      <div className="text-white font-medium truncate">
                        {subscriptionData.id}
                      </div>
                    </div>
                    
                    {/* Renewal/End Date */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/80">
                      <div className="text-sm text-gray-400 mb-1">
                        {isSubscriptionCanceled ? "End Date" : "Renewal Date"}
                      </div>
                      <div className="text-white font-medium flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-blue-400" />
                        {formatDate(subscriptionData.current_period_end)}
                      </div>
                    </div>
                  </div>
                  
                  {isSubscriptionCanceled && (
                    <div className="p-5 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-800/30 rounded-lg text-yellow-300">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-300 mb-1">Subscription Canceled</h4>
                          <p className="text-sm text-yellow-300/80">
                            Your subscription has been canceled and will end on {formatDate(subscriptionData.current_period_end)}.
                            Until then, you will continue to enjoy all premium features.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-5 bg-gradient-to-r from-red-900/20 to-rose-900/20 border border-red-800/30 rounded-lg text-red-300">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="p-5 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-800/30 rounded-lg text-green-300">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <p className="text-sm">{success}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button 
                      onClick={handleDeleteSubscription} 
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        <><CreditCard className="h-4 w-4 mr-2" /> Manage Subscription</>
                      )}
                    </Button>

                    {!isSubscriptionCanceled && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="border-red-500/30 text-red-400 hover:bg-red-950 hover:text-red-300"
                            disabled={isCanceling}
                          >
                            {isCanceling ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                            ) : (
                              <><X className="h-4 w-4 mr-2" /> Cancel Subscription</>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-gray-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Cancel your subscription?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Your subscription will remain active until the end of the current billing period on{' '}
                              <span className="font-medium text-white">
                                {formatDate(subscriptionData?.current_period_end)}
                              </span>. 
                              After that date, you will no longer be charged, and your account will revert to the standard plan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-700">
                              Keep Subscription
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700 text-white border-0"
                              onClick={handleCancelSubscription}
                            >
                              Yes, Cancel Subscription
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700/80">
                    <div className="flex items-center mb-4">
                      <div className="mr-4 p-3 rounded-full bg-gray-700">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Standard Account</h4>
                        <p className="text-gray-400 text-sm">You don&apos;t have an active premium subscription.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-800/30 rounded-lg">
                    <h4 className="font-medium mb-4 flex items-center text-white">
                      <FaCrown className="text-yellow-500 mr-2" /> Premium Benefits
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="text-green-500 mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="text-gray-300">Unlimited access to AI-generated career paths</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="text-green-500 mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="text-gray-300">Advanced skills assessment and personalized recommendations</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="text-green-500 mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="text-gray-300">Premium badges and exclusive content</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="text-green-500 mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="text-gray-300">Priority support and early access to new features</span>
                      </li>
                    </ul>
                    
                    <Button 
                      className="w-full mt-5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0" 
                      onClick={() => router.push("/premium")}
                    >
                      <FaCrown className="mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="p-6 pt-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Notification Preferences */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-medium text-white flex items-center mb-5">
                  <FaRegBell className="mr-2 text-blue-400" /> Notification Preferences
                </h3>
                
                <div className="space-y-5">
                  <div className="p-4 rounded-lg border border-gray-700 bg-gray-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <FaRegEnvelope className="mr-2 text-purple-400" />
                        <Label htmlFor="email-notifications" className="text-white">Email Notifications</Label>
                      </div>
                      <p className="text-xs text-gray-400">
                        Receive notifications via email about account updates
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={profileData.notificationPreferences?.email} 
                      onCheckedChange={(checked: boolean) => 
                        setProfileData({
                          ...profileData, 
                          notificationPreferences: {
                            ...profileData.notificationPreferences as {email: boolean; push: boolean; marketing: boolean;},
                            email: checked
                          }
                        })
                      }
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                  
                  <div className="p-4 rounded-lg border border-gray-700 bg-gray-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <FaMobileAlt className="mr-2 text-blue-400" />
                        <Label htmlFor="push-notifications" className="text-white">Push Notifications</Label>
                      </div>
                      <p className="text-xs text-gray-400">
                        Receive notifications in the browser about your progress
                      </p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={profileData.notificationPreferences?.push} 
                      onCheckedChange={(checked: boolean) => 
                        setProfileData({
                          ...profileData, 
                          notificationPreferences: {
                            ...profileData.notificationPreferences as {email: boolean; push: boolean; marketing: boolean;},
                            push: checked
                          }
                        })
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                  
                  <div className="p-4 rounded-lg border border-gray-700 bg-gray-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <FaRegEnvelope className="mr-2 text-yellow-400" />
                        <Label htmlFor="marketing-notifications" className="text-white">Marketing Emails</Label>
                      </div>
                      <p className="text-xs text-gray-400">
                        Receive promotional emails and updates about new features
                      </p>
                    </div>
                    <Switch 
                      id="marketing-notifications" 
                      checked={profileData.notificationPreferences?.marketing} 
                      onCheckedChange={(checked: boolean) => 
                        setProfileData({
                          ...profileData, 
                          notificationPreferences: {
                            ...profileData.notificationPreferences as {email: boolean; push: boolean; marketing: boolean;},
                            marketing: checked
                          }
                        })
                      }
                      className="data-[state=checked]:bg-yellow-600"
                    />
                  </div>
                </div>
              </div>
              
              {/* Account Security */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-medium text-white flex items-center mb-5">
                  <FaLock className="mr-2 text-green-400" /> Account Security
                </h3>
                
                <div className="space-y-5">
                  <div className="p-5 rounded-lg border border-gray-700 bg-gray-800">
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 rounded-full bg-green-900/50 flex items-center justify-center mr-3">
                        <FaLock className="text-green-400 h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Password Settings</h4>
                        <p className="text-xs text-gray-400">Change your password or set up 2FA</p>
                      </div>
                    </div>
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          <FaLock className="mr-2 h-3 w-3" /> Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-white">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-white">
                            <KeyRound className="h-5 w-5 text-green-400" /> Change Password
                          </DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Update your password to keep your account secure.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {passwordError && (
                            <div className="p-3 bg-gradient-to-r from-red-900/20 to-rose-900/20 border border-red-800/30 rounded-lg text-red-300 text-sm">
                              <div className="flex gap-2 items-start">
                                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <span>{passwordError}</span>
                              </div>
                            </div>
                          )}
                          
                          {passwordSuccess && (
                            <div className="p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-800/30 rounded-lg text-green-300 text-sm">
                              <div className="flex gap-2 items-start">
                                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{passwordSuccess}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="current-password" className="text-gray-300">Current Password</Label>
                            <div className="relative">
                              <Input 
                                id="current-password" 
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter your current password"
                                className="bg-gray-800 border-gray-700 text-white pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                            <div className="relative">
                              <Input 
                                id="new-password" 
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter your new password"
                                className="bg-gray-800 border-gray-700 text-white pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-gray-300">Confirm New Password</Label>
                            <div className="relative">
                              <Input 
                                id="confirm-password" 
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your new password"
                                className="bg-gray-800 border-gray-700 text-white pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsPasswordDialogOpen(false)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleChangePassword} 
                            disabled={isChangingPassword}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                          >
                            {isChangingPassword ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                            ) : (
                              <><KeyRound className="mr-2 h-4 w-4" /> Update Password</>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="p-5 rounded-lg border border-gray-700 bg-gray-800">
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center mr-3">
                        <User className="text-blue-400 h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Connected Accounts</h4>
                        <p className="text-xs text-gray-400">Manage your linked accounts and services</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      disabled
                    >
                      <User className="mr-2 h-3 w-3" /> Manage Connections
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isSaving}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                >
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Preferences</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Gamification Dashboard Card */}
      <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden rounded-xl">
        <CardHeader className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-gray-800">
          <CardTitle className="text-xl text-white flex items-center pt-6">
            <FaTrophy className="mr-2 text-yellow-400" /> Gamification Dashboard
          </CardTitle>
          <CardDescription className="text-gray-400 pb-6">
            Track your progress, collect badges and level up on your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Suspense fallback={<div className="flex justify-center p-10"><LoadingSpinner size="large" /></div>}>
            <GamificationDashboard />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 