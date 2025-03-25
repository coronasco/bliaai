import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebaseAdmin";

/**
 * POST: Activate a specific roadmap and deactivate all others
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Extract roadmap ID and user ID from request body
    const body = await req.json();
    const { roadmapId, userId } = body;
    
    console.log("[DEBUG API-ACTIVATE] Starting activation process:", { roadmapId, userId });
    
    // Validate input
    if (!roadmapId || typeof roadmapId !== 'string') {
      return NextResponse.json(
        { error: "Invalid roadmap ID" }, 
        { status: 400 }
      );
    }
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: "Invalid user ID" }, 
        { status: 400 }
      );
    }
    
    // Check if the roadmap exists and belongs to the user
    console.log("[DEBUG API-ACTIVATE] Checking if roadmap exists using Admin SDK:", roadmapId);
    const roadmapDocRef = adminDb.collection('roadmaps').doc(roadmapId);
    const roadmapDoc = await roadmapDocRef.get();
    
    if (!roadmapDoc.exists) {
      console.log("[DEBUG API-ACTIVATE] Roadmap not found:", roadmapId);
      return NextResponse.json(
        { error: "Roadmap not found" }, 
        { status: 404 }
      );
    }
    
    const roadmapData = roadmapDoc.data();
    if (!roadmapData) {
      console.log("[DEBUG API-ACTIVATE] Roadmap has no data:", roadmapId);
      return NextResponse.json(
        { error: "Roadmap data not found" }, 
        { status: 404 }
      );
    }
    
    console.log("[DEBUG API-ACTIVATE] Roadmap found:", { 
      roadmapId, 
      ownerId: roadmapData.userId,
      requesterId: userId,
      isOwner: roadmapData.userId === userId 
    });
    
    if (roadmapData.userId !== userId) {
      console.log("[DEBUG API-ACTIVATE] Permission denied - user is not the owner");
      return NextResponse.json(
        { error: "You don't have permission to activate this roadmap" }, 
        { status: 403 }
      );
    }
    
    // Get all user roadmaps to deactivate them
    console.log("[DEBUG API-ACTIVATE] Getting all user roadmaps for userId using Admin SDK:", userId);
    const roadmapsQuery = adminDb.collection('roadmaps').where('userId', '==', userId);
    const querySnapshot = await roadmapsQuery.get();
    
    if (querySnapshot.empty) {
      console.log("[DEBUG API-ACTIVATE] No roadmaps found for user:", userId);
      return NextResponse.json(
        { error: "No roadmaps found for user" }, 
        { status: 404 }
      );
    }
    
    console.log("[DEBUG API-ACTIVATE] Found roadmaps for user:", { count: querySnapshot.size });
    
    try {
      // Use a batch to update all roadmaps in a single transaction
      console.log("[DEBUG API-ACTIVATE] Starting batch operation with Admin SDK");
      const batch = adminDb.batch();
      
      // First, deactivate all roadmaps
      let deactivatedCount = 0;
      querySnapshot.forEach(doc => {
        if (doc.id !== roadmapId) { // Skip the roadmap we want to activate
          batch.update(doc.ref, { 
            isActive: false,
            updatedAt: new Date()
          });
          deactivatedCount++;
        }
      });
      
      console.log("[DEBUG API-ACTIVATE] Prepared batch updates:", { 
        deactivatedCount,
        toActivate: roadmapId
      });
      
      // Then, activate the selected roadmap
      batch.update(roadmapDocRef, { 
        isActive: true,
        updatedAt: new Date()
      });
      
      // Commit the batch
      console.log("[DEBUG API-ACTIVATE] Committing batch updates with Admin SDK");
      await batch.commit();
      console.log("[DEBUG API-ACTIVATE] Batch commit successful");
      
      return NextResponse.json({ 
        success: true,
        message: "Roadmap activated successfully",
        roadmapId
      });
    } catch (batchError) {
      console.error("[DEBUG API-ACTIVATE] Error in batch operation:", batchError);
      
      // Log detailed error info
      if (batchError instanceof Error) {
        console.error("[DEBUG API-ACTIVATE] Error details:", {
          name: batchError.name,
          message: batchError.message,
          stack: batchError.stack
        });
      }
      
      return NextResponse.json(
        { 
          error: "Could not update roadmap status", 
          details: batchError instanceof Error ? batchError.message : String(batchError) 
        }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("[DEBUG API-ACTIVATE] Error activating roadmap:", error);
    
    // Log detailed error info
    if (error instanceof Error) {
      console.error("[DEBUG API-ACTIVATE] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      { 
        error: "Could not activate roadmap", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 