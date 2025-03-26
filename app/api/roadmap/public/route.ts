import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, orderBy, limit as limitQuery, 
  getDocs, startAfter, getDoc, doc 
} from "firebase/firestore";

// Interfață pentru roadmap public
interface PublicRoadmap {
  id: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  createdAt: string | null;
  updatedAt: string | null;
  difficulty: string;
  requiredSkills: string[];
  popularity: number;
  tags: string[];
}

/**
 * GET: Obține roadmap-uri publice, cu opțiuni de sortare și filtrare
 * Query params:
 * - query: string - pentru căutare după titlu
 * - sort: 'popularity' | 'recent' - pentru sortare
 * - limit: number - pentru limitarea numărului de rezultate
 * - lastDocId: string - pentru paginare
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Extragem parametrii din query
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get('query') || '';
    const sort = searchParams.get('sort') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '10');
    const lastDocId = searchParams.get('lastDocId');
    
    // Log parametrii pentru debug
    console.log("[DEBUG API PUBLIC] Getting public roadmaps:", { searchQuery, sort, limit, lastDocId });
    
    // Construim query-ul de bază
    let roadmapsQuery = query(
      collection(db, "roadmaps"),
      where("isPublic", "==", true)
    );
    
    // Adăugăm sortarea
    if (sort === 'popularity') {
      roadmapsQuery = query(
        roadmapsQuery,
        orderBy("popularity", "desc")
      );
    } else {
      roadmapsQuery = query(
        roadmapsQuery,
        orderBy("createdAt", "desc")
      );
    }
    
    // Adăugăm căutarea după titlu dacă există
    if (searchQuery) {
      // Inițializăm un nou query pentru căutare, păstrând sortarea
      let searchOrderBy = "createdAt";
      const searchDirection: "asc" | "desc" = "desc";
      
      if (sort === 'popularity') {
        searchOrderBy = "popularity";
      }
      
      roadmapsQuery = query(
        collection(db, "roadmaps"),
        where("isPublic", "==", true),
        where("title", ">=", searchQuery),
        where("title", "<=", searchQuery + "\uf8ff"),
        orderBy("title"),
        orderBy(searchOrderBy, searchDirection)
      );
    }
    
    // Adăugăm lastDocId pentru paginare dacă există
    if (lastDocId) {
      const lastDocRef = doc(db, "roadmaps", lastDocId);
      const lastDocSnap = await getDoc(lastDocRef);
      
      if (lastDocSnap.exists()) {
        roadmapsQuery = query(
          roadmapsQuery,
          startAfter(lastDocSnap)
        );
      }
    }
    
    // Adăugăm limita
    roadmapsQuery = query(
      roadmapsQuery,
      limitQuery(limit)
    );
    
    // Executăm query-ul
    const querySnapshot = await getDocs(roadmapsQuery);
    const roadmaps: PublicRoadmap[] = [];
    
    // Procesăm rezultatele
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      roadmaps.push({
        id: doc.id,
        title: data.title || "Untitled Roadmap",
        description: data.description || "",
        userId: data.userId,
        userName: data.userName || "Anonymous",
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        difficulty: data.difficulty || "beginner",
        requiredSkills: data.requiredSkills || [],
        popularity: data.popularity || 0,
        tags: data.tags || []
      });
    });
    
    // Creăm obiectul de răspuns
    return NextResponse.json({
      success: true,
      roadmaps: roadmaps,
      hasMore: roadmaps.length === limit,
      total: roadmaps.length
    });
    
  } catch (error) {
    console.error("Error fetching public roadmaps:", error);
    return NextResponse.json(
      { error: "Failed to fetch public roadmaps", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 