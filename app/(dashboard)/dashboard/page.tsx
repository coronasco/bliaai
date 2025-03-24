"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, updateDoc, addDoc, collection, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";
import { FaBriefcase, FaSuitcase, FaCommentDots } from "react-icons/fa";

// Shared Components
import UserCard from "@/components/shared/UserCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CareerRoadmap, { RoadmapType } from "@/components/shared/CareerRoadmap";
import CareerCreationModal from "@/components/shared/CareerCreationModal";

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
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showCareerCreation, setShowCareerCreation] = useState(false);

  // Funcție pentru a deschide modalul de creare carieră
  const openCareerCreation = () => {
    setShowCareerCreation(true);
  };
  
  // Funcție pentru a închide modalul de creare carieră
  const closeCareerCreation = () => {
    setShowCareerCreation(false);
  };

  // Efect pentru a încărca toate roadmap-urile utilizatorului
  useEffect(() => {
    let errorDisplayed = false; // Variabilă pentru a urmări dacă eroarea a fost deja afișată
    
    const loadRoadmaps = async () => {
      if (!user?.uid) return;
      
      setLoading(true);

      try {
        // Verify if the user is premium
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        const premium = userDoc.exists() && userDoc.data()?.isPremium === true;
        setIsPremium(premium);
        
        // Get all the user's roadmaps
        const response = await fetch(`/api/roadmap/list?userId=${user.uid}`);
        
        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("API Error:", errorData);
          throw new Error(errorData.error || 'Could not load roadmaps');
        }

        // Parse the response
        const data = await response.json();
        
        // Process roadmaps
        if (data && Array.isArray(data.roadmaps)) {
          const roadmaps = data.roadmaps as ExtendedRoadmapType[];
          setAllRoadmaps(roadmaps);
          
          // Find the active roadmap
          const activeRoadmap = roadmaps.find(rm => rm.isActive) || (roadmaps.length > 0 ? roadmaps[0] : null);
          
          if (activeRoadmap) {
            // If an active roadmap is found, set it as the current roadmap
            setCurrentRoadmap(activeRoadmap);
          } else if (roadmaps.length > 0) {
            // If no active roadmap exists but there are roadmaps, set the first one as active
            await handleSetActiveRoadmap(roadmaps[0].id);
            setCurrentRoadmap(roadmaps[0]);
          } else {
            // No roadmaps found - make sure currentRoadmap is null
            setCurrentRoadmap(null);
          }
        } else {
          // No roadmaps in response or invalid data format
          setAllRoadmaps([]);
          setCurrentRoadmap(null);
        }
      } catch (error) {
        console.error("Error loading roadmaps:", error);
        setAllRoadmaps([]);
        setCurrentRoadmap(null);
        
        // Verificăm dacă eroarea a fost deja afișată
        if (!errorDisplayed) {
          errorDisplayed = true;
          toast.error("Could not load roadmaps", {
            description: "Please try again later. If the problem persists, contact support."
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadRoadmaps();
    
    // Cleanup function will be called when the component unmounts
    return () => {
      errorDisplayed = true; // Prevent error toast if component unmounts during loading
    };
  }, [user]);
  
  // Funcție pentru a seta un roadmap ca activ
  const handleSetActiveRoadmap = async (roadmapId: string): Promise<void> => {
    if (!user?.uid || !roadmapId) return;
    
    try {
      const response = await fetch('/api/roadmap/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roadmapId,
          userId: user.uid
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("API Error when activating roadmap:", errorData);
        throw new Error(errorData.error || 'Could not activate roadmap');
      }
      
      // Actualizăm starea locală
      const updatedRoadmaps = allRoadmaps.map(rm => ({
        ...rm,
        isActive: rm.id === roadmapId
      }));
      
      setAllRoadmaps(updatedRoadmaps);
      
      // Setăm roadmap-ul activ ca roadmap-ul curent
      const activeRoadmap = updatedRoadmaps.find(rm => rm.id === roadmapId) || null;
      if (activeRoadmap) {
        setCurrentRoadmap(activeRoadmap);
      }
    } catch (error) {
      console.error("Error activating roadmap:", error);
      toast.error("Could not activate roadmap", {
        description: "Please try again later. If the problem persists, contact support."
      });
    }
  };

  // Funcție pentru gestionarea generării unui nou roadmap
  const handleGenerateRoadmap = async (experienceLevel: string, options?: RoadmapGenerationOptions) => {
    if (!user) {
      toast.error("You must be logged in to generate a roadmap");
      return;
    }
    
    setLoading(true);
    
    try {
      if (options?.title) {
        // Folosim noul endpoint pentru generarea structurii roadmap-ului (Faza 1)
        const roadmapData = await fetch('/api/roadmap/structure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            careerTitle: options.title
          })
        });
        
        if (!roadmapData.ok) {
          throw new Error('Error generating the roadmap');
        }
        
        const roadmapResponse = await roadmapData.json();
        const roadmap = roadmapResponse.data;
        
        if (!roadmap) {
          throw new Error('API response does not contain valid data');
        }
        
        // Adăugăm userId la roadmap și îl facem automat public
        const roadmapWithMetadata = {
          ...roadmap,
          userId: user.uid,
          isPublic: true, // Toate roadmap-urile sunt acum public în mod implicit
          creatorName: user.displayName || 'Anonymous',
          creatorEmail: user.email || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Actualizăm starea cu datele generate
        setCurrentRoadmap(roadmapWithMetadata as ExtendedRoadmapType);
        
        // Salvăm roadmap-ul în localStorage pentru persistență
        localStorage.setItem('currentRoadmap', JSON.stringify(roadmapWithMetadata));
        
        // Salvăm roadmap-ul în Firestore
        try {
          const roadmapDocRef = await addDoc(collection(db, "roadmaps"), {
            userId: user.uid,
            roadmap: roadmapWithMetadata,
            isPublic: true, // Adăugăm și la nivelul documentului
            creatorName: user.displayName || 'Anonymous',
            creatorEmail: user.email || '',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Actualizăm roadmap-ul cu ID-ul din Firestore
          const roadmapWithId = {
            ...roadmapWithMetadata,
            id: roadmapDocRef.id
          };
          
          // Actualizăm starea și localStorage cu ID-ul
          setCurrentRoadmap(roadmapWithId as ExtendedRoadmapType);
          localStorage.setItem('currentRoadmap', JSON.stringify(roadmapWithId));
          
          // Actualizăm profilul utilizatorului cu referința la noul roadmap
          const userDocRef = doc(db, "customers", user.uid);
          await updateDoc(userDocRef, {
            roadmapId: roadmapDocRef.id,
            roadmaps: arrayUnion(roadmapDocRef.id), // Adăugăm într-un array de roadmap-uri
            updatedAt: new Date()
          });
          
        } catch (firestoreError) {
          console.error("Error saving roadmap to Firestore:", firestoreError);
          // Continuăm cu versiunea din localStorage chiar dacă salvarea în Firestore eșuează
        }
        
        // Închidem modalul de creare
        closeCareerCreation();
        
        toast.success("Roadmap generated successfully! Click on a subtask to generate details.");
      } else {
        // Deschidem modalul pentru crearea unui nou roadmap
        openCareerCreation();
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast.error("Could not generate the roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = async () => {
    if (!user || !currentRoadmap) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this roadmap? This action cannot be undone.");
    if (!confirmed) return;

    try {
      // Ștergem din Firestore doar dacă avem un ID valid
      if (currentRoadmap.id && currentRoadmap.id.startsWith('roadmap-') === false) {
        await deleteDoc(doc(db, "roadmaps", currentRoadmap.id));
        
        // Actualizăm documentul utilizatorului pentru a elimina referința la roadmap
        await updateDoc(doc(db, "customers", user.uid), {
          roadmapId: null,
          updatedAt: new Date()
        });
      }

      // Ștergem din starea locală
      setCurrentRoadmap(null);
      localStorage.removeItem('currentRoadmap');
      
      toast.success("Roadmap deleted successfully!");
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      toast.error("Could not delete the roadmap");
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
  
  // Funcție pentru a actualiza lista de roadmap-uri
  const updateAllRoadmaps = (roadmaps: ExtendedRoadmapType[]) => {
    setAllRoadmaps(roadmaps);
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
            setAllRoadmaps={updateAllRoadmaps as (roadmaps: RoadmapType[]) => void}
            handleDeleteRoadmap={currentRoadmap ? handleDeleteRoadmap : undefined}
            isOwner={currentRoadmap?.userId === user?.uid || !currentRoadmap?.userId}
            handleSetActiveRoadmap={handleSetActiveRoadmap}
          />
        </div>
      </div>
      
      {/* Modal pentru crearea carierelor */}
      <CareerCreationModal
        isOpen={showCareerCreation}
        onClose={closeCareerCreation}
        onGenerate={async (title, experienceLevel, description) => {
          await handleGenerateRoadmap(experienceLevel, { 
            title, 
            description 
          });
        }}
        isLoading={loading}
        roadmapLevel="beginner"
      />
    </div>
  );
};

export default DashboardPage;
