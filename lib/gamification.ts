import { db } from "./firebase";
import { doc, updateDoc, getDoc, increment, arrayUnion, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

// Types for the gamification system
export type BadgeType = {
  id: string;
  name: string;
  description: string;
  icon: string; // Name of the icon from the icon library
  category: 'learning' | 'achievement' | 'engagement' | 'special';
  level: 'bronze' | 'silver' | 'gold' | 'platinum'; // Badge level
  dateAwarded?: Timestamp;
  progress?: number; // Current progress (for progressive badges)
  threshold?: number; // Required value for obtaining
};

export type AchievementType = {
  id: string;
  type: string;
  points: number;
  description: string;
  timestamp: Timestamp;
};

export type LevelType = {
  level: number;
  title: string;
  icon: string;
  pointsRequired: number;
  rewards?: string[];
};

// Definition of levels and rewards for each level
export const LEVELS: LevelType[] = [
  { level: 1, title: "Novice", icon: "seedling", pointsRequired: 0 },
  { level: 2, title: "Apprentice", icon: "leaf", pointsRequired: 100, rewards: ["Unblock Bronze Badges"] },
  { level: 3, title: "Student", icon: "tree", pointsRequired: 250, rewards: ["Unlock Advanced Quizzes"] },
  { level: 4, title: "Scholar", icon: "book", pointsRequired: 500, rewards: ["Silver Badges"] },
  { level: 5, title: "Expert", icon: "graduation-cap", pointsRequired: 1000, rewards: ["Exclusive Content Access"] },
  { level: 6, title: "Master", icon: "award", pointsRequired: 2000, rewards: ["Gold Badges"] },
  { level: 7, title: "Guru", icon: "crown", pointsRequired: 3500, rewards: ["Advanced Gamification"] },
  { level: 8, title: "Legend", icon: "star", pointsRequired: 5000, rewards: ["Platinum Badges"] },
  { level: 9, title: "Illuminated", icon: "sun", pointsRequired: 7500, rewards: ["Access to Special Events"] },
  { level: 10, title: "Transcendent", icon: "universe", pointsRequired: 10000, rewards: ["Elite Status"] },
];

// Definition of available badges in the system
export const BADGES: BadgeType[] = [
  // Learning badges
  { id: 'first_lesson', name: 'First Lesson', description: 'Complete the first lesson', icon: 'graduation-cap', category: 'learning', level: 'bronze' },
  { id: 'path_complete', name: 'Path Completed', description: 'Complete the first learning path', icon: 'road', category: 'learning', level: 'bronze' },
  { id: 'five_paths', name: 'Explorer', description: 'Complete 5 learning paths', icon: 'compass', category: 'learning', level: 'silver' },
  { id: 'ten_paths', name: 'Adventurer', description: 'Complete 10 learning paths', icon: 'map', category: 'learning', level: 'gold' },
  { id: 'twenty_paths', name: 'Master Explorer', description: 'Complete 20 learning paths', icon: 'globe', category: 'learning', level: 'platinum' },

  // Achievement badges
  { id: 'first_quiz', name: 'First Quiz', description: 'Complete the first quiz', icon: 'question', category: 'achievement', level: 'bronze' },
  { id: 'five_quizzes', name: 'Quiz Master', description: 'Complete 5 quizzes', icon: 'brain', category: 'achievement', level: 'silver' },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Get a perfect score on a quiz', icon: 'star', category: 'achievement', level: 'gold' },
  { id: 'tutorial_complete', name: 'Getting Started', description: 'Complete the app tutorial', icon: 'lightbulb', category: 'achievement', level: 'bronze' },
  
  // Engagement badges
  { id: 'streak_3', name: 'Streak 3', description: '3 days consecutive activity', icon: 'fire', category: 'engagement', level: 'bronze' },
  { id: 'streak_7', name: 'Streak 7', description: '7 days consecutive activity', icon: 'fire', category: 'engagement', level: 'silver' },
  { id: 'streak_30', name: 'Streak 30', description: '30 days consecutive activity', icon: 'fire', category: 'engagement', level: 'gold' },
  { id: 'streak_100', name: 'Streak 100', description: '100 days consecutive activity', icon: 'meteor', category: 'engagement', level: 'platinum' },
  
  // Special badges
  { id: 'early_adopter', name: 'Early Adopter', description: 'Among the first users of the platform', icon: 'rocket', category: 'special', level: 'gold' },
  { id: 'feedback', name: 'Valuable Feedback', description: 'Contribute to improving the platform', icon: 'comment', category: 'special', level: 'silver' },
];

// Definition of activities that give points
export const POINT_ACTIVITIES = {
  COMPLETE_LESSON: 10,
  COMPLETE_PATH: 50,
  COMPLETE_QUIZ: 15,
  PERFECT_QUIZ: 25,
  DAILY_LOGIN: 5,
  FEEDBACK: 20,
  STREAK_MILESTONE: 30,
  GENERATE_ROADMAP: 15,
  INVITE_FRIEND: 40,
  ADD_FIRST_SKILL: 10,
  TUTORIAL_COMPLETE: 50,
};

/**
 * Add points to the user and check if they advanced in level
 * @param userId User ID
 * @param points Number of points to add
 * @param activityType Type of activity that generated the points
 * @param details Additional details about the activity
 */
export const addPoints = async (
  userId: string, 
  points: number, 
  activityType: string, 
  details: string = ""
): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Reference to the user document
    const userRef = doc(db, "customers", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User does not exist in the database");
      return false;
    }
    
    const userData = userDoc.data();
    const currentPoints = userData.points || 0;
    const currentLevel = userData.level || 1;
    
    // Add points and record activity
    const newPoints = currentPoints + points;
    const achievement: AchievementType = {
      id: `${Date.now()}`,
      type: activityType,
      points: points,
      description: details,
      timestamp: Timestamp.now()
    };
    
    // Check if the user advances in level
    const nextLevel = getNextLevel(currentLevel, newPoints);
    const leveledUp = nextLevel > currentLevel;
    
    // Update user data
    await updateDoc(userRef, {
      points: increment(points),
      level: nextLevel,
      achievements: arrayUnion(achievement),
      lastActivityAt: Timestamp.now()
    });
    
    // If the user has advanced in level, display a notification
    if (leveledUp) {
      const newLevelData = LEVELS.find(l => l.level === nextLevel);
      toast.success(`Congratulations! You've advanced to level ${nextLevel}: ${newLevelData?.title}`, {
        description: newLevelData?.rewards?.join(", "),
        action: {
          label: "View profile",
          onClick: () => window.location.href = "/dashboard/profile"
        }
      });
      
      // Add a notification to the notification system
      await addNotification(userId, {
        title: `New level: ${newLevelData?.title}`,
        message: `You've advanced to level ${nextLevel}! ${newLevelData?.rewards?.length ? 'Rewards: ' + newLevelData.rewards.join(", ") : ''}`,
        type: 'achievement',
        read: false,
        timestamp: Timestamp.now()
      });
    } else {
      // Discreet notification for added points
      toast.success(`+${points} points`, {
        description: details,
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error adding points:", error);
    return false;
  }
};

/**
 * Determine if the user advances in level based on new points
 */
export const getNextLevel = (currentLevel: number, newPoints: number): number => {
  // Find the level corresponding to the score
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (newPoints >= LEVELS[i].pointsRequired) {
      return LEVELS[i].level;
    }
  }
  return 1; // Default level
};

/**
 * Award a badge to the user
 */
export const awardBadge = async (userId: string, badgeId: string): Promise<boolean> => {
  if (!userId || !badgeId) return false;
  
  try {
    // Find the badge in the list of badges
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) {
      console.error(`Badge with ID ${badgeId} does not exist`);
      return false;
    }
    
    // Check if the user already has the badge
    const userRef = doc(db, "customers", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    const userBadges = userData.badges || [];
    
    // Check if the badge already exists
    if (userBadges.some((b: BadgeType) => b.id === badgeId)) {
      return false; // Badge already exists
    }
    
    // Add the badge with award date
    const badgeWithDate = {
      ...badge,
      dateAwarded: Timestamp.now()
    };
    
    await updateDoc(userRef, {
      badges: arrayUnion(badgeWithDate)
    });
    
    // Notification for new badge
    toast.success(`You've received a new badge: ${badge.name}`, {
      description: badge.description,
      action: {
        label: "View profile",
        onClick: () => window.location.href = "/dashboard/profile"
      }
    });
    
    // Add a notification to the notification system
    await addNotification(userId, {
      title: `New badge: ${badge.name}`,
      message: badge.description,
      type: 'badge',
      read: false,
      timestamp: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error awarding badge:", error);
    return false;
  }
};

/**
 * Add a notification to the user's notification system
 */
export type NotificationType = {
  title: string;
  message: string;
  type: 'achievement' | 'badge' | 'level' | 'system' | 'reward';
  read: boolean;
  timestamp: Timestamp;
  actionUrl?: string;
};

export const addNotification = async (userId: string, notification: NotificationType): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const userRef = doc(db, "customers", userId);
    await updateDoc(userRef, {
      notifications: arrayUnion(notification)
    });
    return true;
  } catch (error) {
    console.error("Error adding notification:", error);
    return false;
  }
};

/**
 * Check and award badges based on user activities
 */
export const checkAndAwardBadges = async (userId: string, 
  stats: { 
    completedLessons: number, 
    completedPaths: number, 
    completedQuizzes: number, 
    perfectQuizzes: number,
    loginStreak: number 
  }
): Promise<void> => {
  // Check achievements and award corresponding badges
  
  // Badges for lessons and paths
  if (stats.completedLessons >= 1) {
    await awardBadge(userId, 'first_lesson');
  }
  
  if (stats.completedPaths >= 1) {
    await awardBadge(userId, 'path_complete');
  }
  
  if (stats.completedPaths >= 5) {
    await awardBadge(userId, 'five_paths');
  }
  
  if (stats.completedPaths >= 10) {
    await awardBadge(userId, 'ten_paths');
  }
  
  if (stats.completedPaths >= 20) {
    await awardBadge(userId, 'twenty_paths');
  }
  
  // Badges for quizzes
  if (stats.completedQuizzes >= 1) {
    await awardBadge(userId, 'first_quiz');
  }
  
  if (stats.completedQuizzes >= 5) {
    await awardBadge(userId, 'five_quizzes');
  }
  
  if (stats.perfectQuizzes >= 1) {
    await awardBadge(userId, 'perfect_score');
  }
  
  // Badges for engagement
  if (stats.loginStreak >= 3) {
    await awardBadge(userId, 'streak_3');
  }
  
  if (stats.loginStreak >= 7) {
    await awardBadge(userId, 'streak_7');
  }
  
  if (stats.loginStreak >= 30) {
    await awardBadge(userId, 'streak_30');
  }
  
  if (stats.loginStreak >= 100) {
    await awardBadge(userId, 'streak_100');
  }
};

/**
 * Extract and return level and associated information
 */
export const getLevelInfo = (level: number): LevelType | undefined => {
  return LEVELS.find(l => l.level === level);
};

/**
 * Calculate points needed for the next level
 */
export const getPointsForNextLevel = (currentLevel: number): number => {
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel) + 1;
  
  if (nextLevelIndex >= LEVELS.length) {
    // Already at maximum level
    return 0;
  }
  
  return LEVELS[nextLevelIndex].pointsRequired;
};

