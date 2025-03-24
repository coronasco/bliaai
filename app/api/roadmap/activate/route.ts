import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, writeBatch, getDoc } from "firebase/firestore";

/**
 * POST: Activate a specific roadmap and deactivate all others
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
    
    // Check if the roadmap exists and belongs to the user
    const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
    
    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: "Roadmap not found" }, 
        { status: 404 }
      );
    }
    
    const roadmapData = roadmapDoc.data();
    
    if (roadmapData.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to activate this roadmap" }, 
        { status: 403 }
      );
    }
    
    // Get all user roadmaps to deactivate them
    const roadmapsRef = collection(db, "roadmaps");
    const q = query(roadmapsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    // Use a batch to update all roadmaps in a single transaction
    const batch = writeBatch(db);
    
    // First, deactivate all roadmaps
    querySnapshot.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    
    // Then, activate the selected roadmap
    batch.update(doc(db, "roadmaps", roadmapId), { isActive: true });
    
    // Commit the batch
    await batch.commit();
    
    return NextResponse.json({ 
      success: true,
      message: "Roadmap activated successfully"
    });
    
  } catch (error) {
    console.error("Error activating roadmap:", error);
    return NextResponse.json(
      { error: "Could not activate roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 