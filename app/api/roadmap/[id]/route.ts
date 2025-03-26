import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * GET: Obține un roadmap public după ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const roadmapId = params.id;
    
    if (!roadmapId) {
      return NextResponse.json(
        { error: "Roadmap ID is required" }, 
        { status: 400 }
      );
    }
    
    // Obținem documentul roadmap din Firestore
    const roadmapRef = doc(db, "roadmaps", roadmapId);
    const roadmapSnap = await getDoc(roadmapRef);
    
    // Verificăm dacă roadmap-ul există
    if (!roadmapSnap.exists()) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }
    
    // Obținem datele roadmap-ului
    const roadmapData = roadmapSnap.data();
    
    // Verificăm dacă roadmap-ul este public
    if (!roadmapData.isPublic) {
      return NextResponse.json(
        { error: "This roadmap is not public" },
        { status: 403 }
      );
    }
    
    // Creăm obiectul de răspuns
    const roadmap = {
      id: roadmapId,
      ...roadmapData,
      // Convertim timestamp-urile la stringuri ISO pentru serializare JSON
      createdAt: roadmapData.createdAt ? roadmapData.createdAt.toDate().toISOString() : null,
      updatedAt: roadmapData.updatedAt ? roadmapData.updatedAt.toDate().toISOString() : null
    };
    
    // Returnăm roadmap-ul
    return NextResponse.json({
      success: true,
      roadmap: roadmap
    });
    
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmap", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 