/**
 * Check and update the user's daily streak
 */
export const updateDailyStreak = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  
  try {
    const userRef = doc(db, "customers", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return 0;
    
    const userData = userDoc.data();
    const lastActivity = userData.lastActivityAt?.toDate() || new Date(0);
    const currentStreak = userData.loginStreak || 0;
    const lastStreakUpdate = userData.lastStreakUpdate?.toDate() || new Date(0);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastActivityDate = new Date(lastActivity);
    lastActivityDate.setHours(0, 0, 0, 0);
    
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    
    const yesterdayDate = new Date(yesterday);
    yesterdayDate.setHours(0, 0, 0, 0);
    
    const lastStreakUpdateDate = new Date(lastStreakUpdate);
    lastStreakUpdateDate.setHours(0, 0, 0, 0);
    
    let newStreak = currentStreak;
    let shouldUpdateStreak = false;
    let shouldAwardPoints = false;
    
    // Check if the last activity was yesterday or today
    if (lastActivityDate.getTime() === yesterdayDate.getTime()) {
      // Continue the streak
      newStreak += 1;
      shouldUpdateStreak = true;
      shouldAwardPoints = true;
    } else if (lastActivityDate.getTime() === todayDate.getTime()) {
      // Already active today, don't change the streak
      // But check if we already awarded points for streak today
      shouldAwardPoints = lastStreakUpdateDate.getTime() !== todayDate.getTime();
    } else {
      // Reset the streak if more than one day has passed
      if (newStreak !== 1) { // Only if it's not already 1
        newStreak = 1;
        shouldUpdateStreak = true;
        shouldAwardPoints = true;
      }
    }
    
    // Update streak in the database
    await updateDoc(userRef, {
      loginStreak: newStreak,
      lastActivityAt: Timestamp.now(),
      lastStreakUpdate: shouldUpdateStreak ? Timestamp.now() : userData.lastStreakUpdate || Timestamp.now()
    });
    
    // Check streak milestones and award points
    if (shouldAwardPoints && (newStreak === 3 || newStreak === 7 || newStreak === 30 || 
        newStreak === 100 || newStreak % 50 === 0)) {
      await addPoints(
        userId, 
        POINT_ACTIVITIES.STREAK_MILESTONE, 
        'STREAK_MILESTONE', 
        `${newStreak} day consecutive streak`
      );
    }
    
    // Check if this is the first activity of the current day
    if (lastActivityDate.getTime() !== todayDate.getTime()) {
      await addPoints(
        userId,
        POINT_ACTIVITIES.DAILY_LOGIN,
        'DAILY_LOGIN',
        'Daily login'
      );
    }
    
    return newStreak;
  } catch (error) {
    console.error("Error updating streak:", error);
    return 0;
  }
}; 