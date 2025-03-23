import { MainTaskType, SubTaskType } from './openai';

/**
 * Tipul pentru roadmap-ul simplificat folosit pentru afișare
 */
export interface RoadmapType {
  id: string;
  title: string;
  sections: {
    title: string;
    progress: number;
    subsections: {
      title: string;
      completed: boolean;
      relatedPathId?: string;
      pathId?: string;
    }[];
  }[];
  requiredSkills?: string[];
}

/**
 * Convertește un roadmap detaliat în formatul simplificat pentru afișare
 * @param detailedRoadmap Roadmap-ul detaliat
 * @returns Roadmap-ul simplificat pentru afișare
 */
export function convertToDisplayRoadmap(detailedRoadmap: { 
  sections: MainTaskType[]; 
  requiredSkills?: string[]; 
  careerDescription?: string;
  id?: string;
  title?: string;
}): RoadmapType {
  // Verificăm dacă avem secțiuni valide
  if (!Array.isArray(detailedRoadmap.sections) || detailedRoadmap.sections.length === 0) {
    return {
      id: detailedRoadmap.id || `roadmap-${Date.now()}`,
      title: detailedRoadmap.title || 'Career Roadmap',
      sections: [],
      requiredSkills: detailedRoadmap.requiredSkills || []
    };
  }

  // Construim roadmap-ul simplificat
  return {
    id: detailedRoadmap.id || `roadmap-${Date.now()}`,
    title: detailedRoadmap.title || 'Career Roadmap',
    requiredSkills: detailedRoadmap.requiredSkills || [],
    sections: detailedRoadmap.sections.map((section: MainTaskType) => ({
      title: section.title,
      progress: section.progress,
      subsections: section.subtasks.map((subtask: SubTaskType & { pathId?: string }) => ({
        title: subtask.title,
        completed: subtask.completed,
        relatedPathId: (subtask.finalTest && subtask.finalTest.title) ? 
          subtask.finalTest.title : 'View Path',
        pathId: subtask.pathId
      }))
    }))
  };
}

/**
 * Salvează roadmap-ul în localStorage cu verificări de siguranță
 * @param data Datele roadmap-ului
 * @param id ID-ul roadmap-ului
 * @param userId ID-ul utilizatorului (opțional)
 * @returns true dacă salvarea a reușit, false în caz contrar
 */
export function saveRoadmapToLocalStorage(data: Record<string, unknown>, id: string, userId?: string): boolean {
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
}

/**
 * Încarcă roadmap-ul din localStorage
 * @returns Datele roadmap-ului și ID-ul sau null dacă nu există
 */
export function loadRoadmapFromLocalStorage(): { data: Record<string, unknown>, id: string } | null {
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
}

// Funcție pentru a curăța titluri de caractere markdown și spații
export const cleanTitle = (title: string | undefined): string => {
  if (!title) return '';
  return title.replace(/^\*+/, '').replace(/\*+$/, '').trim();
} 