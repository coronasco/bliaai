import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";

/**
 * GET: Get a specific roadmap by ID
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Get roadmap ID and user ID from the query parameters
    const roadmapId = req.nextUrl.searchParams.get("roadmapId");
    const userId = req.nextUrl.searchParams.get("userId");
    
    // Handle different request types
    if (roadmapId) {
      // Get a single roadmap by ID
      const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
      
      if (!roadmapDoc.exists()) {
        return NextResponse.json(
          { error: "Roadmap not found" }, 
          { status: 404 }
        );
      }
      
      // Obținem datele roadmap-ului
      const roadmapData = roadmapDoc.data();
      
      // Check if the user has access to this roadmap
      if (roadmapData.userId !== userId && !roadmapData.isPublic) {
        return NextResponse.json(
          { error: "You don't have access to this roadmap" }, 
          { status: 403 }
        );
      }
      
      // Verificăm dacă este un roadmap clonat (non-original) și are o referință către original
      if (roadmapData.originalRoadmapId && roadmapData.isOriginal === false) {
        console.log(`[DEBUG API] Found cloned roadmap (${roadmapId}), loading original (${roadmapData.originalRoadmapId})`);
        
        try {
          // Obținem datele din roadmap-ul original
          const originalDoc = await getDoc(doc(db, "roadmaps", roadmapData.originalRoadmapId));
          
          if (originalDoc.exists()) {
            const originalData = originalDoc.data();
            console.log(`[DEBUG API] Original roadmap (${roadmapData.originalRoadmapId}) loaded successfully`);
            
            // Actualizăm timestamp-ul de sincronizare
            await updateDoc(doc(db, "roadmaps", roadmapId), {
              lastSyncedAt: serverTimestamp()
            });
            
            // Determinăm care câmpuri să folosim de la roadmap-ul clonat și care de la original
            let responseData;
            
            // Verificăm structura roadmap-ului original
            if (originalData.roadmap && typeof originalData.roadmap === 'object') {
              // Roadmap-ul original are structură nestată (câmp "roadmap")
              responseData = {
                id: roadmapId,
                userId: roadmapData.userId,
                isActive: roadmapData.isActive,
                isPublic: roadmapData.isPublic,
                isOriginal: false,
                originalRoadmapId: roadmapData.originalRoadmapId,
                createdAt: roadmapData.createdAt,
                updatedAt: originalData.updatedAt,
                lastSyncedAt: new Date(),
                // Câmpurile roadmap-ului de la original
                ...originalData.roadmap,
                title: roadmapData.title || originalData.roadmap.title
              };
            } else {
              // Roadmap-ul original are structură plată (câmpurile direct în document)
              responseData = {
                id: roadmapId,
                userId: roadmapData.userId,
                isActive: roadmapData.isActive,
                isPublic: roadmapData.isPublic,
                isOriginal: false,
                originalRoadmapId: roadmapData.originalRoadmapId,
                createdAt: roadmapData.createdAt,
                updatedAt: originalData.updatedAt,
                lastSyncedAt: new Date(),
                // Câmpurile roadmap-ului de la original
                sections: originalData.sections,
                description: originalData.description,
                requiredSkills: originalData.requiredSkills,
                experienceLevel: originalData.experienceLevel,
                title: roadmapData.title || originalData.title
              };
            }
            
            // Returnăm datele combinate
            return NextResponse.json({
              roadmap: responseData
            });
          } else {
            console.log(`[DEBUG API] Original roadmap (${roadmapData.originalRoadmapId}) not found, using cloned data`);
          }
        } catch (originalError) {
          console.error(`[DEBUG API] Error loading original roadmap:`, originalError);
          // Vom continua cu datele roadmap-ului clonat dacă nu putem obține originalul
        }
      }
      
      // Dacă nu este clonat sau dacă nu am reușit să obținem originalul, returnăm datele proprii
      return NextResponse.json({
        roadmap: {
          id: roadmapDoc.id,
          ...roadmapData
        }
      });
    } else if (userId) {
      // Get all roadmaps for a user
      const roadmapsQuery = query(
        collection(db, "roadmaps"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(roadmapsQuery);
      const roadmaps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return NextResponse.json({ roadmaps });
    } else {
      // No valid parameters provided
      return NextResponse.json(
        { error: "Either roadmapId or userId is required" }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error getting roadmap:", error);
    return NextResponse.json(
      { error: "Could not load the roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new roadmap
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Extract roadmap data and user ID from request body
    const { roadmap, userId } = await req.json();
    
    if (!roadmap || !userId) {
      return NextResponse.json(
        { error: "Roadmap data and user ID are required" }, 
        { status: 400 }
      );
    }
    
    // Create a new roadmap document
    const newRoadmap = {
      roadmap,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: false,
      isActive: true
    };
    
    // Add the new roadmap to Firestore
    const newRoadmapRef = doc(collection(db, "roadmaps"));
    await setDoc(newRoadmapRef, newRoadmap);
    
    // Return the new roadmap ID
    return NextResponse.json({
      success: true,
      message: "Roadmap created successfully",
      roadmapId: newRoadmapRef.id
    });
    
  } catch (error) {
    console.error("Error creating roadmap:", error);
    return NextResponse.json(
      { error: "Could not create roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing roadmap
 */
export async function PUT(req: NextRequest): Promise<Response> {
  try {
    // Extract roadmap ID, roadmap data, and user ID from request body
    const { roadmapId, roadmap, userId } = await req.json();
    
    if (!roadmapId || !roadmap || !userId) {
      return NextResponse.json(
        { error: "Roadmap ID, roadmap data, and user ID are required" }, 
        { status: 400 }
      );
    }
    
    // Check if the roadmap exists
    const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
    
    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: "Roadmap not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the user has permission to update this roadmap
    const roadmapData = roadmapDoc.data();
    if (roadmapData.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to update this roadmap" }, 
        { status: 403 }
      );
    }
    
    // Update the roadmap
    await updateDoc(doc(db, "roadmaps", roadmapId), {
      roadmap,
      updatedAt: serverTimestamp()
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Roadmap updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating roadmap:", error);
    return NextResponse.json(
      { error: "Could not update roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a roadmap
 */
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    // Get roadmap ID and user ID from URL
    const url = new URL(req.url);
    const roadmapId = url.searchParams.get("roadmapId");
    const userId = url.searchParams.get("userId");
    
    if (!roadmapId || !userId) {
      return NextResponse.json(
        { error: "Roadmap ID and user ID are required" }, 
        { status: 400 }
      );
    }
    
    // Check if the roadmap exists
    const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
    
    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: "Roadmap not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the user has permission to delete this roadmap
    const roadmapData = roadmapDoc.data();
    if (roadmapData.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this roadmap" }, 
        { status: 403 }
      );
    }
    
    // Delete the roadmap
    await deleteDoc(doc(db, "roadmaps", roadmapId));
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Roadmap deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    return NextResponse.json(
      { error: "Could not delete roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 