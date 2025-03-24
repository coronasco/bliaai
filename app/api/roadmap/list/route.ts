import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

/**
 * GET: Get all roadmaps for a specific user
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Get the user ID from the query parameters
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" }, 
        { status: 400 }
      );
    }
    
    console.log("[DEBUG API] Loading roadmaps for user:", userId);
    
    // Query roadmaps for this user
    const roadmapsQuery = query(
      collection(db, "roadmaps"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    // Get all roadmaps
    const querySnapshot = await getDocs(roadmapsQuery);
    
    console.log("[DEBUG API] Roadmaps query results:", {
      count: querySnapshot.size,
      docs: querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
        // Inspectăm detalii critice
        userId: doc.data().userId,
        roadmapData: doc.data().roadmap ? 'exists' : 'missing',
        nestedRoadmapUserId: doc.data().roadmap?.userId
      }))
    });
    
    // Process results
    const roadmaps = querySnapshot.docs.map(doc => {
      // Verificăm structura documentului
      const data = doc.data();
      let roadmapData;
      
      // Unele roadmap-uri pot avea datele stocate în câmpul "roadmap"
      if (data.roadmap && typeof data.roadmap === 'object') {
        roadmapData = {
          id: doc.id,
          ...data.roadmap,
          userId: data.userId || data.roadmap.userId, // Asigură-te că userId este păstrat
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      } else {
        // Altele pot avea datele direct în document
        roadmapData = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      }
      
      return roadmapData;
    });
    
    console.log("[DEBUG API] Processed roadmaps:", {
      count: roadmaps.length,
      first: roadmaps.length > 0 ? {
        id: roadmaps[0].id,
        title: roadmaps[0].title,
        userId: roadmaps[0].userId,
        sections: Array.isArray(roadmaps[0].sections) ? roadmaps[0].sections.length : 'not an array'
      } : 'no roadmaps'
    });
    
    return NextResponse.json({ 
      roadmaps,
      total: roadmaps.length
    });
    
  } catch (error) {
    console.error("Error loading roadmaps:", error);
    return NextResponse.json(
      { error: "Could not load roadmaps", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 