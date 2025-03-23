"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { 
  FaSeedling, FaLeaf, FaTree, FaBook, 
  FaGraduationCap, FaAward, FaCrown, FaStar, FaSun
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLevelInfo, getPointsForNextLevel, LEVELS } from "@/lib/gamification";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

interface LevelProgressProps {
  level: number;
  points: number;
  compact?: boolean;
}

// Mapping between icon names and React components
const IconMap: Record<string, React.ReactNode> = {
  'seedling': <FaSeedling className="text-green-400" />,
  'leaf': <FaLeaf className="text-green-500" />,
  'tree': <FaTree className="text-green-600" />,
  'book': <FaBook className="text-blue-500" />,
  'graduation-cap': <FaGraduationCap className="text-blue-400" />,
  'award': <FaAward className="text-yellow-500" />,
  'crown': <FaCrown className="text-yellow-400" />,
  'star': <FaStar className="text-yellow-300" />,
  'sun': <FaSun className="text-yellow-300" />,
  'universe': <FaSun className="text-yellow-200" />
};

const LevelProgress: React.FC<LevelProgressProps> = ({ 
  level, 
  points,
  compact = false
}) => {
  const levelInfo = getLevelInfo(level);
  const nextLevelPoints = getPointsForNextLevel(level);
  const currentLevelPoints = levelInfo?.pointsRequired || 0;
  const pointsNeeded = nextLevelPoints - currentLevelPoints;
  const pointsInCurrentLevel = points - currentLevelPoints;
  
  // Calculate progress percentage toward next level
  const progressPercentage = nextLevelPoints === 0 
    ? 100 // If it's the maximum level
    : Math.min(Math.round((pointsInCurrentLevel / pointsNeeded) * 100), 100);
  
  // Get information about the next level
  const nextLevelInfo = level < LEVELS.length ? getLevelInfo(level + 1) : null;
  
  // Return compact version for display in navbar or other restricted spaces
  if (compact) {
    const tooltipContent = (
      <div className="space-y-2 max-w-xs">
        <div className="font-medium text-white">Level {level}: {levelInfo?.title}</div>
        <div className="text-xs text-gray-400">{points} points</div>
        {nextLevelInfo && (
          <div className="text-xs">
            <span className="text-gray-400">Next level: </span>
            <span className="text-white">{nextLevelInfo.title}</span>
            <div className="mt-1">
              <div className="flex justify-between text-[10px] mb-1">
                <span>{pointsInCurrentLevel} / {pointsNeeded}</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1" />
            </div>
          </div>
        )}
      </div>
    );

    const levelBadge = (
      <div className="relative">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full border border-gray-700">
          <span className="text-white text-xs font-bold">{level}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 text-xs">
          {levelInfo?.icon && IconMap[levelInfo.icon]}
        </div>
      </div>
    );

    return (
      <div className="flex items-center space-x-3">
        <Tooltip content={tooltipContent}>
          {levelBadge}
        </Tooltip>
      </div>
    );
  }
  
  // Full version for the profile page
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl mr-2">
              {levelInfo?.icon && IconMap[levelInfo.icon]}
            </span>
            <span>Level {level}: {levelInfo?.title}</span>
          </div>
          <Badge className="bg-purple-800 text-purple-100">
            {points} points
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {nextLevelInfo ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <span className="text-base mr-1.5">
                    {levelInfo?.icon && IconMap[levelInfo.icon]}
                  </span>
                  <span className="text-sm text-gray-300">{levelInfo?.title}</span>
                </div>
                
                <span className="text-gray-500 mx-2">→</span>
                
                <div className="flex items-center">
                  <span className="text-base mr-1.5">
                    {nextLevelInfo.icon && IconMap[nextLevelInfo.icon]}
                  </span>
                  <span className="text-sm text-gray-300">{nextLevelInfo.title}</span>
                </div>
              </div>
              
              <span className="text-sm text-gray-400">
                {pointsInCurrentLevel} / {pointsNeeded}
              </span>
            </div>
            
            <div className="space-y-1">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{points} current points</span>
                <span>{nextLevelPoints} for level {level + 1}</span>
              </div>
            </div>
            
            {nextLevelInfo.rewards && nextLevelInfo.rewards.length > 0 && (
              <div className="mt-3 p-3 bg-purple-900/20 rounded-md border border-purple-900/30">
                <h4 className="text-sm font-medium text-purple-300 mb-1">Rewards at Level {level + 1}:</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  {nextLevelInfo.rewards.map((reward, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1.5 text-purple-400">•</span>
                      {reward}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="text-yellow-400 flex items-center justify-center mb-2">
              <FaCrown className="mr-2" />
              <span className="font-medium">Maximum Level Reached!</span>
            </div>
            <p className="text-sm text-gray-400">Congratulations! You&apos;ve reached the maximum level on the platform.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LevelProgress; 