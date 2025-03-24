"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { FaCrown, FaFire, FaTrophy, FaRoad, FaGraduationCap, FaMoneyBillWave, FaBriefcase, FaBookReader, FaGraduationCap as FaGradCap, FaLaptopCode } from "react-icons/fa";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { BadgeType, getLevelInfo } from "@/lib/gamification";
import { Tooltip } from "@/components/ui/tooltip";
import { RoadmapType } from "@/lib/roadmap-utils";

interface UserCardProps {
  className?: string;
}

// Structura pentru titluri de job bazate pe roadmapuri completate
interface JobTitle {
  title: string;
  domain: string;
  minSalary: number;
  maxSalary: number;
  positions: string[];
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Architect';
}

// Pentru domeniul titles, adăugăm și Architect ca posibilă cheie
interface DomainTitleInfo {
  title: string;
  minSalary: number;
  maxSalary: number;
  positions: string[];
}

interface DomainInfo {
  name: string;
  patterns: string[];
  titles: {
    Junior: DomainTitleInfo;
    Mid: DomainTitleInfo;
    Senior: DomainTitleInfo;
    Lead: DomainTitleInfo;
    Architect?: DomainTitleInfo; // Opțional, deoarece nu toate domeniile au acest nivel
  };
}

// Domenii de carieră și pattern-uri de detectare
const CAREER_DOMAINS: DomainInfo[] = [
  {
    name: 'Web Development',
    patterns: ['web', 'frontend', 'backend', 'fullstack', 'react', 'javascript', 'node', 'php', 'html', 'css'],
    titles: {
      Junior: {
        title: 'Junior Web Developer',
        minSalary: 30000,
        maxSalary: 50000,
        positions: ['Junior Frontend Developer', 'Junior Backend Developer', 'Web Developer Intern']
      },
      Mid: {
        title: 'Web Developer',
        minSalary: 50000,
        maxSalary: 80000,
        positions: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer']
      },
      Senior: {
        title: 'Senior Web Developer',
        minSalary: 80000,
        maxSalary: 120000,
        positions: ['Senior Frontend Engineer', 'Senior Backend Engineer', 'Lead Web Developer']
      },
      Lead: {
        title: 'Web Development Team Lead',
        minSalary: 100000,
        maxSalary: 150000,
        positions: ['Web Development Manager', 'Frontend Team Lead', 'Backend Team Lead']
      }
    }
  },
  {
    name: 'Data Science',
    patterns: ['data', 'analytics', 'statistics', 'machine learning', 'ml', 'ai', 'artificial intelligence', 'data science'],
    titles: {
      Junior: {
        title: 'Junior Data Analyst',
        minSalary: 35000,
        maxSalary: 60000,
        positions: ['Data Analyst Trainee', 'Junior Data Scientist', 'Analytics Associate']
      },
      Mid: {
        title: 'Data Scientist',
        minSalary: 60000,
        maxSalary: 95000, 
        positions: ['Data Analyst', 'Machine Learning Engineer', 'Business Intelligence Analyst']
      },
      Senior: {
        title: 'Senior Data Scientist',
        minSalary: 95000,
        maxSalary: 140000,
        positions: ['Principal Data Scientist', 'ML Ops Engineer', 'AI Specialist']
      },
      Lead: {
        title: 'Data Science Team Lead',
        minSalary: 130000,
        maxSalary: 180000,
        positions: ['Head of Data', 'AI Research Lead', 'Chief Data Officer']
      }
    }
  },
  {
    name: 'Mobile Development',
    patterns: ['mobile', 'android', 'ios', 'swift', 'kotlin', 'react native', 'flutter', 'app development'],
    titles: {
      Junior: {
        title: 'Junior Mobile Developer',
        minSalary: 35000,
        maxSalary: 55000,
        positions: ['iOS Developer Trainee', 'Android Developer Trainee', 'Mobile App Developer']
      },
      Mid: {
        title: 'Mobile Developer',
        minSalary: 55000,
        maxSalary: 90000,
        positions: ['iOS Developer', 'Android Developer', 'Cross-platform Mobile Developer']
      },
      Senior: {
        title: 'Senior Mobile Developer',
        minSalary: 90000,
        maxSalary: 130000,
        positions: ['Senior iOS Engineer', 'Senior Android Engineer', 'Lead Mobile Developer']
      },
      Lead: {
        title: 'Mobile Development Lead',
        minSalary: 120000,
        maxSalary: 160000,
        positions: ['Mobile Team Manager', 'Head of Mobile Engineering', 'Mobile Product Architect']
      }
    }
  },
  {
    name: 'Game Development',
    patterns: ['game', 'unity', 'unreal', 'c#', 'c++', '3d', 'game design', 'gameplay'],
    titles: {
      Junior: {
        title: 'Junior Game Developer',
        minSalary: 30000,
        maxSalary: 50000,
        positions: ['Game Development Trainee', 'Associate Game Programmer', 'QA Game Tester']
      },
      Mid: {
        title: 'Game Developer',
        minSalary: 50000,
        maxSalary: 85000,
        positions: ['Game Programmer', 'Unity Developer', 'Unreal Engine Developer']
      },
      Senior: {
        title: 'Senior Game Developer',
        minSalary: 85000,
        maxSalary: 130000,
        positions: ['Lead Game Engineer', 'Game AI Programmer', 'Graphics Programmer']
      },
      Lead: {
        title: 'Game Development Lead',
        minSalary: 120000,
        maxSalary: 170000,
        positions: ['Game Director', 'Technical Director', 'Game Studio Lead']
      }
    }
  },
  {
    name: 'DevOps',
    patterns: ['devops', 'cloud', 'aws', 'azure', 'gcp', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
    titles: {
      Junior: {
        title: 'Junior DevOps Engineer',
        minSalary: 40000,
        maxSalary: 65000,
        positions: ['Cloud Support Engineer', 'Junior System Administrator', 'DevOps Trainee']
      },
      Mid: {
        title: 'DevOps Engineer',
        minSalary: 65000,
        maxSalary: 100000,
        positions: ['Cloud Engineer', 'Site Reliability Engineer', 'Infrastructure Developer']
      },
      Senior: {
        title: 'Senior DevOps Engineer',
        minSalary: 100000,
        maxSalary: 145000,
        positions: ['Platform Engineer', 'Senior SRE', 'Cloud Architect']
      },
      Lead: {
        title: 'DevOps Team Lead',
        minSalary: 135000,
        maxSalary: 180000,
        positions: ['Head of Infrastructure', 'Director of DevOps', 'Chief Infrastructure Officer']
      }
    }
  },
  {
    name: 'UI/UX Design',
    patterns: ['design', 'ui', 'ux', 'user interface', 'user experience', 'figma', 'sketch', 'adobe xd'],
    titles: {
      Junior: {
        title: 'Junior UI/UX Designer',
        minSalary: 35000,
        maxSalary: 55000,
        positions: ['UI Design Intern', 'Junior UX Researcher', 'Design Associate']
      },
      Mid: {
        title: 'UI/UX Designer',
        minSalary: 55000,
        maxSalary: 85000,
        positions: ['Product Designer', 'Interaction Designer', 'User Experience Designer']
      },
      Senior: {
        title: 'Senior UI/UX Designer',
        minSalary: 85000,
        maxSalary: 130000,
        positions: ['UX Team Lead', 'Senior Product Designer', 'Design Systems Specialist']
      },
      Lead: {
        title: 'Design Lead',
        minSalary: 120000,
        maxSalary: 170000,
        positions: ['Head of Design', 'UX Director', 'Chief Experience Officer']
      }
    }
  }
];

// Fallback pentru domenii necunoscute
const GENERAL_TECH_TITLES = {
  Junior: {
    title: 'Junior Developer',
    minSalary: 30000,
    maxSalary: 50000,
    positions: ['Junior Software Developer', 'Software Engineer Trainee', 'Junior Programmer']
  },
  Mid: {
    title: 'Software Developer',
    minSalary: 50000,
    maxSalary: 90000,
    positions: ['Software Engineer', 'Programmer', 'Application Developer']
  },
  Senior: {
    title: 'Senior Developer',
    minSalary: 90000,
    maxSalary: 140000,
    positions: ['Senior Software Engineer', 'Senior Programmer', 'Technical Team Lead']
  },
  Lead: {
    title: 'Development Lead',
    minSalary: 130000,
    maxSalary: 180000,
    positions: ['Engineering Manager', 'Development Director', 'Technical Lead']
  },
  Architect: {
    title: 'Software Architect',
    minSalary: 140000,
    maxSalary: 200000,
    positions: ['Systems Architect', 'Enterprise Architect', 'Solution Architect']
  }
};

const UserCard = ({ className = "" }: UserCardProps) => {
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();
  const [fullName, setFullName] = useState("");
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [completedRoadmaps, setCompletedRoadmaps] = useState<RoadmapType[]>([]);
  const [totalRoadmaps, setTotalRoadmaps] = useState(0);
  const [userTitle, setUserTitle] = useState<JobTitle | null>(null);
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
        
        // Obține roadmapurile utilizatorului
        const roadmapsRef = collection(db, "roadmaps");
        const userRoadmapsQuery = query(roadmapsRef, where("userId", "==", user.uid));
        const roadmapsSnapshot = await getDocs(userRoadmapsQuery);
        
        const allRoadmaps = roadmapsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as RoadmapType[];
        
        setTotalRoadmaps(allRoadmaps.length);
        
        // Filtrează roadmapurile completate (100% progress)
        const completed = allRoadmaps.filter(roadmap => {
          if (!roadmap.sections) return false;
          // Un roadmap este considerat complet când toate secțiunile au 100% progress
          return roadmap.sections.every(section => section.progress === 100);
        });
        
        setCompletedRoadmaps(completed);
        
        // Determină titlul utilizatorului bazat pe roadmapurile completate
        determineUserTitle(completed);
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Determină titlul utilizatorului în funcție de roadmapurile completate
  const determineUserTitle = (roadmaps: RoadmapType[]) => {
    if (!roadmaps.length) {
      setUserTitle(null);
      return;
    }
    
    // Contorizează roadmaps per domeniu
    const domainCounts: Record<string, number> = {};
    
    // Identifică domeniile din roadmap-uri
    roadmaps.forEach(roadmap => {
      const title = roadmap.title.toLowerCase();
      
      // Caută domeniul care se potrivește cel mai bine
      let matchedDomain = 'General';
      let maxPatternMatches = 0;
      
      CAREER_DOMAINS.forEach(domain => {
        let matches = 0;
        domain.patterns.forEach(pattern => {
          if (title.includes(pattern.toLowerCase())) {
            matches++;
          }
        });
        
        if (matches > maxPatternMatches) {
          maxPatternMatches = matches;
          matchedDomain = domain.name;
        }
      });
      
      // Incrementează contorul pentru acest domeniu
      domainCounts[matchedDomain] = (domainCounts[matchedDomain] || 0) + 1;
    });
    
    // Alege domeniul cu cele mai multe roadmap-uri completate
    let primaryDomain = 'General';
    let maxCount = 0;
    
    Object.entries(domainCounts).forEach(([domain, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryDomain = domain;
      }
    });
    
    // Determină nivelul de experiență bazat pe numărul total de roadmap-uri
    let experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Architect' = 'Junior';
    
    if (roadmaps.length >= 5) {
      experienceLevel = 'Architect';
    } else if (roadmaps.length >= 4) {
      experienceLevel = 'Lead';
    } else if (roadmaps.length >= 3) {
      experienceLevel = 'Senior';
    } else if (roadmaps.length >= 2) {
      experienceLevel = 'Mid';
    }
    
    // Construiește titlul de job
    let title: JobTitle;
    
    if (primaryDomain === 'General') {
      // Utilizează titlurile generale
      const generalTitle = GENERAL_TECH_TITLES[experienceLevel];
      title = {
        title: generalTitle.title,
        domain: 'Technology',
        minSalary: generalTitle.minSalary,
        maxSalary: generalTitle.maxSalary,
        positions: generalTitle.positions,
        level: experienceLevel
      };
    } else {
      // Găsește domeniul și nivelul corespunzător
      const domainInfo = CAREER_DOMAINS.find(d => d.name === primaryDomain);
      
      if (!domainInfo) {
        // Fallback la titlurile generale dacă domeniul nu este găsit
        const generalTitle = GENERAL_TECH_TITLES[experienceLevel];
        title = {
          title: generalTitle.title,
          domain: 'Technology',
          minSalary: generalTitle.minSalary,
          maxSalary: generalTitle.maxSalary,
          positions: generalTitle.positions,
          level: experienceLevel
        };
      } else {
        // Alege cel mai potrivit nivel de experiență disponibil pentru acest domeniu
        let levelToUse = experienceLevel;
        while (!domainInfo.titles[levelToUse] && levelToUse !== 'Junior') {
          // Scade nivelul dacă cel actual nu există
          if (levelToUse === 'Architect') levelToUse = 'Lead';
          else if (levelToUse === 'Lead') levelToUse = 'Senior';
          else if (levelToUse === 'Senior') levelToUse = 'Mid';
          else levelToUse = 'Junior';
        }
        
        const titleInfo = domainInfo.titles[levelToUse];
        if (titleInfo) {
          title = {
            title: titleInfo.title,
            domain: domainInfo.name,
            minSalary: titleInfo.minSalary,
            maxSalary: titleInfo.maxSalary,
            positions: titleInfo.positions,
            level: levelToUse
          };
        } else {
          // Fallback la Junior dacă nivelul specificat nu există
          const juniorTitle = domainInfo.titles.Junior;
          title = {
            title: juniorTitle.title,
            domain: domainInfo.name,
            minSalary: juniorTitle.minSalary,
            maxSalary: juniorTitle.maxSalary,
            positions: juniorTitle.positions,
            level: 'Junior'
          };
        }
      }
    }
    
    setUserTitle(title);
  };

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
  
  // Formatează suma în format monetar
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
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
            <Tooltip content={<p>Premium Member</p>}>
              <FaCrown className="text-yellow-400 text-lg" />
            </Tooltip>
          )}
        </div>
        <CardDescription className="text-gray-400">
          Your learning progress and achievements
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-2">
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-lg font-semibold mb-1">{fullName}</h2>
          
          {userTitle && (
            <div className="mb-2">
              <Tooltip 
                content={
                  <div className="w-64 p-2">
                    <p className="font-semibold mb-1">{userTitle.domain} - {userTitle.level} Level</p>
                    <p className="text-xs mb-2">Completați mai multe roadmap-uri pentru a avansa în carieră.</p>
                    <p className="font-semibold mb-1">Possible Job Positions:</p>
                    <ul className="text-xs">
                      {userTitle.positions.map((position, index) => (
                        <li key={index} className="mb-0.5">• {position}</li>
                      ))}
                    </ul>
                    <p className="text-xs mt-1">
                      <FaMoneyBillWave className="inline mr-1" />
                      Salary Range: {formatCurrency(userTitle.minSalary)} - {formatCurrency(userTitle.maxSalary)}
                    </p>
                  </div>
                }
              >
                <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <FaGraduationCap className="mr-1" /> {userTitle.title}
                </Badge>
              </Tooltip>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-4">
            <Tooltip content={<p>Level {userLevel}: {levelInfo?.title || ''}</p>}>
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white">
                Lvl {userLevel}
              </Badge>
            </Tooltip>
            
            {streakCount > 0 && (
              <Tooltip content={<p>{streakCount} day streak</p>}>
                <Badge className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1">
                  <FaFire className="text-yellow-300" />
                  {streakCount}
                </Badge>
              </Tooltip>
            )}
            
            {highestBadge && (
              <Tooltip content={<p>{highestBadge.name}: {highestBadge.description}</p>}>
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
          
          {/* Roadmap Progress Section */}
          <div className="w-full bg-gray-800 p-3 rounded-md mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FaRoad className="text-indigo-400 mr-2" />
                <h3 className="text-sm font-medium text-white">Career Roadmaps</h3>
              </div>
              <Badge variant="outline" className="text-xs bg-gray-700 text-gray-300">
                {completedRoadmaps.length}/{totalRoadmaps}
              </Badge>
            </div>
            
            {completedRoadmaps.length > 0 ? (
              <div className="space-y-2">
                {completedRoadmaps.slice(0, 2).map(roadmap => (
                  <div key={roadmap.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <FaBriefcase className="text-green-400 mr-1.5" />
                      <span className="text-gray-300">{roadmap.title}</span>
                    </div>
                    <Badge className="bg-green-700 text-white text-xs">Completed</Badge>
                  </div>
                ))}
                {completedRoadmaps.length > 2 && (
                  <div className="text-xs text-center text-indigo-400 mt-1">
                    +{completedRoadmaps.length - 2} more roadmaps completed
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center">
                No roadmaps completed yet. Start your learning journey!
              </div>
            )}
          </div>
          
          {/* Tutorials Coming Soon Section */}
          <div className="w-full bg-gray-800/60 border border-indigo-900/40 p-3 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FaBookReader className="text-indigo-400 mr-2" />
                <h3 className="text-sm font-medium text-white">Personalized Tutorials</h3>
              </div>
              <Badge variant="outline" className="text-xs bg-indigo-900/40 text-indigo-300 border-indigo-700/50">
                Coming soon
              </Badge>
            </div>
            
            <div className="text-xs text-gray-400 space-y-2">
              <p className="text-gray-300">
                We&apos;re working on adding custom tutorials for each roadmap subtask.
              </p>
              <div className="flex gap-2 items-start mt-2">
                <FaLaptopCode className="text-indigo-400 mt-0.5" />
                <p>Interactive lessons tailored to your learning style and progress</p>
              </div>
              <div className="flex gap-2 items-start">
                <FaGradCap className="text-indigo-400 mt-0.5" />
                <p>Expert-guided content to help you master each skill faster</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;    