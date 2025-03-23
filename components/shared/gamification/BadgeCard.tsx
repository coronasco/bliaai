"use client";

import React from "react";
import { FaQuestionCircle } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeType } from "@/lib/gamification";
import { Tooltip } from "@/components/ui/tooltip";
import { 
  FaGraduationCap, FaRoad, FaCompass, FaMap, FaGlobe,
  FaQuestion, FaBrain, FaStar, FaFire, FaMeteor, 
  FaRocket, FaComment, FaSeedling, FaLeaf, FaTree,
  FaBook, FaAward, FaCrown, FaSun
} from "react-icons/fa";
import { Timestamp } from "firebase/firestore";

// Mapping between icon IDs and React components
const IconMap: Record<string, React.ReactNode> = {
  'graduation-cap': <FaGraduationCap />,
  'road': <FaRoad />,
  'compass': <FaCompass />,
  'map': <FaMap />,
  'globe': <FaGlobe />,
  'question': <FaQuestion />,
  'brain': <FaBrain />,
  'star': <FaStar />,
  'fire': <FaFire />,
  'meteor': <FaMeteor />,
  'rocket': <FaRocket />,
  'comment': <FaComment />,
  'seedling': <FaSeedling />,
  'leaf': <FaLeaf />,
  'tree': <FaTree />,
  'book': <FaBook />,
  'award': <FaAward />,
  'crown': <FaCrown />,
  'sun': <FaSun />,
  'universe': <FaSun className="text-yellow-400" />,
  'default': <FaQuestionCircle />
};

// Colors for each badge level
const badgeLevelColors: Record<string, string> = {
  'bronze': 'bg-amber-700 border-amber-500 text-amber-200',
  'silver': 'bg-slate-600 border-slate-400 text-slate-100',
  'gold': 'bg-yellow-600 border-yellow-400 text-yellow-100',
  'platinum': 'bg-indigo-800 border-indigo-400 text-indigo-100'
};

// Colors for each category
const badgeCategoryColors: Record<string, string> = {
  'learning': 'bg-blue-900/40 text-blue-200',
  'achievement': 'bg-green-900/40 text-green-200',
  'engagement': 'bg-purple-900/40 text-purple-200',
  'special': 'bg-red-900/40 text-red-200'
};

interface BadgeCardProps {
  badge: BadgeType;
  locked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  locked = false,
  size = 'md'
}) => {
  // Determine card size based on size prop
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };
  
  const iconSizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl"
  };
  
  const getIcon = (iconName: string) => {
    return IconMap[iconName] || IconMap['default'];
  };
  
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Not unlocked';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const tooltipContent = (
    <div className="space-y-2 max-w-xs">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getIcon(badge.icon)}</span>
        <span className="font-bold text-white">{badge.name}</span>
        <Badge className={badgeCategoryColors[badge.category] || ''}>
          {badge.category}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-300">{badge.description}</p>
      
      {badge.dateAwarded && (
        <p className="text-xs text-gray-400">
          Obtained: {formatDate(badge.dateAwarded)}
        </p>
      )}
      
      {locked && (
        <div className="text-xs font-semibold text-yellow-400 mt-1">
          Still locked
        </div>
      )}
    </div>
  );

  const badgeCard = (
    <Card 
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out
        ${locked ? 'grayscale opacity-40 hover:opacity-50' : 'hover:scale-105 hover:shadow-lg'}
        ${badgeLevelColors[badge.level] || ''}
        border-2
      `}
    >
      <CardContent className="p-0">
        <div className={`
          flex flex-col items-center justify-center p-3
          ${sizeClasses[size]}
        `}>
          <div className={`
            text-center ${iconSizeClasses[size]}
            ${locked ? 'opacity-50' : ''}
          `}>
            {getIcon(badge.icon)}
          </div>
          
          {size !== 'sm' && (
            <div className="mt-2 text-center text-xs font-semibold truncate w-full">
              {badge.name}
            </div>
          )}
          
          {/* Level indicator */}
          <Badge 
            className={`
              absolute top-1 right-1 text-[0.6rem] px-1 py-0 
              uppercase font-semibold
              ${badgeCategoryColors[badge.category] || ''}
            `}
          >
            {badge.level}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Tooltip content={tooltipContent}>
      {badgeCard}
    </Tooltip>
  );
};

export default BadgeCard; 