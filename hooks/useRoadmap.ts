import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { MainTaskType } from '@/lib/openai';

// Tipul returnat de hook
interface RoadmapDataState {
  roadmap: LocalRoadmapType | null;
  detailedRoadmap: DetailedRoadmapType | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
}

// Interfață pentru funcțiile de manipulare a roadmap-ului
interface RoadmapHandlers {
  handleDeleteRoadmap: () => Promise<boolean>;
  handleGeneratePathForSubtask: (sectionIndex: number, subtaskIndex: number, description: string) => Promise<string | null>;
  saveRoadmapToLocalStorage: (data: Record<string, unknown>, id: string, userId?: string) => boolean;
  loadRoadmapFromLocalStorage: () => { data: Record<string, unknown>, id: string } | null;
  saveRoadmapToFirebase: (roadmapData: ApiRoadmapResponse) => Promise<string | null>;
}

// Definiția tipurilor pentru roadmap
interface RoadmapSubsection {
  title: string;
  completed: boolean;
  relatedPathId?: string;
  pathId?: string;
  isPending?: boolean;
}

interface RoadmapSection {
  title: string;
  progress: number;
  subsections: RoadmapSubsection[];
}

interface LocalRoadmapType {
  id?: string;
  title?: string;
  requiredSkills?: string[];
  sections?: RoadmapSection[];
}

// Interfața pentru roadmap-ul detaliat
interface DetailedRoadmapType {
  sections?: MainTaskType[];
  requiredSkills?: string[];
  careerDescription?: string;
}

// Definim tipurile pentru datele primite de la API
interface ApiRoadmapResponse {
  roadmap: ApiRoadmapSection[];
  careerTitle?: string;
  careerDescription?: string;
  requiredSkills?: string[];
}

interface ApiRoadmapSection {
  title: string;
  description?: string;
  subtasks: ApiRoadmapSubtask[];
}

interface ApiRoadmapSubtask {
  title: string;
  description?: string;
}

/**
 * Custom hook pentru gestionarea roadmap-urilor
 * @param user Utilizatorul curent
 * @returns Un array cu starea roadmap-ului și funcțiile pentru manipularea acestuia
 */
