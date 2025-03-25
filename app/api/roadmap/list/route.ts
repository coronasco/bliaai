import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

// Definim interfața pentru timestamp Firestore
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
  toDate?: () => Date;
}

// Definim interfața pentru substructura roadmap 
interface RoadmapData {
  title?: string;
  description?: string;
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    subtasks?: Array<{
      id: string;
      title: string;
      description?: string;
      completed?: boolean;
    }>;
  }>;
  experienceLevel?: string;
  requiredSkills?: string[];
  [key: string]: string | boolean | Date | object | string[] | undefined;
}

// Definim interfața pentru documentul Firestore
interface FirestoreRoadmapDoc {
  userId: string;
  title?: string;
  isActive?: boolean;
  createdAt: FirestoreTimestamp | Timestamp;
  updatedAt: FirestoreTimestamp | Timestamp;
  description?: string;
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    subtasks?: Array<{
      id: string;
      title: string;
      description?: string;
      completed?: boolean;
    }>;
  }>;
  isPublic?: boolean;
  requiredSkills?: string[];
  experienceLevel?: string;
  roadmap?: RoadmapData;
  [key: string]: unknown;
}

// Definim interfața pentru roadmap
interface Roadmap {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    subtasks?: Array<{
      id: string;
      title: string;
      description?: string;
      completed?: boolean;
    }>;
  }>;
  isPublic?: boolean;
  requiredSkills?: string[];
  experienceLevel?: string;
  roadmap?: RoadmapData; // Câmp pentru structura nestată
  [key: string]: string | boolean | Date | Array<string | object | boolean> | object | undefined;
}

/**
 * Convertește un timestamp Firestore într-un Date
 */
function convertTimestamp(timestamp: FirestoreTimestamp | Timestamp | undefined): Date {
  if (!timestamp) return new Date();
  
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  if ('_seconds' in timestamp) {
    return new Date(timestamp._seconds * 1000);
  }
  
  return new Date();
}

/**
 * GET: Get all roadmaps for a specific user
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Get the user ID from the query parameters
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      console.error("[DEBUG API-LIST] No userId provided in request");
      return NextResponse.json(
        { error: "User ID is required" }, 
        { status: 400 }
      );
    }
    
    console.log("[DEBUG API-LIST] Loading roadmaps for user:", userId);
    
    try {
      // Folosim Admin SDK pentru a face interogarea
      console.log("[DEBUG API-LIST] Using Admin SDK to query roadmaps");
      
      // Build the query using admin SDK
      const roadmapsQuery = adminDb
        .collection('roadmaps')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');
      
      console.log("[DEBUG API-LIST] Built query with Admin SDK for userId:", userId);
      
      // Execute the query
      const querySnapshot = await roadmapsQuery.get();
      
      // Process results
      const roadmaps = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirestoreRoadmapDoc;        
        // Convertim timestamps-urile Firestore în Date objects
        const createdAt = convertTimestamp(data.createdAt);
        const updatedAt = convertTimestamp(data.updatedAt);
        
        // Verificăm dacă datele sunt nestuite într-un câmp "roadmap"
        // sau dacă există direct în document
        let finalData: Record<string, unknown> = { ...data };
        
        // Dacă avem un câmp roadmap și titlul principal lipsește, preluăm datele din substructură
        if (data.roadmap && typeof data.roadmap === 'object' && !data.title && data.roadmap.title) {
          
          const roadmapData = data.roadmap;
          
          // Combinăm datele principale cu cele din câmpul roadmap
          finalData = {
            ...data,
            title: roadmapData.title || 'Untitled Roadmap',
            description: roadmapData.description || data.description,
            sections: roadmapData.sections || data.sections,
            experienceLevel: roadmapData.experienceLevel || data.experienceLevel,
            requiredSkills: roadmapData.requiredSkills || data.requiredSkills
          };
        } else if (!data.title) {
          // Dacă tot nu avem titlu, punem unul default
          finalData.title = 'Untitled Roadmap';
        }
        
        return {
          id: doc.id,
          ...finalData,
          createdAt,
          updatedAt
        } as Roadmap;
      });
      
      console.log("[DEBUG API-LIST] Processed roadmaps with Admin SDK:", {
        count: roadmaps.length,
        roadmaps: roadmaps.map(rm => ({
          id: rm.id,
          title: rm.title,
          userId: rm.userId,
          isActive: rm.isActive
        }))
      });
      
      return NextResponse.json({ 
        roadmaps,
        total: roadmaps.length
      });
      
    } catch (firestoreError) {
      console.error("[DEBUG API-LIST] Firestore Admin SDK error:", firestoreError);
      // Logăm mai multe detalii despre eroare
      if (firestoreError instanceof Error) {
        console.error("[DEBUG API-LIST] Error name:", firestoreError.name);
        console.error("[DEBUG API-LIST] Error message:", firestoreError.message);
        console.error("[DEBUG API-LIST] Error stack:", firestoreError.stack);
      }
      return NextResponse.json(
        { 
          error: "Database error", 
          details: firestoreError instanceof Error ? firestoreError.message : String(firestoreError) 
        }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("[DEBUG API-LIST] General error:", error);
    if (error instanceof Error) {
      console.error("[DEBUG API-LIST] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { 
        error: "Could not load roadmaps", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 