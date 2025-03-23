"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
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
              setCurrentRoadmap(roadmapData as ExtendedRoadmapType);
              localStorage.setItem('currentRoadmap', JSON.stringify(roadmapData));
              setLoading(false);
              return; // Roadmap încărcat cu succes, ieșim
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
            } else {
              setCurrentRoadmap(parsedRoadmap);
            }
          }
        } catch (error) {
          console.error("Error loading roadmap from Firestore:", error);
          
          // În caz de eroare, încercăm din localStorage
          const savedRoadmap = localStorage.getItem('currentRoadmap');
          if (savedRoadmap) {
            try {
              const parsedRoadmap = JSON.parse(savedRoadmap) as ExtendedRoadmapType;
              if (!parsedRoadmap.userId || parsedRoadmap.userId === user.uid) {
                setCurrentRoadmap(parsedRoadmap);
              } else {
                localStorage.removeItem('currentRoadmap');
              }
            } catch (e) {
              console.error("Invalid roadmap JSON in localStorage:", e);
              localStorage.removeItem('currentRoadmap');
            }
          }
        }
      } catch (e) {
        console.error("Error parsing roadmap:", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadRoadmap();
  }, [user]); // Adăugăm user ca dependență pentru a reîncărca când se schimbă utilizatorul

  // Funcție pentru gestionarea generării unui nou roadmap
  const handleGenerateRoadmap = async (experienceLevel: string, options?: RoadmapGenerationOptions) => {
    if (!user) {
      toast.error("Trebuie să fii autentificat pentru a genera un roadmap");
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
          throw new Error('Eroare la generarea roadmap-ului');
        }
        
        const roadmap = await roadmapData.json();
        
        // Actualizăm starea cu datele generate
        setCurrentRoadmap(roadmap as ExtendedRoadmapType);
        
        // Salvăm roadmap-ul în localStorage pentru persistență
        localStorage.setItem('currentRoadmap', JSON.stringify(roadmap));
        
        // Închidem modalul de creare
        closeCareerCreation();
        
        toast.success("Roadmap generat cu succes! Faceți clic pe un subtask pentru a genera detalii.");
      } else {
        // Deschidem modalul pentru crearea unui nou roadmap
        openCareerCreation();
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast.error("Nu s-a putut genera roadmap-ul. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = async () => {
    if (!user || !currentRoadmap) return;
    
    const confirmed = window.confirm("Ești sigur că vrei să ștergi acest roadmap? Această acțiune nu poate fi anulată.");
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
      
      toast.success("Roadmap șters cu succes!");
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      toast.error("Nu s-a putut șterge roadmap-ul");
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
            roadmap={currentRoadmap as RoadmapType}
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
