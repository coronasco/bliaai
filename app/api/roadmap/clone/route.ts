import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * POST: Clone a public roadmap for the authenticated user
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Extract roadmap ID and user ID from request body
    const { roadmapId, userId } = await req.json();
    
    if (!roadmapId || !userId) {
      return NextResponse.json(
        { error: "Roadmap ID and user ID are required" }, 
        { status: 400 }
      );
    }
    
    // Get original roadmap
    const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
    
    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: "Roadmap not found" }, 
        { status: 404 }
      );
    }
    
    const roadmapData = roadmapDoc.data();
    
    // Check if roadmap is public
    if (!roadmapData.isPublic) {
      return NextResponse.json(
        { error: "This roadmap is not public and cannot be cloned" }, 
        { status: 403 }
      );
    }
    
    // Create a copy of the roadmap for the current user
    const roadmapCopy = {
      ...roadmapData,
      userId: userId,                     // Set new owner
      originalRoadmapId: roadmapId,       // Reference to original
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: false                     // Cloned roadmap is not public by default
    };
    
    // Save new roadmap to Firestore
    const newRoadmapRef = await addDoc(collection(db, "roadmaps"), roadmapCopy);
    
    // Record cloning for statistics
    await addDoc(collection(db, "roadmap_clones"), {
      userId: userId,
      originalRoadmapId: roadmapId,
      newRoadmapId: newRoadmapRef.id,
      clonedAt: serverTimestamp()
    });
    
    // Return new roadmap details
    return NextResponse.json({
      success: true,
      message: "Roadmap cloned successfully",
      roadmap: {
        ...roadmapData.roadmap,
        id: newRoadmapRef.id
      }
    });
    
  } catch (error) {
    console.error("Error cloning roadmap:", error);
    return NextResponse.json(
      { error: "Could not clone roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 