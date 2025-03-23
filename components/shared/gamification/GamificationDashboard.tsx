"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { updateDailyStreak, BadgeType, AchievementType, checkAndAwardBadges, BADGES } from "@/lib/gamification";
import LevelProgress from "./LevelProgress";
import BadgeCard from "./BadgeCard";

type GamificationData = {
  level: number;
  points: number;
  badges: BadgeType[];
  achievements: AchievementType[];
  loginStreak: number;
  lastActivityAt?: Timestamp;
  completedPaths: number;
  completedLessons: number;
  completedQuizzes: number;
  perfectQuizzes: number;
};

const GamificationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gamificationData, setGamificationData] = useState<GamificationData>({
    level: 1,
    points: 0,
    badges: [],
    achievements: [],
    loginStreak: 0,
    completedPaths: 0,
    completedLessons: 0,
    completedQuizzes: 0,
    perfectQuizzes: 0
  });
  
  // Group badges by categories
  const categorizedBadges = {
    learning: BADGES.filter(badge => badge.category === 'learning'),
    achievement: BADGES.filter(badge => badge.category === 'achievement'),
    engagement: BADGES.filter(badge => badge.category === 'engagement'),
    special: BADGES.filter(badge => badge.category === 'special')
  };
  
  // Check if user has the badge with specified ID
  const hasBadge = (badgeId: string): boolean => {
    return gamificationData.badges?.some(badge => badge.id === badgeId) || false;
  };
  
  // Sort achievements in reverse chronological order
  const sortedAchievements = [...(gamificationData.achievements || [])].sort((a, b) => {
    return b.timestamp.seconds - a.timestamp.seconds;
  });
  
  // Function for date formatting
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp.seconds * 1000);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Load gamification data
  useEffect(() => {
    const loadGamificationData = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        
        // Update daily streak when page loads
        await updateDailyStreak(user.uid);
        
        // Get updated user data
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Build gamification data object
          const gamificationStats = {
            level: userData.level || 1,
            points: userData.points || 0,
            badges: userData.badges || [],
            achievements: userData.achievements || [],
            loginStreak: userData.loginStreak || 0,
            lastActivityAt: userData.lastActivityAt,
            completedPaths: userData.completedPaths?.length || 0,
            completedLessons: userData.completedLessons || 0,
            completedQuizzes: userData.completedQuizzes || 0,
            perfectQuizzes: userData.perfectQuizzes || 0
          };
          
          setGamificationData(gamificationStats);
          
          // Check achievements and award badges if applicable
          await checkAndAwardBadges(user.uid, {
            completedLessons: gamificationStats.completedLessons,
            completedPaths: gamificationStats.completedPaths,
            completedQuizzes: gamificationStats.completedQuizzes,
            perfectQuizzes: gamificationStats.perfectQuizzes,
            loginStreak: gamificationStats.loginStreak
          });
        }
      } catch (error) {
        console.error("Error loading gamification data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadGamificationData();
  }, [user?.uid]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <LevelProgress 
        level={gamificationData.level} 
        points={gamificationData.points} 
      />
      
      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-300">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{gamificationData.loginStreak}</div>
                <div className="text-xs text-gray-400 mt-1">Consecutive Days</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-300">Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {gamificationData.badges?.length || 0} / {BADGES.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">Unlocked</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-300">Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{gamificationData.points}</div>
                <div className="text-xs text-gray-400 mt-1">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for badges and achievements */}
      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid grid-cols-2 bg-gray-800">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="badges">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Badges ({gamificationData.badges?.length || 0} / {BADGES.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Learning badges */}
                <div>
                  <h3 className="text-md font-medium text-blue-400 mb-3">Learning</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {categorizedBadges.learning.map(badge => (
                      <BadgeCard 
                        key={badge.id} 
                        badge={badge} 
                        locked={!hasBadge(badge.id)} 
                      />
                    ))}
                  </div>
                </div>
                
                {/* Achievement badges */}
                <div>
                  <h3 className="text-md font-medium text-green-400 mb-3">Achievements</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {categorizedBadges.achievement.map(badge => (
                      <BadgeCard 
                        key={badge.id} 
                        badge={badge} 
                        locked={!hasBadge(badge.id)} 
                      />
                    ))}
                  </div>
                </div>
                
                {/* Engagement badges */}
                <div>
                  <h3 className="text-md font-medium text-purple-400 mb-3">Engagement</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {categorizedBadges.engagement.map(badge => (
                      <BadgeCard 
                        key={badge.id} 
                        badge={badge} 
                        locked={!hasBadge(badge.id)} 
                      />
                    ))}
                  </div>
                </div>
                
                {/* Special badges */}
                <div>
                  <h3 className="text-md font-medium text-red-400 mb-3">Special</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {categorizedBadges.special.map(badge => (
                      <BadgeCard 
                        key={badge.id} 
                        badge={badge} 
                        locked={!hasBadge(badge.id)} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Achievements History ({sortedAchievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedAchievements.length > 0 ? (
                <div className="space-y-4">
                  {sortedAchievements.map(achievement => (
                    <div 
                      key={achievement.id} 
                      className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="font-medium text-gray-200">
                            {achievement.type}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatDate(achievement.timestamp)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                        <div className="mt-2 text-sm font-medium text-blue-400">+{achievement.points} points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No achievements recorded yet. Start completing activities to earn points!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationDashboard; 