export function useRoadmap(user: User | null): [RoadmapDataState, RoadmapHandlers] {
  const [roadmap, setRoadmap] = useState<LocalRoadmapType | null>(null);
  const [detailedRoadmap, setDetailedRoadmap] = useState<DetailedRoadmapType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoadmapId, setUserRoadmapId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Efectul pentru încărcarea roadmap-ului
  useEffect(() => {
    const loadRoadmap = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Verificăm dacă userul are un roadmap existent
        const userDocRef = doc(db, "customers", user.uid);
        let userDoc;
        
        try {
          userDoc = await getDoc(userDocRef);
        } catch (error) {
          console.error("Error reading user document:", error);
          setError("Could not access user profile.");
          setLoading(false);
          return;
        }

        // Dacă documentul nu există, nu avem roadmap
        if (!userDoc.exists()) {
          console.log("Documentul utilizatorului nu există în Firestore.");
          // Folosim doar localStorage dacă documentul nu există
          checkLocalStorage();
          return;
        }
        
        const userData = userDoc.data();
        
        if (userData?.roadmapId) {
          setUserRoadmapId(userData.roadmapId);
          
          try {
            // Încărcăm roadmap-ul din Firestore
            const roadmapDocRef = doc(db, "roadmaps", userData.roadmapId);
            const roadmapDoc = await getDoc(roadmapDocRef);
            
            if (roadmapDoc.exists()) {
              const roadmapData = roadmapDoc.data();
              setRoadmap(roadmapData.roadmap || null);
              setDetailedRoadmap(roadmapData.detailedRoadmap || null);
              setIsOwner(roadmapData.userId === user.uid);
            } else {
              console.log("Documentul roadmap nu există în Firestore.");
              setRoadmap(null);
              setDetailedRoadmap(null);
              // Verificăm localStorage dacă nu avem roadmap în Firestore
              checkLocalStorage();
            }
          } catch (error) {
            console.error("Error reading roadmap from Firestore:", error);
            setError("Could not access roadmap. Check your internet connection.");
            // Verificăm localStorage în caz de eroare
            checkLocalStorage();
          }
        } else {
          console.log("Utilizatorul nu are asociat un roadmapId.");
          // Verificăm localStorage dacă nu avem roadmapId
          checkLocalStorage();
        }
      } catch (error) {
        console.error('Error loading roadmap:', error);
        setError('Could not load roadmap. Please try again.');
        // Încercăm să încărcăm din localStorage în caz de eroare
        checkLocalStorage();
      } finally {
        setLoading(false);
      }
    };
    
    // Funcție pentru verificarea localStorage
    const checkLocalStorage = () => {
      // Verificăm dacă există un roadmap local salvat
      const localRoadmap = localStorage.getItem('localRoadmap');
      
      if (localRoadmap) {
        try {
          const parsedRoadmap = JSON.parse(localRoadmap);
          setRoadmap(parsedRoadmap);
          setIsOwner(true);
        } catch (error) {
          console.error('Eroare la parsarea roadmap-ului local:', error);
          localStorage.removeItem('localRoadmap');
          setRoadmap(null);
        }
      } else {
        setRoadmap(null);
      }
    };
    
    loadRoadmap();
  }, [user]);

  // Funcția de ștergere a roadmap-ului
  const handleDeleteRoadmap = async () => {
    if (!user || !roadmap) return false;
    
    try {
      // Ștergem roadmap-ul din Firestore dacă există și utilizatorul este proprietarul
      if (userRoadmapId && isOwner) {
        // Ștergem documentul roadmap
        await deleteDoc(doc(db, "roadmaps", userRoadmapId));
        
        // Actualizăm documentul utilizatorului pentru a elimina referința la roadmap
        const userDocRef = doc(db, "customers", user.uid);
        await updateDoc(userDocRef, {
          roadmapId: null
        });
      }
      
      // Resetăm starea
      setRoadmap(null);
      setDetailedRoadmap(null);
      setUserRoadmapId(null);
      
      // Ștergem și din localStorage
      localStorage.removeItem('localRoadmap');
      
      return true;
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      setError("Could not delete roadmap. Please try again.");
      return false;
    }
  };
  
  // Funcția pentru generarea path-ului pentru un subtask
  const handleGeneratePathForSubtask = async (sectionIndex: number, subtaskIndex: number, description: string) => {
    if (!user || !roadmap) return null;
    
    try {
      // Verificăm dacă roadmap-ul are secțiunile și subtask-urile necesare
      if (!roadmap.sections || 
          !roadmap.sections[sectionIndex] || 
          !roadmap.sections[sectionIndex].subsections || 
          !roadmap.sections[sectionIndex].subsections[subtaskIndex]) {
        console.error("Invalid section or subtask index:", sectionIndex, subtaskIndex);
        setError("Secțiunea sau subtask-ul nu există.");
        return null;
      }
      
      // Obținem titlul și descrierea subtask-ului
      const section = roadmap.sections[sectionIndex];
      const subtask = section.subsections[subtaskIndex];
      
      // Marcăm subtask-ul ca fiind în curs de generare
      const updatedSections = [...(roadmap.sections || [])];
      updatedSections[sectionIndex].subsections[subtaskIndex].isPending = true;
      
      // Actualizăm starea locală
      setRoadmap({
        ...roadmap,
        sections: updatedSections
      });
      
      // Apelăm API-ul pentru a genera path-ul
      const response = await fetch('/api/path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: subtask.title,
          description: description,
          userId: user.uid,
          sectionIndex,
          subtaskIndex,
          roadmapId: userRoadmapId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }
      
      const pathData = await response.json();
      
      if (!pathData || !pathData.id) {
        throw new Error('Invalid path data returned from API');
      }
      
      // Actualizăm roadmap-ul cu referința la noul path
      updatedSections[sectionIndex].subsections[subtaskIndex].pathId = pathData.id;
      updatedSections[sectionIndex].subsections[subtaskIndex].isPending = false;
      
      const updatedRoadmap = {
        ...roadmap,
        sections: updatedSections
      };
      
      // Actualizăm starea locală
      setRoadmap(updatedRoadmap);
      
      // Actualizăm roadmap-ul în Firestore dacă există
      if (userRoadmapId) {
        await updateDoc(doc(db, "roadmaps", userRoadmapId), {
          roadmap: updatedRoadmap
        });
      }
      
      return pathData.id;
    } catch (error) {
      console.error("Error generating path for subtask:", error);
      setError("Could not generate path for subtask. Please try again.");
      
      // Resetăm starea pending în caz de eroare
      if (roadmap.sections && 
          roadmap.sections[sectionIndex] && 
          roadmap.sections[sectionIndex].subsections && 
          roadmap.sections[sectionIndex].subsections[subtaskIndex]) {
        const updatedSections = [...(roadmap.sections || [])];
        updatedSections[sectionIndex].subsections[subtaskIndex].isPending = false;
        
        setRoadmap({
          ...roadmap,
          sections: updatedSections
        });
      }
      
      return null;
    }
  };

  // Funcție pentru salvarea roadmap-ului în Firebase
  const saveRoadmapToFirebase = async (roadmapData: ApiRoadmapResponse): Promise<string | null> => {
    if (!user) {
      console.error("Nu există utilizator autentificat pentru a salva roadmap-ul");
      return null;
    }
    
    try {
      console.log("Salvez roadmap în Firebase pentru utilizatorul:", user.uid);
      console.log("Date primite pentru salvare:", JSON.stringify(roadmapData).slice(0, 200) + "...");
      
      // Verificăm structura datelor primite
      if (!roadmapData || !roadmapData.roadmap) {
        console.error("Structura roadmap-ului este invalidă:", roadmapData);
        throw new Error("Structura roadmap-ului este invalidă pentru salvare");
      }
      
      // Verificăm dacă roadmap-ul conține secțiuni
      if (!Array.isArray(roadmapData.roadmap) || roadmapData.roadmap.length === 0) {
        console.error("Roadmap-ul nu conține secțiuni pentru salvare");
        throw new Error("Roadmap-ul nu conține secțiuni pentru salvare");
      }
      
      // Cream structura roadmap-ului conform interfeței LocalRoadmapType
      const processedRoadmap: LocalRoadmapType = {
        id: userRoadmapId || undefined,
        title: roadmapData.careerTitle || "Career Roadmap",
        requiredSkills: Array.isArray(roadmapData.requiredSkills) ? roadmapData.requiredSkills : [],
        sections: roadmapData.roadmap.map((stage) => {
          // Cream secțiune conformă cu interfața
          const section: RoadmapSection = {
            title: stage.title || "",
            progress: 0,
            subsections: []
          };
          
          // Verificăm și adăugăm subtask-urile
          if (Array.isArray(stage.subtasks)) {
            section.subsections = stage.subtasks.map((subtask) => {
              // Cream subtask conform cu interfața
              const roadmapSubsection: RoadmapSubsection = {
                title: subtask.title || "",
                completed: false,
                isPending: false
              };
              return roadmapSubsection;
            });
          }
          
          return section;
        })
      };
      
      // Cream structura detailedRoadmap conform interfeței DetailedRoadmapType
      const detailedRoadmapData: DetailedRoadmapType = {
        careerDescription: roadmapData.careerDescription || "",
        requiredSkills: Array.isArray(roadmapData.requiredSkills) ? roadmapData.requiredSkills : [],
        sections: roadmapData.roadmap.map((stage) => {
          // Transformăm secțiunea în formatul MainTaskType
          const subtasks = Array.isArray(stage.subtasks) 
            ? stage.subtasks.map((subtask) => ({
                title: subtask.title || "",
                description: subtask.description || "",
                lessons: [],
                finalTest: {
                  title: "Final Test",
                  description: `Test for ${subtask.title}`,
                  questions: [],
                  isPassed: false,
                  attemptsCount: 0
                },
                completed: false
              }))
            : [];
        
          return {
            title: stage.title || "",
            description: stage.description || "",
            progress: 0,
            subtasks
          };
        })
      };
      
      let roadmapId = userRoadmapId;
      
      console.log("Structură procesată pentru Firebase:", {
        roadmapTitle: processedRoadmap.title,
        roadmapSectionsCount: processedRoadmap.sections?.length,
        detailedRoadmapSectionsCount: detailedRoadmapData.sections?.length
      });
      
      // Dacă utilizatorul nu are deja un roadmap, creăm unul nou
      if (!roadmapId) {
        // Creăm document în colecția roadmaps
        const roadmapData = {
          userId: user.uid,
          createdAt: new Date(),
          roadmap: processedRoadmap,
          detailedRoadmap: detailedRoadmapData
        };
        
        console.log("Creez document nou în colecția roadmaps");
        const roadmapRef = await addDoc(collection(db, "roadmaps"), roadmapData);
        
        roadmapId = roadmapRef.id;
        console.log("Roadmap nou creat cu ID:", roadmapId);
        
        // Actualizăm documentul utilizatorului cu referința la noul roadmap
        const userDocRef = doc(db, "customers", user.uid);
        
        try {
          // Verificăm dacă documentul există înainte de a încerca să-l actualizăm
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            console.log("Document utilizator găsit, actualizez cu roadmapId");
            await updateDoc(userDocRef, {
              roadmapId: roadmapId
            });
            console.log("Document utilizator actualizat cu noul roadmapId");
          } else {
            // Dacă documentul nu există, îl creăm
            console.log("Document utilizator nu există, creez unul nou");
            await setDoc(userDocRef, {
              roadmapId: roadmapId,
              email: user.email,
              createdAt: new Date()
            });
            console.log("Document utilizator nou creat cu roadmapId");
          }
        } catch (error) {
          console.error("Error updating user document:", error);
          throw new Error("Could not update user profile.");
        }
      } else {
        // Actualizăm documentul existent
        console.log("Actualizez document existent în colecția roadmaps cu ID:", roadmapId);
        const roadmapDocRef = doc(db, "roadmaps", roadmapId);
        
        await updateDoc(roadmapDocRef, {
          roadmap: processedRoadmap,
          detailedRoadmap: detailedRoadmapData,
          updatedAt: new Date()
        });
        console.log("Roadmap existent actualizat cu succes");
      }
      
      // Actualizăm starea locală
      setRoadmap(processedRoadmap);
      setDetailedRoadmap(detailedRoadmapData);
      setUserRoadmapId(roadmapId);
      setIsOwner(true);
      
      // Creem și un backup în localStorage pentru siguranță
      console.log("Salvez backup în localStorage");
      const roadmapForLocalStorage = {
        ...processedRoadmap,
        sections: processedRoadmap.sections || []
      };
      saveRoadmapToLocalStorage(roadmapForLocalStorage as Record<string, unknown>, roadmapId, user.uid);
      
      return roadmapId;
    } catch (error) {
      console.error("Error saving roadmap to Firebase:", error);
      setError("Could not save roadmap. Please try again.");
      return null;
    }
  };

  // Funcție pentru salvarea roadmap-ului în localStorage cu verificări de siguranță
  const saveRoadmapToLocalStorage = (data: Record<string, unknown>, id: string, userId?: string) => {
    try {
      if (!data || typeof data !== 'object') {
        console.error("Cannot save invalid roadmap data to localStorage:", data);
        return false;
      }
      
      // Salvăm datele în localStorage
      localStorage.setItem('userRoadmapData', JSON.stringify(data));
      localStorage.setItem('userCurrentRoadmapId', id);
      
      if (userId) {
        localStorage.setItem('userRoadmapOwnerId', userId);
      }
      
      // Salvăm și un backup pentru siguranță
      localStorage.setItem('userRoadmapData_backup', JSON.stringify(data));
      localStorage.setItem('roadmapLastUpdated', new Date().toISOString());
      
      console.log("Roadmap salvat în localStorage cu succes!");
      return true;
    } catch (error) {
      console.error("Eroare la salvarea roadmap-ului în localStorage:", error);
      return false;
    }
  };

  // Funcție pentru încărcarea sigură a roadmap-ului din localStorage
  const loadRoadmapFromLocalStorage = () => {
    try {
      const storedRoadmap = localStorage.getItem('userRoadmapData');
      const storedRoadmapId = localStorage.getItem('userCurrentRoadmapId');
      
      if (!storedRoadmap || !storedRoadmapId) {
        console.log("Nu există date de roadmap în localStorage");
        return null;
      }
      
      // Verificăm dacă JSON-ul este valid
      try {
        const parsedRoadmap = JSON.parse(storedRoadmap);
        
        // Verificăm structura roadmap-ului
        if (!parsedRoadmap || typeof parsedRoadmap !== 'object') {
          console.error("Invalid roadmap structure in localStorage");
          return null;
        }
        
        // Verificăm dacă avem secțiuni
        if (!Array.isArray(parsedRoadmap.sections) || parsedRoadmap.sections.length === 0) {
          console.error("Roadmap from localStorage has no sections");
          
          // Încercăm să recuperăm din backup dacă există
          const backupRoadmap = localStorage.getItem('userRoadmapData_backup');
          if (backupRoadmap) {
            try {
              const parsedBackup = JSON.parse(backupRoadmap);
              if (parsedBackup && 
                  typeof parsedBackup === 'object' && 
                  Array.isArray(parsedBackup.sections) && 
                  parsedBackup.sections.length > 0) {
                console.log("Recuperare reușită din backup!");
                return {
                  data: parsedBackup,
                  id: storedRoadmapId
                };
              }
            } catch (backupError) {
              console.error("Eroare la parsarea backup-ului:", backupError);
            }
          }
          
          return null;
        }
        
        console.log("Roadmap încărcat cu succes din localStorage");
        return {
          data: parsedRoadmap,
          id: storedRoadmapId
        };
      } catch (parseError) {
        console.error("Eroare la parsarea roadmap-ului din localStorage:", parseError);
        return null;
      }
    } catch (error) {
      console.error("Eroare la accesarea localStorage:", error);
      return null;
    }
  };

  // Returnăm starea și funcțiile
  return [
    {
      roadmap,
      detailedRoadmap,
      loading,
      error,
      isOwner
    },
    {
      handleDeleteRoadmap,
      handleGeneratePathForSubtask,
      saveRoadmapToLocalStorage,
      loadRoadmapFromLocalStorage,
      saveRoadmapToFirebase
    }
  ];
} 