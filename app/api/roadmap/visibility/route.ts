import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/**
 * POST: Change roadmap visibility (public/private)
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Extract roadmap ID and visibility state from request body
    const { roadmapId, isPublic, userId } = await req.json();
    
    if (!roadmapId || isPublic === undefined || !userId) {
      return NextResponse.json(
        { error: "Roadmap ID, user ID and visibility state are required" }, 
        { status: 400 }
      );
    }
    
    // Get roadmap from Firestore
    const roadmapRef = doc(db, "roadmaps", roadmapId);
    const roadmapDoc = await getDoc(roadmapRef);
    
    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: "Roadmap not found" }, 
        { status: 404 }
      );
    }
    
    const roadmapData = roadmapDoc.data();
    
    // Check if user is the roadmap owner
    if (roadmapData.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to modify this roadmap" }, 
        { status: 403 }
      );
    }
    
    // Update visibility state
    await updateDoc(roadmapRef, {
      isPublic: isPublic,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: isPublic 
        ? "Roadmap is now public" 
        : "Roadmap is now private"
    });
    
  } catch (error) {
    console.error("Error changing roadmap visibility:", error);
    return NextResponse.json(
      { error: "Could not change roadmap visibility", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 