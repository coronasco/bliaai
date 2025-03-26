"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { FaBriefcase, FaSuitcase, FaCommentDots } from "react-icons/fa";

// Shared Components
import UserCard from "@/components/shared/UserCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CareerRoadmap, { RoadmapType } from "@/components/shared/CareerRoadmap";
import { CareerCreationModal } from "@/components/shared/CareerCreationModal";

// Extindem tipul RoadmapType pentru a include userId
type ExtendedRoadmapType = RoadmapType & {
  userId?: string;
};

// Definim tipul pentru opțiunile de generare a roadmap-ului
type RoadmapGenerationOptions = {
  title: string;
  description: string;
  timeframe?: string;
  learningFocus?: string;
  currentSkills?: string;
  preferredResources?: string[];
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [allRoadmaps, setAllRoadmaps] = useState<ExtendedRoadmapType[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<ExtendedRoadmapType | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showCareerCreation, setShowCareerCreation] = useState(false);

  // Funcție pentru a deschide modalul de creare carieră
  const openCareerCreation = () => {
    console.log("[DEBUG] Opening career creation modal:", {
      isPremium,
      user: user?.uid
    });
    setShowCareerCreation(true);
  };
  
  // Funcție pentru a închide modalul de creare carieră
  const closeCareerCreation = () => {
    setShowCareerCreation(false);
  };

  // Încărcăm roadmap-urile utilizatorului
  useEffect(() => {
    const fetchRoadmaps = async () => {
      if (!user) return;
      
      try {
        const roadmapsRef = collection(db, "roadmaps");
        const q = query(roadmapsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const roadmaps = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          userId: user.uid
        })) as ExtendedRoadmapType[];
        
        setAllRoadmaps(roadmaps);
        if (roadmaps.length > 0) {
          setCurrentRoadmap(roadmaps[0]);
        }
      } catch (error) {
        console.error("Error fetching roadmaps:", error);
        toast.error("Failed to load your roadmaps");
      }
    };
    
    fetchRoadmaps();
  }, [user]);

  // Verificăm statusul premium al utilizatorului
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setIsPremium(userDoc.data().isPremium || false);
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
      }
    };
    
    checkPremiumStatus();
  }, [user]);

  // Funcție pentru generarea unui nou roadmap
  const handleGenerateRoadmap = async (level: string, options?: RoadmapGenerationOptions) => {
    if (!user) return;
    
    try {
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          level,
          ...options,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate roadmap");
      }
      
      const data = await response.json();
      
      // Adăugăm noul roadmap în lista de roadmap-uri
      const newRoadmap = {
        ...data.roadmap,
        id: data.roadmapId,
        userId: user.uid,
      } as ExtendedRoadmapType;
      
      setAllRoadmaps(prev => [...prev, newRoadmap]);
      setCurrentRoadmap(newRoadmap);
      
      toast.success("Roadmap generated successfully!");
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast.error("Failed to generate roadmap");
    }
  };

  // Funcție pentru ștergerea unui roadmap
  const handleDeleteRoadmap = async () => {
    if (!user || !currentRoadmap) return;
    
    try {
      await deleteDoc(doc(db, "roadmaps", currentRoadmap.id));
      
      // Actualizăm lista de roadmap-uri
      setAllRoadmaps(prev => prev.filter(rm => rm.id !== currentRoadmap.id));
      
      // Setăm primul roadmap disponibil sau null
      setCurrentRoadmap(allRoadmaps.find(rm => rm.id !== currentRoadmap.id) || null);
      
      toast.success("Roadmap deleted successfully!");
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      toast.error("Failed to delete roadmap");
    }
  };

  // Funcție pentru a actualiza roadmap-ul
  const updateRoadmap = (roadmap: ExtendedRoadmapType | null) => {
    setCurrentRoadmap(roadmap);
    
    // Actualizăm și în allRoadmaps dacă există
    if (roadmap) {
      setAllRoadmaps(prev => {
        const index = prev.findIndex(rm => rm.id === roadmap.id);
        if (index !== -1) {
          // Dacă roadmap-ul există, îl actualizăm
          const updated = [...prev];
          updated[index] = roadmap;
          return updated;
        } else {
          // Dacă roadmap-ul nu există, îl adăugăm
          return [...prev, roadmap];
        }
      });
      
      localStorage.setItem('currentRoadmap', JSON.stringify(roadmap));
    } else {
      // Dacă roadmap-ul este null, ștergem din localStorage
      localStorage.removeItem('currentRoadmap');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prima coloană - User Card și card-ul de anunț */}
        <div className="md:col-span-1 space-y-6">
          <UserCard />
          
          {/* Card pentru anunțarea funcționalității viitoare de joburi */}
          <Card className="bg-gray-900 text-gray-100 border border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <FaBriefcase className="text-indigo-400 mr-2" />
                  <span>Recommended Jobs</span>
                </CardTitle>
                <span className="text-xs bg-indigo-500/30 text-indigo-300 py-1 px-2 rounded-full">
                  Coming soon
                </span>
              </div>
              <CardDescription className="text-gray-400">
                Discover opportunities that match your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 py-1">
                <div className="flex items-start gap-3">
                  <FaSuitcase className="text-indigo-400 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium text-white">Apply to relevant jobs</h4>
                    <p className="text-xs text-gray-400">Take advantage of personalized job opportunities based on your completed roadmaps and acquired experience.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaCommentDots className="text-indigo-400 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium text-white">Personalized feedback</h4>
                    <p className="text-xs text-gray-400">Receive recommendations to improve your professional profile and enhance your employment prospects.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full text-center">
                <p className="text-xs text-gray-500">This feature will be available soon. Continue completing roadmaps to unlock more opportunities!</p>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* A doua coloană - Career Roadmap */}
        <div className="md:col-span-2">
          <CareerRoadmap
            roadmap={currentRoadmap}
            allRoadmaps={allRoadmaps}
            onlineStatus={true}
            isPremium={isPremium}
            handleGenerateRoadmap={handleGenerateRoadmap}
            handleOpenCreateCareer={openCareerCreation}
            setRoadmap={updateRoadmap as (roadmap: RoadmapType | null) => void}
            handleDeleteRoadmap={currentRoadmap ? handleDeleteRoadmap : undefined}
            isOwner={currentRoadmap?.userId === user?.uid || !currentRoadmap?.userId}
            currentUserId={user?.uid}
          />
        </div>
      </div>
      
      {/* Modal pentru crearea carierelor */}
      <CareerCreationModal
        isOpen={showCareerCreation}
        onClose={closeCareerCreation}
      />
    </div>
  );
};

export default DashboardPage;
