"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { FaBriefcase, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaStar, FaExternalLinkAlt } from "react-icons/fa";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { RoadmapType } from "@/lib/roadmap-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface UserJobsCardProps {
  className?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  domain: string;
  level: string;
  applicationUrl: string;
  postedDate: Date;
  isFeatured: boolean;
}

// Mock data pentru joburi - în producție acestea ar veni de la un API
const MOCK_JOBS: Job[] = [
  {
    id: "job1",
    title: "Frontend Developer",
    company: "TechCorp",
    location: "București, România",
    salary: {
      min: 40000,
      max: 70000,
      currency: "USD"
    },
    description: "Dezvoltarea și menținerea aplicațiilor web pentru clienții noștri folosind React și TypeScript",
    requirements: ["React", "TypeScript", "HTML/CSS", "Jest"],
    domain: "Web Development",
    level: "Mid",
    applicationUrl: "https://example.com/jobs/frontend-dev",
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 zile în urmă
    isFeatured: true
  },
  {
    id: "job2",
    title: "Data Scientist",
    company: "DataViz",
    location: "Remote",
    salary: {
      min: 60000,
      max: 95000,
      currency: "USD"
    },
    description: "Analizarea și interpretarea datelor complexe pentru a oferi soluții pentru clienții noștri",
    requirements: ["Python", "Machine Learning", "SQL", "Pandas", "TensorFlow"],
    domain: "Data Science",
    level: "Mid",
    applicationUrl: "https://example.com/jobs/data-scientist",
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 zile în urmă
    isFeatured: false
  },
  {
    id: "job3",
    title: "Mobile Developer",
    company: "AppWorks",
    location: "Cluj-Napoca, România",
    salary: {
      min: 45000,
      max: 80000,
      currency: "USD"
    },
    description: "Dezvoltarea aplicațiilor mobile native pentru iOS și Android folosind Swift și Kotlin",
    requirements: ["Swift", "Kotlin", "Mobile Architecture", "Git"],
    domain: "Mobile Development",
    level: "Mid",
    applicationUrl: "https://example.com/jobs/mobile-dev",
    postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 zile în urmă
    isFeatured: false
  },
  {
    id: "job4",
    title: "DevOps Engineer",
    company: "CloudNet",
    location: "Remote",
    salary: {
      min: 65000,
      max: 105000,
      currency: "USD"
    },
    description: "Automatizarea și optimizarea infrastructurii cloud pentru aplicațiile noastre",
    requirements: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
    domain: "DevOps",
    level: "Senior",
    applicationUrl: "https://example.com/jobs/devops",
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 zi în urmă
    isFeatured: true
  },
  {
    id: "job5",
    title: "Game Developer",
    company: "GameStudio",
    location: "Iași, România",
    salary: {
      min: 45000,
      max: 85000,
      currency: "USD"
    },
    description: "Dezvoltarea jocurilor 3D folosind Unity și programare în C#",
    requirements: ["Unity", "C#", "Game Design", "3D Modeling", "Animation"],
    domain: "Game Development",
    level: "Mid",
    applicationUrl: "https://example.com/jobs/game-dev",
    postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 zile în urmă
    isFeatured: false
  },
  {
    id: "job6",
    title: "UX/UI Designer",
    company: "DesignHub",
    location: "București, România",
    salary: {
      min: 40000,
      max: 80000,
      currency: "USD"
    },
    description: "Crearea de interfețe intuitive și atractive pentru aplicațiile web și mobile",
    requirements: ["Figma", "Adobe XD", "User Research", "Prototyping", "Interaction Design"],
    domain: "UI/UX Design",
    level: "Mid",
    applicationUrl: "https://example.com/jobs/ux-designer",
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 zile în urmă
    isFeatured: false
  },
  {
    id: "job7",
    title: "Senior Web Developer",
    company: "WebSolutions",
    location: "Timișoara, România",
    salary: {
      min: 75000,
      max: 110000,
      currency: "USD"
    },
    description: "Conducerea echipei de dezvoltare frontend și implementarea arhitecturii pentru proiecte complexe",
    requirements: ["React", "Node.js", "CSS Architecture", "Performance Optimization", "Team Leadership"],
    domain: "Web Development",
    level: "Senior",
    applicationUrl: "https://example.com/jobs/senior-web-dev",
    postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 zile în urmă
    isFeatured: true
  }
];

