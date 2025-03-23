import { db } from "./firebase";
import { doc, updateDoc, getDoc, increment, arrayUnion, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

// Tipuri pentru sistemul de gamification
export type BadgeType = {
  id: string;
  name: string;
  description: string;
  icon: string; // Numele iconiței din biblioteca de icoane
  category: 'learning' | 'achievement' | 'engagement' | 'special';
  level: 'bronze' | 'silver' | 'gold' | 'platinum'; // Nivelul badge-ului
  dateAwarded?: Timestamp;
  progress?: number; // Progres actual (pentru badge-uri progresive)
  threshold?: number; // Valoarea necesară pentru obținere
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

// Definirea nivelelor și a recompenselor pentru fiecare nivel
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

// Definirea badge-urilor disponibile în sistem
export const BADGES: BadgeType[] = [
  // Badge-uri pentru învățare
  { id: 'first_lesson', name: 'First Lesson', description: 'Complete the first lesson', icon: 'graduation-cap', category: 'learning', level: 'bronze' },
  { id: 'path_complete', name: 'Path Completed', description: 'Complete the first learning path', icon: 'road', category: 'learning', level: 'bronze' },
  { id: 'five_paths', name: 'Explorer', description: 'Complete 5 learning paths', icon: 'compass', category: 'learning', level: 'silver' },
  { id: 'ten_paths', name: 'Adventurer', description: 'Complete 10 learning paths', icon: 'map', category: 'learning', level: 'gold' },
  { id: 'twenty_paths', name: 'Master Explorer', description: 'Complete 20 learning paths', icon: 'globe', category: 'learning', level: 'platinum' },

  // Badge-uri pentru realizări
  { id: 'first_quiz', name: 'First Quiz', description: 'Complete the first quiz', icon: 'question', category: 'achievement', level: 'bronze' },
  { id: 'five_quizzes', name: 'Quiz Master', description: 'Complete 5 quizzes', icon: 'brain', category: 'achievement', level: 'silver' },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Get a perfect score on a quiz', icon: 'star', category: 'achievement', level: 'gold' },
  { id: 'tutorial_complete', name: 'Getting Started', description: 'Complete the app tutorial', icon: 'lightbulb', category: 'achievement', level: 'bronze' },
  
  // Badge-uri pentru implicare
  { id: 'streak_3', name: 'Streak 3', description: '3 days consecutive activity', icon: 'fire', category: 'engagement', level: 'bronze' },
  { id: 'streak_7', name: 'Streak 7', description: '7 days consecutive activity', icon: 'fire', category: 'engagement', level: 'silver' },
  { id: 'streak_30', name: 'Streak 30', description: '30 days consecutive activity', icon: 'fire', category: 'engagement', level: 'gold' },
  { id: 'streak_100', name: 'Streak 100', description: '100 days consecutive activity', icon: 'meteor', category: 'engagement', level: 'platinum' },
  
  // Badge-uri speciale
  { id: 'early_adopter', name: 'Early Adopter', description: 'Among the first users of the platform', icon: 'rocket', category: 'special', level: 'gold' },
  { id: 'feedback', name: 'Valuable Feedback', description: 'Contribute to improving the platform', icon: 'comment', category: 'special', level: 'silver' },
];

// Definirea activităților care oferă puncte
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
 * Adaugă puncte utilizatorului și verifică dacă a avansat în nivel
 * @param userId ID-ul utilizatorului
 * @param points Numărul de puncte de adăugat
 * @param activityType Tipul activității care a generat punctele
 * @param details Detalii suplimentare despre activitate
 */
export const addPoints = async (
  userId: string, 
  points: number, 
  activityType: string, 
  details: string = ""
): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Referință către documentul utilizatorului
    const userRef = doc(db, "customers", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("Utilizatorul nu există în baza de date");
      return false;
    }
    
    const userData = userDoc.data();
    const currentPoints = userData.points || 0;
    const currentLevel = userData.level || 1;
    
    // Adaugă punctele și înregistrează activitatea
    const newPoints = currentPoints + points;
    const achievement: AchievementType = {
      id: `${Date.now()}`,
      type: activityType,
      points: points,
      description: details,
      timestamp: Timestamp.now()
    };
    
    // Verifică dacă utilizatorul avansează în nivel
    const nextLevel = getNextLevel(currentLevel, newPoints);
    const leveledUp = nextLevel > currentLevel;
    
    // Actualizează datele utilizatorului
    await updateDoc(userRef, {
      points: increment(points),
      level: nextLevel,
      achievements: arrayUnion(achievement),
      lastActivityAt: Timestamp.now()
    });
    
    // Dacă utilizatorul a avansat în nivel, afișează o notificare
    if (leveledUp) {
      const newLevelData = LEVELS.find(l => l.level === nextLevel);
      toast.success(`Felicitări! Ai avansat la nivelul ${nextLevel}: ${newLevelData?.title}`, {
        description: newLevelData?.rewards?.join(", "),
        action: {
          label: "Vezi profilul",
          onClick: () => window.location.href = "/dashboard/profile"
        }
      });
      
      // Adaugă o notificare în sistemul de notificări
      await addNotification(userId, {
        title: `Nivel nou: ${newLevelData?.title}`,
        message: `Ai avansat la nivelul ${nextLevel}! ${newLevelData?.rewards?.length ? 'Recompense: ' + newLevelData.rewards.join(", ") : ''}`,
        type: 'achievement',
        read: false,
        timestamp: Timestamp.now()
      });
    } else {
      // Notificare discretă pentru punctele adăugate
      toast.success(`+${points} puncte`, {
        description: details,
      });
    }
    
    return true;
  } catch (error) {
    console.error("Eroare la adăugarea punctelor:", error);
    return false;
  }
};

