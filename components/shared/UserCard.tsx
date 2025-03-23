"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { FaCrown, FaFire, FaTrophy } from "react-icons/fa";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { BadgeType, getLevelInfo } from "@/lib/gamification";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

interface UserCardProps {
  className?: string;
}

const UserCard = ({ className = "" }: UserCardProps) => {
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();
  const [fullName, setFullName] = useState("");
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);

  // Get user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFullName(userData.fullName || userData.name || "User");
          setUserLevel(userData.level || 1);
          setUserPoints(userData.points || 0);
          setStreakCount(userData.loginStreak || 0);
          setBadges(userData.badges || []);
          
          
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Calculate progress to next level (0-100%)
  const calculateLevelProgress = () => {
    // Assume each level requires (current level × 100) points
    const pointsForNextLevel = userLevel * 100;
    const currentLevelPoints = (userLevel - 1) * 100;
    const pointsInCurrentLevel = userPoints - currentLevelPoints;
    const progress = Math.min(Math.floor((pointsInCurrentLevel / pointsForNextLevel) * 100), 100);
    return progress;
  };

  // Get the highest tier (most prestigious) badge
  const getHighestTierBadge = () => {
    if (!badges || badges.length === 0) return null;
    
    const tierOrder = ['platinum', 'gold', 'silver', 'bronze'];
    
    // Sort badges by tier importance
    const sortedBadges = [...badges].sort((a, b) => {
      return tierOrder.indexOf(a.level) - tierOrder.indexOf(b.level);
    });
    
    return sortedBadges[0];
  };

  const highestBadge = getHighestTierBadge();
  const levelInfo = getLevelInfo(userLevel);
  const levelProgress = calculateLevelProgress();

  if (loading) {
    return (
      <Card className={`w-full bg-gray-900 text-gray-100 ${className}`}>
        <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full bg-gray-900 text-gray-100 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-1">
          <CardTitle className="text-xl">User Profile</CardTitle>
          {isPremium && (
            <TooltipProvider>
              <Tooltip content="Premium Member">
                <div>
                  <FaCrown className="text-yellow-400 text-lg" />
                </div>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <CardDescription className="text-gray-400">
          Your learning progress and achievements
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-lg font-semibold mb-1">{fullName}</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <TooltipProvider>
              <Tooltip content={`Level ${userLevel}: ${levelInfo?.title || ''}`}>
                <Badge className="bg-purple-600 hover:bg-purple-700 text-white">
                  Lvl {userLevel}
                </Badge>
              </Tooltip>
            </TooltipProvider>
            
            {streakCount > 0 && (
              <TooltipProvider>
                <Tooltip content={`${streakCount} day streak`}>
                  <Badge className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1">
                    <FaFire className="text-yellow-300" />
                    {streakCount}
                  </Badge>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {highestBadge && (
              <TooltipProvider>
                <Tooltip content={`${highestBadge.name}: ${highestBadge.description}`}>
                  <Badge 
                    className={`
                      flex items-center gap-1
                      ${highestBadge.level === 'platinum' ? 'bg-indigo-600 hover:bg-indigo-700' : 
                        highestBadge.level === 'gold' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                        highestBadge.level === 'silver' ? 'bg-gray-500 hover:bg-gray-600' : 
                        'bg-amber-700 hover:bg-amber-800'} text-white
                    `}
                  >
                    <FaTrophy className={`
                      ${highestBadge.level === 'platinum' ? 'text-indigo-300' : 
                        highestBadge.level === 'gold' ? 'text-yellow-300' : 
                        highestBadge.level === 'silver' ? 'text-gray-300' : 
                        'text-amber-300'}
                    `} />
                    {highestBadge.name}
                  </Badge>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="w-full mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Progress to level {userLevel + 1}</span>
              <span className="text-gray-400">{userPoints} points</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full mb-4">
            <div className="bg-gray-800 p-3 rounded-md text-center">
              <div className="text-2xl font-bold text-purple-400">{userPoints}</div>
              <div className="text-xs text-gray-400">Total Points</div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded-md text-center">
              <div className="text-2xl font-bold text-blue-400">{badges.length}</div>
              <div className="text-xs text-gray-400">Badges Earned</div>
            </div>
          </div>
          
          <Link href="/dashboard/profile" passHref>
            <Button 
              variant="outline" 
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              View Full Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;    