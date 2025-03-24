"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { toast } from "sonner";

// Shared Components
import UserCard from "@/components/shared/UserCard";
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
  
  const [loading, setLoading] = useState(true);
  const [currentRoadmap, setCurrentRoadmap] = useState<ExtendedRoadmapType | null>(null);
  const [isPremium] = useState(false);
  const [showCareerCreation, setShowCareerCreation] = useState(false);

  // Funcție pentru a deschide modalul de creare carieră
  const openCareerCreation = () => {
    setShowCareerCreation(true);
  };
  
  // Funcție pentru a închide modalul de creare carieră
  const closeCareerCreation = () => {
    setShowCareerCreation(false);
  };

  // Funcție pentru a actualiza roadmap-ul
  const updateRoadmap = (roadmap: ExtendedRoadmapType | null) => {
    setCurrentRoadmap(roadmap);
    
    // Actualizăm și în localStorage
    if (roadmap) {
      localStorage.setItem('currentRoadmap', JSON.stringify(roadmap));
    } else {
      // Dacă roadmap-ul este null, ștergem din localStorage
      localStorage.removeItem('currentRoadmap');
    }
  };

  // Încărcăm roadmap-ul din localStorage și din Firestore la pornirea aplicației
  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Verificăm întâi dacă există un roadmap în Firestore pentru acest utilizator
        try {
          const userDocRef = doc(db, "customers", user.uid);
          // Actualizăm ultima activitate a utilizatorului
          await updateDoc(userDocRef, { lastActive: new Date() })
            .catch(() => null); // Ignorăm erorile la actualizare
          
          // Încărcăm documentul utilizatorului
          const userDocSnapshot = await getDoc(userDocRef);
          
          if (userDocSnapshot.exists() && userDocSnapshot.data().roadmapId) {
            // Avem un ID de roadmap, îl încărcăm din Firestore
            const roadmapId = userDocSnapshot.data().roadmapId;
            const roadmapDocRef = doc(db, "roadmaps", roadmapId);
            const roadmapDoc = await getDoc(roadmapDocRef);
            
            if (roadmapDoc.exists()) {
              const roadmapData = roadmapDoc.data();
              
              if (roadmapData.roadmap) {
                // Asigurăm-ne că roadmap-ul include userId pentru a identifica proprietarul
                const updatedRoadmap = {
                  ...roadmapData.roadmap,
                  userId: roadmapData.userId || user.uid,
                  id: roadmapId
                };
                
                setCurrentRoadmap(updatedRoadmap as ExtendedRoadmapType);
                localStorage.setItem('currentRoadmap', JSON.stringify(updatedRoadmap));
                setLoading(false);
                return; // Roadmap încărcat cu succes, ieșim
              }
            }
          }
          
          // Dacă nu am găsit un roadmap în Firestore sau nu există, încercăm localStorage
          const savedRoadmap = localStorage.getItem('currentRoadmap');
          if (savedRoadmap) {
            const parsedRoadmap = JSON.parse(savedRoadmap) as ExtendedRoadmapType;
            
            // Verificăm dacă acest roadmap aparține utilizatorului curent
            if (parsedRoadmap.userId && parsedRoadmap.userId !== user.uid) {
              console.log("Roadmap-ul din localStorage aparține altui utilizator, nu-l încărcăm");
              localStorage.removeItem('currentRoadmap');
              setCurrentRoadmap(null);
            } else {
              // Asigurăm-ne că roadmap-ul include userId
              const updatedRoadmap = {
                ...parsedRoadmap,
                userId: parsedRoadmap.userId || user.uid
              };
              setCurrentRoadmap(updatedRoadmap);
              localStorage.setItem('currentRoadmap', JSON.stringify(updatedRoadmap));
            }
          } else {
            // Nu avem roadmap nici în Firestore, nici în localStorage
            setCurrentRoadmap(null);
          }
        } catch (error) {
          console.error("Error loading roadmap from Firestore:", error);
          setCurrentRoadmap(null);
        }
      } catch (error) {
        console.error("Error in roadmap loading process:", error);
        setCurrentRoadmap(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadRoadmap();
  }, [user]); // Adăugăm user ca dependență pentru a reîncărca când se schimbă utilizatorul

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
        
        // Adăugăm userId la roadmap pentru a-l asocia cu utilizatorul curent
        const roadmapWithUserId = {
          ...roadmap,
          userId: user.uid
        };
        
        // Actualizăm starea cu datele generate
        setCurrentRoadmap(roadmapWithUserId as ExtendedRoadmapType);
        
        // Salvăm roadmap-ul în localStorage pentru persistență
        localStorage.setItem('currentRoadmap', JSON.stringify(roadmapWithUserId));
        
        // Salvăm roadmap-ul în Firestore
        try {
          const roadmapDocRef = await addDoc(collection(db, "roadmaps"), {
            userId: user.uid,
            roadmap: roadmapWithUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Actualizăm roadmap-ul cu ID-ul din Firestore
          const roadmapWithId = {
            ...roadmapWithUserId,
            id: roadmapDocRef.id
          };
          
          // Actualizăm starea și localStorage cu ID-ul
          setCurrentRoadmap(roadmapWithId as ExtendedRoadmapType);
          localStorage.setItem('currentRoadmap', JSON.stringify(roadmapWithId));
          
          // Actualizăm profilul utilizatorului cu referința la noul roadmap
          const userDocRef = doc(db, "customers", user.uid);
          await updateDoc(userDocRef, {
            roadmapId: roadmapDocRef.id
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* User Profile Card */}
        <div className="w-full md:w-1/3 mb-6 md:mb-0">
          <UserCard className="h-full" />
        </div>

        {/* Main Content */}
        <div className="w-full md:w-2/3">
          <CareerRoadmap 
            roadmap={currentRoadmap}
            onlineStatus={true}
            isPremium={isPremium}
            handleGenerateRoadmap={handleGenerateRoadmap}
            handleOpenCreateCareer={openCareerCreation}
            setRoadmap={updateRoadmap as (roadmap: RoadmapType | null) => void}
            handleDeleteRoadmap={handleDeleteRoadmap}
            isOwner={currentRoadmap?.userId === user?.uid || !currentRoadmap?.userId}
          />
        </div>
      </div>

      {/* Folosim componenta CareerCreationModal pentru noul flux simplificat */}
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