/**
 * Determină dacă utilizatorul avansează în nivel bazat pe punctele noi
 */
export const getNextLevel = (currentLevel: number, newPoints: number): number => {
  // Găsește nivelul corespunzător punctajului
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (newPoints >= LEVELS[i].pointsRequired) {
      return LEVELS[i].level;
    }
  }
  return 1; // Nivel implicit
};

/**
 * Acordă un badge utilizatorului
 */
export const awardBadge = async (userId: string, badgeId: string): Promise<boolean> => {
  if (!userId || !badgeId) return false;
  
  try {
    // Găsește badge-ul în lista de badge-uri
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) {
      console.error(`Badge-ul cu ID-ul ${badgeId} nu există`);
      return false;
    }
    
    // Verifică dacă utilizatorul are deja badge-ul
    const userRef = doc(db, "customers", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    const userBadges = userData.badges || [];
    
    // Verifică dacă badge-ul există deja
    if (userBadges.some((b: BadgeType) => b.id === badgeId)) {
      return false; // Badge-ul există deja
    }
    
    // Adaugă badge-ul cu data acordării
    const badgeWithDate = {
      ...badge,
      dateAwarded: Timestamp.now()
    };
    
    await updateDoc(userRef, {
      badges: arrayUnion(badgeWithDate)
    });
    
    // Notificare pentru badge nou
    toast.success(`Ai primit un nou badge: ${badge.name}`, {
      description: badge.description,
      action: {
        label: "Vezi profilul",
        onClick: () => window.location.href = "/dashboard/profile"
      }
    });
    
    // Adaugă o notificare în sistemul de notificări
    await addNotification(userId, {
      title: `Badge nou: ${badge.name}`,
      message: badge.description,
      type: 'badge',
      read: false,
      timestamp: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Eroare la acordarea badge-ului:", error);
    return false;
  }
};

/**
 * Adaugă o notificare în sistemul de notificări al utilizatorului
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
    console.error("Eroare la adăugarea notificării:", error);
    return false;
  }
};

/**
 * Verifică și acordă badge-uri bazate pe activitățile utilizatorului
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
  // Verifică realizările și acordă badge-uri corespunzătoare
  
  // Badge-uri pentru lecții și trasee
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
  
  // Badge-uri pentru quiz-uri
  if (stats.completedQuizzes >= 1) {
    await awardBadge(userId, 'first_quiz');
  }
  
  if (stats.completedQuizzes >= 5) {
    await awardBadge(userId, 'five_quizzes');
  }
  
  if (stats.perfectQuizzes >= 1) {
    await awardBadge(userId, 'perfect_score');
  }
  
  // Badge-uri pentru engagement
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
 * Extrage și returnează nivelul și informațiile asociate
 */
export const getLevelInfo = (level: number): LevelType | undefined => {
  return LEVELS.find(l => l.level === level);
};

/**
 * Calculează punctele necesare pentru nivelul următor
 */
export const getPointsForNextLevel = (currentLevel: number): number => {
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel) + 1;
  
  if (nextLevelIndex >= LEVELS.length) {
    // Deja la nivel maxim
    return 0;
  }
  
  return LEVELS[nextLevelIndex].pointsRequired;
};

/**
 * Verifică și actualizează streak-ul zilnic al utilizatorului
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
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastActivityDate = new Date(lastActivity);
    lastActivityDate.setHours(0, 0, 0, 0);
    
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    
    const yesterdayDate = new Date(yesterday);
    yesterdayDate.setHours(0, 0, 0, 0);
    
    let newStreak = currentStreak;
    
    // Verifică dacă ultima activitate a fost ieri sau astăzi
    if (lastActivityDate.getTime() === yesterdayDate.getTime()) {
      // Continuă streak-ul
      newStreak += 1;
    } else if (lastActivityDate.getTime() === todayDate.getTime()) {
      // Deja activ astăzi, nu schimba streak-ul
    } else {
      // Resetează streak-ul dacă a trecut mai mult de o zi
      newStreak = 1;
    }
    
    // Actualizează streak-ul în baza de date
    await updateDoc(userRef, {
      loginStreak: newStreak,
      lastActivityAt: Timestamp.now()
    });
    
    // Verifică milestone-uri de streak și acordă puncte
    if (newStreak === 3 || newStreak === 7 || newStreak === 30 || 
        newStreak === 100 || newStreak % 50 === 0) {
      await addPoints(
        userId, 
        POINT_ACTIVITIES.STREAK_MILESTONE, 
        'STREAK_MILESTONE', 
        `Streak de ${newStreak} zile consecutive`
      );
    }
    
    // Verifică dacă e prima activitate din ziua curentă
    if (lastActivityDate.getTime() !== todayDate.getTime()) {
      await addPoints(
        userId,
        POINT_ACTIVITIES.DAILY_LOGIN,
        'DAILY_LOGIN',
        'Login zilnic'
      );
    }
    
    return newStreak;
  } catch (error) {
    console.error("Eroare la actualizarea streak-ului:", error);
    return 0;
  }
}; 