const UserJobsCard = ({ className = "" }: UserJobsCardProps) => {
  const { user } = useAuth();
  const [userDomain, setUserDomain] = useState<string | null>(null);
  const [_userLevel, setUserLevel] = useState<string | null>(null);
  const [relevantJobs, setRelevantJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Formateaza data postării într-un format lizibil
  const formatPostDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Astăzi";
    } else if (diffDays === 1) {
      return "Ieri";
    } else {
      return `Acum ${diffDays} zile`;
    }
  };

  // Formatează suma în format monetar
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user || !user.uid) return;

      try {
        setLoading(true);
        
        // Obține roadmap-urile utilizatorului
        const roadmapsRef = collection(db, "roadmaps");
        const userRoadmapsQuery = query(roadmapsRef, where("userId", "==", user.uid));
        const roadmapsSnapshot = await getDocs(userRoadmapsQuery);
        
        const allRoadmaps = roadmapsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as RoadmapType[];
        
        // Determină domeniul principal și nivelul utilizatorului
        if (allRoadmaps.length > 0) {
          // Contorizează domenii pentru roadmap-uri
          const domainCounts: Record<string, number> = {};
          let totalRoadmaps = 0;
          
          allRoadmaps.forEach(roadmap => {
            if (!roadmap.sections) return;
            
            // Verifică dacă roadmap-ul este completat
            if (roadmap.sections.every(section => section.progress === 100)) {
              totalRoadmaps++;
              
              // Determină domeniul bazat pe titlu
              const title = roadmap.title.toLowerCase();
              let domain = "Technology"; // Default
              
              if (title.includes("web") || title.includes("frontend") || title.includes("backend")) {
                domain = "Web Development";
              } else if (title.includes("data") || title.includes("analytics") || title.includes("machine learning")) {
                domain = "Data Science";
              } else if (title.includes("mobile") || title.includes("android") || title.includes("ios")) {
                domain = "Mobile Development";
              } else if (title.includes("devops") || title.includes("cloud") || title.includes("infrastructure")) {
                domain = "DevOps";
              } else if (title.includes("game") || title.includes("unity") || title.includes("unreal")) {
                domain = "Game Development";
              } else if (title.includes("design") || title.includes("ui") || title.includes("ux")) {
                domain = "UI/UX Design";
              }
              
              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            }
          });
          
          // Găsește domeniul predominant
          let maxCount = 0;
          let primaryDomain = "Technology";
          
          Object.entries(domainCounts).forEach(([domain, count]) => {
            if (count > maxCount) {
              maxCount = count;
              primaryDomain = domain;
            }
          });
          
          // Determină nivelul de experiență
          let experienceLevel = "Junior";
          if (totalRoadmaps >= 5) {
            experienceLevel = "Architect";
          } else if (totalRoadmaps >= 4) {
            experienceLevel = "Lead";
          } else if (totalRoadmaps >= 3) {
            experienceLevel = "Senior";
          } else if (totalRoadmaps >= 2) {
            experienceLevel = "Mid";
          }
          
          setUserDomain(primaryDomain);
          setUserLevel(experienceLevel);
          
          // Filtrează joburile relevante
          filterJobs(primaryDomain, experienceLevel);
        } else {
          // Nu există roadmap-uri, utilizează toate joburile
          setRelevantJobs(MOCK_JOBS);
        }
      } catch (error) {
        console.error("Error fetching user data for jobs:", error);
        setRelevantJobs(MOCK_JOBS);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user]);

  // Filtrează joburile relevante pentru utilizator
  const filterJobs = (domain: string, level: string) => {
    // Obține toate joburile care se potrivesc cu domeniul
    const domainJobs = MOCK_JOBS.filter(job => job.domain === domain);
    
    // Verifică dacă există suficiente joburi pentru domeniu
    if (domainJobs.length >= 3) {
      // Mai întâi adaugă joburile pentru nivelul exact
      const exactLevelJobs = domainJobs.filter(job => job.level === level);
      
      // Apoi adaugă alte joburi din același domeniu
      let otherLevelJobs = domainJobs.filter(job => job.level !== level);
      
      // Sortează joburile după Featured și data postării
      otherLevelJobs = otherLevelJobs.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.postedDate.getTime() - a.postedDate.getTime();
      });
      
      // Combină și limitează la 5 joburi
      const combinedJobs = [...exactLevelJobs, ...otherLevelJobs].slice(0, 5);
      setRelevantJobs(combinedJobs);
    } else {
      // Dacă nu sunt suficiente joburi pentru domeniu, adaugă și joburi din alte domenii
      // dar pune-le la final
      const otherDomainJobs = MOCK_JOBS.filter(job => job.domain !== domain);
      
      // Sortează toate joburile după Featured și data postării
      const allSortedJobs = [...domainJobs, ...otherDomainJobs].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.postedDate.getTime() - a.postedDate.getTime();
      });
      
      setRelevantJobs(allSortedJobs.slice(0, 5));
    }
  };

  if (loading) {
    return (
      <Card className={`w-full bg-gray-900 text-gray-100 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Joburi Recomandate</CardTitle>
          <CardDescription className="text-gray-400">
            Încărcare recomandări de carieră...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-4 w-32 bg-gray-700 mb-2" />
                    <Skeleton className="h-3 w-24 bg-gray-700 mb-1" />
                  </div>
                  <Skeleton className="h-6 w-16 bg-gray-700" />
                </div>
                <Skeleton className="h-3 w-full bg-gray-700 mt-3" />
                <Skeleton className="h-3 w-3/4 bg-gray-700 mt-1" />
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-3 w-20 bg-gray-700" />
                  <Skeleton className="h-8 w-24 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full bg-gray-900 text-gray-100 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-1">
          <CardTitle className="text-xl">Joburi Recomandate</CardTitle>
          <div className="flex gap-2">
            {userDomain && (
              <Badge className="bg-indigo-600/40 text-indigo-200 border border-indigo-500/30">
                {userDomain}
              </Badge>
            )}
            {_userLevel && (
              <Badge className="bg-purple-600/40 text-purple-200 border border-purple-500/30">
                {_userLevel}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-gray-400">
          Oportunități de carieră potrivite profilului tău
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {relevantJobs.length > 0 ? (
          <div className="space-y-4">
            {relevantJobs.map((job) => (
              <div 
                key={job.id} 
                className={`bg-gray-800 border ${job.isFeatured ? 'border-indigo-500/40' : 'border-gray-700'} 
                rounded-md p-4 transition-all hover:bg-gray-750`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white flex items-center">
                      {job.title}
                      {job.isFeatured && (
                        <Tooltip content={<p>Job recomandat special</p>}>
                          <FaStar className="text-yellow-400 ml-2 h-3 w-3" />
                        </Tooltip>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span className="flex items-center">
                        <FaBuilding className="mr-1 h-3 w-3" /> {job.company}
                      </span>
                      <span className="flex items-center">
                        <FaMapMarkerAlt className="mr-1 h-3 w-3" /> {job.location}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      job.level === 'Junior' ? 'bg-green-600' : 
                      job.level === 'Mid' ? 'bg-blue-600' : 
                      job.level === 'Senior' ? 'bg-purple-600' :
                      'bg-indigo-600'
                    } text-white text-xs`}
                  >
                    {job.level}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-300 mt-3 line-clamp-2">
                  {job.description}
                </p>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {job.requirements.slice(0, 3).map((req, idx) => (
                    <Badge key={idx} variant="outline" className="bg-gray-700/50 text-gray-300 text-xs">
                      {req}
                    </Badge>
                  ))}
                  {job.requirements.length > 3 && (
                    <Badge variant="outline" className="bg-gray-700/50 text-gray-300 text-xs">
                      +{job.requirements.length - 3}
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatPostDate(job.postedDate)}</span>
                    <span className="flex items-center text-xs text-green-400">
                      <FaMoneyBillWave className="mr-1 h-3 w-3" />
                      {formatCurrency(job.salary.min)} - {formatCurrency(job.salary.max)}
                    </span>
                  </div>
                  
                  <Link href={job.applicationUrl} target="_blank" passHref>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-8 bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-500/30 text-indigo-300"
                    >
                      Aplică <FaExternalLinkAlt className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FaBriefcase className="mx-auto h-10 w-10 text-gray-600 mb-3" />
            <p>Nu am găsit joburi care să se potrivească cu profilul tău în acest moment.</p>
            <p className="text-sm mt-2">
              Completează mai multe roadmap-uri pentru a debloca recomandări personalizate!
            </p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link href="/jobs" passHref>
            <Button 
              variant="outline" 
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Exploreză toate joburile disponibile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserJobsCard; 